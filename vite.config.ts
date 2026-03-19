import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import electron from 'vite-plugin-electron/simple'
import path from 'path'
import fs from 'fs'

function copyPreload() {
  return {
    name: 'copy-preload',
    buildStart() {
      fs.mkdirSync('dist-electron/preload', { recursive: true })
      fs.copyFileSync('electron/preload.cjs', 'dist-electron/preload/preload.cjs')
    },
  }
}

export default defineConfig({
  plugins: [
    react(),
    copyPreload(),
    electron({
      main: {
        entry: 'electron/main.ts',
        vite: {
          build: {
            outDir: 'dist-electron/main',
            rollupOptions: {
              external: ['electron', 'ws', 'cheerio', 'axios'],
            },
          },
        },
      },
      preload: {
        input: 'electron/preload.ts',
        vite: {
          build: {
            outDir: 'dist-electron/preload',
            rollupOptions: {
              external: ['electron'],
              output: {
                entryFileNames: 'preload.old.js',
              },
            },
          },
        },
      },
      renderer: {},
    }),
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
})
