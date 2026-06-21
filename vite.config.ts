import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  server: {
    port: Number(process.env.PORT) || 5173,
  },
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      manifest: {
        name: '5-9 ビリヤード得点アプリ',
        short_name: '5-9スコア',
        description: '5-9（ジャパン）ビリヤード得点管理アプリ',
        theme_color: '#1a1a2e',
        background_color: '#1a1a2e',
        display: 'fullscreen',
        orientation: 'landscape',
        icons: [
          { src: '/icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: '/icon-512.png', sizes: '512x512', type: 'image/png' },
        ],
      },
    }),
  ],
})
