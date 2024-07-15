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

    Example Text List:
    part 1, 10 seconds, desc: Segment about nature
    part 2, 5 seconds, desc: Segment about technology
    part 3, 7 seconds, desc: introducing my self as a developer 
    part 4, 3 seconds, desc: saying hello to the audience
    part 5, 8 seconds, desc: Saying goodbye to the audience
    
    Example Task Request 1:
    Combine segments based on their context to create a cohesive video.

    Example Output 1:
    [3, 4, 5, 2]

    Example Output 2:
    [1, 3, 4, 5, 2]
    `,
  ],
  [
    "human",
    `
    # Text List:
    {grouped_segments}
    ## end of the Text List.

    # Task Request:
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

  const modelWithStructuredOutput = openaiModel.withStructuredOutput(
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

  const storyLines = tempSegments
    .map(
      (segment) =>
        `part ${segment.id}, ${segment.duration} seconds, desc:
  ${segment.description}`
    )
    .join("\n\n"); // Double newline for clearer separation

  const partIds = await chain
    .invoke({
      editing_request,
      grouped_segments: storyLines,
      total_segments: tempSegments.length - 1,
    })
    .then(({ raw, parsed }) => {
      if (!parsed) {
        console.log(
          "Raw Output on video-editor-grouped-segment-based",
          raw.content
        );
      }

      return parsed?.partIds || [];
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
