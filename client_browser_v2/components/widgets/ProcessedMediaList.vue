<template>
    <div class="min-h-[200px] pb-2">
        <template v-for="(media, i) in mediaManagerStore.processedVideoMediaList">
            <WidgetsProcessedMediaCard :class="['m-2 border-none bg-slate-50 dark:bg-slate-900 md:m-4', { 'mt-2': i == 0 }]" :media="media" />
        </template>
    </div>
</template>
<script setup lang="ts">
    import { useMediaManagerStore } from '../../stores/mediaManager.ts';

    const mediaManagerStore = useMediaManagerStore();
</script>
