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

module.exports = {
  createFolder,
};
