<template>
    <App>
        <DashboardShell :brand-title="t('ai-video-editor')">
            <template #header>
                <div class="flex w-full justify-end space-x-2">
                    <PartialThemeSwitcher />
                    <PartialProfileButton />
                </div>
            </template>

            <template #horizontal-menu>
                <HorizontalMenu :items="[]" />
            </template>

            <template #sidebar-menu>
                <SidebarMenu :title="t('ai-video-editor')" :items="menuItems" @item-click="onMenuItemClicked" />
            </template>

            <template #content>
                <NuxtPage />
            </template>
        </DashboardShell>

        <ThemeCustomizer />
    </App>
</template>
<script setup lang="ts">
    import { App, DashboardShell, ThemeCustomizer, SidebarMenu, HorizontalMenu } from '@codebridger/lib-vue-components/shell.ts';
    import type { SidebarItemType, HorizontalMenuItemType } from '@codebridger/lib-vue-components/types.ts';
    import { useMediaManagerStore } from '../stores/mediaManager';

    const { t } = useI18n();

    const menuItems = useDashboardNavigatorItems();
    const router = useRouter();

    function onMenuItemClicked(item: SidebarItemType | HorizontalMenuItemType) {
        if (item?.to) {
            router.push(item.to);
        }
    }

    const mediaStore = useMediaManagerStore();
    const route = useRoute();

    onMounted(() => {
        const projectId = route.params.id as string;

        if (!projectId) {
            window.alert('Project ID is missing, refresh the page.');
        } else {
            mediaStore.initialize(projectId);
        }
    });

    onUnmounted(() => {
        mediaStore.clear();
    });
</script>
