const { getCollection, getFilePath } = require("@modular-rest/server");
const { VIDEO_PROJECT } = require("../../config");

async function findProjectById(id) {
  const model = getCollection(
    VIDEO_PROJECT.DATABASE,
    VIDEO_PROJECT.PROJECT_COLLECTION
  );

  return model
    .findOne({ _id: id })
    .exec()
    .then((project) => project.toObject())
    .catch((err) => null);
}

async function getVideoMediaDocsByFileIds(fileIds) {
  const video_media_model = getCollection(
    VIDEO_PROJECT.DATABASE,
    VIDEO_PROJECT.VIDEO_MEDIA
  );

  return video_media_model
    .find({ fileId: { $in: fileIds } })
    .exec()
    .then((videos) => {
      // sort the videos based on the order of the ids
      const videoMap = videos.reduce((acc, video) => {
        acc[video.fileId] = video;
        return acc;
      }, {});

      return fileIds.map((id) => videoMap[id]);
    });
}

/**
 * Asynchronously extracts segments along with their file paths from a project's timeline.
 *
 * This function retrieves a project by its ID and iterates over its timeline to extract
 * information about each segment. For each segment in the timeline, it finds the corresponding
 * video document to get the file path and then constructs an array of objects containing
 * the video file path, start time, and end time of each segment.
 *
 * Note: This function assumes the existence of `getVideoProjectModels`, which provides the models
 * for querying the database, and `getFilePath`, which retrieves the file path for a given fileId.
 *
 * @param {string} projectId - The ID of the project from which to extract segment information.
 * @returns {Promise<Array<{videoFilePath: string, start: number, end: number, text:string}>>} A promise that resolves to an array of objects,
 *          each object containing the `videoFilePath`, `start`, and `end` properties for a segment.
 */
async function extractSegmentsWithFilePathFromProjectTimeline(projectId) {
  const { videoMediaModel, projectModel } = getVideoProjectModels();

  const projectDoc = await projectModel.findOne({ _id: projectId });

  const streamSegments = [];

  for (const groupedSegment of projectDoc.toObject().timeline) {
    if (!groupedSegment.ids || groupedSegment.ids.length === 0) {
      continue;
    }

    const videoDoc = await videoMediaModel
      .findOne({ _id: groupedSegment.parentRef })
      .then((doc) => doc.toObject());

    for (const segmentId of groupedSegment.ids) {
      const segmentIndex = videoDoc.segments.findIndex(
        (seg) => seg.id === segmentId
      );

      const segmentData = videoDoc.segments[segmentIndex];

      streamSegments.push({
        order: streamSegments.length - 1,
        videoFilePath: await getFilePath(videoDoc.fileId),
        fileId: videoDoc.fileId,
        start: segmentData.start,
        end: segmentData.end,
        text: segmentData.text,
      });
    }
  }

  return streamSegments;
}

function getVideoProjectModels() {
  return {
    projectModel: getCollection(
      VIDEO_PROJECT.DATABASE,
      VIDEO_PROJECT.PROJECT_COLLECTION
    ),
    videoMediaModel: getCollection(
      VIDEO_PROJECT.DATABASE,
      VIDEO_PROJECT.VIDEO_MEDIA
    ),
    videoRevisionModel: getCollection(
      VIDEO_PROJECT.DATABASE,
      VIDEO_PROJECT.VIDEO_REVISION
    ),
  };
}

module.exports = {
  findProjectById,
  getVideoMediaDocsByFileIds,
  getVideoProjectModels,
  extractSegmentsWithFilePathFromProjectTimeline,
};
