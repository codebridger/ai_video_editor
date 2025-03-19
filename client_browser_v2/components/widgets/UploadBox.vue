<template>
    <div>
        <FullscreenDropfile icon="IconGallery" :filter-file-dropped="(file: File) => file.type.startsWith('image')" @drop="addUploadList" />

        <InputFileHeadless v-slot="{ open, remove, drop, files }" :update:modelValue="addUploadList" multiple>
            <!-- Controls -->
            <div class="mb-4 flex items-center gap-2">
                <IconButton size="sm" title="Select files" @click="open" icon="IconPlus" label="Select files" />

                <IconButton size="sm" title="Start Upload" icon="IconArrowUp" label="Start Upload" @click="startUpload" />
            </div>

            <div
                role="button"
                tabindex="-1"
                class="
        "
                @dragenter.stop.prevent
                @dragover.stop.prevent
                @drop="drop"
            >
                <div
                    v-if="!files?.length"
                    class="focus:ring-primary-500/50 group cursor-pointer rounded-lg border-[3px] border-dashed border-gray-300 p-8 transition-colors duration-300 hover:border-gray-400 focus:border-gray-400 focus:outline-none focus:ring-2 dark:border-gray-700 dark:hover:border-gray-600 dark:focus:border-gray-700"
                    tabindex="0"
                    role="button"
                    @click="open"
                    @keydown.enter.prevent="open"
                >
                    <div class="p-5 text-center">
                        <Icon name="IconCloudUpload" class="size-10 text-gray-400" />

                        <h4 class="font-sans text-sm text-gray-400">Drop files to upload</h4>

                        <div>
                            <span class="font-sans text-[0.7rem] font-semibold uppercase text-gray-400"> Or </span>
                        </div>

                        <label
                            for="file"
                            class="group-hover:text-primary-500 group-focus:text-primary-500 cursor-pointer font-sans text-sm text-gray-400 underline underline-offset-4 transition-colors duration-300"
                        >
                            Select files
                        </label>
                    </div>
                </div>

                <ul v-else class="mt-6 space-y-2 overflow-auto">
                    <li v-for="file in mediaManagerStore.uploadList" :key="file.name" :tooltip="file.name">
                        <WidgetsUploadingFileCard :file="file" @remove="remove(file)" />
                    </li>
                </ul>
            </div>
        </InputFileHeadless>
    </div>
</template>

<script setup lang="ts">
    import { useMediaManagerStore } from '../../stores/mediaManager.ts';
    import { IconButton, FullscreenDropfile, InputFileHeadless, Icon } from '@codebridger/lib-vue-components/elements.ts';

    const mediaManagerStore = useMediaManagerStore();

    const startUpload = () => {
        console.log('startUpload');
    };

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
