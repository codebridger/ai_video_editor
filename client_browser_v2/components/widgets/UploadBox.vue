<template>
    <section>
        <h1>UploadBox</h1>
    </section>
</template>

<script setup lang="ts">
    import { useMediaManagerStore } from '../../stores/mediaManager.ts';

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
