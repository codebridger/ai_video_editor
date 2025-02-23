type Tool = {
  component: string;
  props?: {
    class?: string;
    disableTransitions?: boolean;
    inverted?: boolean;
  };
};

type NavigationItem = {
  title: string;
  icon?: {
    name: string;
    class: string;
  };
  subsidebar?: {
    component: string;
  };
  activePath?: string;
  to?: string;
  click?: () => void;
  position?: string;
  component?: string;
};

export type SidebarLayoutConfig = {
  toolbar?: {
    showNavBurger: boolean;
    tools: Tool[];
  };
  circularMenu?: {
    enabled: boolean;
    tools: Tool[];
  };
  navigation?: {
    logo: {
      component: string;
      props: {
        class: string;
      };
    };
    startOpen: boolean;
    items: NavigationItem[];
  };
};
