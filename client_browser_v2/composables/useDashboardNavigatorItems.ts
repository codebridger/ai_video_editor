import type { SidebarGroupType } from '@codebridger/lib-vue-components/types.ts';

export const useDashboardNavigatorItems = (): Array<SidebarGroupType> => {
    const { t } = useI18n();

    return [
        {
            title: '',
            children: [
                {
                    title: t('dashboard'),
                    icon: 'IconMenuDashboard',
                    child: [{ title: t('dashboard'), to: '/' }],
                },
                {
                    title: t('video-project.title'),
                    icon: 'IconDesktop',
                    child: [
                        { title: t('video-project.shorts'), to: '/video-project/project-:id/shorts' },
                        { title: t('video-project.timeline'), to: '/video-project/project-:id/timeline' },
                    ],
                },
            ],
        },
    ];
};
