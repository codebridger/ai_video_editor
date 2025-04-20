<template>
    <div>
        <Card
            rounded="md"
            :class="[
                'group',
                'relative',
                'm-1 flex h-32 w-32 flex-col p-1.5',
                'word-wrap break-all',
                'text-gray-400 dark:text-gray-400',
                // Hoverable
                'hover:bg-primary-200 dark:hover:bg-primary-700',
                'hover:cursor-pointer',
                'shadow-none',
            ]"
        >
            <span>
                {{ props.file.fileName }}
            </span>
            <span>{{ props.file.size }}</span>

            <Modal v-model="removeModal" size="md" :title="t('video-project.remove-file')">
                <template #trigger>
                    <IconButton
                        size="sm"
                        class="absolute bottom-0 right-0 m-1 flex w-fit justify-end p-1 opacity-0 group-hover:opacity-100"
                        @click="onRemoveClick"
                        icon="IconTrash"
                    />
                </template>
                <!-- Body -->
                <div class="p-4 md:p-6">
                    {{ t('video-project.are-you-sure-you-want-to-remove-this-file') }}
                    <br /><span> {{ props.file.fileName }}</span>
                </div>

                <template #footer>
                    <!-- Footer -->
                    <div class="p-4 md:p-6">
                        <div class="flex gap-x-2">
                            <Button @click="removeModal = false"> {{ t('decline') }} </Button>

                            <Button color="primary" @click="removeFile"> {{ t('accept') }} </Button>
                        </div>
                    </div>
                </template>
            </Modal>
        </Card>
    </div>
</template>

<script setup lang="ts">
    import { Card, IconButton, Button } from '@codebridger/lib-vue-components/elements.ts';
    import { Modal } from '@codebridger/lib-vue-components/complex.ts';
    import { Types } from '@modular-rest/client';

    const { t } = useI18n();

    const emit = defineEmits<{ remove: [fileId: string] }>();

    const props = defineProps({
        file: {
            type: Object as PropType<Types.FileDocument>,
            required: true,
        },
        confirmRemove: {
            type: Boolean,
            default: false,
        },
    });

    const removeModal = ref(false);

    function onRemoveClick() {
        if (props.confirmRemove == true) {
            removeModal.value = true;
        } else {
            emit('remove', props.file._id);
        }
    }

    function removeFile() {
        removeModal.value = false;
        emit('remove', props.file._id);
    }
</script>
<style scoped>
    .p-1\.5 {
        padding: 0.375rem !important;
    }
    .p-1 {
        padding: 0.25rem !important;
    }
</style>
