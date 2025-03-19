<template>
    <section class="w-full">
        <Tabs :tabs="tabs" v-model="activeTab" containerClass="mb-5 border rounded p-2 min-h-max">
            <!-- Custom icons for tabs -->
            <template #icon-uploadMedia>
                <Icon name="IconFolderMinus" />
            </template>
            <template #icon-processedMedia>
                <Icon name="IconGallery" />
            </template>

            <!-- Custom content for each tab -->
            <template #content-uploadMedia>
                <div>
                    <p>Upload Media</p>
                    <WidgetsUploadedMediaList />
                </div>
            </template>

            <template #content-processedMedia>
                <div>
                    <p>Processed Media</p>
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
