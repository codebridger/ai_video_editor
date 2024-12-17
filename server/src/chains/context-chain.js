const { ChatPromptTemplate } = require("@langchain/core/prompts");
const { JsonOutputParser } = require("@langchain/core/output_parsers");

const { z } = require("zod");
const { openAiGptModel, openAio1Model, geminiModel } = require("./model");

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
    openAiGptModel.withStructuredOutput(segmentIdsSchema);

  const prompt = ChatPromptTemplate.fromMessages([
    [
      "assistant",
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
      "assistant",
      `return a json object with the following structure:
      {{
        "groups": [
          {{
            "ids": [0, 1, 2, 3],
            "description": "Description of the group"
          }},
          {{
            "ids": [4, 5, 6],
            "description": "Description of the group"
          }}
        ]
      }}
      `,
    ],
    [
      "user",
      `
      Texts to group:
      {caption_segments}
      `,
    ],
  ]);

  const parser = new JsonOutputParser();

  const chain = prompt.pipe(openAio1Model).pipe(parser);

  return chain
    .invoke({
      caption_segments: caption_segments.map(
        (segment, i) => `${i}. ${segment.text}`
      ),
      total_segments: caption_segments.length,
    })
    .then((result) => {
      // const parsed = JSON.parse(result.content.toString());
      // const structured = segmentIdsSchema.parse(parsed);
      // return structured.groups;
      return result.groups;
    });
}

function extractGroupDescription(lines = []) {
  const prompt = ChatPromptTemplate.fromMessages([
    [
      "assistant",
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
      "user",
      `
      [Lines]
      {lines}
      `,
    ],
  ]);

  const chain = prompt.pipe(openAio1Model);

  return chain
    .invoke({ lines: lines.map((line, i) => `${i + 1}. ${line}`).join("\n") })
    .then((parsed) => {
      return parsed.content;
    });
}

module.exports = { extractGroupsBySegments, extractGroupDescription };
