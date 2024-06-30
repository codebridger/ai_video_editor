const { getFilePath, storeFile, removeFile } = require("@modular-rest/server");
const fluentFfmpeg = require("fluent-ffmpeg");
const path = require("path");
const OpenAI = require("openai");
const fs = require("fs");
const contextChain = require("../../chains/segment-grouper-chain");
const { getVideoProjectModels } = require("./service");
const { createFolder, safeUnlink } = require("../../helpers/file");

const temptDir = path.join(require.main?.path || process.cwd(), "..", "temp");
const processed_videos_dir = path.join(temptDir, "processed_videos");

async function processVideo(fileDoc) {
  const { _id, originalName, fileName, owner, format, tag, size } = fileDoc;

  const id = _id.toString();
  let language = "";
  let segments = [];
  let groupedSegments = [];
  let lowQualityFileId = "";
  let isProcessed = true;

  const { videoMediaModel } = getVideoProjectModels();

  const filePath = await getFilePath(id);

  // Get format properties
  const formatProp = await getFormatProperties(filePath);

  const videoMediaDoc = await videoMediaModel.create({
    fileId: id,
    originalName,
    projectId: tag,
    creation_time: (formatProp.tags || {}).creation_time,
    format: formatProp,
    isProcessed,
    segments,
    groupedSegments,
  });

  try {
    // Generate audio from the video
    const outputFile = await generateAudio(filePath);

    await Promise.all([
      // Get the transcript segments
      getTranscriptSegments(outputFile)
        .then((res) => {
          language = res.language;
          return res.segments.map((segment, index) => ({
            ...segment,
            id: index,
          }));
        })
        .then((res) => (segments = res))
        .finally(() => safeUnlink(outputFile)),

      // Generate low quality video
      generateLowQualityVideo(filePath)
        .then(getFileInformation)
        .then((fileInfo) => {
          return storeFile({
            file: fileInfo,
            ownerId: owner,
            tag: tag + "_low",
            removeFileAfterStore: true,
          });
        })
        .then((fileDoc) => (lowQualityFileId = fileDoc._id.toString())),
    ]);

    // get grouped segments
    groupedSegments = await extractGroupedSegments(segments);

    isProcessed = true;
  } catch (error) {
    console.error("Error processing video " + id, error);
    isProcessed = false;
  }

  // Save the processed video
  await videoMediaModel
    .updateOne(
      { _id: videoMediaDoc._id },
      {
        fileId: id,
        lowQualityFileId,
        fileName,
        projectId: tag,
        format: {
          creation_time: (formatProp.tags || {}).creation_time,
        },
        isProcessed,
        segments,
        language,
        groupedSegments,
      }
    )
    .exec()
    .finally(() => {
      console.log("Video processed successfully" + id);
    });
}

async function generateLowQualityVideo(filePath) {
  const _id = path.basename(filePath, path.extname(filePath));

  const outputFile = path.join(processed_videos_dir, `${_id}_low.mp4`);

  return new Promise(async (resolve, reject) => {
    await createFolder(processed_videos_dir);

    fluentFfmpeg(filePath)
      .videoCodec("libx264")
      .audioCodec("aac")
      .size("640x?") // 640 pixels wide, preserve aspect ratio
      .withOutputFps(24) // 24 frames per second
      // .videoBitrate("500k")
      .output(outputFile)
      .on("error", (err) => {
        console.error(`video convert error: ${err.message}`);
        reject(err);
      })
      .on("progress", (progress) => {
        // console.log(`Processing video: ${progress.percent}%`);
      })
      .on("end", () => {
        resolve(outputFile);
      })
      .run();
  });
}

