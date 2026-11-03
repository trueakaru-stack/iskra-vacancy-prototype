import { defineConfig, type UserConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { vanillaExtractPlugin } from '@vanilla-extract/vite-plugin';
import { readdirSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';

/**
 * Общая конфигурация сборки библиотечных пакетов NeoBook.
 *
 * Два решения, которые стоит понимать:
 *
 * 1. preserveModules вместо единого бандла. Дизайн-система из полусотни
 *    компонентов, собранная в один файл, приезжает к потребителю целиком —
 *    вместе с visx, календарями и таблицами, даже если он импортировал Badge.
 *    Сохранение файловой структуры даёт бандлеру потребителя честно
 *    вытрясти неиспользуемое.
 *
 * 2. Типы генерирует `tsc --build` из корня, а не плагин внутри Vite.
 *    Project references всё равно нужны для инкрементальной проверки
 *    в монорепо, а лишняя зависимость от плагина, догоняющего мажорные
 *    версии TypeScript, здесь ни к чему.
 */

/** Директории, которые не должны попадать в дистрибутив ни при каких условиях. */
const EXCLUDED_DIRS = new Set(['test', '__tests__', '__mocks__', 'story-support']);

/**
 * Рекурсивно собирает точки входа: каждый .ts/.tsx, кроме тестов, сторис
 * и стилевых модулей.
 *
 * Исключение директории test обязательно: тестовые хелперы импортируют vitest
 * и @testing-library, и без фильтра они становятся точками входа — вместе
 * со всем тестовым фреймворком внутри опубликованного пакета.
 */
function collectEntries(dir: string, root = dir, out: Record<string, string> = {}) {
  for (const name of readdirSync(dir)) {
    const full = join(dir, name);
    if (statSync(full).isDirectory()) {
      if (!EXCLUDED_DIRS.has(name)) collectEntries(full, root, out);
    } else if (
      /\.tsx?$/.test(name) &&
      !/\.(test|spec|stories)\.tsx?$/.test(name) &&
      !name.endsWith('.css.ts')
    ) {
      out[relative(root, full).replace(/\.tsx?$/, '')] = full;
    }
  }
  return out;
}

export interface LibraryConfigOptions {
  /** Абсолютный путь к директории пакета. */
  root: string;
  /** Зависимости, которые не должны попасть в бандл. */
  external?: (string | RegExp)[];
}

export function libraryConfig({ root, external = [] }: LibraryConfigOptions): UserConfig {
  return defineConfig({
    plugins: [react(), vanillaExtractPlugin()],
    build: {
      lib: {
        entry: collectEntries(join(root, 'src')),
        formats: ['es'],
      },
      rollupOptions: {
        external: [
          'react',
          'react-dom',
          'react/jsx-runtime',
          /^react-aria-components/,
          /^@internationalized\//,
          /^@neobook\//,
          'clsx',
          ...external,
        ],
        output: {
          preserveModules: true,
          preserveModulesRoot: join(root, 'src'),
          entryFileNames: '[name].js',
          assetFileNames: 'styles[extname]',
        },
      },
      // dist/ не чистим: сюда же tsc кладёт .d.ts, и порядок запуска
      // Vite и tsc не должен иметь значения.
      emptyOutDir: false,
      // Минификация — задача бандлера потребителя: он видит весь граф целиком
      // и справится лучше. Читаемый дистрибутив к тому же сильно упрощает
      // разбор багов в чужом проекте.
      minify: false,
      sourcemap: true,
      target: 'es2022',
    },
  }) as UserConfig;
}
