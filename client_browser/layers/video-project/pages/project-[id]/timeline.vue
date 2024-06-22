<template>
  <div class="container">
    <WidgetsSelectedVideoList
      title="Selected videos for timeline"
      v-model="files"
    />
    <WidgetsPromptBox class="my-4" title="Prompt to generate video" />
  </div>
</template>

<script setup lang="ts">
import { Types } from "@modular-rest/client";

definePageMeta({
  layout: "project",
});

const route = useRoute();
const id = computed(() => route.params.id?.toString() || "");

const files = ref<Types.FileDocument[]>([]);
</script>
