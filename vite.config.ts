import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// PAGES_BASE is set during GitHub Pages build: PAGES_BASE=/claire-test-agents/ npm run build
// Local dev and preview use '/' (default)
const base = process.env.PAGES_BASE ?? '/'

export default defineConfig({
  plugins: [react()],
  base,
  build: { outDir: 'dist', chunkSizeWarningLimit: 2000 },
})
