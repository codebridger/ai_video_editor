<template>
  <div class="flex flex-col h-screen">
    <div class="w-full max-w-sm">
      <BaseTabs
        :classes="{ inner: 'tabs-m-0' }"
        justify="center"
        :tabs="tabs"
        v-model="activeTab"
      />
    </div>

    <section class="flex-1 flex flex-col" v-if="activeTab === 'uploadMedia'">
      <div class="h-[60vh] w-full">
        <WidgetsUploadedMediaList />
      </div>

      <div class="p-4 overflow-y-auto">
        <WidgetsUploadBox />
      </div>
    </section>

    <section
      class="h-[95hv] overflow-auto px-2"
      v-else-if="activeTab === 'processedMedia'"
    >
      <WidgetsProcessedMediaList />
    </section>
  </div>
</template>

<script setup lang="ts">
import { useMediaManagerStore } from "../../store/mediaManager";

const mediaManagerStore = useMediaManagerStore();

const activeTab = ref("uploadMedia");
const tabs = [
  {
    label: "Upload Media",
    value: "uploadMedia",
    icon: "mdi-light:cloud-upload",
  },
  {
    label: "Processed Media",
    value: "processedMedia",
    icon: "mdi-light:filmstrip",
  },
];
</script>
