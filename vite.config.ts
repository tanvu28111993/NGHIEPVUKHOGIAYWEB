import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, '.', '');
    return {
      server: {
        port: 3000,
        host: '0.0.0.0',
      },
      build: {
        rollupOptions: {
          output: {
            manualChunks: {
              'vendor-react': ['react', 'react-dom'],
              'vendor-ui': ['lucide-react'], 
              'vendor-data': ['@tanstack/react-query', 'zustand', 'idb-keyval']
            }
          }
        }
      },
      plugins: [
        react(),
        VitePWA({
          strategies: 'injectManifest', // Chuyển sang chế độ thủ công
          srcDir: '.', // File sw.ts nằm ở root
          filename: 'sw.ts', // Tên file source
          registerType: 'autoUpdate',
          includeAssets: ['favicon.ico', 'apple-touch-icon.png', 'masked-icon.svg'],
          manifest: {
            name: 'Nghiệp Vụ Kho Giấy Pro',
            short_name: 'Kho Giấy',
            description: 'Hệ thống quản lý kho giấy chuyên nghiệp trên nền tảng Web PC.',
            theme_color: '#0f0f0f',
            background_color: '#0f0f0f',
            display: 'standalone',
            start_url: '/',
            icons: [
              {
                src: 'https://i.postimg.cc/8zF3c24h/image.png',
                sizes: '192x192',
                type: 'image/png',
                purpose: 'any maskable'
              },
              {
                src: 'https://i.postimg.cc/8zF3c24h/image.png',
                sizes: '512x512',
                type: 'image/png',
                purpose: 'any maskable'
              }
            ]
          },
          devOptions: {
            enabled: true,
            type: 'module',
          }
        })
      ],
      define: {
        'process.env.API_KEY': JSON.stringify(env.GEMINI_API_KEY),
        'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY)
      },
      resolve: {
        alias: {
          '@': path.resolve('.'),
        }
      },
      // @ts-ignore
      test: {
        globals: true,
        environment: 'jsdom',
        setupFiles: [],
      }
    };
});