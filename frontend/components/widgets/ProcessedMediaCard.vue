<template>
    <Card>
        <div class="flex justify-between">
            <div class="flex items-center space-x-2">
                <h3 class="dark:text-muted-700 p-2 text-gray-600">
                    {{ media.fileName || media.fileId }}
                </h3>
                <span class="text-sm text-gray-600">{{ ffmpegProps.width + 'x' + ffmpegProps.height }}</span>
            </div>

            <div class="flex">
                <IconButton rounded="none" size="sm" title="Remove File" @click="removeFile" icon="IconTrash" />

                <IconButton
                    :loading="isPending"
                    :disabled="isPending"
                    rounded="none"
                    size="sm"
                    title="Regenerate Segments"
                    @click="generateGroupedSegments"
                    icon="IconRefresh"
                />

                <IconButton rounded="none" size="sm" title="Play Video" @click="mediaManagerStore.fetchVideoLink(media.fileId)" icon="IconPlayCircle" />
            </div>
        </div>

        <span class="px-2 text-sm text-gray-600">{{ ffmpegProps.creation_time }}</span>

        <div class="max-w-sm space-y-2 p-4" v-if="isPending || !media.isProcessed">
            <div class="animate-placeload bg-placeload bg-placeload h-4 w-full rounded"></div>
            <div class="animate-placeload bg-placeload bg-placeload h-4 w-[85%] rounded"></div>
        </div>

        <section v-else>
            <Tabs :tabs="tabs" v-model="activeTab" class="mx-4" :classes="{ inner: 'tabs-m-0' }">
                <!-- Grouped Segments -->
                <template #content-groupedSegments>
                    <draggable
                        v-model="media.groupedSegments"
                        :key="key"
                        class="flex flex-col space-y-1 p-4"
                        tag="div"
                        :group="{
                            name: 'groupedSegments',
                            pull: true,
                            put: false,
                        }"
                        :sort="false"
                        item-key="_id"
                        :clone="cloneGroupedSegment"
                    >
                        <template #item="{ element }">
                            <div class="draggable-item">
                                <Card class="flex cursor-move select-none items-end justify-between shadow-none">
                                    <p class="text-sm">{{ element.description }}</p>
                                    <span class="text-muted-400 ml-1 text-xs">{{ Math.floor(element.duration) }}s</span>
                                </Card>
                            </div>
                        </template>
                    </draggable>
                </template>

                <!-- Captions -->
                <template #content-segments>
                    <draggable
                        v-model="media.segments"
                        :key="key"
                        class="flex flex-col space-y-1 p-4"
                        tag="div"
                        :group="{
                            name: 'segments',
                            pull: true,
                            put: false,
                        }"
                        :sort="false"
                        item-key="_id"
                        :clone="cloneCaptionAsGroupedSegment"
                    >
                        <template #item="{ element }">
                            <div class="draggable-item">
                                <Card class="flex cursor-move select-none items-end justify-between shadow-none">
                                    <p class="select-none text-sm">{{ element.text }}</p>
                                    <span class="text-muted-400 ml-1 text-xs">{{ Math.floor(element.end - element.start) }}s</span>
                                </Card>
                            </div>
                        </template>
                    </draggable>
                </template>
            </Tabs>
        </section>
    </Card>
</template>

