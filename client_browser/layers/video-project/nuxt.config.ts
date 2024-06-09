// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  modules: ["@pinia/nuxt", "@nuxtjs/i18n"],

  extends: [
    [
      "gh:cssninjaStudio/tairo/layers/tairo-layout-collapse#v1.5.1",
      {
        install: true,
        giget: { auth: process.env.GIGET_AUTH_TOKEN },
      },
    ],
  ],
});
