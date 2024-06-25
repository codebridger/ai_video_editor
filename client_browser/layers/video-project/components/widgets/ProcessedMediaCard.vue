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

      <div class="flex">
        <BaseButtonIcon
          rounded="none"
          size="sm"
          data-nui-tooltip="Remove File"
          data-nui-tooltip-position="left"
          @click="removeFile"
        >
          <!-- Refresh -->
          <Icon name="i-ph-trash-fill" class="size-5" />
        </BaseButtonIcon>

        <BaseButtonIcon
          :loading="isPending"
          :disabled="isPending"
          rounded="none"
          size="sm"
          data-nui-tooltip="Regenerate Segments"
          data-nui-tooltip-position="left"
          @click="generateGroupedSegments"
        >
          <!-- Refresh -->
          <Icon name="i-ph-repeat-fill" class="size-5" />
        </BaseButtonIcon>

        <BaseButtonIcon
          rounded="none"
          size="sm"
          data-nui-tooltip="Play Video"
          data-nui-tooltip-position="left"
          @click="mediaManagerStore.fetchVideoLink(media.fileId)"
        >
          <!-- Refresh -->
          <Icon name="i-ph-play-fill" class="size-5" />
        </BaseButtonIcon>
      </div>
    </div>

    <span class="px-2 text-sm text-gray-600">{{
      ffmpegProps.creation_time
    }}</span>

    <div class="p-4 max-w-sm space-y-2" v-if="isPending || !media.isProcessed">
      <BasePlaceload class="h-4 w-full rounded" />
      <BasePlaceload class="h-4 w-[85%] rounded" />
    </div>

    <section v-else>
      <BaseTabs
        v-model="activeTab"
        :tabs="tabs"
        class="mx-4 border-b-[1px] border-gray-200 dark:border-gray-700"
        :classes="{ inner: 'tabs-m-0' }"
      />

      <!-- Grouped Segments -->
      <template v-if="activeTab == 'groupedSegments'">
        <draggable
          class="p-4 flex flex-col space-y-1"
          :key="key"
          :list="media.groupedSegments"
          :group="{ name: 'grouped-segments', pull: 'clone', put: false }"
          item-key="_id"
          :clone="clone"
        >
          <template
            #item="{
              element,
              index,
            }: {
              element: GroupedSegment,
              index: number,
            }"
          >
            <BaseCard
              class="p-2 flex items-end justify-between cursor-pointer select-none"
            >
              <p class="text-sm">
                {{ element.description }}
              </p>
              <span class="ml-1 text-muted-400 text-xs"
                >{{ Math.floor(element.duration) }}s</span
              >
            </BaseCard>
          </template>
        </draggable>
      </template>

      <!-- Captions -->
      <template v-if="activeTab == 'segments'">
        <draggable
          class="p-4 flex flex-col space-y-1"
          :key="key"
          :list="media.segments"
          :group="{ name: 'grouped-segment', pull: 'clone', put: false }"
          item-key="_id"
        >
          <template
            #item="{
              element,
              index,
            }: {
              element: GroupedSegment,
              index: number,
            }"
          >
            <BaseCard class="p-2 flex items-end justify-between">
              <p class="text-sm select-none">
                {{ element.text }}
              </p>
              <span class="ml-1 text-muted-400 text-xs"
                >{{ Math.floor(element.end - element.start) }}s</span
              >
            </BaseCard>
          </template>
        </draggable>
      </template>
    </section>
  </BaseCard>
</template>

<script setup lang="ts">
import draggable from "vuedraggable";
import { functionProvider } from "@modular-rest/client";
import { useMediaManagerStore } from "../../store/mediaManager";
import type {
  GroupedSegment,
  VideoMediaType,
  TimelineGroupedSegmentType,
} from "../../types/project.type";
import { isRTL } from "../../helpers/languages";

const mediaManagerStore = useMediaManagerStore();
const props = defineProps<{
  media: VideoMediaType;
}>();

const isPending = ref(false);
const key = ref(Date.now());

const activeTab = ref("groupedSegments");
const tabs = [
  { label: "Topics", value: "groupedSegments" },
  { label: "Captions", value: "segments" },
];

const ffmpegProps = ref<{
  width: number;
  height: number;
  creation_time: string;
}>({
  width: 0,
  height: 0,
  creation_time: "",
});

onMounted(() => {
  if (!props.media.isProcessed) {
    checkIfProcessed();
  }

  fetchFfmpegProps();
});

function generateGroupedSegments() {
  if (
    !window.confirm("Do you really want to re generate context of this video?")
  ) {
    return;
  }

  isPending.value = true;

  mediaManagerStore.generateGroupedSegments(props.media._id).finally(() => {
    isPending.value = false;
    key.value = Date.now();
  });
}

function removeFile() {
  if (!window.confirm("Do you really want to delete this video?")) {
    return;
  }

  mediaManagerStore.removeProjectFile(props.media.fileId);
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
      const videoSteam = res.streams.find(
        (stream: any) => stream.codec_type === "video"
      );

      ffmpegProps.value = {
        width: videoSteam.width,
        height: videoSteam.height,
        creation_time: (res.format.tags.creation_time || "")
          .split("T")
          .join(" ")
          .split(".")[0],
      };
    });
}

function clone(element: GroupedSegment) {
  const clone = JSON.parse(
    JSON.stringify(element)
  ) as TimelineGroupedSegmentType;

  let processedVideoId = "";
  let fileId = "";

  for (let i = 0; i < mediaManagerStore.processedVideoMediaList.length; i++) {
    const video = mediaManagerStore.processedVideoMediaList[i];

    for (let j = 0; j < video.groupedSegments.length; j++) {
      const groupedSegment = video.groupedSegments[j];

      if (groupedSegment._id === element._id) {
        clone["processedVideoId"] = video._id;
        clone["fileId"] = video.fileId;
        break;
      }
    }
  }

  console.log(clone);

  return clone;
}
</script>
