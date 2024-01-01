import OpenAI from "openai";
import fs from "fs";
import { writeTextFile } from "./fs-utils.js";

export async function storeTranscript(
  soundFilePath: string,
  outputFilePath: string,
  language: string
) {
  const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  });

  // read audio file and get openai transcript
  const audio = fs.createReadStream(soundFilePath);

  return openai.audio.transcriptions
    .create({
      file: audio,
      model: "whisper-1",
      language: language || "fa",
      response_format: "srt",
    })
    .then((transcript) => {
      // write transcript to file
      writeTextFile(outputFilePath, transcript as any);
      console.log("The file has been saved!");
    });
}
