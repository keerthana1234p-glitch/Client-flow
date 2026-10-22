import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  test: {
    environment: 'node',
    globals: true,
    testTimeout: 45000,
    fileParallelism: false,
    include: ['src/**/*.test.ts'],
    exclude: ['**/node_modules/**', '**/scratch/**'],
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
});
