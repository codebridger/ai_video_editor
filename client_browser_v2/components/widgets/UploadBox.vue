<template>
    <section>
        <DropFile accept="video/*" multiple v-model="addUploadList" @drop="addUploadList" />
    </section>
</template>

<script setup lang="ts">
    import { useMediaManagerStore } from '../../stores/mediaManager.ts';
    import { DropFile } from '@codebridger/lib-vue-components/elements.ts';

    const mediaManagerStore = useMediaManagerStore();

    function addUploadList(files: FileList | null) {
        if (!files) {
            return;
        }

        Array.from(files).forEach((file) => {
            if (mediaManagerStore.uploadList.some((f) => f.name === file.name)) {
                return;
            }

            mediaManagerStore.uploadList.push(file);
        });
    }
</script>
