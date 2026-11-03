import { libraryConfig } from '@neobook/vite-config';

export default {
  ...libraryConfig({ root: import.meta.dirname }),
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/test/setup.ts'],
    css: true,
  },
};
