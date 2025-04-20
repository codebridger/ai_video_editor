const {
  getCollection,
  DatabaseTrigger,
  removeFile,
} = require("@modular-rest/server");

const projectService = require("./service");
const mediaProcessor = require("./media-processor.service");
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
          if (
            file.fileId &&
            typeof file.fileId === "string" &&
            file.fileId.trim() !== ""
          ) {
            removeFile(file.fileId).catch((err) => {});
          }
          if (
            file.lowQualityFileId &&
            typeof file.lowQualityFileId === "string" &&
            file.lowQualityFileId.trim() !== ""
          ) {
            removeFile(file.lowQualityFileId).catch((err) => {});
          }
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
          if (
            revision.fileId &&
            typeof revision.fileId === "string" &&
            revision.fileId.trim() !== ""
          ) {
            removeFile(revision.fileId).catch((err) => {});
          }
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
    if (fileId && typeof fileId === "string" && fileId.trim() !== "") {
      removeFile(fileId).catch((err) => {});
    }
    if (
      lowQualityFileId &&
      typeof lowQualityFileId === "string" &&
      lowQualityFileId.trim() !== ""
    ) {
      removeFile(lowQualityFileId).catch((err) => {});
    }
  }),
];

module.exports.videoRevisionTriggers = [
  new DatabaseTrigger("remove-one", async ({ query, queryResult }) => {
    const { _id, fileId } = query;

    if (fileId && typeof fileId === "string" && fileId.trim() !== "") {
      removeFile(fileId).catch((err) => {});
    }
  }),
];

module.exports.projectFileTriggers = [
  /*
  When a video file is uploaded, 
  we need to process it to extract the audio and transcript.
 */
  new DatabaseTrigger("insert-one", async ({ query, queryResult }) => {
    const { tag } = queryResult;
    const projectDoc = await projectService.findProjectById(tag);

    // Make sure it's belong to a project
    if (projectDoc && projectDoc._id.toString() === tag) {
      mediaProcessor.processVideo(queryResult);
    }
  }),

  new DatabaseTrigger("remove-one", async ({ query, queryResult }) => {
    try {
      await getCollection(VIDEO_PROJECT.DATABASE, VIDEO_PROJECT.VIDEO_MEDIA)
        .deleteOne({ fileId: query._id })
        .exec();
    } catch (error) {
      console.error("Error removing video media:", error);
    }
  }),
];
