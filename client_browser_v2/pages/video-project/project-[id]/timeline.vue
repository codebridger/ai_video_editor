<template>
    <h1>{{ t('video-project.timeline') }}</h1>
</template>

<script setup lang="ts">
    const { t } = useI18n();
    definePageMeta({
        layout: 'project',
        title: () => t('video-project.timeline'),
        middleware: ['auth'],
    });
</script>
