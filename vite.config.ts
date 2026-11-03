import react from '@vitejs/plugin-react';
import { vanillaExtractPlugin } from '@vanilla-extract/vite-plugin';
import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  base: './',
  plugins: [react(), vanillaExtractPlugin()],
  resolve: {
    alias: [
      {
        find: /^@neobook\/react\/(.*)$/,
        replacement: `${fileURLToPath(new URL('./packages/react/src/', import.meta.url))}$1`,
      },
    ],
  },
  test: {
    environment: 'jsdom',
    restoreMocks: true,
    include: ['tests/**/*.test.{ts,tsx}'],
  },
});
