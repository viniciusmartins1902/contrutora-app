import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

// https://vite.dev/config/
export default defineConfig({
  plugins: [vue()],
  // Necessário para Capacitor: usa caminhos relativos no build
  base: './',
})
