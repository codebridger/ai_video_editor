<template>
  <div class="w-full max-w-sm">
    <BaseTabs justify="center" :tabs="tabs" v-model="activeTab" />
  </div>

  <section v-if="activeTab === 'uploadMedia'">
    <div class="p-2 h-1/2">
      <WidgetsUploadedMedia />
    </div>

    <div class="p-4">
      <WidgetsUploadBox />
    </div>
  </section>
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
    value: "scenes",
    icon: "mdi-light:filmstrip",
  },
];
</script>
