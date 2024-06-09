<script setup lang="ts">
import { dataProvider, functionProvider } from "@modular-rest/client";
import { useVideoProjects } from "../../../layers/video-project/store/videoProject";

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

const videoStore = useVideoProjects();

onMounted(async () => {
  await videoStore.initialize();
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
      <div class="flex flex-col space-y-2">
        <TransitionGroup
          mode="out-in"
          enter-active-class="transition-opacity duration-500"
          enter-from-class="opacity-0"
          enter-to-class="opacity-100"
          leave-active-class="transition-opacity duration-500"
          leave-from-class="opacity-100"
          leave-to-class="opacity-0"
        >
          <template v-for="project of videoStore.projects" :key="project._id">
            <BaseCard
              class="w-full py-6 px-8 flex justify-between items-center"
              shadow="hover"
            >
              <span>
                {{ project.title }}
              </span>

              <div class="flex space-x-2">
                <BaseButton>{{ $t("edit") }}</BaseButton>

                <BaseButtonIcon
                  @click="videoStore.removeById(project._id)"
                  color="primary"
                >
                  <Icon name="i-solar-trash-bin-2-broken" />
                </BaseButtonIcon>
              </div>
            </BaseCard>
          </template>
        </TransitionGroup>
      </div>

      <BasePagination
        class="my-8"
        :page-size="videoStore.pagination.limit"
        :item-per-page="videoStore.pagination.limit"
        :total-items="videoStore.pagination.total"
        :current-page="videoStore.pagination.page"
        :max-links-displayed="5"
        rounded="sm"
        @update:currentPage="videoStore.fetchPage($event)"
      />
    </template>
  </TairoContentWrapper>
</template>
