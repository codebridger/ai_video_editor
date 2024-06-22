const { getFilePath, getCollection } = require("@modular-rest/server");
const fluentFfmpeg = require("fluent-ffmpeg");
const path = require("path");
const OpenAI = require("openai");
const fs = require("fs");
const { VIDEO_PROJECT } = require("../../config");

function createFolder(folderPath) {
  return new Promise((resolve, reject) => {
    require("fs").mkdir(folderPath, { recursive: true }, (err) => {
      if (err) {
        reject(err);
      } else {
        resolve("");
      }
    });
  });
}

async function processVideo(fileDoc) {
  const { _id, originalName, fileName, owner, format, tag, size } = fileDoc;

  const id = _id.toString();
  let segments = [];
  let formatProp = {};
  let isProcessed = false;

  try {
    const filePath = await getFilePath(id);

    // Generate audio from the video
    const outputFile = await generateAudio(filePath);

    // Get the transcript segments
    segments = await getTranscriptSegments(outputFile);
    fs.unlinkSync(outputFile);

    // Get format properties
    formatProp = await getFormatProperties(filePath);
    isProcessed = true;
  } catch (error) {
    console.error("Error processing video " + id, error);
    isProcessed = false;
  }

  const model = getCollection(
    VIDEO_PROJECT.DATABASE,
    VIDEO_PROJECT.VIDEO_MEDIA
  );

  // Save the processed video
  await model
    .insertMany([
      {
        fileId: id,
        format: formatProp,
        isProcessed,
        segments,
      },
    ])
    .finally(() => {
      console.log("Video processed successfully" + id);
    });
}

function generateAudio(filePath) {
  const temptDir = path.join(require.main?.path || process.cwd(), "temp");
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
    language: "fa",
    response_format: "verbose_json",
    timestamp_granularities: ["segment"],
  });

  // @ts-ignore
  const segments = transcription.segments.map(({ start, end, text }) => {
    return { start, end, text };
  });

  return segments;
}

module.exports = {
  processVideo,
};
