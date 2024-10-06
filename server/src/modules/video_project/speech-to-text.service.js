const { default: OpenAI } = require("openai");
const speech = require("@google-cloud/speech");
const fs = require("fs");
const Groq = require("groq-sdk");

async function getTranscriptSegmentsByOpenai(filePath) {
  const openai = new OpenAI.OpenAI();
  openai.apiKey = process.env.OPENAI_API_KEY || "";

  const transcription = await openai.audio.transcriptions.create({
    file: fs.createReadStream(filePath),
    model: "whisper-1",
    language: "fa",
    response_format: "verbose_json",
    timestamp_granularities: ["segment"],
    temperature: 0.0,
    prompt: "if you can't find human voice, just describe the sound",
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

async function getTranscriptSegmentsByGroq(filePath) {
  const groq = new Groq.default.Groq();
  const transcription = await groq.audio.transcriptions.create({
    file: fs.createReadStream(filePath),
    model: "whisper-large-v3",
    language: "fa",
    response_format: "verbose_json",
  });

  console.log(transcription);

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

// async function getTranscriptSegmentsByGoogle(filePath) {
//   // Creates a client
//   const client = new speech.SpeechClient();

//   // Reads a local audio file and converts it to base64
//   const file = fs.readFileSync(filePath);
//   const audioBytes = file.toString("base64");

//   const audio = {
//     content: audioBytes,
//   };

//   const config = {
//     encoding: "LINEAR16",
//     sampleRateHertz: 16000,
//     languageCode: "fa-IR",
//   };

//   const request = {
//     audio: audio,
//     config: config,
//   };

//   // Detects speech in the audio file. This creates a recognition job that you
//   // can wait for now, or get its result later.
//   const [operation] = await client.longRunningRecognize(request);
//   // Get a Promise representation of the final result of the job
//   const [response] = await operation.promise();
//   const transcription = response.results
//     .map((result) => result.alternatives[0].transcript)
//     .join("\n");
//   console.log(`Transcription: ${transcription}`);
// }

module.exports = {
  getTranscriptSegmentsByOpenai,
  getTranscriptSegmentsByGroq,
};
