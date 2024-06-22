<template>
  <section class="flex items-end justify-between space-x-4">
    <div class="flex-1">
      <!-- <BaseHeading class="mx-4 my-2"> {{ props.title }} </BaseHeading> -->
      <BaseTextarea
        :model-value="props.modelValue"
        :label="props.title"
        class="h-32 p-2 border-solid border-[1px] border-gray-200 dark:border-muted-700"
        placeholder="Type here..."
        @update:model-value="emit('update:modelValue', $event)"
      />
    </div>

    <BaseButton @click="emit('generate', props.modelValue)">
      Generate
    </BaseButton>
  </section>
</template>

<script setup lang="ts">
const props = defineProps({
  title: String,
  modelValue: {
    type: String,
    default: "",
  },
});

const emit = defineEmits<{
  "update:modelValue": [string];
  generate: [string];
}>();
</script>
