const { defineFunction, getFilePath } = require("@modular-rest/server");

const { extractGroupedSegments } = require("./media-processor.service");

const { getVideoProjectModels } = require("./service");

const {
  generateTimelineByPrompt,
  generateVideoRevision,
} = require("./timeline.service");

module.exports.functions = [
  // Generate the timeline based given prompt
  // timeline is a sort of grouped segments
  defineFunction({
    name: "generateTimeline",
    permissionTypes: ["user_access"],
    callback: ({ projectId, prompt, userId }) => {
      return generateTimelineByPrompt({ projectId, prompt, userId });
    },
  }),

  // Render the video based on the timeline
  // and return the revision document
  defineFunction({
    name: "generateVideoRevision",
    permissionTypes: ["user_access"],
    callback: ({ prompt, projectId, userId }) => {
      return generateVideoRevision({ prompt, projectId, userId });
    },
  }),

  // Analyze the video media and generate the grouped segments
  // based on the context
  defineFunction({
    name: "generateGroupedSegments",
    permissionTypes: ["user_access"],
    callback: async ({ videoMediaId }) => {
      if (!videoMediaId) {
        throw new Error("videoMediaId is required.");
      }

      const { videoMediaModel } = getVideoProjectModels();

      const videoMedia = await videoMediaModel
        .findById(videoMediaId)
        .exec()
        .then((doc) => doc.toObject());

      if (!videoMedia) {
        throw new Error("No video found with the given id");
      }

      const segments = videoMedia.segments;
      const groupedSegments = await extractGroupedSegments(segments);

      // update the video with the grouped segments
      await videoMediaModel.findByIdAndUpdate(
        { _id: videoMediaId },
        {
          groupedSegments,
          isProcessed: true,
        }
      );

      return {
        groupedSegments,
      };
    },
  }),

  // Get ffmpeg props for a video
  defineFunction({
    name: "getFfmpegProps",
    permissionTypes: ["user_access"],
    callback: async ({ fileId }) => {
      if (!fileId) {
        throw new Error("fileId is required.");
      }

      const filePath = await getFilePath(fileId);

      const ffmpeg = require("fluent-ffmpeg");

      return new Promise((resolve, reject) => {
        ffmpeg.ffprobe(filePath, (err, metadata) => {
          if (err) {
            reject(err);
          }

          resolve(metadata);
        });
      });
    },
  }),
];
