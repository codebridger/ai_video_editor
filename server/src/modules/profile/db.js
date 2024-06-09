const {
  CollectionDefinition,
  Schema,
  Permission,
  Schemas,
} = require("@modular-rest/server");

const { USER_CONTENT } = require("../../config");

const profileCollection = new CollectionDefinition({
  db: USER_CONTENT.DATABASE,
  collection: USER_CONTENT.PROFILE_COLLECTION,
  schema: new Schema(
    {
      gPicture: String,
      name: String,
      refId: String,
      images: [Schemas.file],
    },
    { timestamps: true }
  ),
  permissions: [
    new Permission({
      type: "user_access",
      read: true,
      write: true,
      onlyOwnData: true,
      ownerIdField: "refId",
    }),
  ],
});

module.exports = [profileCollection];
