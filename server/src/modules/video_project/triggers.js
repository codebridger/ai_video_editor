const {
  CmsTrigger,
  getCollection,
  DatabaseTrigger,
  removeFile,
} = require("@modular-rest/server/src");
const projectService = require("./service");
const mediaProcessor = require("./mediaProcessor");
const { VIDEO_PROJECT } = require("../../config");

module.exports.projectDocTriggers = [
  new DatabaseTrigger("remove-one", async ({ query, queryResult }) => {
    const id = query._id;

    const { videoMediaModel, videoRevisionModel } =
      projectService.getVideoProjectModels();

    // Remove all files
    await videoMediaModel
      .find({ projectId: id })
      .exec()
      .then((mediaFile) => {
        mediaFile.forEach((file) => {
          removeFile(file.fileId).catch((err) => {});
          removeFile(file.lowQualityFileId).catch((err) => {});
        });
      });

    // Remove all media files
    await videoMediaModel.deleteMany({ projectId: id }).exec();

    // Remove all revisions files
    await videoRevisionModel
      .find({ projectId: id })
      .exec()
      .then((revisions) => {
        revisions.forEach((revision) => {
          removeFile(revision.fileId).catch((err) => {});
        });
      });

    // Remove all revisions
    await videoRevisionModel.deleteMany({ projectId: id }).exec();
  }),

  new DatabaseTrigger("update-one", async ({ query, queryResult }) => {
    const id = query._id;

    const { videoMediaModel, videoRevisionModel } =
      projectService.getVideoProjectModels();

    if (query.$set?.timeline === undefined) return;
  }),
];

module.exports.videoMediaTriggers = [
  new DatabaseTrigger("remove-one", async ({ query, queryResult }) => {
    const { _id, fileId, lowQualityFileId } = query;

    const { videoMediaModel, videoRevisionModel } =
      projectService.getVideoProjectModels();

    // Remove all files
    removeFile(fileId).catch((err) => {});
    removeFile(lowQualityFileId).catch((err) => {});
  }),
];

module.exports.videoRevisionTriggers = [
  new DatabaseTrigger("remove-one", async ({ query, queryResult }) => {
    const { _id, fileId } = query;

    removeFile(fileId).catch((err) => {});
  }),
];

module.exports.projectFileTriggers = [
  /*
  When a video file is uploaded, 
  we need to process it to extract the audio and transcript.
 */
  new CmsTrigger("insert-one", async ({ query, queryResult }) => {
    const { tag } = queryResult;
    const projectDoc = await projectService.findProjectById(tag);

    // Make sure it's belong to a project
    if (projectDoc && projectDoc._id.toString() === tag) {
      mediaProcessor.processVideo(queryResult);
    }
  }),

  new CmsTrigger("remove-one", async ({ query, queryResult }) => {
    getCollection(VIDEO_PROJECT.DATABASE, VIDEO_PROJECT.VIDEO_MEDIA)
      .deleteOne({ fileId: query._id })
      .exec();
  }),
];
