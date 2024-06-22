const {
  CollectionDefinition,
  Schema,
  Permission,
  Schemas,
} = require("@modular-rest/server");

const { VIDEO_PROJECT } = require("../../config");

const projectCollection = new CollectionDefinition({
  db: VIDEO_PROJECT.DATABASE,
  collection: VIDEO_PROJECT.PROJECT_COLLECTION,
  schema: new Schema(
    {
      title: String,
      userId: String,
    },
    { timestamps: true }
  ),
  permissions: [
    new Permission({
      type: "user_access",
      read: true,
      write: true,
      onlyOwnData: true,
      ownerIdField: "userId",
    }),
  ],
});

const transcriptSegmentCollection = new CollectionDefinition({
  db: VIDEO_PROJECT.DATABASE,
  collection: VIDEO_PROJECT.VIDEO_MEDIA,
  schema: new Schema(
    {
      fileId: String,
      isProcessed: Boolean,
      // Format properties:
      // https://github.com/fluent-ffmpeg/node-fluent-ffmpeg?tab=readme-ov-file#reading-video-metadata
      format: {
        type: Object,
        default: {},
      },
      // Segments:
      // https://platform.openai.com/docs/api-reference/audio/createTranscription
      segments: [
        {
          start: Number,
          end: Number,
          text: String,
        },
      ],
    },
    { timestamps: true }
  ),
  permissions: [],
});

module.exports = [projectCollection, transcriptSegmentCollection];
