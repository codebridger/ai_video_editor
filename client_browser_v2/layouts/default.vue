<template>
    <App>
        <DashboardShell brand-title="ChatPilots" menu-style="horizontal">
            <template #header>
                <div class="flex w-full justify-end space-x-2">
                    <PartialThemeSwitcher />
                    <PartialProfileButton />
                </div>
            </template>

            <template #horizontal-menu>
                <HorizontalMenu title="ChatPilots" :items="[]" />
            </template>

            <template #content>
                <NuxtPage />
            </template>
        </DashboardShell>

        <ThemeCustomizer />
    </App>
</template>

<script setup lang="ts">
    import { App, DashboardShell, ThemeCustomizer, HorizontalMenu } from '@codebridger/lib-vue-components/shell.ts';
</script>

<style scoped>
    .horizontal-menu {
        display: none !important;
    }
</style>
