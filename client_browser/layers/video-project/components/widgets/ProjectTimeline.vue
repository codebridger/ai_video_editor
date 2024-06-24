<template>
  <section class="relative">
    <div class="flex justify-between items-center w-[400px]">
      <BaseHeading size="md" class="mx-4 my-2 text-gray-600 dark:bg-muted-700">
        {{ title }}
      </BaseHeading>
      <span class="text-gray-500 dark:bg-muted-600"
        >Duration: {{ totalDuration }}s</span
      >
    </div>

    <div
      v-if="tempFiles.length === 0"
      :class="[
        'absolute h-32 w-full flex justify-center items-center',
        'dark:text-muted-400 text-gray-400',
        'overflow-auto',
      ]"
    >
      <span>Drop files here</span>
    </div>

    <draggable
      :key="componentKey"
      :class="[
        'p-1 border-solid rounded border-[1px] border-gray-200 dark:border-muted-700',
        'overflow-y-auto',
        'h-[550px] w-[400px]',
      ]"
      v-model="tempFiles"
      :group="'grouped-segments'"
      item-key="_id"
      @change="onDrop"
    >
      <template
        #item="{ element, index }: { element: GroupedSegment, index: number }"
      >
        <BaseCard class="p-1 w-96 cursor-pointer">
          <p
            class="text-sm select-none"
            :dir="isRTL('persian') ? 'rtl' : 'ltr'"
          >
            {{ element.description }}
          </p>
        </BaseCard>
      </template>
    </draggable>
  </section>
</template>

<script setup lang="ts">
import draggable from "vuedraggable";
import type { GroupedSegment } from "../../types/project.type";
import { isRTL } from "../../helpers/languages";
import { VideoPlayer } from "@videojs-player/vue";
import "video.js/dist/video-js.css";

import { useMediaManagerStore } from "../../store/mediaManager";
const mediaManager = useMediaManagerStore();

const props = defineProps({
  title: String,
  modelValue: Array as PropType<GroupedSegment[]>,
});

const emit = defineEmits<{ "update:modelValue": [GroupedSegment[]] }>();

const isReadyForPreview = ref(false);
const tempFiles = ref<GroupedSegment[]>([]);
const componentKey = ref(0);

const totalDuration = computed(() => {
  return Math.floor(
    tempFiles.value.reduce((acc, file) => acc + file.duration, 0)
  );
});

function onDrop() {
  componentKey.value++;
  emit("update:modelValue", tempFiles.value);
}

function onRemove(fileId: string) {
  tempFiles.value = tempFiles.value.filter((file) => file._id !== fileId);
  componentKey.value++;
  emit("update:modelValue", tempFiles.value);
}

watch(
  () => props.modelValue,
  () => {
    tempFiles.value = props.modelValue || [];
    componentKey.value++;
  },
  { immediate: true, deep: true }
);
</script>
