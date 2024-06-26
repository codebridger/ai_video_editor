const {
  defineFunction,
  storeFile,
  getFilePath,
} = require("@modular-rest/server");
const fs = require("fs");
const videoEditorCaptionBasedChain = require("../../chains/video-editor-caption-based");
const {
  exportVideoBySegments,
  extractGroupedSegments,
} = require("./mediaProcessor");
const {
  getVideoMediaDocsByFileIds,
  getVideoProjectModels,
  findProjectById,
  extractSegmentsWithFilePathFromProjectTimeline,
} = require("./service");

const contextChain = require("../../chains/segment-grouper-chain");
const { sleep } = require("../../helpers/promis");
const timelineChain = require("../../chains/video-editor-grouped-segment-based");

module.exports.functions = [
  // Generate the timeline based given prompt
  // timeline is a sort of grouped segments
  defineFunction({
    name: "generateTimeline",
    permissionTypes: ["user_access"],
    callback: async ({ projectId, prompt, userId }) => {
      if (!projectId) {
        throw new Error("projectId is required.");
      }

      const { videoMediaModel, projectModel } = getVideoProjectModels();

      const project = await projectModel
        .findOne({
          _id: projectId,
          userId,
        })
        .exec();

      if (!project) {
        throw new Error("No project found with the given id");
      }

      const projectVideoMedia = await videoMediaModel
        .find({ projectId })
        .sort({ creation_time: 1 })
        .exec();

      let groupedSegments = [];

      for (const videoMedia of projectVideoMedia) {
        if (!videoMedia || !videoMedia.groupedSegments) {
          continue;
        }

        const videoMediaJson = videoMedia.toObject();

        groupedSegments = groupedSegments.concat(
          videoMediaJson.groupedSegments.map((segment) => {
            return {
              ...segment,
              processedVideoId: videoMediaJson._id.toString(),
              fileId: videoMediaJson.fileId,
            };
          })
        );
      }

      const timeline = await timelineChain.invoke({
        editing_request: prompt,
        grouped_segments: groupedSegments,
      });

      await projectModel.updateOne({ _id: projectId }, { $set: { timeline } });

      return {
        timeline,
      };
    },
  }),

  // Render the video based on the timeline
  // and return the revision document
  defineFunction({
    name: "generateVideoRevision",
    permissionTypes: ["user_access"],
    callback: async ({ prompt, projectId, userId }) => {
      if (!prompt || !projectId || !userId) {
        throw new Error("prompt and ids is required. userId is required.");
      }

      const projectDoc = await findProjectById(projectId);

      if (!projectDoc) {
        throw new Error("No project found with the given id");
      } else if (projectDoc.userId !== userId) {
        throw new Error("User does not have access to the project");
      }

      // extract segments
      const extractedSegments =
        await extractSegmentsWithFilePathFromProjectTimeline(projectId);

      //
      // Save the video revision
      //
      const { videoRevisionModel } = getVideoProjectModels();

      const newRevision = await videoRevisionModel.create({
        userId,
        projectId,
        prompt,
        isPending: true,
        segments: extractedSegments,
      });

      //
      // Export the video from the revision
      //

      exportVideoBySegments(extractedSegments)
        .then(async (fileForSaving) => {
          const exportedFileId = await storeFile({
            file: fileForSaving,
            ownerId: userId,
            tag: newRevision._id.toString(),
            removeFileAfterStore: true,
          })
            .then((savedFile) => savedFile._id.toString())
            .catch((error) => "");

          await videoRevisionModel
            .updateOne(
              {
                _id: newRevision._id,
              },
              {
                $set: { isPending: false, fileId: exportedFileId },
              }
            )
            .exec()
            .then((res) => {
              console.log("Video revision exported successfully", res);
            });
        })
        .catch(async (error) => {
          console.error("Error exporting video revision", error);
          await videoRevisionModel
            .updateOne(
              {
                _id: newRevision._id,
              },
              {
                $set: { isPending: false },
              }
            )
            .exec();
        });

      return newRevision.toObject();
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
