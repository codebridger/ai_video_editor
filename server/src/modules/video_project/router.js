let Router = require("koa-router");
const ffmpeg = require("fluent-ffmpeg");
const stream = require("stream");

const { reply, getCollection, userManager } = require("@modular-rest/server");
const { extractSegmentsWithFilePathFromProjectTimeline } = require("./service");

const name = "stream";
const editor = new Router();

editor.get("/grouped-segments", async (ctx) => {
  const { projectId = "" } = ctx.query;

  // Create a stream to concatenate the segments
  const concatStream = new stream.PassThrough();

  // Function to add segments to the stream
  const addSegmentToStream = (videoPath, startTime, duration, callback) => {
    const segmentStream = new stream.PassThrough();

    ffmpeg(videoPath)
      .setStartTime(startTime)
      .setDuration(duration)
      .size("480x640")
      .outputFormat("mpegts") // Use MPEG-TS container format for streaming
      .videoBitrate("1000k") // Set fixed video bitrate to 1000 kbps
      .audioBitrate("128k") // Set fixed audio bitrate to 128 kbps
      .on("stderr", (stderrLine) => {
        console.error("FFmpeg stderr:", stderrLine);
      })
      .on("end", () => {
        console.log(`Finished processing segment from ${videoPath}`);
        segmentStream.end();
        callback();
      })
      .on("error", (err) => {
        console.error(`Error processing segment from ${videoPath}:`, err);
        segmentStream.end();
        callback(err);
      })
      .pipe(segmentStream);

    segmentStream.pipe(concatStream, { end: false });
  };

  const videoSegments = await extractSegmentsWithFilePathFromProjectTimeline(
    projectId.toString()
  );

  if (!videoSegments.length) {
    ctx.status = 404;
    ctx.body = "No video segments found";
    return;
  }

  // Process the segments in sequence
  const processSegments = (index) => {
    if (index < videoSegments.length) {
      const segment = videoSegments[index];
      addSegmentToStream(
        segment.videoFilePath,
        segment.start,
        segment.end - segment.start,
        (err) => {
          if (err) {
            ctx.status = 500;
            ctx.body = "Internal Server Error";
            return;
          }
          processSegments(index + 1);
        }
      );
    } else {
      concatStream.end();
    }
  };

  // Set response headers for video streaming
  ctx.set("Content-Type", "video/mp2t"); // MPEG-TS MIME type
  ctx.set("Transfer-Encoding", "chunked");

  // Pipe the concatenated stream to the response
  ctx.body = concatStream;

  // Start processing segments
  processSegments(0);
});

module.exports.name = name;
module.exports.main = editor;
