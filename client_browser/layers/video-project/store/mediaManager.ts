import {
  fileProvider,
  Types,
  functionProvider,
  dataProvider,
} from "@modular-rest/client";
import { defineStore } from "pinia";
import {
  VIDEO_PROJECT_DATABASE,
  type VideoMediaType,
} from "../types/project.type";

export const useMediaManagerStore = defineStore("mediaManagerStore", () => {
  // The uploaded files for the project, Native cms files
  const projectFiles = ref<Types.FileDocument[]>([]);
  // The files are bing uploaded by the user
  const uploadList = ref<FileList | null>(null);
  // The Progress of the files being uploaded
  const uploadProgressList = ref<{ [key: string]: number }>({});

  // ProjectMedia Files
  // These are process content of cms files
  const processedVideoMediaList = ref<VideoMediaType[]>([]);

  function fetchProjectFiles(projectId: string) {
    projectFiles.value = [];
    uploadList.value = null;
    uploadProgressList.value = {};

    return fileProvider
      .getFileDocsByTag(projectId, authUser.value?.id!)
      .then((files) => {
        projectFiles.value = files;
      })
      .catch((error) => {
        console.error("Error fetching project files:", error);
      });
  }

  function fetchVideoMedias(projectId: string) {
    processedVideoMediaList.value = [];

    return dataProvider
      .find<VideoMediaType>({
        database: VIDEO_PROJECT_DATABASE.DATABASE,
        collection: VIDEO_PROJECT_DATABASE.VIDEO_MEDIA,
        query: { projectId },
      })
      .then((medias) => {
        processedVideoMediaList.value = medias;
      });
  }

  function fetchVideoMediaByFileId(fileId: string) {
    return dataProvider
      .findOne<VideoMediaType>({
        database: VIDEO_PROJECT_DATABASE.DATABASE,
        collection: VIDEO_PROJECT_DATABASE.VIDEO_MEDIA,
        query: { fileId },
      })
      .then((medias) => {
        const index = processedVideoMediaList.value.findIndex(
          (media) => media.fileId === fileId
        );
        if (index !== -1) {
          processedVideoMediaList.value[index] = medias;
        } else {
          processedVideoMediaList.value.push(medias);
        }
      });
  }

  function getUploadSessionId(file: File) {
    return file.name + file.size + file.lastModified;
  }

  function checkUploadProgress(file: File) {
    const sessionId = getUploadSessionId(file);
    return uploadProgressList.value[sessionId];
  }

  function startUploadSession(fileName: string, projectId: string) {
    let file = null;
    // iterate into the file list and upload each file
    if (uploadList.value) {
      for (let i = 0; i < uploadList.value.length; i++) {
        file = uploadList.value[i];
        if (file.name === fileName) break;
      }
    }

    if (!(file && file.name === fileName))
      return Promise.reject("File not found");

    const sessionId = getUploadSessionId(file);

    if (checkUploadProgress(file))
      return Promise.reject("File already in progress");

    return fileProvider
      .uploadFile(
        file,
        (event) => {
          const percentage = Math.round((event.loaded / event.total) * 100);
          uploadProgressList.value[sessionId] = percentage;
        },
        projectId
      )
      .then((fileDoc) => {
        projectFiles.value.push(fileDoc);
        delete uploadProgressList.value[sessionId];

        return fetchVideoMediaByFileId(fileDoc._id);
      })
      .catch((error) => {
        delete uploadProgressList.value[sessionId];
        throw error;
      });
  }

  function removeProjectFile(fileId: string) {
    return fileProvider.removeFile(fileId).then(() => {
      projectFiles.value = projectFiles.value.filter(
        (file) => file._id !== fileId
      );
    });
  }

  function generateVideoRevision(context: { prompt: string; ids: string[] }) {
    return functionProvider.run({
      name: "generateVideoRevision",
      args: {
        prompt: context.prompt,
        mediaVideoIds: context.ids,
        userId: authUser.value?.id,
      },
    });
  }

  function generateGroupedSegments(videoMediaId: string) {
    return functionProvider
      .run({
        name: "generateGroupedSegments",
        args: {
          videoMediaId,
        },
      })
      .then((res: any) => {
        // update the grouped segments in the store
        const index = processedVideoMediaList.value.findIndex(
          (media) => media._id === videoMediaId
        );

        if (index !== -1) {
          processedVideoMediaList.value[index].groupedSegments =
            res.groupedSegments;
        }
      });
  }

  return {
    projectFiles,
    uploadList,
    processedVideoMediaList,
    startUploadSession,
    checkUploadProgress,
    fetchProjectFiles,
    removeProjectFile,
    generateVideoRevision,
    fetchVideoMedias,
    fetchVideoMediaByFileId,
    generateGroupedSegments,
  };
});
