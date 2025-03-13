<template>
    <section class="flex items-end justify-between space-x-4">
        <div class="flex-1">
            <Textarea
                type="text"
                :label="props.title"
                :placeholder="t('type-here')"
                v-model="props.modelValue"
                :error="!!error"
                :error-message="error || ''"
                :loading="!!props.newPhrase && isSubmitting"
                @update:model-value="emit('update:modelValue', $event)"
                class="mb-2 min-h-24 w-full p-2"
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
