<script setup lang="ts">
import { dataProvider, functionProvider } from "@modular-rest/client";
import {
  COLLECTIONS,
  DATABASE,
  type PhraseBundleType,
} from "~/types/database.type";
import { FN, type UserStatisticType } from "~/types/function.type";

// set compile time meta information
definePageMeta({
  // static meta information can be added to vue-router, we use it
  // to generate the search index in the demo
  title: "Dashboard",
});

// meta information can also be added to the head
useHead({
  meta: [{ name: "description", content: "Subturtle popup app" }],
});

const recentBundles = ref<PhraseBundleType[]>([]);
const statistics = ref<UserStatisticType>({
  totalPhrases: 0,
  totalBundles: 0,
});

function getRecentBundles() {
  dataProvider
    .find<PhraseBundleType>({
      database: DATABASE.USER_CONTENT,
      collection: COLLECTIONS.PHRASE_BUNDLE,
      query: {
        refId: authUser.value?.id,
      },
      options: {
        limit: 3,
        sort: {
          updatedAt: -1,
        },
      },
    })
    .then((data) => {
      recentBundles.value = data;
    });
}

function getUserStatistics() {
  functionProvider
    .run<UserStatisticType>({
      name: FN.getUserStatistic,
      args: {
        userId: authUser.value?.id,
      },
    })
    .then((data) => {
      statistics.value = data;
    });
}

onMounted(() => {
  // getRecentBundles();
  // getUserStatistics();
});
</script>

<template>
  <section
    :class="[
      'w-full flex flex-col space-y-4 items-start',
      'md:flex-row md:space-x-4 md:space-y-0',
    ]"
  ></section>

  <div class="flex justify-between mt-4 mb-2">
    <BaseHeading>{{ $t("page.dashboard.recent") }}</BaseHeading>
  </div>

  <section
    class="tablet:grid-cols-2 grid w-full gap-4 lg:grid-cols-3"
  ></section>
</template>
