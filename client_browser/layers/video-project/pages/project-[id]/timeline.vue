<template>
  <div class="container">
    <WidgetsPromptBox
      class="my-4"
      title="Prompt to generate video"
      v-model="prompt"
      :loading="isGeneratingTimeline"
      @generate="generateTimeline"
    />

    <BaseTabs :tabs="tabs" v-model="activeTab"></BaseTabs>

    <section class="flex justify-between">
      <template v-if="activeTab == 'timeline'">
        <div>
          <WidgetsProjectTimeline
            title="Clips Timeline"
            v-model="mediaManager.timeline"
            @update:modelValue="mediaManager.updateProjectTimeLine"
          />

          <BaseButton @click="renderTimeLine" :loading="isRenderingTimeline">
            Render
          </BaseButton>
        </div>
      </template>

      <template v-else-if="activeTab == 'renders'">
        <BaseCard
          color="muted"
          :class="[
            'p-1 border-solid rounded border-[1px] border-gray-200 dark:border-muted-700',
            'overflow-y-auto',
            'h-[550px] w-[400px]',
          ]"
        >
          <template v-for="revision in mediaManager.videoRevisions">
            <BaseCard
              :class="[
                'p-2 w-96',
                // 'cursor-pointer hover:bg-slate-400 dark:hover:bg-muted-700 hover:text-gray-100',
                'flex items-center justify-between',
              ]"
            >
              <div class="">
                <p class="text-sm">{{ revision._id }}</p>
                <p class="text-xs">{{ revision.prompt }}</p>
              </div>

              <BaseButton
                :loading="revision.isPending"
                @click="activeRevision = revision"
                >Play</BaseButton
              >
            </BaseCard>
          </template>
        </BaseCard>
      </template>

      <WidgetsProjectRevisionPlayer class="flex-1" :revision="activeRevision" />
    </section>
  </div>
</template>

<script setup lang="ts">
import { Types } from "@modular-rest/client";
import { useMediaManagerStore } from "../../store/mediaManager";
import type { VideoRevisionType } from "../../types/project.type";
const mediaManager = useMediaManagerStore();

definePageMeta({
  layout: "project",
});

const prompt = ref("Generate a 60 second video for Instagram reels.");
const isGeneratingTimeline = ref(false);
const isRenderingTimeline = ref(false);

const activeTab = ref("timeline");
const tabs = [
  { label: "Timeline", value: "timeline" },
  { label: "Renders", value: "renders" },
];

const activeRevision = ref<VideoRevisionType>();

function generateTimeline() {
  isGeneratingTimeline.value = true;
  mediaManager.generateTimeline(prompt.value).finally(() => {
    isGeneratingTimeline.value = false;
  });
}

async function renderTimeLine() {
  isRenderingTimeline.value = true;

  const revision = await mediaManager.renderTimeline({ prompt: prompt.value });

  function sleep(time: number) {
    return new Promise((resolve) => setTimeout(resolve, time));
  }

  while (revision.isPending) {
    await sleep(1000);

    await mediaManager.fetchVideoRevisions(mediaManager.projectId);

    const fetched = mediaManager.videoRevisions.find(
      (revision) => revision._id === revision._id
    );

    if (fetched) {
      revision.isPending = fetched.isPending;
    }
  }

  isRenderingTimeline.value = false;
}

function playRevision() {}
</script>
