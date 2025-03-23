<template>
    <div>
        <template v-for="(media, i) in mediaManagerStore.processedVideoMediaList">
            <WidgetsProcessedMediaCard :class="['my-4', { 'mt-2': i == 0 }]" :media="media" />
        </template>
    </div>
</template>
<script setup lang="ts">
    import { useMediaManagerStore } from '../../stores/mediaManager.ts';

    const mediaManagerStore = useMediaManagerStore();
</script>
