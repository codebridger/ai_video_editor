<script setup lang="ts">
import { useMediaManagerStore } from "../store/mediaManager";

const mediaStore = useMediaManagerStore();
const route = useRoute();

onMounted(() => {
  const projectId = route.params.id as string;

  if (!projectId) {
    window.alert("Project ID is missing, refresh the page.");
  } else {
    mediaStore.initialize(projectId);
  }
});

onUnmounted(() => {
  mediaStore.clear();
});
</script>

<template>
  <TairoSidebarLayout>
    <slot />
  </TairoSidebarLayout>
</template>

<style>
/* How target down level styles */
.tabs-m-0 {
  margin: 0 !important;
}
</style>
