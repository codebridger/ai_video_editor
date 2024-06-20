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

module.exports = {
  findProjectById,
};
