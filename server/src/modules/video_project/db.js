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
      // Original files stored into file collection with projectId as tag
      // originalFiles: [Schemas.file],
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

module.exports = [projectCollection];
