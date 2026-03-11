import { defineConfig } from 'vitest/config'
import vue from '@vitejs/plugin-vue'

export default defineConfig({
  plugins: [vue()],
  base: '/site_phraseo/',
  resolve: {
    alias: {
      '@': '/src'
    }
  },
  test: {
    environment: 'jsdom',
    globals: true,
    include: ['src/**/*.{test,spec}.ts'],
    alias: {
      '@': new URL('./src', import.meta.url).pathname
    }
  }
});
