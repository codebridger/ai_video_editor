<template>
  <div class="container">
    <WidgetsPromptBox
      class="my-4"
      title="Prompt to generate video"
      v-model="prompt"
      :loading="isGeneratingTimeline"
      @generate="generateTimeline"
    />

    <WidgetsProjectTimeline
      title="Clips Timeline"
      v-model="mediaManager.timeline"
      @update:modelValue="mediaManager.updateProjectTimeLine"
    />

    <BaseButton @click="renderTimeLine" :loading="isRenderingTimeline">
      Render
    </BaseButton>
  </div>
</template>

<script setup lang="ts">
import { Types } from "@modular-rest/client";
import { useMediaManagerStore } from "../../store/mediaManager";
const mediaManager = useMediaManagerStore();

definePageMeta({
  layout: "project",
});

const prompt = ref("Generate a 60 second video for Instagram reels.");
const isGeneratingTimeline = ref(false);
const isRenderingTimeline = ref(false);

function generateTimeline() {
  isGeneratingTimeline.value = true;
  mediaManager.generateTimeline(prompt.value).finally(() => {
    isGeneratingTimeline.value = false;
  });
}

async function renderTimeLine() {
  isRenderingTimeline.value = true;

  const revision = await mediaManager.renderTimeline({ prompt: prompt.value });

  function sleep(time: number) {
    return new Promise((resolve) => setTimeout(resolve, time));
  }

  while (revision.isPending) {
    await sleep(1000);

    await mediaManager.fetchVideoRevisions(mediaManager.projectId);

    const fetched = mediaManager.videoRevisions.find(
      (revision) => revision._id === revision._id
    );

    if (fetched) {
      revision.isPending = fetched.isPending;
    }
  }

  isRenderingTimeline.value = false;
}
</script>
