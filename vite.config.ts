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
    // Also watch for changes to preload.cjs during dev
    configureServer(server: any) {
      fs.watchFile('electron/preload.cjs', () => {
        fs.copyFileSync('electron/preload.cjs', 'dist-electron/preload/preload.cjs')
        console.log('[copy-preload] preload.cjs updated')
      })
      server.httpServer?.on('close', () => {
        fs.unwatchFile('electron/preload.cjs')
      })
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
        onstart(args) {
          // npm sets ELECTRON_RUN_AS_NODE=1 which makes Electron run as plain Node
          delete process.env.ELECTRON_RUN_AS_NODE
          args.startup()
        },
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
