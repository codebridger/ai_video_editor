<template>
    <div>
        <h1>starter page</h1>
    </div>
</template>

<script setup lang="ts">
    const { t } = useI18n();
    definePageMeta({
        layout: 'default',
        title: () => t('dashboard'),
        // @ts-ignore
        middleware: ['auth'],
    });
</script>
