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

  const filePath = await getFilePath(_id.toString());
  const outputFile = await generateAudio(filePath);

  const segments = await getTranscriptSegments(outputFile);
  fs.unlinkSync(outputFile);

  // Save the segments to the database
  const model = getCollection(
    VIDEO_PROJECT.DATABASE,
    VIDEO_PROJECT.TRANSCRIPT_SEGMENT_COLLECTION
  );

  await model.insertMany([
    {
      fileId: _id.toString(),
      segments,
    },
  ]);
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
        console.error(`Error processing video: ${err.message}`);
        reject(err);
      })
      .on("progress", (progress) => {
        console.log(`Processing video: ${progress.percent}%`);
      })
      .on("end", () => {
        console.log("Done");
        resolve(outputFile);
      })
      .saveToFile(outputFile);
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
