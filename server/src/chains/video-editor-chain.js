const { ChatPromptTemplate } = require("@langchain/core/prompts");

const { z } = require("zod");
const { model } = require("./model");

function getBaseChain() {
  const segmentIdsSchema = z.object({
    segment_ids: z
      .array(z.number().describe("id of the segment"))
      .describe("List of segment ids."),
  });

  const modelWithStructuredOutput = model.withStructuredOutput(
    segmentIdsSchema,
    { includeRaw: true }
  );

  const prompt = ChatPromptTemplate.fromMessages([
    [
      "system",
      `
			  You are a video editor who can help with video editing tasks based on given caption segments and given prompt.
			  each segment contains:
			  - 'id': id of the segment.
			  - 'duration': duration of the segment in seconds.
			  - 'text': text of the caption segment to know the context of the segment.
			  
			  Technical instruction:
			  - Base on the given prompt and caption segments, you need to reorder, remove segments and return a list of segment ids in json format.
        - read text in the caption segments and choose the best order of the segments based on the given prompt.
			  - care about duration of the segments and what asked in the prompt.
		  `,
    ],
    [
      "human",
      `
		  Caption segments:
		  {caption_segments}
      # End of caption segments

		  Prompt:
		  {editing_request}
      Pick '40' seconds from segments, count all picked segments to be close to '40' seconds.
      # end of prompt
	  
		  Analyze the caption segments and editing request prompt to reorder, 
      remove segments and return a list segment ids in json format:
		  `,
    ],
  ]);

  return prompt.pipe(modelWithStructuredOutput);
}

function invoke({ editing_request, caption_segments }) {
  const chain = getBaseChain();
  return chain
    .invoke({ editing_request, caption_segments })
    .then(({ raw, parsed }) => {
      return parsed;
    });
}

module.exports = { invoke };
