import { GlobalOptions, authentication } from '@modular-rest/client';

export default defineNuxtPlugin((nuxtApp) => {
  const config = useRuntimeConfig();
  const loginRoute = '/auth/login';

  GlobalOptions.set({
    // the base url of the server, it should match with the server address
    host: config.public.BASE_URL_API || window.location.origin,
  });
});
