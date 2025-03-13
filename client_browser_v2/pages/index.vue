<template>
    <div class="p-10">
        <section class="flex items-center justify-between">
            <h1 class="text-2xl font-bold">{{ t('video-project.your-projects') }}</h1>
            <WidgetsAddProject />
        </section>
        <section class="flex flex-col space-y-2" v-if="!projectsStore.isLoading">
            <h1>Projects</h1>
        </section>
    </div>
</template>

<script setup lang="ts">
    import { Button } from '@codebridger/lib-vue-components/elements.ts';
    import { useVideoProjects } from '../stores/videoProject.ts';

    const { t } = useI18n();

    definePageMeta({
        layout: 'default',
        title: () => t('dashboard'),
        middleware: ['auth'],
    });

    useHead({
        meta: [{ name: 'description', content: 'AI Video Editor' }],
    });

    const projectsStore = useVideoProjects();

    onMounted(() => {
        projectsStore.initialize();
    });
</script>
