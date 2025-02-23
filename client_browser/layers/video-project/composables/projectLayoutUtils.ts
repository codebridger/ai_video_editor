import type { SidebarLayoutConfig } from "../types/collapseConfig.type";

export function useSidebarSetup() {
  const appConfig = useAppConfig();
  const { t } = useI18n();
  const router = useRouter();

  return {
    setupSidebarLayout(id: string) {
      // debugger;

      const config: SidebarLayoutConfig = {
        toolbar: {
          showNavBurger: true,
          tools: [
            {
              component: "ThemeToggle",
            },
            {
              component: "ToolbarAccountMenu",
            },
          ],
        },
        navigation: {
          logo: {
            component: "TairoLogo",
            props: { class: "text-primary-600 h-10" },
          },
          startOpen: true,
          items: [
            {
              title: "Timeline",
              activePath: `/project-${id}/timeline`,
              icon: { name: "i-ph-film-strip-duotone", class: "w-5 h-5" },
              subsidebar: {
                component: "VideoProjectSidebar",
              },
              click: () => {
                router.push(`/project-${id}/timeline`);
              },
            },
            {
              title: "Shorts And Story",
              activePath: `/project-${id}/shorts`,
              icon: { name: "i-tdesign-mobile-shortcut", class: "w-5 h-5" },
              subsidebar: {
                component: "VideoProjectSidebar",
              },
              click: () => {
                router.push(`/project-${id}/shorts`);
              },
            },
          ],
        },
      };

      // @ts-ignore
      appConfig.tairo.sidebar = config;
    },
  };
}
