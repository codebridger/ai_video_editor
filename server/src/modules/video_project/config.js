const path = require("path");

const temptDir = path.join(require.main?.path || process.cwd(), "..", "temp");
const processed_videos_dir = path.join(temptDir, "processed_videos");

module.exports = {
  temptDir,
  processed_videos_dir,
};
