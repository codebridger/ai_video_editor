<template>
    <div class="relative flex w-full flex-col items-center justify-center space-y-10 overflow-hidden bg-white/60 p-5 dark:bg-black/50 md:justify-start md:p-10">
        <!-- <div class="dropdown ms-auto w-max">
            <client-only>
                <Popper :placement="store.rtlClass === 'rtl' ? 'bottom-start' : 'bottom-end'" offsetDistance="8">
                    <Button
                        type="button"
                        rounded="lg"
                        class="flex items-center gap-2.5 border border-white-dark/30 px-2 py-1.5 text-white-dark hover:border-primary hover:text-primary dark:bg-black"
                    >
                        <div>
                            <img :src="currentFlag" alt="image" class="h-5 w-5 rounded-full object-cover" />
                        </div>
                        <div class="text-base font-bold uppercase">{{ store.locale }}</div>
                        <span class="shrink-0">
                            <icon-caret-down />
                        </span>
                    </Button>

                    <template #content="{ close }">
                        <ul class="grid w-[280px] grid-cols-2 gap-2 !px-2 font-semibold text-dark dark:text-white-dark dark:text-white-light/90">
                            <template v-for="item in store.languageList" :key="item.code">
                                <li>
                                    <a
                                        type="button"
                                        class="w-full hover:text-primary"
                                        :class="{ 'bg-primary/10 text-primary': store.locale === item.code }"
                                        @click="changeLanguage(item), close()"
                                    >
                                        <img class="h-5 w-5 rounded-full object-cover" :src="`/assets/images/flags/${item.code.toUpperCase()}.svg`" alt="" />
                                        <span class="ltr:ml-3 rtl:mr-3">{{ item.name }}</span>
                                    </a>
                                </li>
                            </template>
                        </ul>
                    </template>
                </Popper>
            </client-only>
        </div> -->

        <div class="mx-auto w-full max-w-[440px]">
            <div class="mb-10 sm:mb-40">
                <h1 class="text-3xl font-extrabold uppercase !leading-snug text-primary md:text-4xl">{{ t('auth.sign-in') }}</h1>
                <p class="text-base font-bold leading-normal text-white-dark">{{ t('auth.choose-account-type') }}</p>
            </div>
            <form class="space-y-5 dark:text-white" @submit.prevent="router.push('/')">
                <!-- <Button disabled color="gradient" shadow uppercase block iconName="IconInstagram" :label="t('auth.sign-in-with-instagram')" /> -->
                <Button
                    @click="triggerGoogleLoginProcess"
                    color="gradient"
                    shadow
                    uppercase
                    block
                    iconName="IconGoogle"
                    :label="t('auth.sign-in-with-google')"
                />
            </form>
            <div class="relative my-7 text-center md:mb-9">
                <span class="absolute inset-x-0 top-1/2 h-px w-full -translate-y-1/2 bg-white-light dark:bg-white-dark"></span>
                <span class="relative bg-white px-2 font-bold uppercase text-white-dark dark:bg-dark dark:text-white-light">{{ t('or') }}</span>
            </div>
            <div class="text-center dark:text-white">
                {{ t('auth.do-not-have-account') }}
                <span class="text-primary"> {{ t('auth.sign-in-new-account') }} </span>
            </div>
        </div>
    </div>
</template>

<script lang="ts" setup>
    import { useAppStore } from '@/stores/index';
    import { useRouter } from 'vue-router';
    import { Button } from '@codebridger/lib-vue-components/elements.ts';

    const { t } = useI18n();

    useHead({ title: t('auth.login-boxed') });

    const router = useRouter();

    definePageMeta({
        layout: 'spotlight',
    });

    const store = useAppStore();
    const { setLocale } = useI18n();

    function triggerGoogleLoginProcess() {
        const config = useRuntimeConfig();
        const url = `${config.public.BASE_URL_API}/auth/google`;
        window.open(url, '_self');
    }
</script>
