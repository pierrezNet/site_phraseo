import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
export default defineConfig({
  base: '/site_phraseo/',
  plugins: [vue()],
  resolve: {
    alias: {
      '@': '/src'
    }
  }
});
