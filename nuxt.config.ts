// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: true },

  modules: [
    '@nuxt/eslint',
    '@nuxt/ui',
    '@nuxt/image',
    '@nuxt/icon',
    '@pinia/nuxt',
  ],

  css: ['~/assets/css/main.css'],

  icon: {
    mode: 'css',
    cssLayer: 'base',
    componentName: 'Icon'
  },

  runtimeConfig: {
    public: {
      apiBase: 'http://localhost:3001',
    },
  },

  devServer: {
    port: 3000,
  },

  eslint: {
    config: {
      stylistic: {
        commaDangle: 'never',
        braceStyle: '1tbs'
      }
    }
  },
});
