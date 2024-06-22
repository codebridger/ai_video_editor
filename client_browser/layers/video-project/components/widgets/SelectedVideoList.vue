<template>
  <section class="relative">
    <BaseHeading class="mx-4 my-2"> {{ title }} </BaseHeading>
    <div
      v-if="tempFiles.length === 0"
      :class="[
        'absolute h-32 w-full flex justify-center items-center',
        'dark:text-muted-400 text-gray-400',
      ]"
    >
      <span>Drop files here</span>
    </div>
    <draggable
      :key="componentKey"
      :class="[
        'p-1 border-solid rounded border-[1px] border-gray-200 dark:border-muted-700',
        'flex flex-wrap content-start',
        'min-h-32',
      ]"
      v-model="tempFiles"
      :group="'projectFiles'"
      item-key="fileName"
      @change="onDrop"
    >
      <template #item="{ element, index }">
        <WidgetsProjectFileCard
          :file="element"
          @remove="onRemove"
          confirm-remove
        />
      </template>
    </draggable>
  </section>
</template>

<script setup lang="ts">
import { Types } from "@modular-rest/client";
import draggable from "vuedraggable";

const props = defineProps({
  title: String,
  modelValue: Array as PropType<Types.FileDocument[]>,
});

const emit = defineEmits<{ "update:modelValue": [Types.FileDocument[]] }>();

const tempFiles = ref<Types.FileDocument[]>([]);
const componentKey = ref(0);

function onDrop() {
  componentKey.value++;
}

function onRemove(fileId: string) {
  tempFiles.value = tempFiles.value.filter((file) => file._id !== fileId);
  componentKey.value++;
  emit("update:modelValue", tempFiles.value);
}

watch(
  () => props.modelValue,
  () => {
    tempFiles.value = props.modelValue || [];
  },
  { immediate: true, deep: true }
);
</script>
