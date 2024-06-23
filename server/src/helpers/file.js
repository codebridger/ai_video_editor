const fs = require("fs");

function createFolder(folderPath) {
  return new Promise((resolve, reject) => {
    fs.mkdir(folderPath, { recursive: true }, (err) => {
      if (err) {
        reject(err);
      } else {
        resolve("");
      }
    });
  });
}

function safeUnlink(filePath) {
  try {
    fs.unlink(filePath, (err) => {
      if (err) {
        // console.error("Error deleting file", err);
      }
    });
  } catch (error) {}
}

module.exports = {
  createFolder,
  safeUnlink,
};
