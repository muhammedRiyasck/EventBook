import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: ['node_modules/', 'dist/', 'src/__tests__/'],
      thresholds: {
        lines: 20,
        functions: 15,
        branches: 10,
      },
    },
    include: ['src/__tests__/**/*.test.ts'],
    hookTimeout: 30000,
    testTimeout: 30000,
  },
});
