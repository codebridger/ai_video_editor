<template>
    <div class="mx-auto flex flex-col space-y-10 p-4 sm:p-10 lg:w-10/12">
        <section class="flex items-center justify-between">
            <h1 class="text-sm font-bold md:text-2xl">{{ t('video-project.your-projects') }}</h1>
            <WidgetsAddProject />
        </section>
        <section class="flex flex-col space-y-2" v-if="!projectsStore.isLoading">
            <template v-for="project of projectsStore.projects" :key="project._id">
                <Card class="flex w-full items-center justify-between rounded-md px-8 py-6 shadow-none hover:bg-gray-100 hover:shadow-md">
                    <h1 class="light:text-gray-900 text-sm dark:text-gray-50 md:text-lg">{{ project.title }}</h1>
                    <div class="flex space-x-2">
                        <Button :to="'/video-project/project-' + project._id + '/timeline'" color="primary" rounded="lg" class="w-full" :label="t('edit')" />
                        <IconButton size="sm" class="w-full" rounded="full" icon="IconX" @click="projectsStore.removeById(project._id)" />
                    </div>
                </Card>
            </template>
        </section>
    </div>
</template>

<script setup lang="ts">
    import { Card, Button, IconButton } from '@codebridger/lib-vue-components/elements.ts';
    import { useVideoProjects } from '../stores/videoProject.ts';

    const { t } = useI18n();

    definePageMeta({
        layout: 'default',
        title: () => t('dashboard'),
        middleware: ['auth'],
    });

    useHead({
        meta: [{ name: () => t('description'), content: () => t('ai-video-editor') }],
    });

    const projectsStore = useVideoProjects();

    onMounted(() => {
        projectsStore.initialize();
    });
</script>
