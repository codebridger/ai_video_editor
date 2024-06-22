<template>
  <div class="container">
    <WidgetsSelectedVideoList
      title="Selected videos for timeline"
      v-model="files"
    />

    <WidgetsPromptBox
      class="my-4"
      title="Prompt to generate video"
      v-model="prompt"
      @generate="generateVideo"
    />
  </div>
</template>

<script setup lang="ts">
import { Types } from "@modular-rest/client";
import { useMediaManagerStore } from "../../store/mediaManager";
const mediaManager = useMediaManagerStore();

definePageMeta({
  layout: "project",
});

const route = useRoute();
const id = computed(() => route.params.id?.toString() || "");

const files = ref<Types.FileDocument[]>([]);
const prompt = ref("Generate a 60 second video for Instagram reels.");
const segments = ref<
  { start: number; end: number; text: string; videoId: string }[]
>([]);

function generateVideo() {
  mediaManager.generateVideoRevision({
    prompt: prompt.value,
    ids: files.value.map((file) => file._id),
  });
}
</script>
