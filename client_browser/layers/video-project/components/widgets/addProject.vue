<template>
  <BaseButton color="primary" @click="addModal = true">
    {{ $t("layer_project.add_project") }}
  </BaseButton>

  <TairoModal :open="addModal">
    <template #header>
      <!-- Header -->
      <div class="flex w-full items-center justify-between p-4 md:p-6">
        <h3
          class="font-heading text-muted-900 text-lg font-medium leading-6 dark:text-white"
        >
          {{ $t("layer_project.add_project") }}
        </h3>

        <BaseButtonClose @click="cancel" />
      </div>
    </template>

    <template #default>
      <!-- Body -->
      <div class="p-4 md:p-6">
        <BaseInput
          v-model="title"
          :error="useFieldError('title').value"
          rounded="sm"
          placeholder="Project Name"
        />
      </div>
    </template>

    <template #footer>
      <!-- Footer -->
      <div class="flex justify-end space-x-2 p-4 md:p-6">
        <BaseButton @click="cancel">
          {{ $t("cancel") }}
        </BaseButton>
        <BaseButton color="primary" @click="submit">
          {{ $t("create") }}
        </BaseButton>
      </div>
    </template>
  </TairoModal>
</template>

<script lang="ts" setup>
import { useForm, useFieldError } from "vee-validate";
import * as yup from "yup";

import { $t } from "~/composables/i18n";
import { useVideoProjects } from "../../store/videoProject";

const addModal = ref(false);
const isPending = ref(false);

const i18n = useI18n();
const videoProjects = useVideoProjects();

const { defineField, resetForm, validate } = useForm({
  validationSchema: {
    title: yup.string().min(1).max(255).trim().required(),
  },
});

const [title] = defineField("title");

async function submit() {
  isPending.value = true;

  const isValid = await validate();

  if (!isValid) {
    isPending.value = false;
    return;
  }

  return videoProjects
    .createProject(title.value)
    .then(() => {
      isPending.value = false;
      addModal.value = false;
      resetForm();
    })
    .catch(({ message }) => {
      isPending.value = false;
      toastError({
        title: i18n.t("layer_project.add_project_error"),
        message: message || "",
      });
    });
}

function cancel() {
  addModal.value = false;
  isPending.value = false;
  resetForm();
}
</script>
