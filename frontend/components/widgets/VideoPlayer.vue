<template>
    <div class="flex items-center justify-center">
        <video-player :width="500" controls autoplay responsive v-if="mediaManager.activeVideoForPlayer" :src="mediaManager.activeVideoForPlayer" />
    </div>
</template>

<script setup lang="ts">
    import { VideoPlayer } from '@videojs-player/vue';
    import 'video.js/dist/video-js.css';
    import { fileProvider } from '@modular-rest/client';

    import { useMediaManagerStore } from '../../stores/mediaManager.ts';
    const mediaManager = useMediaManagerStore();
</script>
