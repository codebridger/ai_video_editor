const { ChatPromptTemplate } = require("@langchain/core/prompts");

const { z } = require("zod");
const { openaiModel, geminiModel } = require("./model");

const prompt = ChatPromptTemplate.fromMessages([
  [
    "system",
    `
    Break the given text list into context-based groups:
    - Analyze the content of each segment to determine its context.
    - Group segments that share similar themes or topics together.
    - Do not group segments solely based on their numeric order.
    - Return a list of groups, where each group is a list of segment IDs.
    - The ID range is from 0 to {total_segments}.
    - Each group should contain segments that share a common context or theme.
    - For example, if there are segments about "nature" and "technology", group them accordingly.
    - Maximum 20-40 segments per group.
    - Minimum 2 segments per group.
    - Ensure diverse grouping to reflect different themes.
    Example Output:
    [
      [0, 2, 3, 7, 8], // Group 1 based on context A
      [1, 4, 5, 6, 9]  // Group 2 based on context B
    ]
    `,
  ],
  [
    "human",
    `
    Texts to group:
    {grouped_segments}

    Task Request:
    {editing_request}
    `,
  ],
]);

function getBaseChain() {
  const segmentIdsSchema = z.object({
    partIds: z
      .array(z.number().describe("id of the segment"))
      .describe("List of segment ids."),
  });
  const modelWithStructuredOutput = geminiModel.withStructuredOutput(
    segmentIdsSchema,
    { includeRaw: true }
  );

  return prompt.pipe(modelWithStructuredOutput);
}

async function invoke({ editing_request, grouped_segments = [] }) {
  const tempSegments = grouped_segments.map((segment, i) => ({
    id: i,
    duration: Math.floor(segment.duration) + " seconds",
    description: segment.description,
  }));

  const chain = getBaseChain();

  const partIds = await chain
    .invoke({
      editing_request,
      grouped_segments: tempSegments
        .map(
          (segment) =>
            `${segment.id}, ${segment.duration} seconds, ${segment.description}`
        )
        .join("\n"),
      total_segments: tempSegments.length - 1,
    })
    .then(({ raw, parsed }) => {
      return parsed.partIds;
    });

  console.log("partIds", partIds);

  const timeline = [];

  for (const partId of partIds) {
    if (!grouped_segments[partId]) {
      continue;
    }

    timeline.push({
      id: partId,
      duration: parseInt(tempSegments[partId].duration.split(" ")[0]),
      description: grouped_segments[partId].description,
      ids: grouped_segments[partId].ids,
      processedVideoId: grouped_segments[partId].processedVideoId,
      fileId: grouped_segments[partId].fileId,
    });
  }

  return timeline;
}

module.exports = { invoke };
