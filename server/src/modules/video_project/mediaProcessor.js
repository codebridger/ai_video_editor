const { getFilePath, getCollection } = require("@modular-rest/server");
const fluentFfmpeg = require("fluent-ffmpeg");
const path = require("path");
const OpenAI = require("openai");
const fs = require("fs");
const { VIDEO_PROJECT } = require("../../config");
const contextChain = require("../../chains/segment-grouper-chain");
const { getVideoProjectModels } = require("./service");
const { createFolder, safeUnlink } = require("../../helpers/file");
const { sleep } = require("../../helpers/promis");

const temptDir = path.join(require.main?.path || process.cwd(), "..", "temp");

async function processVideo(fileDoc) {
  const { _id, originalName, fileName, owner, format, tag, size } = fileDoc;

  const id = _id.toString();
  let language = "";
  let segments = [];
  let groupedSegments = [];
  let formatProp = {};
  let isProcessed = false;

  const { videoMediaModel } = getVideoProjectModels();

  const videoMediaDoc = await videoMediaModel.create({
    fileId: id,
    originalName,
    projectId: tag,
    format: formatProp,
    isProcessed,
    segments,
    groupedSegments,
  });

  try {
    const filePath = await getFilePath(id);

    // Generate audio from the video
    const outputFile = await generateAudio(filePath);

    // Get the transcript segments
    segments = await getTranscriptSegments(outputFile)
      .then((res) => {
        language = res.language;
        return res.segments.map((segment, index) => ({
          ...segment,
          id: index,
        }));
      })
      .finally(() => {
        safeUnlink(outputFile);
      });

    // get grouped segments
    groupedSegments = await extractGroupedSegments(segments);

    // Get format properties
    formatProp = await getFormatProperties(filePath);
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
        fileName,
        projectId: tag,
        format: formatProp,
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

function generateAudio(filePath) {
  const outputDir = path.join(temptDir, "processed_videos");

  const _id = path.basename(filePath, path.extname(filePath));

  const outputFile = path.join(temptDir, "processed_videos", `${_id}.mp3`);

  return new Promise(async (resolve, reject) => {
    await createFolder(outputDir);

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
    // language: "fa",
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
 * Defines the type for a segment object.
 *
 * @typedef {Object} Segment
 * @property {string} fileId - The ID of the video the segment belongs to.
 * @property {string} id - A unique identifier for the segment.
 * @property {number} start - The start time of the segment in the video.
 * @property {number} end - The end time of the segment in the video.
 * @property {number} duration - The duration of the segment, calculated as end - start.
 * @property {string} text - The text associated with the segment.
 */
/**
 * Exports video segments based on the provided video IDs and segment details.
 *
 * @param {string[]} fileId - An array of file IDs to be processed.
 * @param {Segment[]} segments - An array of segment objects.
 * @returns {Promise<any>}
 */
async function exportVideoBySegments(
  fileId = [],
  segments = [],
  onProgress = (progress) => {}
) {
  console.log(
    `Exporting video from ${segments.length} segments from ${fileId.length} files.`
  );

  const total_duration = segments.reduce(
    (acc, segment) => acc + segment.duration,
    0
  );

  console.log(`Total duration of segments: ${total_duration} seconds`);

  const filePaths = {};
  const intermediateFiles = [];
  const export_dir = path.join(temptDir, "exported_videos");
  await createFolder(export_dir);
  const timestamp = Date.now();
  const outputFilePath = path.join(export_dir, `${timestamp}.mp4`);

  // Get file paths for each video ID
  for (const id of fileId) {
    filePaths[id] = await getFilePath(id);
  }

  // Extract segments
  for (const segment of segments) {
    const { fileId, start, duration } = segment;
    const filePath = filePaths[fileId];
    const outputFile = path.join(
      export_dir,
      `segment-${timestamp}-${segment.id}.mp4`
    );
    await extractSegment(filePath, start, duration, outputFile);
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
        safeUnlink(outputFilePath);
      } catch (error) {}
      return "";
    })
    .finally(() => {
      // Optionally, clean up intermediate files
      intermediateFiles.forEach((file) => safeUnlink(file));
    });
}

function getFileInformation(filePath) {
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
        const fileType = metadata.streams[0].codec_type;
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
