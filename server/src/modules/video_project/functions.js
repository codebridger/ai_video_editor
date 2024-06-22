const { defineFunction, storeFile } = require("@modular-rest/server");
const fs = require("fs");
const videoRevisionChain = require("../../chains/video-editor-chain");
const { exportVideoBySegments } = require("./mediaProcessor");
const {
  getVideoMediaDocsByFileIds,
  getVideoProjectModels,
} = require("./service");

module.exports.functions = [
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

      const revisionContainsSegmentIds = await videoRevisionChain.invoke({
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
      const { videoRevision } = getVideoProjectModels();

      const newRevision = await videoRevision.create({
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

          videoRevision.findByIdAndUpdate(newRevision._id, {
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
];
