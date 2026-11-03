import { defineConfig } from 'vite';
import { vanillaExtractPlugin } from '@vanilla-extract/vite-plugin';
import { resolve } from 'node:path';

/**
 * createGlobalThemeContract не порождает ни одного CSS-правила — он только
 * описывает ссылки на переменные. Поэтому на выходе получается обычный JS-объект,
 * и потребителям @neobook/tokens vanilla-extract не нужен вовсе.
 *
 * Сам контракт при этом остаётся полноценным: тот, кто хочет собрать
 * типизированную кастомную тему через createTheme/assignVars, импортирует
 * `@neobook/tokens/contract` и получает рабочий контракт.
 */
export default defineConfig({
  plugins: [vanillaExtractPlugin()],
  build: {
    lib: {
      entry: {
        index: resolve(import.meta.dirname, 'src/index.ts'),
        'contract.css': resolve(import.meta.dirname, 'src/contract.css.ts'),
      },
      formats: ['es'],
    },
    rollupOptions: {
      external: ['@vanilla-extract/css'],
    },
    // dist/ не чистим: сюда же tsc кладёт декларации, и порядок запуска
    // Vite и tsc не должен иметь значения.
    emptyOutDir: false,
    // Значения токенов должны читаться в дистрибутиве глазами — это
    // документация контракта не в меньшей степени, чем код.
    minify: false,
  },
});
