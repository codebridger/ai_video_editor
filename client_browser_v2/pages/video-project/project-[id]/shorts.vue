<template>
    <h1>{{ t('video-project.shorts') }}</h1>
</template>

<script setup lang="ts">
    const { t } = useI18n();
    definePageMeta({
        layout: 'project',
        title: () => t('video-project.shorts'),
        middleware: ['auth'],
    });
</script>
