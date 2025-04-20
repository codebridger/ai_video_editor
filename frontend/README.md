# Frontend Documentation (AI Video Editor)

This directory contains the Nuxt 3 frontend application for the AI Video Editor.

## Technology Stack

*   **Framework:** [Nuxt 3](https://nuxt.com/)
*   **Language:** TypeScript
*   **UI:** [Vue 3](https://vuejs.org/)
*   **Styling:** [Tailwind CSS](https://tailwindcss.com/), SASS
*   **State Management:** [Pinia](https://pinia.vuejs.org/)
*   **API Client:** [`@modular-rest/client`](https://www.npmjs.com/package/@modular-rest/client)
*   **Forms:** [VeeValidate](https://vee-validate.logaretm.com/v4/), [Yup](https://github.com/jquense/yup)
*   **Video Player:** [Video.js](https://videojs.com/)
*   **Internationalization:** [`@nuxtjs/i18n`](https://i18n.nuxtjs.org/)

## Folder Structure

*   **`.nuxt/`:** Nuxt's build directory (automatically generated). *(Ignored by Git)*
*   **`assets/`:** Uncompiled assets like CSS, SASS files, or fonts.
*   **`components/`:** Vue components organized into `global` (registered globally), `partial` (used within specific pages/layouts), and `widgets` (reusable complex UI elements).
*   **`composables/`:** Reusable Vue Composition API functions (e.g., `useApi`, state management helpers).
*   **`helpers/`:** Utility functions specific to the frontend.
*   **`joint-system/`:** Likely shared types or models between frontend and potentially backend (needs verification).
*   **`layouts/`:** Nuxt layout components (e.g., `default.vue`).
*   **`locales/`:** Translation files for internationalization (`en.json`, etc.).
*   **`middleware/`:** Nuxt route middleware (e.g., for authentication checks).
*   **`pages/`:** Application views and routes (file-based routing).
*   **`plugins/`:** Nuxt plugins for integrating libraries (e.g., Pinia, i18n).
*   **`public/`:** Static assets directly served (e.g., images, favicons).
*   **`stores/`:** Pinia store modules for state management.
*   **`types/`:** TypeScript type definitions specific to the frontend.
*   **`utils/`:** General utility functions.

## Development

To run the frontend development server:

```bash
cd frontend
yarn dev
```

The application will be available at `http://localhost:3000` (or the configured port). Refer to the root `README.md` for instructions on running the full stack.

## Building for Production

To build the application for production deployment:

```bash
cd frontend
yarn build
```

This command compiles the application and outputs the result to the `.nuxt/dist/` directory. Consult the [Nuxt deployment documentation](https://nuxt.com/docs/getting-started/deployment) for deployment strategies.

## Key Configurations

*   **`nuxt.config.ts`:** The main configuration file for Nuxt. Defines modules, plugins, build settings, runtime config, etc.
*   **`.env`:** Used for environment variables (though no `.env.sample` exists). Potentially used for `API_BASE_URL` or other runtime configuration accessed via `useRuntimeConfig()`. *(Ignored by Git)*
*   **`i18n.config.ts`:** Configuration for the `@nuxtjs/i18n` module.
*   **`tailwind.config.cjs`:** Configuration file for Tailwind CSS.

## State Management

[Pinia](https://pinia.vuejs.org/) is used for global state management. Store modules are defined in the `stores/` directory. Components can access stores by importing and using them (e.g., `useAuthStore()`).

## API Communication

API requests to the backend server are handled using the `@modular-rest/client`. Configuration (like the base URL) is typically handled via Nuxt runtime config, which might read from `.env`.
Composables like `useApi` likely abstract the API calls.

## Styling

Styling is primarily done using [Tailwind CSS](https://tailwindcss.com/). Custom CSS or SASS can be added in the `assets/css/` directory.
