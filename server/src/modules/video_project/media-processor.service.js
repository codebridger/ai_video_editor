const { getFilePath, storeFile, removeFile } = require("@modular-rest/server");
const fluentFfmpeg = require("fluent-ffmpeg");
const path = require("path");
const contextChain = require("../../chains/context-chain");
const { getVideoProjectModels } = require("./service");
const { createFolder, safeUnlink } = require("../../helpers/file");
const {
  getFileInformation,
  getAudioFromVideo,
} = require("./video-engine.service");
const { processed_videos_dir } = require("./config");
const {
  getTranscriptSegmentsByOpenai,
  getTranscriptSegmentsByGroq,
} = require("./speech-to-text.service");

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
    const outputFile = await getAudioFromVideo({ filePath });

    await Promise.all([
      // Get the transcript segments
      getTranscriptSegmentsByGroq(outputFile)
        .then((res) => {
          language = res.language;
          return res.segments.map((segment, index) => ({
            ...segment,
            id: index,
          }));
        })
        .then((res) => (segments = res))
        .finally(() => {
          safeUnlink(outputFile);
        }),

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

/**
 * Extracts and groups segments based on their context, generating a description and calculating the duration for each group.
 *
 * @param {Array<{text: string, start: number, end: number}>} segments - An array of segment objects, where each segment includes `text`, `start`, and `end` properties.
 * @returns {Promise<Array<{ids: Array<number>, duration: number, description: string}>>} A promise that resolves to an array of grouped segment objects. Each object in the array includes
 *                            `ids` (an array of indices referring to the original segments), `duration` (the total duration of all
 *                            segments in the group), and `description` (a string description of the group).
 */
async function extractGroupedSegments(segments) {
  let groupedSegments = [];

  // get grouped segments
  if (segments.length > 1) {
    groupedSegments = await contextChain.extractGroupsBySegments({
      caption_segments: segments,
    });

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

  // @ts-ignore
  return groupedSegments;
}

module.exports = {
  processVideo,
  extractGroupedSegments,
};
