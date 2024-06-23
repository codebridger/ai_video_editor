const { ChatOpenAI } = require("@langchain/openai");

module.exports.model = new ChatOpenAI({
  temperature: 0,
  model: "gpt-4o",
  apiKey: process.env.OPENAI_API_KEY,
});
