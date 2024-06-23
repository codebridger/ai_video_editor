<template>
  <div class="container">
    <WidgetsPromptBox
      class="my-4"
      title="Prompt to generate video"
      v-model="prompt"
      :loading="isPending"
      @generate="generateVideo"
    />

    <WidgetsProjectTimeline
      title="Clips Timeline"
      v-model="mediaManager.timeline"
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
const isPending = ref(false);

function generateVideo() {
  isPending.value = true;
  mediaManager.generateTimeline(prompt.value).finally(() => {
    isPending.value = false;
  });
}
</script>
