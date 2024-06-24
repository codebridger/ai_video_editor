<template>
  <div class="flex justify-center items-center">
    <video-player :width="500" controls v-if="videoLink" :src="videoLink" />
  </div>
</template>

<script setup lang="ts">
import { VideoPlayer } from "@videojs-player/vue";
import "video.js/dist/video-js.css";
import { fileProvider } from "@modular-rest/client";

import type { VideoRevisionType } from "../../types/project.type";

const videoLink = ref("");
const props = defineProps({
  revision: Object as PropType<VideoRevisionType>,
});

watch(() => props.revision, fetchVideoLink, { immediate: true });

async function fetchVideoLink() {
  ``;
  if (!props.revision) return;

  const fileDoc = await fileProvider.getFileDoc(
    props.revision?.fileId!,
    // @ts-ignore
    authUser.value?.id
  );

  videoLink.value = fileProvider
    // @ts-ignore
    .getFileLink(fileDoc);

  console.log("videoLink: ", videoLink.value);
}
</script>
