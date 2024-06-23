<template>
  <!-- <BaseHeading size="sm" class="mx-2 mb-2"> Uploaded Videos </BaseHeading> -->

  <draggable
    :class="[
      'px-1 pb-1 border-solid border-b-[1px] border-b-gray-200 dark:border-muted-700',
      'flex flex-wrap content-start',
      'overflow-auto',
    ]"
    :group="{ name: 'projectFiles', pull: 'clone', put: false }"
    v-model="mediaManagerStore.projectFiles"
    item-key="fileName"
  >
    <template #item="{ element, index }">
      <WidgetsProjectFileCard
        :file="element"
        @remove="mediaManagerStore.removeProjectFile"
        :confirm-remove="true"
      />
    </template>
  </draggable>
</template>

<script setup lang="ts">
import { useMediaManagerStore } from "../../store/mediaManager";
import draggable from "vuedraggable";

const mediaManagerStore = useMediaManagerStore();
</script>
