const {
  getFilePath,
  storeFile,
  removeFile,
} = require("@modular-rest/server/src");
const { getVideoProjectModels, findProjectById } = require("./service");
const timelineChain = require("../../chains/video-editor-grouped-segment-based");
const { exportVideoBySegments } = require("./video-engine.service");

/**
 * Asynchronously extracts segments along with their file paths from a project's timeline.
 *
 * This function retrieves a project by its ID and iterates over its timeline to extract
 * information about each segment. For each segment in the timeline, it finds the corresponding
 * video document to get the file path and then constructs an array of objects containing
 * the video file path, start time, and end time of each segment.
 *
 * Note: This function assumes the existence of `getVideoProjectModels`, which provides the models
 * for querying the database, and `getFilePath`, which retrieves the file path for a given fileId.
 *
 * @param {string} projectId - The ID of the project from which to extract segment information.
 * @returns {Promise<Array<{videoFilePath: string, start: number, end: number, text:string}>>} A promise that resolves to an array of objects,
 *          each object containing the `videoFilePath`, `start`, and `end` properties for a segment.
 */
async function extractSegmentsWithFilePathFromProjectTimeline(projectId) {
  const { videoMediaModel, projectModel } = getVideoProjectModels();

  const projectDoc = await projectModel.findOne({ _id: projectId });

  const streamSegments = [];

  for (const groupedSegment of projectDoc.toObject().timeline || []) {
    if (!groupedSegment.ids || groupedSegment.ids.length === 0) {
      continue;
    }

    const videoDoc = await videoMediaModel
      .findOne({ _id: groupedSegment.processedVideoId })
      .then((doc) => doc.toObject());

    for (const segmentId of groupedSegment.ids) {
      const segmentIndex = videoDoc.segments.findIndex(
        (seg) => seg.id === segmentId
      );

      const captionSegmentData = videoDoc.segments[segmentIndex];

      streamSegments.push({
        videoFilePath: await getFilePath(videoDoc.lowQualityFileId),
        fileId: videoDoc.lowQualityFileId,
        start: captionSegmentData.start,
        end: captionSegmentData.end,
        text: captionSegmentData.text,
      });
    }
  }

  return streamSegments;
}

async function generateTimelineByPrompt({ projectId, prompt, userId }) {
  if (!projectId) {
    throw new Error("projectId is required.");
  }

  const { videoMediaModel, projectModel } = getVideoProjectModels();

  const project = await projectModel
    .findOne({
      _id: projectId,
      userId,
    })
    .exec();

  if (!project) {
    throw new Error("No project found with the given id");
  }

  const projectVideoMedia = await videoMediaModel
    .find({ projectId })
    .sort({ creation_time: 1 })
    .exec();

  let groupedSegments = [];

  for (const videoMedia of projectVideoMedia) {
    if (!videoMedia || !videoMedia.groupedSegments) {
      continue;
    }

    const videoMediaJson = videoMedia.toObject();

    groupedSegments = groupedSegments.concat(
      videoMediaJson.groupedSegments.map((segment) => {
        return {
          ...segment,
          processedVideoId: videoMediaJson._id.toString(),
          fileId: videoMediaJson.fileId,
        };
      })
    );
  }

  const timeline = await timelineChain.invoke({
    editing_request: prompt,
    grouped_segments: groupedSegments,
  });

  await projectModel.updateOne({ _id: projectId }, { $set: { timeline } });

  return {
    timeline,
  };
}

async function generateVideoRevision({ prompt, projectId, userId }) {
  if (!prompt || !projectId || !userId) {
    throw new Error("prompt and ids is required. userId is required.");
  }

  console.time("timeline_render_took");

  const projectDoc = await findProjectById(projectId, userId);

  if (!projectDoc) {
    throw new Error("No project found with the given id");
  } else if (projectDoc.userId !== userId) {
    throw new Error("User does not have access to the project");
  }

  // extract segments
  const extractedSegments =
    await extractSegmentsWithFilePathFromProjectTimeline(projectId);

  //
  // Save the video revision
  //
  const { videoRevisionModel } = getVideoProjectModels();

  const newRevision = await videoRevisionModel.create({
    userId,
    projectId,
    prompt,
    isPending: true,
    segments: extractedSegments,
  });

  //
  // Export the video from the revision
  //

  exportVideoBySegments(extractedSegments)
    .then(async (fileForSaving) => {
      const exportedFileId = await storeFile({
        file: fileForSaving,
        ownerId: userId,
        tag: newRevision._id.toString(),
        removeFileAfterStore: true,
      })
        .then((savedFile) => savedFile._id.toString())
        .catch((error) => "");

      await videoRevisionModel
        .updateOne(
          {
            _id: newRevision._id,
          },
          {
            $set: { isPending: false, fileId: exportedFileId },
          }
        )
        .exec()
        .then((res) => {
          console.log("Video revision exported successfully", res);
        });
    })
    .catch(async (error) => {
      console.error("Error exporting video revision", error);
      await videoRevisionModel
        .updateOne(
          {
            _id: newRevision._id,
          },
          {
            $set: { isPending: false },
          }
        )
        .exec();
    })
    .finally(() => {
      console.timeEnd("timeline_render_took");
    });

  return newRevision.toObject();
}

async function generateTimelinePreview({ projectId, userId }) {
  if (!projectId || !userId) {
    throw new Error("prompt and ids is required. userId is required.");
  }

  console.time("timeline_render_took");

  const projectDoc = await findProjectById(projectId, userId);

  if (!projectDoc) {
    throw new Error("No project found with the given id");
  } else if (projectDoc.userId !== userId) {
    throw new Error("User does not have access to the project");
  }

  // Remove old preview
  if (projectDoc.timelinePreview?.fileId) {
    await removeFile(projectDoc.timelinePreview.fileId).catch((error) => {});
  }

  // extract segments
  const extractedSegments =
    await extractSegmentsWithFilePathFromProjectTimeline(projectId);

  const { projectModel } = getVideoProjectModels();

  // Set the preview as pending
  await projectModel
    .updateOne(
      { _id: projectId },
      {
        $set: {
          "timelinePreview.fileId": "",
          "timelinePreview.isPending": !!extractedSegments.length,
        },
      }
    )
    .exec();

  if (extractedSegments.length === 0) {
    return Promise.resolve();
  }

  //
  // Export the video from the revision
  //

  return exportVideoBySegments(extractedSegments)
    .then(async (fileForSaving) => {
      const exportedFileId = await storeFile({
        file: fileForSaving,
        ownerId: userId,
        tag: projectId + "_preview",
        removeFileAfterStore: true,
      })
        .then((savedFile) => savedFile._id.toString())
        .catch((error) => "");

      await projectModel
        .updateOne(
          {
            _id: projectId,
          },
          {
            $set: {
              timelinePreview: {
                fileId: exportedFileId,
                isPending: false,
              },
            },
          }
        )
        .exec();
    })
    .catch(async (error) => {
      console.error("Error exporting video revision", error);
      await projectModel
        .updateOne(
          {
            _id: projectId,
          },
          {
            $set: {
              "timelinePreview.isPending": false,
            },
          }
        )
        .exec();
    })
    .finally(() => {
      console.timeEnd("timeline_render_took");
    });
}

module.exports = {
  extractSegmentsWithFilePathFromProjectTimeline,
  generateTimelineByPrompt,
  generateVideoRevision,
  generateTimelinePreview,
};
