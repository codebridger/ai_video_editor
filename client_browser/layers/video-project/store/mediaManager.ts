import { fileProvider, Types, functionProvider } from "@modular-rest/client";
import { defineStore } from "pinia";

export const useMediaManagerStore = defineStore("mediaManagerStore", () => {
  const projectFiles = ref<Types.FileDocument[]>([]);
  const uploadList = ref<FileList | null>(null);
  const uploadProgressList = ref<{ [key: string]: number }>({});

  function fetchProjectFiles(projectId: string) {
    return fileProvider
      .getFileDocsByTag(projectId, authUser.value?.id!)
      .then((files) => {
        projectFiles.value = files;
      })
      .catch((error) => {
        console.error("Error fetching project files:", error);
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
    debugger;
    return functionProvider.run({
      name: "generateVideoRevision",
      args: {
        prompt: context.prompt,
        mediaVideoIds: context.ids,
        userId: authUser.value?.id,
      },
    });
  }

  return {
    projectFiles,
    uploadList,
    startUploadSession,
    checkUploadProgress,
    fetchProjectFiles,
    removeProjectFile,
    generateVideoRevision,
  };
});
