<template>
  <div>
    <BaseCard
      rounded="md"
      :class="[
        'group',
        'relative',
        'm-1 w-32 h-32 flex flex-col justify-center p-2',
        'word-wrap break-all',
        // Hoverable
        'hover:bg-primary-200 dark:hover:bg-primary-700',
        'hover:cursor-pointer',
      ]"
    >
      <span>
        {{ props.file.fileName }}
      </span>
      <span>{{ props.file.size }}</span>

      <div
        class="absolute w-full bottom-0 flex justify-end px-2 opacity-0 group-hover:opacity-100"
      >
        <BaseButtonIcon
          color="default"
          size="sm"
          class="scale-75"
          @click="onRemoveClick"
        >
          <Icon name="i-solar-trash-bin-2-broken" class="size-4" />
        </BaseButtonIcon>
      </div>
    </BaseCard>

    <TairoModal :open="removeModal" size="md" @close="removeModal = false">
      <template #header>
        <!-- Header -->
        <div class="flex w-full items-center justify-between p-4 md:p-6">
          <h3
            class="font-heading text-muted-900 text-lg font-medium leading-6 dark:text-white"
          >
            Remove File
          </h3>

          <BaseButtonClose @click="removeModal = false" />
        </div>
      </template>

      <!-- Body -->
      <div class="p-4 md:p-6">
        Are you sure you want to remove this file?
        <br /><span> {{ props.file.fileName }}</span>
      </div>

      <template #footer>
        <!-- Footer -->
        <div class="p-4 md:p-6">
          <div class="flex gap-x-2">
            <BaseButton @click="removeModal = false"> Decline </BaseButton>

            <BaseButton color="primary" variant="solid" @click="removeFile">
              Accept
            </BaseButton>
          </div>
        </div>
      </template>
    </TairoModal>
  </div>
</template>

<script setup lang="ts">
import { Types } from "@modular-rest/client";

const emit = defineEmits<{ remove: [fileId: string] }>();

const props = defineProps({
  file: {
    type: Object as PropType<Types.FileDocument>,
    required: true,
  },
  confirmRemove: {
    type: Boolean,
    default: false,
  },
});

const removeModal = ref(false);

function onRemoveClick() {
  if (props.confirmRemove == false) {
    removeModal.value = true;
  } else {
    emit("remove", props.file._id);
  }
}

function removeFile() {
  removeModal.value = false;
  emit("remove", props.file._id);
}
</script>
