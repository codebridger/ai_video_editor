<template>
  <BaseCard>
    <div class="flex justify-between">
      <BaseHeading size="sm" class="text-gray-600 dark:text-muted-700 p-2">
        {{ media.fileName || media.fileId }}
      </BaseHeading>

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
        <BaseCard class="p-1">
          <p class="text-sm" :dir="isRTL(media.language) ? 'rtl' : 'ltr'">
            {{ element.description }}
          </p>
        </BaseCard>
      </template>
    </draggable>

    <!-- <section class="p-4 flex flex-col space-y-1" :key="key" v-else>
      <BaseCard
        class="p-1"
        v-for="(group, i) in media.groupedSegments || []"
        :key="i"
      >
        <p class="text-sm" :dir="isRTL(media.language) ? 'rtl' : 'ltr'">
          {{ group.description }}
        </p>
      </BaseCard>
    </section> -->
  </BaseCard>
</template>

<script setup lang="ts">
import { useMediaManagerStore } from "../../store/mediaManager";
import draggable from "vuedraggable";
import type { GroupedSegment, VideoMediaType } from "../../types/project.type";
import { isRTL } from "../../helpers/languages";

const mediaManagerStore = useMediaManagerStore();
const props = defineProps<{
  media: VideoMediaType;
}>();

const isPending = ref(false);
const key = ref(Date.now());

onMounted(() => {
  if (!props.media.isProcessed) {
    checkIfProcessed();
  }
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
</script>