function generateAudio(filePath) {
  const _id = path.basename(filePath, path.extname(filePath));

  const outputFile = path.join(processed_videos_dir, `${_id}.mp3`);

  return new Promise(async (resolve, reject) => {
    await createFolder(processed_videos_dir);

    fluentFfmpeg(filePath)
      .audioChannels(1)
      .audioBitrate("96k")
      .audioCodec("libmp3lame")
      // .output(outputFile)
      .on("error", (err) => {
        console.error(`video convert error: ${err.message}`);
        reject(err);
      })
      .on("progress", (progress) => {
        // console.log(`Processing video: ${progress.percent}%`);
      })
      .on("end", () => {
        resolve(outputFile);
      })
      .saveToFile(outputFile);
  });
}

function getFormatProperties(filePath) {
  return new Promise(async (resolve, reject) => {
    fluentFfmpeg.ffprobe(filePath, (err, { format = {} }) => {
      if (err) {
        reject(err);
      } else {
        resolve(format);
      }
    });
  });
}

async function getTranscriptSegments(filePath) {
  const openai = new OpenAI.OpenAI();
  openai.apiKey = process.env.OPENAI_API_KEY || "";

  const transcription = await openai.audio.transcriptions.create({
    file: fs.createReadStream(filePath),
    model: "whisper-1",
    language: "fa",
    response_format: "verbose_json",
    timestamp_granularities: ["segment"],
    temperature: 0.0,
    prompt: "if you cant find human voice, just describe the sound",
  });

  // @ts-ignore
  const segments = transcription.segments.map(({ start, end, text }) => {
    return {
      start,
      end,
      text,
    };
  });

  return {
    segments,
    // @ts-ignore
    language: transcription.language,
  };
}

async function extractGroupedSegments(segments) {
  let groupedSegments = [];

  // get grouped segments
  if (segments.length > 1) {
    groupedSegments = await contextChain
      .extractGroupsBySegments({
        caption_segments: segments,
      })
      .then(({ groups }) => groups);

    // generate group description
    for (const group of groupedSegments) {
      group.ids = group.ids.filter((id) => segments[id] !== undefined);

      const lines = group.ids.map((id) => {
        return segments[id].text || "";
      });

      const duration = group.ids.reduce(
        (acc, id) => acc + (segments[id].end - segments[id].start),
        0
      );

      const description = await contextChain.extractGroupDescription(lines);
      group["description"] = description;
      group["duration"] = duration;
    }
  } else {
    groupedSegments = [
      {
        ids: [0],
        duration: segments[0].end - segments[0].start,
        description: segments[0].text || "No description available",
      },
    ];
  }

  return groupedSegments;
}

/**
 * Helper function to extract and save a video segment.
 */
async function extractSegment(filePath, start, duration, outputFile) {
  return new Promise((resolve, reject) => {
    fluentFfmpeg(filePath)
      .seekInput(start)
      .duration(duration)
      .videoCodec("libx264") // Re-encode video to H.264
      .audioCodec("aac") // Re-encode audio to AAC
      .size("1408x1872") // Standardize resolution
      .fps(30) // Standardize frame rate
      .output(outputFile)
      .on("end", () => resolve("Segment extracted successfully"))
      .on("error", (err) => reject(err))
      .run();
  });
}

/**
 * Merges multiple video files into a single video file.
 */
async function mergeVideos(inputFiles, outputFile, onProgress = (p) => {}) {
  return new Promise((resolve, reject) => {
    const command = fluentFfmpeg();

    // Add each input file
    inputFiles.forEach((file) => {
      command.input(file);
    });

    // Use the concat filter for merging
    command
      .on("error", (err) => reject(err))
      .on("end", () => resolve("Videos merged successfully"))
      .on("progress", (progress) => {
        console.log(`Merging videos: ${progress.percent}%`);
        onProgress(progress);
      })
      .mergeToFile(outputFile, path.dirname(outputFile));
  });
}

/**
 * Exports video segments based on the provided video file paths and segment details.
 *
 * @param {Array<{videoFilePath: string, start: number, end: number, text:string}>} segments - An array of segment objects.
 * @param {(p:any)=>void} onProgress - A callback function to report progress.
 * @returns {Promise<any>}
 */
