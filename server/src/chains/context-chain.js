const { ChatPromptTemplate } = require("@langchain/core/prompts");

const { z } = require("zod");
const { openaiModel, geminiModel } = require("./model");

/**
 * Extracts groups of segments based on their contextual relevance.
 *
 * This function takes an object containing caption segments and uses a schema to validate the structure of the segment IDs.
 * It then creates a prompt template for the OpenAI model to break the given text list into contextually relevant groups.
 */
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
      - Each group can maximum contain between 1 to 30 segments.
      - Create meaningful groups by analyzing the context of each segment.
      - Return a list of groups, where each group is a list of segment IDs.
      - The ID range is from 0 to {total_segments}.
      - Ensure that IDs are grouped based on context rather than just sequentially.
      - For example, if there are 10 segments, instead of grouping 1-5 and 6-10, group them based on their content. E.g., [0, 2, 3, 7, 8] might be one group if they share a common theme, and [1, 4, 5, 6, 9] another.

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
      return parsed.groups;
    });
}

function extractGroupDescription(lines = []) {
  const prompt = ChatPromptTemplate.fromMessages([
    [
      "system",
      `
        Take [lines] and generate a ready to use short description for the following text list.

        Consider the following:
        1. These lines are scene scripts of a video, and you need to generate a description for an easy understanding of the content.
        2. just add the matters part and don't add things like: this text is about, this text is for, etc.
        3. use action words to start the description.
        4. use the same language of the text list.
      `,
    ],
    [
      "human",
      `
      [Lines]
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
