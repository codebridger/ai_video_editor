<template>
    <div>
        <FileInputCombo
            class="m-4"
            ref="fileInput"
            accept="video/*"
            autoUpload
            :files="mediaManagerStore.uploadList"
            :progress="uploadProgress"
            @file-select="addUploadList"
            @file-upload="handleFileUpload"
            @file-upload-cancel="handleCancelUpload"
            @file-upload-delete="handleDeleteUpload"
        />
    </div>
</template>

<script setup lang="ts">
    import { useMediaManagerStore } from '../../stores/mediaManager.ts';
    import { FileInputCombo } from '@codebridger/lib-vue-components/elements.ts';
    import { computed } from 'vue';

    const mediaManagerStore = useMediaManagerStore();

    // Calculate progress for each file in the upload list
    const uploadProgress = computed(() => {
        const progress: Record<string, number> = {};
        mediaManagerStore.uploadList.forEach((file) => {
            const progressValue = mediaManagerStore.checkUploadProgress(file) || 0;
            progress[file.name] = progressValue;
        });
        return progress;
    });

    function addUploadList(payload: { files: File[] }) {
        if (!payload.files.length) {
            return;
        }

        payload.files.forEach((file) => {
            if (mediaManagerStore.uploadList.some((f) => f.name === file.name)) {
                return;
            }

            mediaManagerStore.uploadList.push(file);

            // Only start upload if project ID exists
            if (mediaManagerStore.projectId) {
                mediaManagerStore.startUploadSession(file.name, mediaManagerStore.projectId);
            } else {
                console.error('Cannot upload file: Project ID is not set');
            }
        });
    }

    function handleFileUpload(payload: { file: File }) {
        if (!payload.file) {
            return;
        }

        // Only start upload if project ID exists
        if (mediaManagerStore.projectId) {
            mediaManagerStore.startUploadSession(payload.file.name, mediaManagerStore.projectId);
        } else {
            console.error('Cannot upload file: Project ID is not set');
        }
    }

    function handleCancelUpload(payload: { file: File }) {
        if (!payload.file) {
            return;
        }

        // Remove the file from the upload list without completing the upload
        mediaManagerStore.uploadList = mediaManagerStore.uploadList.filter((file) => file.name !== payload.file.name);
    }

    function handleDeleteUpload(payload: { file: File }) {
        if (!payload.file) {
            return;
        }

        // Find if this file was already uploaded and has a fileId
        const fileDoc = mediaManagerStore.projectFiles.find((f) => f.fileName === payload.file.name);

        if (fileDoc) {
            // If the file was already uploaded, remove it from the project
            mediaManagerStore.removeProjectFile(fileDoc._id);
        }

        // Also remove it from the upload list if it's still there
        mediaManagerStore.uploadList = mediaManagerStore.uploadList.filter((file) => file.name !== payload.file.name);
    }
</script>
