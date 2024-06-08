// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  devtools: { enabled: true },

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
