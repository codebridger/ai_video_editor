<template>
    <Card>
        <div class="flex w-full items-center justify-between">
            <div class="-translate-x-9 -translate-y-1 scale-[0.6]">
                <SwitchBall id="captions-switch" v-model="activeCaptionEdit" label="Captions" sublabel="Add or remove captions" />
            </div>

            <IconButton rounded="none" size="sm" title="Remove File" @click="onRemove(group._id)" icon="IconTrash" />
        </div>

        <div class="w-full p-2">
            <p class="select-none text-sm ltr:text-left rtl:text-right">
                {{ group.description }}
            </p>
        </div>

        <div class="w-full" v-if="activeCaptionEdit">
            <template v-for="segment of captionSegments">
                <Card class="my-1 p-2">
                    <p class="select-none text-sm ltr:text-left rtl:text-right">
                        {{ segment.text }}
                    </p>
                </Card>
            </template>
        </div>
    </Card>
</template>

<script setup lang="ts">
    import { Card, IconButton, SwitchBall } from '@codebridger/lib-vue-components/elements.ts';
    import type { TimelineGroupedSegmentType, SegmentType } from '../../types/project.type';
    import { useMediaManagerStore } from '../../stores/mediaManager.ts';

    const mediaManagerStore = useMediaManagerStore();

    const props = defineProps<{
        group: TimelineGroupedSegmentType;
    }>();

    const emit = defineEmits(['remove']);
    const activeCaptionEdit = ref(false);

    const captionSegments = computed(() => {
        try {
            return mediaManagerStore.processedVideoMediaList
                .find((media) => media._id === props.group.processedVideoId)
                ?.segments.filter((segment) => props.group.ids.includes(segment.id));
        } catch (error) {
            return [];
        }
    });

    const onRemove = (id: string) => {
        emit('remove', id);
    };
</script>