async function exportVideoBySegments(
  segments = [],
  onProgress = (progress) => {}
) {
  console.log(`Exporting video from ${segments.length} segments.`);

  const totalDuration = segments.reduce(
    (acc, segment) => acc + (segment.end - segment.start),
    0
  );

  console.log(`Total duration of segments: ${totalDuration} seconds`);

  const intermediateFiles = [];
  const exportDir = path.join(temptDir, "exported_videos"); // Define your tempDir properly
  if (!fs.existsSync(exportDir)) {
    fs.mkdirSync(exportDir);
  }
  const timestamp = Date.now();
  const outputFilePath = path.join(exportDir, `${timestamp}.mp4`);

  // Extract segments
  for (const segment of segments) {
    const { videoFilePath, start, end } = segment;
    const duration = end - start;
    const outputFile = path.join(
      exportDir,
      `segment-${timestamp}-${intermediateFiles.length}.mp4`
    );
    await extractSegment(videoFilePath, start, duration, outputFile);
    intermediateFiles.push(outputFile);
  }

  // Merge segments
  return mergeVideos(intermediateFiles, outputFilePath, onProgress)
    .then(() => {
      console.log("Video segments merged successfully");
      return getFileInformation(outputFilePath);
    })
    .catch((err) => {
      console.error(`Error merging videos: ${err.message}`);
      try {
        fs.unlinkSync(outputFilePath);
      } catch (error) {}
      return "";
    })
    .finally(() => {
      // Optionally, clean up intermediate files
      intermediateFiles.forEach((file) => safeUnlink(file));
    });
}

/**
 * Asynchronously retrieves detailed information about a media file, including its MIME type, name, size, and path.
 *
 * This function analyzes a media file specified by `filePath` to extract its codec information using `fluent-ffmpeg`.
 * It then maps the codec to a MIME type for easier handling in web contexts. If the codec is not recognized, it defaults
 * to "application/octet-stream". The function also retrieves the file's size and name from the file system.
 *
 * @param {string} filePath - The path to the media file to be analyzed.
 * @returns {Promise<{path: string, type: string, name: string, size: number}>} A promise that resolves with an object containing:
 *          - `path`: The full path to the media file.
 *          - `type`: The MIME type of the media file, derived from its codec.
 *          - `name`: The name of the file, including its extension.
 *          - `size`: The size of the file in bytes.
 *          If an error occurs during the analysis, the promise is rejected with the error.
 *
 * @example
 * getFileInformation("/path/to/video.mp4").then(fileInfo => {
 *   console.log(fileInfo);
 * }).catch(error => {
 *   console.error("Error getting file information:", error);
 * });
 */
function getFileInformation(filePath) {
  function getMimeType(codec_name) {
    const codecToMimeMap = {
      h264: "video/mp4",
      vp8: "video/webm",
      vp9: "video/webm",
      aac: "audio/aac",
      mp3: "audio/mpeg",
      opus: "audio/opus",
      vorbis: "audio/vorbis",
    };

    return codecToMimeMap[codec_name] || "application/octet-stream";
  }

  return new Promise((resolve, reject) => {
    // Getting file size
    const fileSize = fs.statSync(filePath).size;

    // Extracting file name
    const fileName = path.basename(filePath);

    // Using fluent-ffmpeg to determine the file type
    fluentFfmpeg.ffprobe(filePath, (err, metadata) => {
      if (err) {
        reject(err);
      } else {
        // Assuming the first stream is representative for the file type
        const fileType = getMimeType(metadata.streams[0].codec_name);
        // Constructing the file info object
        const fileInfo = {
          path: filePath,
          type: fileType, // This is not a MIME type, but a codec type. Adjust as needed.
          name: fileName,
          size: fileSize,
        };
        resolve(fileInfo);
      }
    });
  });
}

module.exports = {
  processVideo,
  exportVideoBySegments,
  extractGroupedSegments,
};
