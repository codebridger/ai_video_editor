const { ChatPromptTemplate } = require("@langchain/core/prompts");
const { JsonOutputParser } = require("@langchain/core/output_parsers");

const { z } = require("zod");
const { openAiGptModel, openAio1Model, geminiModel } = require("./model");

const prompt = ChatPromptTemplate.fromMessages([
  [
    "assistant",
    `
    You are a story editor for a video production company.
    what you have is a sort of script includes sequence-number, durations, and descriptions of each one.

    Instructions:
    1. check the [Task Request] to understand what kind of video you need to create.
    2. Combine the segments based on their context to create a cohesive video.
    3. The output should be a list of sequence-ids.

    Example Text List:
    sequence 1, 10 seconds, desc: Segment about nature
    sequence 2, 5 seconds, desc: Segment about technology
    sequence 3, 7 seconds, desc: introducing my self as a developer 
    sequence 4, 3 seconds, desc: saying hello to the audience
    sequence 5, 8 seconds, desc: Saying goodbye to the audience
    
    Example Task Request 1:
    Combine segments based on their context to create a cohesive video.

    Example Output 1:
    [3, 4, 5, 2]

    Example Output 2:
    [1, 3, 4, 5, 2]
    `,
  ],
  [
    "assistant",
    `Return the output in an json array format. For example: [1, 2, 3, 4]`,
  ],
  [
    "user",
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

  const modelWithStructuredOutput = openAiGptModel.withStructuredOutput(
    segmentIdsSchema,
    { includeRaw: true }
  );

  const parser = new JsonOutputParser();
  return prompt.pipe(openAio1Model).pipe(parser);
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
        `sequence ${segment.id}, ${segment.duration}, desc: ${segment.description}.`
    )
    .join("\n\n"); // Double newline for clearer separation

  console.log("\n", "STORY LINES", storyLines, "\n");

  const partIds = await chain
    .invoke({
      editing_request,
      grouped_segments: storyLines,
      total_segments: tempSegments.length - 1,
    })
    .then((parsed) => {
      // if (!parsed) {
      //   console.log(
      //     "Raw Output on video-editor-grouped-segment-based",
      //     raw.content
      //   );
      // }

      return parsed || [];
    })
    .catch((error) => {
      console.error("Error on video-editor-grouped-segment-based", error);
      return [];
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
