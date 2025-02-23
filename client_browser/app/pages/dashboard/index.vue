<script setup lang="ts">
import { useVideoProjects } from "../../../layers/video-project/store/videoProject";

const { setupSidebarLayout } = useSidebarSetup();

// set compile time meta information
definePageMeta({
  // static meta information can be added to vue-router, we use it
  // to generate the search index in the demo
  title: "Dashboard",
});

// meta information can also be added to the head
useHead({
  meta: [{ name: "description", content: "AI Video Editor" }],
});

const projectsStore = useVideoProjects();

onMounted(() => {
  projectsStore.initialize();
});
</script>

<template>
  <TairoContentWrapper>
    <template #left>
      <span>Your Projects</span>
    </template>

    <template #right>
      <WidgetsAddProject />
    </template>

    <template #default>
      <div class="flex flex-col space-y-2" v-if="!projectsStore.isLoading">
        <!-- <TransitionGroup
          mode="out-in"
          enter-active-class="transition-opacity duration-500"
          enter-from-class="opacity-0"
          enter-to-class="opacity-100"
          leave-active-class="transition-opacity duration-500"
          leave-from-class="opacity-100"
          leave-to-class="opacity-0"
        > -->
        <template v-for="project of projectsStore.projects" :key="project._id">
          <BaseCard
            @mouseenter="setupSidebarLayout(project._id)"
            class="w-full py-6 px-8 flex justify-between items-center"
            shadow="hover"
          >
            <span>
              {{ project.title }}
            </span>

            <div class="flex space-x-2">
              <BaseButton :to="'/project-' + project._id + '/timeline'">{{
                $t("edit")
              }}</BaseButton>

              <BaseButtonIcon
                @click="projectsStore.removeById(project._id)"
                color="primary"
              >
                <Icon name="i-solar-trash-bin-2-broken" />
              </BaseButtonIcon>
            </div>
          </BaseCard>
        </template>
        <!-- </TransitionGroup> -->
      </div>

      <BasePagination
        class="my-8"
        :page-size="projectsStore.pagination.limit"
        :item-per-page="projectsStore.pagination.limit"
        :total-items="projectsStore.pagination.total"
        :current-page="projectsStore.pagination.page"
        :max-links-displayed="5"
        rounded="sm"
        @update:currentPage="projectsStore.fetchPage($event)"
      />
    </template>
  </TairoContentWrapper>
</template>
