<template>
    <Modal v-model="addModal" :title="t('video-project.add-project')">
        <template #trigger>
            <Button color="primary" rounded="lg" class="w-full" @click="addModal = true" iconName="IconPlus" :label="t('video-project.add-project')" />
        </template>
        <template #default>
            <div class="flex flex-col space-y-2 p-4">
                <Input :placeholder="t('video-project.project-name')" v-model="title" :error="!!error" :error-message="error || ''" />
            </div>
        </template>

        <template #footer>
            <!-- Footer -->
            <div class="flex justify-end space-x-2">
                <Button @click="cancel" :label="t('cancel')" />
                <Button color="primary" @click="submit" :loading="isPending" :label="t('create')" />
            </div>
        </template>
    </Modal>
</template>

<script setup lang="ts">
    import { Button, Input } from '@codebridger/lib-vue-components/elements.ts';
    import { Modal } from '@codebridger/lib-vue-components/complex.ts';
    import { useForm, useFieldError } from 'vee-validate';
    import * as yup from 'yup';
    import { useVideoProjects } from '../../stores/videoProject.ts';

    const { t } = useI18n();
    const addModal = ref(false);
    const isPending = ref(false);
    const videoProjects = useVideoProjects();

    const { defineField, resetForm, validate } = useForm({
        validationSchema: {
            title: yup.string().min(1).max(255).trim().required(),
        },
    });

    const [title] = defineField('title');

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
            });
    }

    function cancel() {
        addModal.value = false;
        isPending.value = false;
        resetForm();
    }
</script>
