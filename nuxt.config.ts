import { execSync } from 'node:child_process'
import { writeFileSync } from 'node:fs'

let buildCommit = process.env.GIT_COMMIT || ''
if (!buildCommit) {
  try {
    buildCommit = execSync('git rev-parse --short HEAD', { encoding: 'utf-8' }).trim()
  } catch {
    buildCommit = 'unknown'
  }
}

// Bake build info into a JSON file so it survives Docker deploys (no .git at runtime)
writeFileSync('build-info.json', JSON.stringify({ version: '1.0.0', commit: buildCommit }))

// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({

  modules: [
    '@nuxt/eslint',
    '@nuxt/ui',
    '@nuxt/image',
    '@nuxt/icon',
    '@pinia/nuxt',
    '@vueuse/nuxt'
  ],
  devtools: { enabled: true },

  css: ['~/assets/css/main.css'],

  runtimeConfig: {
    public: {
      apiBase: 'http://localhost:3001',
      shopBase: 'http://localhost:3002'
    }
  },

  devServer: {
    port: 3000
  },
  compatibilityDate: '2025-07-15',

  eslint: {
    config: {
      stylistic: {
        commaDangle: 'never',
        braceStyle: '1tbs'
      }
    }
  },

  icon: {
    mode: 'css',
    cssLayer: 'base',
    componentName: 'Icon'
  }
})
