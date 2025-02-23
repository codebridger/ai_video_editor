<script setup lang="ts">
import { useMediaManagerStore } from "../../store/mediaManager";

const props = defineProps({
  file: {
    type: Object as PropType<File>,
    required: true,
  },
});

const mediaStore = useMediaManagerStore();
const route = useRoute();

const emit = defineEmits(["remove"]);
const isUploading = ref(false);

onMounted(() => {
  startUpload();
});

function startUpload() {
  const projectId = route.params.id as string;
  isUploading.value = true;

  return mediaStore
    .startUploadSession(props.file.name, projectId)
    .then(() => emit("remove", props.file))
    .finally(() => {
      isUploading.value = false;
    });
}
</script>

<template>
  <div
    class="border-muted-200 dark:border-muted-700 dark:bg-muted-800 relative flex items-center justify-end gap-2 rounded-xl border bg-white p-3"
  >
    <div class="flex items-center gap-2">
      <div class="shrink-0">
        <img
          v-if="props.file.type.startsWith('image')"
          class="size-14 rounded-xl object-cover object-center"
          alt="Image preview"
        />

        <img
          v-else
          class="size-14 rounded-xl object-cover object-center"
          src="/img/avatars/placeholder-file.png"
          alt="Image preview"
        />
      </div>

      <div class="font-sans">
        <span
          class="text-muted-800 dark:text-muted-100 line-clamp-1 block text-sm truncate w-20"
        >
          {{ props.file.name }}
        </span>

        <span class="text-muted-400 block text-xs">
          {{ formatFileSize(props.file.size) }}
        </span>
      </div>
    </div>

    <div
      class="ms-auto w-32 px-4 transition-opacity duration-300"
      :class="'opacity-100'"
    >
      <BaseProgress
        :value="mediaStore.checkUploadProgress(props.file)"
        :color="'success'"
        size="xs"
      />
    </div>

    <div class="flex gap-2">
      <!-- <button
        class="border-muted-200 hover:border-primary-500 text-muted-700 dark:text-muted-200 hover:text-primary-600 dark:border-muted-700 dark:bg-muted-900 dark:hover:border-primary-500 dark:hover:text-primary-600 relative flex size-8 cursor-pointer items-center justify-center rounded-full border bg-white transition-colors duration-300 disabled:cursor-not-allowed disabled:opacity-60"
        disabled
        type="button"
        tooltip="Cancel"
      >
        <Icon name="lucide:slash" class="size-4" />

        <span class="sr-only">Cancel</span>
      </button> -->

      <button
        class="border-muted-200 hover:border-primary-500 text-muted-700 dark:text-muted-200 hover:text-primary-600 dark:border-muted-700 dark:bg-muted-900 dark:hover:border-primary-500 dark:hover:text-primary-600 relative flex size-8 cursor-pointer items-center justify-center rounded-full border bg-white transition-colors duration-300"
        type="button"
        tooltip="Upload"
        @click.prevent="startUpload"
        v-if="!isUploading"
      >
        <Icon name="lucide:arrow-up" class="size-4" />

        <span class="sr-only">Upload</span>
      </button>

      <button
        class="border-muted-200 hover:border-primary-500 text-muted-700 dark:text-muted-200 hover:text-primary-600 dark:border-muted-700 dark:bg-muted-900 dark:hover:border-primary-500 dark:hover:text-primary-600 relative flex size-8 cursor-pointer items-center justify-center rounded-full border bg-white transition-colors duration-300"
        type="button"
        tooltip="Remove"
        @click.prevent="emit('remove', props.file)"
        v-if="!isUploading"
      >
        <Icon name="lucide:x" class="size-4" />

        <span class="sr-only">Remove</span>
      </button>
    </div>
  </div>
</template>
