<template>
    <section class="flex w-full flex-col space-y-4 p-6">
        <!-- Prompt to generate video -->
        <WidgetsPromptBox title="Prompt to generate video" v-model="prompt" :loading="isGeneratingTimeline" @generate="generateTimeline" />

        <section class="flex flex-col gap-4">
            <!-- Timeline and renders tabs -->
            <Tabs :tabs="tabs" v-model="activeTab" class="my-4 min-h-max rounded bg-white">
                <!-- Timeline tabs and render preview button -->
                <template #content-timeline>
                    <div class="m-2">
                        <WidgetsProjectTimeline
                            title="Clips Timeline"
                            v-model="mediaManager.timeline"
                            @update:modelValue="mediaManager.updateProjectTimeLine"
                        />

                        <Button
                            class="mt-2"
                            @click="generateTimelinePreview"
                            :loading="isRenderingTimelinePreview"
                            :disabled="mediaManager.timeline.length === 0"
                            label="Render Preview"
                        />
                    </div>
                </template>

                <!-- Video Revisions tab -->
                <template #content-renders>
                    <Card :class="['rounded', 'overflow-y-auto overflow-x-visible', 'shadow-none', 'min-h-[200px]', 'm-2']">
                        <template v-for="revision in mediaManager.videoRevisions" :key="revision._id">
                            <Card
                                :class="[
                                    'w-96 p-2',
                                    // 'cursor-pointer hover:bg-slate-400 dark:hover:bg-gray-700 hover:text-gray-100',
                                    'flex items-center justify-between',
                                ]"
                            >
                                <div class="">
                                    <p class="text-sm">{{ revision._id }}</p>
                                    <p class="text-xs">{{ revision.prompt }}</p>
                                </div>

                                <IconButton
                                    rounded="none"
                                    size="sm"
                                    :loading="revision.isPending"
                                    :disabled="revision.isPending"
                                    @click="mediaManager.removeVideoRevision(revision._id)"
                                    icon="IconTrash"
                                />

                                <IconButton
                                    rounded="none"
                                    size="sm"
                                    :loading="revision.isPending"
                                    :disabled="revision.isPending"
                                    @click="mediaManager.fetchVideoLink(revision.fileId)"
                                    icon="IconPlayCircle"
                                />
                            </Card>
                        </template>
                    </Card>
                </template>
            </Tabs>

            <!-- Video Player -->
            <WidgetsVideoPlayer class="flex-1" />
        </section>
    </section>
</template>

<script setup lang="ts">
    import { Tabs, Button, Card, IconButton } from '@codebridger/lib-vue-components/elements.ts';
    import { useMediaManagerStore } from '../../../stores/mediaManager.ts';

    const { t } = useI18n();
    const mediaManager = useMediaManagerStore();

    definePageMeta({
        layout: 'project',
        title: () => t('video-project.timeline'),
        middleware: ['auth'],
    });

    const prompt = ref('Generate a 60 second video for Instagram reels.');
    const isGeneratingTimeline = ref(false);
    const isRenderingTimelinePreview = ref(false);
    const isGeneratingVideoRevision = ref(false);

    const activeTab = ref('timeline');
    const tabs = [
        { id: 'timeline', label: 'Timeline', value: 'timeline' },
        { id: 'renders', label: 'Renders', value: 'renders' },
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

            const fetched = mediaManager.videoRevisions.find((revision) => revision._id === newRevision._id);

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
