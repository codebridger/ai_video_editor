<template>
    <section :class="['flex flex-wrap items-start justify-start', 'h-full w-full overflow-hidden overflow-y-auto', 'p-2']">
        <template v-for="file in mediaManagerStore.projectFiles" :key="file._id">
            <WidgetsProjectFileCard :file="file" @remove="mediaManagerStore.removeProjectFile" :confirm-remove="true" />
        </template>
    </section>
</template>

<script setup lang="ts">
    import { useMediaManagerStore } from '../../stores/mediaManager.ts';

    const mediaManagerStore = useMediaManagerStore();
</script>
