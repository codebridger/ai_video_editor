<script setup lang="ts">
import { useMediaManagerStore } from "../store/mediaManager";

const mediaStore = useMediaManagerStore();
const route = useRoute();

onMounted(() => {
  const projectId = route.params.id as string;
  mediaStore.initialize(projectId);
});
</script>

<template>
  <TairoSidebarLayout>
    <slot />
  </TairoSidebarLayout>
</template>
