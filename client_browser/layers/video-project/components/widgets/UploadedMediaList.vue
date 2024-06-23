<template>
  <section
    :class="[
      'border-solid border-y-[1px] border-y-gray-200 dark:border-muted-700',
      'flex flex-wrap content-start justify-center',
      'overflow-hidden overflow-y-auto h-full w-full',
    ]"
  >
    <template v-for="file in mediaManagerStore.projectFiles" :key="file._id">
      <WidgetsProjectFileCard
        :file="file"
        @remove="mediaManagerStore.removeProjectFile"
        :confirm-remove="true"
      />
    </template>
  </section>
</template>

<script setup lang="ts">
import { useMediaManagerStore } from "../../store/mediaManager";

const mediaManagerStore = useMediaManagerStore();
</script>
