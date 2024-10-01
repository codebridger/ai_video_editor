const { ChatPromptTemplate } = require("@langchain/core/prompts");

const { z } = require("zod");
const { openaiModel, geminiModel } = require("./model");

const prompt = ChatPromptTemplate.fromMessages([
  [
    "system",
    `
    You are a story editor for a video production company.
    what you have is a sort of script with part numbers, durations, and descriptions of each.

    Instructions:
    1. check the [Task Request] to understand what kind of video you need to create.
    2. Combine the segments based on their context to create a cohesive video.
    3. The output should be a list of part ids in the order they should be combined.

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
        `part ${segment.id}, ${segment.duration}, desc: ${segment.description}.`
    )
    .join("\n\n"); // Double newline for clearer separation

  console.log("\n", "STORY LINES", storyLines, "\n");

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
