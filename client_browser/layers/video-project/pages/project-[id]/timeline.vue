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

          <BaseButton
            class="mt-2"
            @click="generateTimelinePreview"
            :loading="isRenderingTimelinePreview"
            :disabled="mediaManager.timeline.length === 0"
          >
            Render Preview
          </BaseButton>
        </div>
      </template>

      <!-- Rendered Video Revisions -->
      <template v-else-if="activeTab == 'renders'">
        <BaseCard
          color="muted"
          :class="[
            'p-1 border-solid rounded border-[1px] border-gray-200 dark:border-muted-700',
            'overflow-y-auto overflow-x-visible',
            'h-[550px] w-[400px]',
          ]"
        >
          <template
            v-for="revision in mediaManager.videoRevisions"
            :key="revision._id"
          >
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

              <BaseButtonIcon
                rounded="none"
                size="sm"
                :loading="revision.isPending"
                :disabled="revision.isPending"
                @click="mediaManager.removeVideoRevision(revision._id)"
              >
                <!-- Refresh -->
                <Icon name="i-ph-trash-fill" class="size-5" />
              </BaseButtonIcon>

              <BaseButtonIcon
                rounded="none"
                size="sm"
                :loading="revision.isPending"
                :disabled="revision.isPending"
                @click="mediaManager.fetchVideoLink(revision.fileId)"
              >
                <!-- Refresh -->
                <Icon name="i-ph-play-fill" class="size-5" />
              </BaseButtonIcon>
            </BaseCard>
          </template>
        </BaseCard>
      </template>

      <WidgetsVideoPlayer class="flex-1" />
    </section>
  </div>
</template>

<script setup lang="ts">
import { useMediaManagerStore } from "../../store/mediaManager";

const mediaManager = useMediaManagerStore();

definePageMeta({
  layout: "project",
});

const prompt = ref("Generate a 60 second video for Instagram reels.");
const isGeneratingTimeline = ref(false);
const isRenderingTimelinePreview = ref(false);
const isGeneratingVideoRevision = ref(false);

const activeTab = ref("timeline");
const tabs = [
  { label: "Timeline", value: "timeline" },
  { label: "Renders", value: "renders" },
];

function generateTimeline() {
  isGeneratingTimeline.value = true;
  mediaManager.generateTimeline(prompt.value).finally(() => {
    isGeneratingTimeline.value = false;
  });
}

async function generateVideoRevision() {
  isGeneratingVideoRevision.value = true;

  const newRevision = await mediaManager.generateVideoRevision({
    prompt: prompt.value,
  });

  function sleep(time: number) {
    return new Promise((resolve) => setTimeout(resolve, time));
  }

  let isPending = true;
  while (isPending) {
    await sleep(5000);

    await mediaManager.fetchVideoRevisions(mediaManager.projectId);

    const fetched = mediaManager.videoRevisions.find(
      (revision) => revision._id === newRevision._id
    );

    if (fetched) {
      isPending = fetched.isPending;
    }
  }

  isGeneratingVideoRevision.value = false;
}

function generateTimelinePreview() {
  isRenderingTimelinePreview.value = true;

  mediaManager.generateTimelinePreview().finally(() => {
    isRenderingTimelinePreview.value = false;
  });
}
</script>
