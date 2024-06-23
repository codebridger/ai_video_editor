const { defineFunction, storeFile } = require("@modular-rest/server");
const fs = require("fs");
const videoEditorCaptionBasedChain = require("../../chains/video-editor-caption-based");
const {
  exportVideoBySegments,
  extractGroupedSegments,
} = require("./mediaProcessor");
const {
  getVideoMediaDocsByFileIds,
  getVideoProjectModels,
} = require("./service");

const contextChain = require("../../chains/segment-grouper-chain");
const { sleep } = require("../../helpers/promis");
const timelineChain = require("../../chains/video-editor-grouped-segment-based");

module.exports.functions = [
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
        .exec();

      let groupedSegments = [];

      for (const videoMedia of projectVideoMedia) {
        if (!videoMedia || !videoMedia.groupedSegments) {
          continue;
        }

        const videoMediaJson = videoMedia.toObject();

        groupedSegments = groupedSegments.concat(
          videoMediaJson.groupedSegments
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

  defineFunction({
    name: "generateVideoRevision",
    permissionTypes: ["user_access"],
    callback: async ({ prompt, mediaVideoIds, userId }) => {
      if (!prompt || !mediaVideoIds || !userId) {
        throw new Error("prompt and ids is required. userId is required.");
      } else if (mediaVideoIds.length === 0 || prompt.length < 30) {
        throw new Error(
          "prompt has to be at least 30 characters, and ids must be at least 1"
        );
      }

      //
      // Get the videos from the ids
      //

      const videos = await getVideoMediaDocsByFileIds(mediaVideoIds);
      const projectId = videos[0].projectId;

      const segments = [];

      if (!videos) {
        throw new Error("No videos found with the given ids");
      }

      //
      // concatenate all the segments from all the videos into a single list
      //

      let segmentId = 0;
      for (const video of videos) {
        video.segments.forEach((segment) => {
          segments.push({
            fileId: video.fileId,
            id: segmentId,
            start: segment.start,
            end: segment.end,
            duration: segment.end - segment.start,
            text: segment.text,
          });

          segmentId++;
        });
      }

      //
      // Generate the video revision
      //

      const revisionContainsSegmentIds =
        await videoEditorCaptionBasedChain.invoke({
          editing_request: prompt,
          caption_segments: segments.map((segment) => ({
            id: segment.id,
            duration: segment.duration,
            text: segment.text,
          })),
        });

      const newSegmentList = segments.filter((segment) =>
        revisionContainsSegmentIds.segment_ids.includes(segment.id)
      );

      //
      // Save the video revision
      //
      const { videoMediaModel, videoRevisionModel } = getVideoProjectModels();

      const newRevision = await videoMediaModel.create({
        userId,
        projectId,
        prompt,
        isPending: true,
        originalFileIds: mediaVideoIds,
        segments: newSegmentList,
      });

      //
      // Export the video from the revision
      //

      exportVideoBySegments(mediaVideoIds, newSegmentList).then(
        async (fileForSaving) => {
          const exportedFileId = await storeFile({
            file: fileForSaving,
            ownerId: userId,
            tag: "video_revision",
            removeFileAfterStore: true,
          })
            .then((savedFile) => savedFile._id.toString())
            .catch((error) => "");

          videoRevisionModel.findByIdAndUpdate(newRevision._id, {
            isPending: false,
            exportedFileId: exportedFileId,
          });
        }
      );

      return {
        revisionId: newRevision._id.toString(),
      };
    },
  }),

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
];
