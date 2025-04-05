<template>
    <div>
        <FileInputCombo autoUpload accept="video/*" @file-select="addUploadList" class="m-4" />
    </div>
</template>

<script setup lang="ts">
    import { useMediaManagerStore } from '../../stores/mediaManager.ts';
    import { FileInputCombo } from '@codebridger/lib-vue-components/elements.ts';
    const mediaManagerStore = useMediaManagerStore();

    function addUploadList(payload: { files: File[] }) {
        if (!payload.files.length) {
            return;
        }

        payload.files.forEach((file) => {
            if (mediaManagerStore.uploadList.some((f) => f.name === file.name)) {
                return;
            }

            mediaManagerStore.uploadList.push(file);
            mediaManagerStore.startUploadSession(file.name, mediaManagerStore.projectId);
        });
    }
</script>
