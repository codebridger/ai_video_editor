<template>
    <section class="w-full">
        <Tabs :tabs="tabs" v-model="activeTab" containerClass="mb-5 border rounded p-2 h-screen">
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
            icon: 'mdi-light:cloud-upload',
        },
        {
            id: 'processedMedia',
            label: 'Processed Media',
            value: 'processedMedia',
            icon: 'mdi-light:filmstrip',
        },
    ];
</script>
