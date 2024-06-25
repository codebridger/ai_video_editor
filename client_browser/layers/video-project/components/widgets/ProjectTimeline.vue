<template>
  <section class="relative">
    <div class="flex justify-between items-center w-[400px]">
      <BaseHeading size="md" class="mx-4 my-2 text-gray-600 dark:bg-muted-700">
        {{ title }}
      </BaseHeading>
      <span class="text-gray-500 dark:bg-muted-600">
        Duration: {{ totalDuration }}s</span
      >
    </div>

    <div
      v-if="timelineGroupedSegments.length === 0"
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
      v-model="timelineGroupedSegments"
      :group="{ name: 'grouped-segments', pull: true, put: true }"
      item-key="_id"
      @change="onDrop"
    >
      <template
        #item="{
          element,
          index,
        }: {
          element: TimelineGroupedSegmentType,
          index: number,
        }"
      >
        <div class="flex">
          <!-- Segment time -->
          <div
            v-if="timelinePositions[index]"
            :class="[
              'w-6 flex flex-col justify-between',
              'text-[8px] text-center text-gray-600 dark:text-muted-400',
              'border-b-[1px] border-gray-200 dark:border-muted-700',
              {
                'border-t-[1px] ': index == 0,
              },
            ]"
          >
            <div class="flex items-start">
              <span v-if="index == 0"
                >{{ timelinePositions[index].start }}s</span
              >
            </div>
            <div class="flex items-start">
              <span>{{ timelinePositions[index].end }}s</span>
            </div>
          </div>

          <!-- Segment detail -->
          <BaseCard class="p-2 w-96 cursor-pointer flex items-center space-x-2">
            <div class="flex-1">
              <p
                class="text-sm select-none"
                :dir="isRTL('persian') ? 'rtl' : 'ltr'"
              >
                {{ element.description }}
              </p>
            </div>

            <BaseButtonIcon
              rounded="none"
              size="sm"
              data-nui-tooltip="Remove File"
              data-nui-tooltip-position="left"
              @click="onRemove(element._id)"
            >
              <!-- Refresh -->
              <Icon name="i-ph-trash-fill" class="size-5" />
            </BaseButtonIcon>
          </BaseCard>
        </div>
      </template>
    </draggable>
  </section>
</template>

<script setup lang="ts">
import draggable from "vuedraggable";
import type { TimelineGroupedSegmentType } from "../../types/project.type";
import { isRTL } from "../../helpers/languages";

import { useMediaManagerStore } from "../../store/mediaManager";

const props = defineProps({
  title: String,
  modelValue: Array as PropType<TimelineGroupedSegmentType[]>,
});

const emit = defineEmits<{
  "update:modelValue": [TimelineGroupedSegmentType[]];
}>();

const timelineGroupedSegments = ref<TimelineGroupedSegmentType[]>([]);
const componentKey = ref(0);

const totalDuration = computed(() => {
  return Math.floor(
    timelineGroupedSegments.value.reduce((acc, file) => acc + file.duration, 0)
  );
});

const timelinePositions = ref<{ start: number; end: number }[]>([]);
function calculateTimelinePositions() {
  timelinePositions.value = [];
  timelineGroupedSegments.value.forEach((segment, index) => {
    timelinePositions.value.push({
      start: index === 0 ? 0 : timelinePositions.value[index - 1].end,
      end:
        index === 0
          ? segment.duration
          : timelinePositions.value[index - 1].end + segment.duration,
    });
  });
}

function onDrop() {
  componentKey.value++;
  emit("update:modelValue", timelineGroupedSegments.value);
}

function onRemove(groupId: string) {
  timelineGroupedSegments.value = timelineGroupedSegments.value.filter(
    (file) => file._id !== groupId
  );
  componentKey.value++;
  emit("update:modelValue", timelineGroupedSegments.value);
}

watch(
  () => props.modelValue,
  () => {
    timelineGroupedSegments.value = props.modelValue || [];
    calculateTimelinePositions();
    componentKey.value++;
  },
  { immediate: true, deep: true }
);
</script>
