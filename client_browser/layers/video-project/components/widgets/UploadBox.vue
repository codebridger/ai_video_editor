<template>
  <div>
    <BaseFullscreenDropfile
      icon="ph:image-duotone"
      :filter-file-dropped="(file) => file.type.startsWith('image')"
      @drop="addUploadList"
    />

    <BaseInputFileHeadless
      v-slot="{ open, remove, drop, files }"
      @update:modelValue="addUploadList"
      multiple
    >
      <!-- Controls -->
      <div class="mb-4 flex items-center gap-2">
        <button
          type="button"
          class="nui-focus border-muted-200 hover:border-primary-500 text-muted-700 dark:text-muted-200 hover:text-primary-600 dark:border-muted-700 dark:bg-muted-800 dark:hover:border-primary-500 dark:hover:text-primary-600 relative flex size-8 cursor-pointer items-center justify-center rounded-full border bg-white transition-colors duration-300"
          tooltip="Select files"
          @click="open"
        >
          <Icon
            name="lucide:plus"
            class="absolute start-1/2 top-1/2 size-4 -translate-x-1/2 -translate-y-1/2"
          />

          <span class="sr-only">Select files</span>
        </button>

        <button
          type="button"
          class="nui-focus border-muted-200 hover:border-primary-500 text-muted-700 dark:text-muted-200 hover:text-primary-600 dark:border-muted-700 dark:bg-muted-800 dark:hover:border-primary-500 dark:hover:text-primary-600 relative flex size-8 cursor-pointer items-center justify-center rounded-full border bg-white transition-colors duration-300"
          tooltip="Start Upload"
        >
          <Icon name="lucide:arrow-up" class="size-4" />

          <span class="sr-only">Start Upload</span>
        </button>
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
          class="nui-focus border-muted-300 dark:border-muted-700 hover:border-muted-400 focus:border-muted-400 dark:hover:border-muted-600 dark:focus:border-muted-700 group cursor-pointer rounded-lg border-[3px] border-dashed p-8 transition-colors duration-300"
          tabindex="0"
          role="button"
          @click="open"
          @keydown.enter.prevent="open"
        >
          <div class="p-5 text-center">
            <Icon
              name="mdi-light:cloud-upload"
              class="text-muted-400 group-hover:text-primary-500 group-focus:text-primary-500 mb-2 size-10 transition-colors duration-300"
            />

            <h4 class="text-muted-400 font-sans text-sm">
              Drop files to upload
            </h4>

            <div>
              <span
                class="text-muted-400 font-sans text-[0.7rem] font-semibold uppercase"
              >
                Or
              </span>
            </div>

            <label
              for="file"
              class="text-muted-400 group-hover:text-primary-500 group-focus:text-primary-500 cursor-pointer font-sans text-sm underline underline-offset-4 transition-colors duration-300"
            >
              Select files
            </label>
          </div>
        </div>

        <ul v-else class="mt-6 space-y-2 overflow-auto">
          <li
            v-for="file in mediaManagerStore.uploadList"
            :key="file.name"
            :data-nui-tooltip="file.name"
          >
            <WidgetsUploadingFileCard :file="file" @remove="remove(file)" />
          </li>
        </ul>
      </div>
    </BaseInputFileHeadless>
  </div>
</template>

<script setup lang="ts">
import { useMediaManagerStore } from "../../store/mediaManager";

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
