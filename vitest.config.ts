import { defineConfig } from 'vitest/config';
import { resolve } from 'node:path';

export default defineConfig({
  resolve: {
    alias: {
      '@school-erp/application': resolve(__dirname, 'packages/application/src/index.ts'),
      '@school-erp/domain': resolve(__dirname, 'packages/domain/src/index.ts'),
    },
  },
});