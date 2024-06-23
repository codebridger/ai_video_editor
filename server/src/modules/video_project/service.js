const { getCollection } = require("@modular-rest/server");
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
};
