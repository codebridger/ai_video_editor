import { LLMChain } from "langchain/chains";
import { OpenAIChat } from "langchain/llms/openai";
import { ChatPromptTemplate } from "langchain/prompts";

const chatPromptTemplate = ChatPromptTemplate.fromMessages([
  [
    "system",
    `
		You are a video director who can make a summary from transcripts, by choosing best sentences and combining them.
		Instructions:
			1. Read the transcript which include time stamp.
			2. Choose the best sentences.
			3. Combine them into a summary.
			4. return the summary with keeping time data, without any extra description.
	`,
  ],
  [
    "user",
    `
		This is the transcript:
		{transcript}

		Summary:
	`,
  ],
]);

const model = new OpenAIChat({
  openAIApiKey: process.env.OPENAI_API_KEY,
  modelName: "gpt-4",
});

export const summaryChain = new LLMChain({
  llm: model,
  prompt: chatPromptTemplate,
});