<script setup lang="ts">
    import { Card, IconButton, Tabs } from '@codebridger/lib-vue-components/elements.ts';
    import draggable from 'vuedraggable';
    import { functionProvider } from '@modular-rest/client';
    import { useMediaManagerStore } from '../../stores/mediaManager.ts';
    import type { GroupedSegment, VideoMediaType, TimelineGroupedSegmentType, SegmentType } from '../../types/project.type.ts';

    const mediaManagerStore = useMediaManagerStore();
    const props = defineProps<{
        media: VideoMediaType;
    }>();

    const isPending = ref(false);
    const key = ref(Date.now());

    const activeTab = ref('groupedSegments');
    const tabs = [
        { id: 'groupedSegments', label: 'Topics', value: 'groupedSegments' },
        { id: 'segments', label: 'Captions', value: 'segments' },
    ];

    const ffmpegProps = ref<{
        width: number;
        height: number;
        creation_time: string;
    }>({
        width: 0,
        height: 0,
        creation_time: '',
    });

    onMounted(() => {
        if (!props.media.isProcessed) {
            checkIfProcessed();
        }

        fetchFfmpegProps();
    });

    function generateGroupedSegments() {
        if (!window.confirm('Do you really want to re generate context of this video?')) {
            return;
        }

        isPending.value = true;

        mediaManagerStore.generateGroupedSegments(props.media._id).finally(() => {
            isPending.value = false;
            key.value = Date.now();
        });
    }

    function removeFile() {
        if (!window.confirm('Do you really want to delete this video?')) {
            return;
        }

        mediaManagerStore.removeProjectFile(props.media.fileId);
    }

    async function checkIfProcessed() {
        function sleep(ms: number) {
            return new Promise((resolve) => setTimeout(resolve, ms));
        }

        while (!props.media.isProcessed) {
            await sleep(5000);
            mediaManagerStore.fetchVideoMediaByFileId(props.media.fileId);
        }
    }

    function fetchFfmpegProps() {
        return functionProvider
            .run({
                name: 'getFfmpegProps',
                args: { fileId: props.media.fileId },
            })
            .then((res: any) => {
                const videoSteam = res.streams.find((stream: any) => stream.codec_type === 'video');

                ffmpegProps.value = {
                    width: videoSteam.width,
                    height: videoSteam.height,
                    creation_time: (res.format.tags.creation_time || '').split('T').join(' ').split('.')[0],
                };
            });
    }

    function cloneGroupedSegment(element: GroupedSegment) {
        const clone = JSON.parse(JSON.stringify(element)) as TimelineGroupedSegmentType;

        let processedVideoId = '';
        let fileId = '';

        for (let i = 0; i < mediaManagerStore.processedVideoMediaList.length; i++) {
            const video = mediaManagerStore.processedVideoMediaList[i];

            for (let j = 0; j < video.groupedSegments.length; j++) {
                const groupedSegment = video.groupedSegments[j];

                if (groupedSegment._id === element._id) {
                    clone['processedVideoId'] = video._id;
                    clone['fileId'] = video.fileId;
                    break;
                }
            }
        }

        console.log(clone);

        return clone;
    }

    function cloneCaptionAsGroupedSegment(element: SegmentType) {
        const clone = {
            _id: element._id,
            description: element.text,
            duration: element.end - element.start,
            ids: [element.id],
        } as TimelineGroupedSegmentType;

        for (let i = 0; i < mediaManagerStore.processedVideoMediaList.length; i++) {
            const video = mediaManagerStore.processedVideoMediaList[i];

            for (let j = 0; j < video.segments.length; j++) {
                const segment = video.segments[j];

                if (segment._id === element._id) {
                    clone['processedVideoId'] = video._id;
                    clone['fileId'] = video.fileId;
                    break;
                }
            }
        }

        return clone;
    }
</script>

<style scoped>
    @keyframes placeload {
        0% {
            background-position: -468px 0;
        }
        100% {
            background-position: 468px 0;
        }
    }

    .animate-placeload {
        animation: placeload 1s linear infinite;
        background-size: 468px 100%;
        background-image: linear-gradient(to right, #f6f7f8 8%, #edeef1 18%, #f6f7f8 33%);
    }

    .draggable-item {
        touch-action: none; /* Prevents scrolling while dragging on touch devices */
    }

    .sortable-drag {
        opacity: 0.5;
    }

    .sortable-ghost {
        opacity: 0.5;
        background: #c8ebfb;
    }
</style>
