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
  collection: VIDEO_PROJECT.TRANSCRIPT_SEGMENT_COLLECTION,
  schema: new Schema(
    {
      fileId: String,
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
