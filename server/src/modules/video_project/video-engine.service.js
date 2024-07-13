const path = require("path");
const fs = require("fs");
const fluentFfmpeg = require("fluent-ffmpeg");
const { temptDir } = require("./config");
const { safeUnlink } = require("../../helpers/file");

/**
 * Merges multiple video files into a single video file.
 */
async function mergeVideos(inputFiles, outputFile, onProgress = (p) => {}) {
  return new Promise((resolve, reject) => {
    const command = fluentFfmpeg();

    // Add each input file
    inputFiles.forEach((file) => {
      command.input(file);
    });

    // Use the concat filter for merging
    command
      .on("error", (err) => reject(err))
      .on("end", () => resolve("Videos merged successfully"))
      .on("progress", (progress) => {
        console.log(`Merging videos: ${progress.percent}%`);
        onProgress(progress);
      })
      .mergeToFile(outputFile, path.dirname(outputFile));
  });
}

/**
 * Exports video segments based on the provided video file paths and segment details.
 *
 * @param {Array<{videoFilePath: string, start: number, end: number, text:string}>} segments - An array of segment objects.
 * @param {(p:any)=>void} onProgress - A callback function to report progress.
 * @returns {Promise<any>}
 */
async function exportVideoBySegments(
  segments = [],
  onProgress = (progress) => {}
) {
  console.log(`Exporting video from ${segments.length} segments.`);

  const totalDuration = segments.reduce(
    (acc, segment) => acc + (segment.end - segment.start),
    0
  );

  console.log(`Total duration of segments: ${totalDuration} seconds`);

  const intermediateFiles = [];
  const exportDir = path.join(temptDir, "exported_videos"); // Define your tempDir properly
  if (!fs.existsSync(exportDir)) {
    fs.mkdirSync(exportDir);
  }
  const timestamp = Date.now();
  const outputFilePath = path.join(exportDir, `${timestamp}.mp4`);

  // Extract segments
  for (const segment of segments) {
    const { videoFilePath, start, end } = segment;
    const duration = end - start;
    const outputFile = path.join(
      exportDir,
      `segment-${timestamp}-${intermediateFiles.length}.mp4`
    );
    await extractSegment(videoFilePath, start, duration, outputFile);
    intermediateFiles.push(outputFile);
  }

  // Merge segments
  return mergeVideos(intermediateFiles, outputFilePath, onProgress)
    .then(() => {
      console.log("Video segments merged successfully");
      return getFileInformation(outputFilePath);
    })
    .catch((err) => {
      console.error(`Error merging videos: ${err.message}`);
      try {
        fs.unlinkSync(outputFilePath);
      } catch (error) {}
      return "";
    })
    .finally(() => {
      // Optionally, clean up intermediate files
      intermediateFiles.forEach((file) => safeUnlink(file));
    });
}

/**
 * Helper function to extract and save a video segment.
 */
async function extractSegment(filePath, start, duration, outputFile) {
  return new Promise((resolve, reject) => {
    fluentFfmpeg(filePath)
      .seekInput(start)
      .duration(duration)
      .videoCodec("libx264") // Re-encode video to H.264
      .audioCodec("aac") // Re-encode audio to AAC
      .size("640x480") // Standardize resolution
      .autopad(true, "black") // Center video and add black padding without stretching
      .fps(30) // Standardize frame rate
      .output(outputFile)
      .on("end", () => resolve("Segment extracted successfully"))
      .on("error", (err) => reject(err))
      .run();
  });
}

/**
 * Asynchronously retrieves detailed information about a media file, including its MIME type, name, size, and path.
 *
 * This function analyzes a media file specified by `filePath` to extract its codec information using `fluent-ffmpeg`.
 * It then maps the codec to a MIME type for easier handling in web contexts. If the codec is not recognized, it defaults
 * to "application/octet-stream". The function also retrieves the file's size and name from the file system.
 *
 * @param {string} filePath - The path to the media file to be analyzed.
 * @returns {Promise<{path: string, type: string, name: string, size: number}>} A promise that resolves with an object containing:
 *          - `path`: The full path to the media file.
 *          - `type`: The MIME type of the media file, derived from its codec.
 *          - `name`: The name of the file, including its extension.
 *          - `size`: The size of the file in bytes.
 *          If an error occurs during the analysis, the promise is rejected with the error.
 *
 * @example
 * getFileInformation("/path/to/video.mp4").then(fileInfo => {
 *   console.log(fileInfo);
 * }).catch(error => {
 *   console.error("Error getting file information:", error);
 * });
 */
function getFileInformation(filePath) {
  function getMimeType(codec_name) {
    const codecToMimeMap = {
      h264: "video/mp4",
      vp8: "video/webm",
      vp9: "video/webm",
      aac: "audio/aac",
      mp3: "audio/mpeg",
      opus: "audio/opus",
      vorbis: "audio/vorbis",
    };

    return codecToMimeMap[codec_name] || "application/octet-stream";
  }

  return new Promise((resolve, reject) => {
    // Getting file size
    const fileSize = fs.statSync(filePath).size;

    // Extracting file name
    const fileName = path.basename(filePath);

    // Using fluent-ffmpeg to determine the file type
    fluentFfmpeg.ffprobe(filePath, (err, metadata) => {
      if (err) {
        reject(err);
      } else {
        // Assuming the first stream is representative for the file type
        const fileType = getMimeType(metadata.streams[0].codec_name);
        // Constructing the file info object
        const fileInfo = {
          path: filePath,
          type: fileType, // This is not a MIME type, but a codec type. Adjust as needed.
          name: fileName,
          size: fileSize,
        };
        resolve(fileInfo);
      }
    });
  });
}

module.exports = {
  exportVideoBySegments,
  mergeVideos,
  getFileInformation,
};
