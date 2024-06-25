const {
  CollectionDefinition,
  Schema,
  Permission,
  Schemas,
} = require("@modular-rest/server");

const { VIDEO_PROJECT } = require("../../config");
const {
  projectDocTriggers,
  videoMediaTriggers,
  videoRevisionTriggers,
} = require("./triggers");

const groupedSegmentsSchema = new Schema({
  ids: [Number],
  description: String,
  duration: Number,
});

const TimelineGroupedSegmentTypesSchema = new Schema({
  ids: [Number],
  description: String,
  duration: Number,
  processedVideoId: String,
  fileId: String,
});

const projectCollection = new CollectionDefinition({
  db: VIDEO_PROJECT.DATABASE,
  collection: VIDEO_PROJECT.PROJECT_COLLECTION,
  schema: new Schema(
    {
      title: String,
      userId: String,
      timeline: [TimelineGroupedSegmentTypesSchema],
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
  triggers: projectDocTriggers,
});

const videoMedia = new CollectionDefinition({
  db: VIDEO_PROJECT.DATABASE,
  collection: VIDEO_PROJECT.VIDEO_MEDIA,
  schema: new Schema(
    {
      fileId: String,
      fileName: String,
      projectId: String,
      isProcessed: Boolean,
      language: String,
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
          id: Number,
          start: Number,
          end: Number,
          text: String,
        },
      ],
      // grouped segments based on their context.
      groupedSegments: [groupedSegmentsSchema],
    },
    { timestamps: true }
  ),
  permissions: [
    new Permission({
      type: "user_access",
      read: true,
      write: true,
    }),
  ],
  triggers: videoMediaTriggers,
});

const videoRevision = new CollectionDefinition({
  db: VIDEO_PROJECT.DATABASE,
  collection: VIDEO_PROJECT.VIDEO_REVISION,
  schema: new Schema(
    {
      userId: String,
      projectId: String,
      prompt: String,
      fileId: String,
      isPending: Boolean,
      segments: [
        {
          videoFilePath: { type: String, required: true },
          fileId: { type: String, required: true },
          start: { type: Number, required: true },
          end: { type: Number, required: true },
          text: { type: String, required: true },
        },
      ],
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
  triggers: videoRevisionTriggers,
});

module.exports = [projectCollection, videoMedia, videoRevision];
