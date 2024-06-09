<script setup lang="ts">
import { dataProvider, functionProvider } from "@modular-rest/client";

// set compile time meta information
definePageMeta({
  // static meta information can be added to vue-router, we use it
  // to generate the search index in the demo
  title: "Dashboard",
});

// meta information can also be added to the head
useHead({
  meta: [{ name: "description", content: "AI Video Editor" }],
});
</script>

<template>
  <TairoContentWrapper>
    <template #left>
      <span>Your Projects</span>
    </template>
    <template #right>
      <WidgetsAddProject />
    </template>
    <template> </template>
  </TairoContentWrapper>
</template>
