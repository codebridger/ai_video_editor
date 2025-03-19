<template>
    <section
        :class="[
            'border-y-[1px] border-solid border-y-gray-200 dark:border-gray-700',
            'flex flex-wrap content-start justify-center',
            'h-full w-full overflow-hidden overflow-y-auto',
        ]"
    >
        <h1>Uploaded Media List</h1>
        <template v-for="file in mediaManagerStore.projectFiles" :key="file._id">
            <WidgetsProjectFileCard :file="file" @remove="mediaManagerStore.removeProjectFile" :confirm-remove="true" />
        </template>
    </section>
</template>

<script setup lang="ts">
    import { useMediaManagerStore } from '../../stores/mediaManager.ts';

    const mediaManagerStore = useMediaManagerStore();
</script>
