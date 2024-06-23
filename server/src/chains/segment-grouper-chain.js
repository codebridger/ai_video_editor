const { ChatPromptTemplate } = require("@langchain/core/prompts");

const { z } = require("zod");
const { openaiModel, geminiModel } = require("./model");

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
    openaiModel.withStructuredOutput(segmentIdsSchema);

  const prompt = ChatPromptTemplate.fromMessages([
    [
      "system",
      `
      Break the given text list into contextually relevant groups:
      - Analyze the context of each segment to determine its grouping.
      - Each group should contain between 1 and 30 segments.
      - Create meaningful groups by analyzing the context of each segment.
      - Return a list of groups, where each group is a list of segment IDs.
      - The ID range is from 0 to {total_segments}.
      - Ensure that IDs are grouped based on context rather than just sequentially.
      - For example, if there are 10 segments, instead of grouping 1-5 and 6-10, group them based on their content. E.g., [0, 2, 3, 7, 8] might be one group if they share a common theme, and [1, 4, 5, 6, 9] another.
      - Maximum 30 segments per group.
      - Minimum 1 segment per group.
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

  return chain
    .invoke({
      caption_segments: caption_segments.map(
        (segment, i) => `${i}. ${segment.text}`
      ),
      total_segments: caption_segments.length,
    })
    .then((parsed) => {
      return parsed;
    });
}

function extractGroupDescription(lines = []) {
  const prompt = ChatPromptTemplate.fromMessages([
    [
      "system",
      `
        Extract the most important keywords from the given text.
        - Only return the keywords, separated by commas, to describe the essence of the video clip.
        - Ensure the keywords are concise and relevant to the main themes and content of the clip.
        - Use 3-10 words for each keyword.
        - If the text is too short, return the same text.
        - don't add any extra words like: here are the keywords, the keywords are, etc.
      `,
    ],
    [
      "human",
      `
      Please provide a description for the following video captions:
      {lines}
      `,
    ],
  ]);

  const chain = prompt.pipe(openaiModel);

  return chain
    .invoke({ lines: lines.map((line, i) => `${i + 1}. ${line}`).join("\n") })
    .then((parsed) => {
      return parsed.content;
    });
}

module.exports = { extractGroupsBySegments, extractGroupDescription };
