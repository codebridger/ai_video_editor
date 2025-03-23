<template>
    <section class="flex w-full space-x-8 p-6">
        <div class="w-2/5">
            <VideoProjectSidebar />
        </div>
        <div class="w-3/5">
            <WidgetsPromptBox title="Prompt to generate video" v-model="prompt" :loading="isGeneratingTimeline" @generate="generateTimeline" />
            <Tabs :tabs="tabs" v-model="activeTab" containerClass="my-4 border rounded p-2 h-screen">
                <!-- Custom content for each tab -->
                <template #content-timeline>
                    <div>
                        <p>Timeline</p>
                    </div>
                </template>

                <template #content-renders>
                    <div>
                        <p>Renders</p>
                    </div>
                </template>
            </Tabs>
        </div>
    </section>
</template>

<script setup lang="ts">
    import { Tabs } from '@codebridger/lib-vue-components/elements.ts';
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
