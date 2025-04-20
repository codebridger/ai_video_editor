<template>
    <div>
        <FileInputCombo
            class="m-4"
            ref="fileInput"
            accept="video/*"
            :auto-upload="true"
            @file-select="handleFileSelect"
            @file-upload="handleFileUpload"
            @file-upload-cancel="handleCancelUpload"
            @file-upload-delete="handleDeleteUpload"
            :showPreview="showPreviewState"
        />
    </div>
</template>

<script setup lang="ts">
    import { useMediaManagerStore } from '../../stores/mediaManager.ts';
    import { FileInputCombo } from '@codebridger/lib-vue-components/elements.ts';
    import { ref, watch } from 'vue';

    const mediaManagerStore = useMediaManagerStore();
    const fileInput = ref(null);
    const showPreviewState = ref(false);

    // Define interface for the active uploads tracking
    interface ActiveUploads {
        [key: string]: {
            abort: () => void;
        };
    }

    // Track active uploads to allow cancellation
    const activeUploads = ref<ActiveUploads>({});

    // Watch for changes in uploadList length to control preview with delay
    watch(
        () => mediaManagerStore.uploadList.length,
        (newLength) => {
            if (newLength > 0) {
                showPreviewState.value = true;
            } else {
                // Add delay before hiding preview
                setTimeout(() => {
                    showPreviewState.value = false;
                }, 1000); // 1 second delay, adjust as needed
            }
        },
        { immediate: true }
    );

    function handleFileSelect(payload: { files: File[] }) {
        console.log('Selected files:', payload.files);
    }

    function handleFileUpload(payload: { file: File; fileId: string }) {
        const { file, fileId } = payload;

        if (!mediaManagerStore.projectId) {
            console.error('Cannot upload file: Project ID is not set');
            if (fileInput.value) {
                // @ts-ignore
                fileInput.value.setFileStatus(fileId, 'error', 'Project ID is not set');
            }
            return;
        }

        try {
            // Start upload using mediaManager
            // We're not actually creating an XHR here, but we need to track it
            // for potential cancellation
            const mockXhr = {
                abort: () => {
                    console.log(`Aborting upload for ${file.name}`);
                    // Remove from upload list
                    mediaManagerStore.uploadList = mediaManagerStore.uploadList.filter((f) => f.name !== file.name);
                },
            };

            // Track the upload for potential cancellation
            activeUploads.value[fileId] = mockXhr;

            // Add file to upload list if not already there
            if (!mediaManagerStore.uploadList.some((f) => f.name === file.name)) {
                mediaManagerStore.uploadList.push(file);
            }

            // Set up an interval to check progress
            const progressInterval = setInterval(() => {
                const progress = mediaManagerStore.checkUploadProgress(file);
                if (progress !== undefined) {
                    // Update the component's progress display using fileId
                    if (fileInput.value) {
                        // @ts-ignore
                        fileInput.value.updateFileProgress(fileId, progress);
                    }

                    // If upload is complete (progress is 100%), clear interval and set status
                    if (progress === 100) {
                        clearInterval(progressInterval);
                        if (fileInput.value) {
                            // @ts-ignore
                            fileInput.value.setFileStatus(fileId, 'finished');
                        }
                        delete activeUploads.value[fileId];
                    }
                }
            }, 500);

            // Start the actual upload
            mediaManagerStore
                .startUploadSession(file.name, mediaManagerStore.projectId)
                .then(() => {
                    clearInterval(progressInterval);
                    if (fileInput.value) {
                        // @ts-ignore
                        fileInput.value.setFileStatus(fileId, 'finished');
                    }
                    delete activeUploads.value[fileId];
                })
                .catch((error) => {
                    clearInterval(progressInterval);
                    if (fileInput.value) {
                        // @ts-ignore
                        fileInput.value.setFileStatus(fileId, 'error', error.message || 'Upload failed');
                    }
                    delete activeUploads.value[fileId];
                });
        } catch (error: any) {
            if (fileInput.value) {
                // @ts-ignore
                fileInput.value.setFileStatus(fileId, 'error', error.message);
            }
        }
    }

    function handleCancelUpload(payload: { file: File; fileId: string }) {
        const { file, fileId } = payload;

        if (activeUploads.value[fileId]) {
            // Abort the upload
            activeUploads.value[fileId].abort();
            delete activeUploads.value[fileId];
            console.log(`Upload cancelled for ${file.name}`);
        }
    }

    function handleDeleteUpload(payload: { file: File }) {
        if (!payload.file) {
            return;
        }

        const fileName = payload.file.name;

        // Find if this file was already uploaded and has a fileId
        const fileDoc = mediaManagerStore.projectFiles.find((f) => f.fileName === fileName);

        if (fileDoc) {
            // If the file was already uploaded, remove it from the project
            mediaManagerStore.removeProjectFile(fileDoc._id).catch((error) => {
                console.error('Failed to remove project file:', error);
            });
        }

        // Also remove it from the upload list if it's still there
        mediaManagerStore.uploadList = mediaManagerStore.uploadList.filter((file) => file.name !== fileName);

        // Clear UI file progress if upload list is now empty
        if (mediaManagerStore.uploadList.length === 0 && fileInput.value) {
            // @ts-ignore
            fileInput.value.clearFiles();
        }
    }
</script>
