const { CmsTrigger, getCollection } = require("@modular-rest/server/src");
const projectService = require("./service");
const mediaProcessor = require("./mediaProcessor");
const { VIDEO_PROJECT } = require("../../config");

module.exports.projectFileTriggers = [
  new CmsTrigger("insert-one", async ({ query, queryResult }) => {
    const { tag } = queryResult;
    const projectDoc = await projectService.findProjectById(tag);

    // Make sure it's belong to a project
    if (projectDoc && projectDoc._id.toString() === tag) {
      mediaProcessor.processVideo(queryResult);
    }
  }),

  new CmsTrigger("remove-one", async ({ query, queryResult }) => {
    getCollection(
      VIDEO_PROJECT.DATABASE,
      VIDEO_PROJECT.TRANSCRIPT_SEGMENT_COLLECTION
    )
      .deleteOne({ fileId: query._id })
      .exec();
  }),
];
