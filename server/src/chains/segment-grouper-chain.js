const { ChatPromptTemplate } = require("@langchain/core/prompts");

const { z } = require("zod");
const { model } = require("./model");

function extractGroupsBySegments({ caption_segments }) {
  const segmentIdsSchema = z.object({
    groups: z
      .array(
        z.object({
          ids: z.array(z.number().describe("id of the segment")),
          // description: z.string().describe("description of the group"),
        })
      )
      .describe("List of groups."),
  });

  const modelWithStructuredOutput =
    model.withStructuredOutput(segmentIdsSchema);

  const prompt = ChatPromptTemplate.fromMessages([
    [
      "system",
      `
        Break the given text list into groups:
        - if there are more than 5 segments, try to group don't put all segments in one group.
        - Try to group given text list into meaningful groups. even if context is similar try to break it into different groups.
        - Return a list of groups, where each group is a list of segment IDs.
        - Ids start from 0.
        - Don't add ids, only use the given ids.
		  `,
    ],
    [
      "human",
      `
		  Texts to group:
		  {caption_segments}
		  `,
    ],
  ]);

  const chain = prompt.pipe(modelWithStructuredOutput);

  return chain.invoke({ caption_segments }).then((parsed) => {
    return parsed;
  });
}

function extractGroupDescription(lines = []) {
  const prompt = ChatPromptTemplate.fromMessages([
    [
      "system",
      `
        write a short description about below Video Caption in same language as the text (keep it short but informative),
        if text is too short like 1-5 words just return the exact text.

        Video Captions:
        {lines}
      `,
    ],
  ]);

  const chain = prompt.pipe(model);

  return chain.invoke({ lines }).then((parsed) => {
    return parsed.content;
  });
}

module.exports = { extractGroupsBySegments, extractGroupDescription };
