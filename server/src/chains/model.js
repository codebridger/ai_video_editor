const { ChatOpenAI } = require("@langchain/openai");
const { ChatGoogleGenerativeAI } = require("@langchain/google-genai");

module.exports.openaiModel = new ChatOpenAI({
  // temperature: 1,
  model: "gpt-4o-mini",
  // @ts-ignore
  apiKey: process.env.OPENAI_API_KEY,
});

module.exports.geminiModel = null;
// new ChatGoogleGenerativeAI({
//   model: "gemini-1.5-pro",
//   // maxOutputTokens: 2048,
//   temperature: 1,
//   // @ts-ignore
//   apiKey: process.env.GOOGLE_API_KEY,
// });
