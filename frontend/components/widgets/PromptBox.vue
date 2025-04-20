<template>
    <section class="flex w-full items-end justify-between space-x-4">
        <div class="flex-1">
            <TextArea
                type="text"
                :label="props.title"
                :placeholder="t('type-here')"
                :model-value="props.modelValue"
                @update:model-value="emit('update:modelValue', $event)"
                class="mb-2 min-h-24 w-full"
            />
            <Button @click="emit('generate', props.modelValue)" :loading="loading" :label="t('video-project.generate-timeline')" />
        </div>
    </section>
</template>

<script setup lang="ts">
    import { TextArea, Button } from '@codebridger/lib-vue-components/elements.ts';

    const { t } = useI18n();
    const props = defineProps({
        title: String,
        loading: Boolean,
        modelValue: {
            type: String,
            default: '',
        },
    });

    const emit = defineEmits<{
        'update:modelValue': [string];
        generate: [string];
    }>();
</script>
