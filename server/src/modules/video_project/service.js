const { getCollection, getFilePath } = require("@modular-rest/server");
const { VIDEO_PROJECT } = require("../../config");

async function findProjectById(id, userId = null) {
  const model = getCollection(
    VIDEO_PROJECT.DATABASE,
    VIDEO_PROJECT.PROJECT_COLLECTION
  );

  const query = userId ? { _id: id, userId } : { _id: id };

  return model
    .findOne(query)
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
