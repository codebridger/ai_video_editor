// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  devtools: { enabled: true },

  extends: [
    // enable the iconnav layout layer
    "gh:cssninjaStudio/tairo/layers/tairo-layout-iconnav#v1.5.1",
  ],
});
