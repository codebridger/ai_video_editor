<template>
  <BaseCard class="w-96 cursor-pointer flex flex-col items-center space-y-2">
    <div class="w-full flex justify-between items-center">
      <div class="scale-[0.6] -translate-x-9 -translate-y-1">
        <BaseSwitchBall
          v-model="activeCaptionEdit"
          label="Captions"
          sublabel="Add or remove captions"
        />
      </div>

      <BaseButtonIcon
        rounded="none"
        size="sm"
        data-nui-tooltip="Remove File"
        data-nui-tooltip-position="left"
        @click="onRemove(group._id)"
      >
        <!-- Refresh -->
        <Icon name="i-ph-trash-fill" class="size-5" />
      </BaseButtonIcon>
    </div>

    <div class="w-full p-2">
      <p class="text-sm select-none" :dir="isRTL('persian') ? 'rtl' : 'ltr'">
        {{ group.description }}
      </p>
    </div>

    <div class="w-full" v-if="activeCaptionEdit">
      <template v-for="segment of captionSegments">
        <BaseCard class="p-2 my-1">
          <p
            class="text-sm select-none"
            :dir="isRTL('persian') ? 'rtl' : 'ltr'"
          >
            {{ segment.text }}
          </p>
        </BaseCard>
      </template>
    </div>
  </BaseCard>
</template>

<script setup lang="ts">
import type {
  TimelineGroupedSegmentType,
  SegmentType,
} from "../../types/project.type";
import { isRTL } from "../../helpers/languages";
import { useMediaManagerStore } from "../../store/mediaManager";

const mediaManagerStore = useMediaManagerStore();

const props = defineProps<{
  group: TimelineGroupedSegmentType;
}>();

const emit = defineEmits(["remove"]);
const activeCaptionEdit = ref(false);

const captionSegments = computed(() => {
  try {
    return mediaManagerStore.processedVideoMediaList
      .find((media) => media._id === props.group.processedVideoId)
      ?.segments.filter((segment) => props.group.ids.includes(segment.id));
  } catch (error) {
    return [];
  }
});

const onRemove = (id: string) => {
  emit("remove", id);
};
</script>
