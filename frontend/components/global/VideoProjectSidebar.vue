<template>
    <section class="w-full">
        <Tabs :tabs="tabs" v-model="activeTab" class="min-h-max rounded bg-white">
            <!-- Custom icons for tabs -->
            <template #icon-uploadMedia>
                <Icon name="IconFolderMinus" />
            </template>
            <template #icon-processedMedia>
                <Icon name="IconGallery" />
            </template>

            <!-- Custom content for each tab -->
            <template #content-uploadMedia>
                <div class="flex flex-col gap-4">
                    <WidgetsUploadedMediaList />
                    <WidgetsUploadBox />
                </div>
            </template>

            <template #content-processedMedia>
                <div>
                    <WidgetsProcessedMediaList />
                </div>
            </template>
        </Tabs>
    </section>
</template>

<script setup lang="ts">
    import { Tabs, Icon } from '@codebridger/lib-vue-components/elements.ts';
    import { useMediaManagerStore } from '../../stores/mediaManager.ts';

    const { t } = useI18n();

    const mediaManagerStore = useMediaManagerStore();

    const activeTab = ref('uploadMedia');
    const tabs = [
        {
            id: 'uploadMedia',
            label: 'Upload Media',
            value: 'uploadMedia',
        },
        {
            id: 'processedMedia',
            label: 'Processed Media',
            value: 'processedMedia',
        },
    ];
</script>
