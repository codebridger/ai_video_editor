import { dataProvider } from "@modular-rest/client";
import {
  VIDEO_PROJECT_DATABASE,
  type ProjectType,
} from "../types/project.type";

export const useVideoProjects = defineStore("videoProjects", () => {
  const i18n = useI18n();

  const projects = ref<ProjectType[]>([]);

  const listController = dataProvider.list<ProjectType>(
    {
      database: VIDEO_PROJECT_DATABASE.DATABASE,
      collection: VIDEO_PROJECT_DATABASE.PROJECT_COLLECTION,
      query: {
        userId: authUser.value?.id,
      },
      options: {
        limit: 20,
        sort: { createdAt: -1 },
      },
    },
    { limit: 20, page: 1 }
  );

  const pagination = computed(() => listController.pagination);
  const isLoading = ref(false);

  function fetchPage(page: number) {
    isLoading.value = true;
    return listController
      .fetchPage(page)
      .then((list) => {
        projects.value = JSON.parse(JSON.stringify(list));
      })
      .finally(() => (isLoading.value = false));
  }

  async function initialize() {
    isLoading.value = true;

    try {
      await listController.updatePagination();
      await fetchPage(1);
    } catch (error) {
      isLoading.value = false;
    }
  }

  function createProject(title: string) {
    return dataProvider
      .insertOne({
        database: VIDEO_PROJECT_DATABASE.DATABASE,
        collection: VIDEO_PROJECT_DATABASE.PROJECT_COLLECTION,
        doc: {
          title: title,
          userId: authUser.value?.id,
        },
      })
      .then((project) => {
        projects.value.unshift(project);
      });
  }

  function removeById(id: string) {
    const index = projects.value.findIndex((project) => project._id === id);

    if (index === -1) {
      return;
    }

    const [removedItem] = projects.value.splice(index, 1);

    return dataProvider
      .removeOne({
        database: VIDEO_PROJECT_DATABASE.DATABASE,
        collection: VIDEO_PROJECT_DATABASE.PROJECT_COLLECTION,
        query: {
          userId: authUser.value?.id,
          _id: id,
        },
      })
      .catch(({ message }) => {
        projects.value.splice(index, 0, removedItem);
        toastError({
          title: i18n.t("layer_project.remove_project_error"),
          message,
        });
      });
  }

  return {
    projects,
    pagination,
    fetchPage,
    initialize,
    isLoading,
    removeById,
    createProject,
  };
});
