import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';
import { copyFileSync, mkdirSync, readFileSync, writeFileSync, existsSync, rmSync } from 'fs';

export default defineConfig({
  base: './',
  plugins: [
    react(),
    {
      name: 'copy-manifest',
      closeBundle() {
        // Копируем manifest.json и иконки в dist
        mkdirSync('dist', { recursive: true });
        copyFileSync('public/manifest.json', 'dist/manifest.json');

        // Копируем иконки
        const icons = ['icon16.svg', 'icon48.svg', 'icon128.svg'];
        icons.forEach(icon => {
          try {
            copyFileSync(`public/${icon}`, `dist/${icon}`);
            // Также копируем как PNG для совместимости
            const pngName = icon.replace('.svg', '.png');
            copyFileSync(`public/${icon}`, `dist/${pngName}`);
          } catch (e) {
            console.warn(`Could not copy ${icon}`);
          }
        });

        // Перемещаем options.html из dist/src в dist
        try {
          if (existsSync('dist/src/options.html')) {
            copyFileSync('dist/src/options.html', 'dist/options.html');
            rmSync('dist/src', { recursive: true, force: true });
          }
        } catch (e) {
          console.warn('Could not move options.html:', e.message);
        }

        // Исправляем пути в HTML файлах для Chrome расширений
        try {
          const htmlPath = 'dist/options.html';
          let html = readFileSync(htmlPath, 'utf-8');
          // Исправляем пути с ../ на ./
          html = html.replace(/src="\.\.\/([^"]+)"/g, 'src="./$1"');
          html = html.replace(/href="\.\.\/([^"]+)"/g, 'href="./$1"');
          // Исправляем абсолютные пути
          html = html.replace(/src="\/([^"]+)"/g, 'src="./$1"');
          html = html.replace(/href="\/([^"]+)"/g, 'href="./$1"');
          writeFileSync(htmlPath, html);
        } catch (e) {
          console.warn('Could not fix HTML paths', e);
        }
      },
    },
  ],
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    rollupOptions: {
      input: {
        options: resolve(__dirname, 'src/options.html'),
        background: resolve(__dirname, 'src/background/background.ts'),
      },
      output: {
        entryFileNames: (chunkInfo) => {
          return chunkInfo.name === 'background'
            ? 'background.js'
            : '[name].js';
        },
        chunkFileNames: 'chunks/[name].[hash].js',
        assetFileNames: (assetInfo) => {
          if (assetInfo.name?.endsWith('.html')) {
            return '[name].[ext]';
          }
          return 'assets/[name].[ext]';
        },
      },
    },
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, './src'),
    },
  },
});
