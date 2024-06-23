<template>
  <div class="container">
    <WidgetsPromptBox
      class="my-4"
      title="Prompt to generate video"
      v-model="prompt"
      @generate="generateVideo"
    />

    <WidgetsProjectTimeline
      title="Selected videos for timeline"
      v-model="mediaManager.timeLine"
      @update:modelValue="mediaManager.updateProjectTimeLine"
    />
  </div>
</template>

<script setup lang="ts">
import { Types } from "@modular-rest/client";
import { useMediaManagerStore } from "../../store/mediaManager";
import type { GroupedSegment } from "../../types/project.type";
const mediaManager = useMediaManagerStore();

definePageMeta({
  layout: "project",
});

const prompt = ref("Generate a 60 second video for Instagram reels.");

function generateVideo() {
  // mediaManager.generateVideoRevision({
  //   prompt: prompt.value,
  //   ids: timeline.value.map((file) => file._id),
  // });
}
</script>
