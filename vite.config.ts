import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'node:path';
import { copyFileSync, mkdirSync, readFileSync, writeFileSync, existsSync, rmSync } from 'node:fs';

export default defineConfig({
  base: './',
  plugins: [
    react(),
    {
      name: 'copy-manifest',
      closeBundle() {
        // Copy manifest.json and icons to dist
        mkdirSync('dist', { recursive: true });
        copyFileSync('public/manifest.json', 'dist/manifest.json');

        // Copy icons
        const icons = ['icon16.png', 'icon48.png', 'icon128.png'];
        icons.forEach(icon => {
          try {
            copyFileSync(`public/${icon}`, `dist/${icon}`);
          } catch (e) {
            console.warn(`Could not copy ${icon}`);
          }
        });

        // Move options.html from dist/src to dist
        try {
          if (existsSync('dist/src/options.html')) {
            copyFileSync('dist/src/options.html', 'dist/options.html');
            rmSync('dist/src', { recursive: true, force: true });
          }
        } catch (e) {
          console.warn('Could not move options.html:', e instanceof Error ? e.message : String(e));
        }

        // Fix paths in HTML files for Chrome extensions
        try {
          const htmlPath = 'dist/options.html';
          let html = readFileSync(htmlPath, 'utf-8');
          // Fix paths from ../ to ./
          html = html.replace(/src="\.\.\/([^"]+)"/g, 'src="./$1"');
          html = html.replace(/href="\.\.\/([^"]+)"/g, 'href="./$1"');
          // Fix absolute paths
          html = html.replace(/src="\/([^"]+)"/g, 'src="./$1"');
          html = html.replace(/href="\/([^"]+)"/g, 'href="./$1"');
          writeFileSync(htmlPath, html);
        } catch (e) {
          console.warn('Could not fix HTML paths:', e instanceof Error ? e.message : String(e));
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
