<template>
    <section class="relative">
        <div class="flex items-center justify-between">
            <h3 size="md" class="mx-4 my-2 text-gray-600 dark:bg-gray-700">
                {{ title }}
            </h3>
            <span class="text-gray-500 dark:bg-gray-600"> Duration: {{ totalDuration }}s</span>
        </div>

        <div
            v-if="timelineGroupedSegments.length === 0"
            :class="['absolute flex h-32 w-full items-center justify-center', 'text-gray-400 dark:text-gray-400', 'overflow-auto']"
        >
            <span>Drop files here</span>
        </div>

        <draggable
            :key="componentKey"
            :class="['rounded border-[1px] border-solid border-gray-200 p-1 dark:border-gray-700', 'overflow-y-auto', 'min-h-[200px]']"
            v-model="timelineGroupedSegments"
            :group="{ name: 'grouped-segments', pull: 'clone', put: true }"
            :sort="true"
            handle=".drag-handle"
            item-key="_id"
            @change="onDrop"
        >
            <template #item="{ element, index }: { element: TimelineGroupedSegmentType, index: number }">
                <div class="flex">
                    <!-- Segment time -->
                    <div
                        v-if="timelinePositions[index]"
                        :class="[
                            'flex w-6 flex-col justify-between',
                            'text-center text-[8px] text-gray-600 dark:text-gray-400',
                            'border-b-[1px] border-gray-200 dark:border-gray-700',
                            {
                                'border-t-[1px] ': index == 0,
                            },
                        ]"
                    >
                        <div class="flex items-start">
                            <span v-if="index == 0">{{ timelinePositions[index].start }}s</span>
                        </div>
                        <div class="flex items-start">
                            <span>{{ timelinePositions[index].end }}s</span>
                        </div>
                    </div>

                    <!-- Segment detail -->
                    <WidgetsTimelineGroupedSegmentCard class="p-2" :group="element" @remove="onRemove" />
                </div>
            </template>
        </draggable>
    </section>
</template>

<script setup lang="ts">
    import draggable from 'vuedraggable';
    import type { TimelineGroupedSegmentType } from '../../types/project.type.ts';

    const props = defineProps({
        title: String,
        modelValue: Array as PropType<TimelineGroupedSegmentType[]>,
    });

    const emit = defineEmits<{
        'update:modelValue': [TimelineGroupedSegmentType[]];
    }>();

    const timelineGroupedSegments = ref<TimelineGroupedSegmentType[]>([]);
    const componentKey = ref(0);

    const totalDuration = computed(() => {
        return Math.floor(timelineGroupedSegments.value.reduce((acc, file) => acc + file.duration, 0));
    });

    const timelinePositions = ref<{ start: number; end: number }[]>([]);
    function calculateTimelinePositions() {
        timelinePositions.value = [];
        timelineGroupedSegments.value.forEach((segment, index) => {
            timelinePositions.value.push({
                start: index === 0 ? 0 : timelinePositions.value[index - 1].end,
                end: index === 0 ? segment.duration : timelinePositions.value[index - 1].end + segment.duration,
            });
        });
    }

    function onDrop() {
        componentKey.value++;
        emit('update:modelValue', timelineGroupedSegments.value);
    }

    function onRemove(groupId: string) {
        timelineGroupedSegments.value = timelineGroupedSegments.value.filter((file) => file._id !== groupId);
        componentKey.value++;
        emit('update:modelValue', timelineGroupedSegments.value);
    }

    watch(
        () => props.modelValue,
        () => {
            timelineGroupedSegments.value = props.modelValue || [];
            calculateTimelinePositions();
            componentKey.value++;
        },
        { immediate: true, deep: true }
    );
</script>
