<template>
  <BaseCard>
    <div class="flex justify-between">
      <div class="flex items-center space-x-2">
        <BaseHeading size="sm" class="text-gray-600 dark:text-muted-700 p-2">
          {{ media.fileName || media.fileId }}
        </BaseHeading>
        <span class="text-sm text-gray-600">{{
          ffmpegProps.width + "x" + ffmpegProps.height
        }}</span>
      </div>

      <div>
        <BaseButtonIcon
          :loading="isPending"
          rounded="none"
          size="sm"
          data-nui-tooltip="Regenerate Segments"
          data-nui-tooltip-position="left"
          @click="generateGroupedSegments"
        >
          <!-- Refresh -->
          <Icon name="i-ph-repeat-fill" class="size-5" />
        </BaseButtonIcon>
      </div>
    </div>

    <div class="p-4 max-w-sm space-y-2" v-if="isPending || !media.isProcessed">
      <BasePlaceload class="h-4 w-full rounded" />
      <BasePlaceload class="h-4 w-[85%] rounded" />
    </div>

    <draggable
      v-else
      class="p-4 flex flex-col space-y-1"
      :key="key"
      :list="media.groupedSegments"
      :group="'grouped-segments'"
      item-key="_id"
    >
      <template
        #item="{ element, index }: { element: GroupedSegment, index: number }"
      >
        <BaseCard class="p-2 flex items-end justify-between">
          <p class="text-sm select-none">
            {{ element.description }}
          </p>
          <spam class="ml-1 text-muted-400 text-xs"
            >{{ Math.floor(element.duration) }}s</spam
          >
        </BaseCard>
      </template>
    </draggable>
  </BaseCard>
</template>

<script setup lang="ts">
import draggable from "vuedraggable";
import { functionProvider } from "@modular-rest/client";
import { useMediaManagerStore } from "../../store/mediaManager";
import type { GroupedSegment, VideoMediaType } from "../../types/project.type";
import { isRTL } from "../../helpers/languages";

const mediaManagerStore = useMediaManagerStore();
const props = defineProps<{
  media: VideoMediaType;
}>();

const isPending = ref(false);
const key = ref(Date.now());

const ffmpegProps = ref<{
  width: number;
  height: number;
}>({
  width: 0,
  height: 0,
});

onMounted(() => {
  if (!props.media.isProcessed) {
    checkIfProcessed();
  }

  fetchFfmpegProps();
});

function generateGroupedSegments() {
  isPending.value = true;

  mediaManagerStore.generateGroupedSegments(props.media._id).finally(() => {
    isPending.value = false;
    key.value = Date.now();
  });
}

async function checkIfProcessed() {
  function sleep(ms: number) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  while (!props.media.isProcessed) {
    await sleep(5000);
    mediaManagerStore.fetchVideoMediaByFileId(props.media.fileId);
  }
}

function fetchFfmpegProps() {
  return functionProvider
    .run({
      name: "getFfmpegProps",
      args: { fileId: props.media.fileId },
    })
    .then((res: any) => {
      ffmpegProps.value = {
        width: res.streams[0].width,
        height: res.streams[0].height,
      };
    });
}
</script>
