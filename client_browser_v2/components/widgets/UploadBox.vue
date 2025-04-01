<template>
    <div>
        <FileInputCombo autoUpload accept="video/*" @file-select="addUploadList" />
    </div>
</template>

<script setup lang="ts">
    import { useMediaManagerStore } from '../../stores/mediaManager.ts';
    import { FileInputCombo } from '@codebridger/lib-vue-components/elements.ts';
    import { useRoute } from 'vue-router';

    const mediaManagerStore = useMediaManagerStore();
    const route = useRoute();

    function addUploadList(files: File[]) {
        if (!files || files.length === 0) {
            return;
        }

        const projectId = route.params.id as string;

        files.forEach((file) => {
            if (mediaManagerStore.uploadList.some((f) => f.name === file.name)) {
                return;
            }

            mediaManagerStore.uploadList.push(file);
            // Start upload to update projectFiles
            mediaManagerStore.startUploadSession(file.name, projectId);
        });
    }
</script>
