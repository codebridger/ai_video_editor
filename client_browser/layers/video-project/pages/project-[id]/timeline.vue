<template>
  <div class="container">TimeLine</div>
</template>

<script setup lang="ts">
definePageMeta({
  layout: "project",
});

const route = useRoute();
const id = computed(() => route.params.id?.toString() || "");
</script>
