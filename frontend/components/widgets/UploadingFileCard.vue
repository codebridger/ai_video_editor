<template>
    <div class="relative flex items-center justify-end gap-2 rounded-xl border border-gray-200 bg-white p-3 dark:border-gray-700 dark:bg-gray-800">
        <div class="flex items-center gap-2">
            <div class="shrink-0">
                <img v-if="props.file.type.startsWith('image')" class="size-14 rounded-xl object-cover object-center" alt="Image preview" />

                <Icon name="IconGallery" class="size-14 rounded-xl object-cover object-center" />
            </div>

            <div class="font-sans">
                <span class="line-clamp-1 block w-20 truncate text-sm text-gray-800 dark:text-gray-100">
                    {{ props.file.name }}
                </span>

                <span class="block text-xs text-gray-400">
                    {{ formatFileSize(props.file.size) }}
                </span>
            </div>
        </div>

        <div class="ms-auto w-32 px-4 transition-opacity duration-300" :class="'opacity-100'">
            <Progress :value="mediaStore.checkUploadProgress(props.file)" :max="100" color="success" size="xs" rounded="sm" />
        </div>

        <div class="flex gap-2">
            <IconButton size="sm" title="Upload" @click.prevent="startUpload" v-if="!isUploading" icon="IconArrowUp" label="Upload" />

            <IconButton size="sm" title="Remove" @click.prevent="emit('remove', props.file)" v-if="!isUploading" icon="IconX" label="Remove" />
        </div>
    </div>
</template>

<script setup lang="ts">
    import { IconButton, Progress, Icon } from '@codebridger/lib-vue-components/elements.ts';
    import { useMediaManagerStore } from '../../stores/mediaManager.ts';

    const props = defineProps({
        file: {
            type: Object as PropType<File>,
            required: true,
        },
    });

    const mediaStore = useMediaManagerStore();
    const route = useRoute();

    const emit = defineEmits(['remove']);
    const isUploading = ref(false);

    function formatFileSize(bytes: number): string {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }

    onMounted(() => {
        startUpload();
    });

    function startUpload() {
        const projectId = route.params.id as string;
        isUploading.value = true;

        return mediaStore
            .startUploadSession(props.file.name, projectId)
            .then(() => emit('remove', props.file))
            .finally(() => {
                isUploading.value = false;
            });
    }
</script>
