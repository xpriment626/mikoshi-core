import { defineConfig } from 'vitest/config';
import { resolve } from 'path';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    setupFiles: ['./test/setup.ts'],
    include: [
      'packages/*/src/**/*.{test,spec}.{ts,tsx}',
      'packages/*/test/**/*.{test,spec}.{ts,tsx}',
      'apps/*/src/**/*.{test,spec}.{ts,tsx}',
      'apps/*/test/**/*.{test,spec}.{ts,tsx}'
    ],
    exclude: [
      'node_modules',
      'dist',
      'build',
      '.next',
      'coverage',
      '**/*.e2e.{test,spec}.{ts,tsx}'
    ],
    coverage: {
      enabled: true,
      provider: 'v8',
      reporter: ['text', 'json', 'html', 'lcov'],
      reportsDirectory: './coverage',
      all: true,
      include: [
        'packages/*/src/**/*.{ts,tsx}',
        'apps/*/src/**/*.{ts,tsx}'
      ],
      exclude: [
        '**/*.{test,spec}.{ts,tsx}',
        '**/*.d.ts',
        '**/index.ts',
        '**/*.config.{ts,js}',
        '**/node_modules/**',
        '**/dist/**',
        '**/build/**',
        '**/coverage/**',
        '**/.next/**',
        '**/test/**'
      ],
      thresholds: {
        branches: 80,
        functions: 80,
        lines: 80,
        statements: 80
      },
      clean: true,
      cleanOnRerun: true
    },
    testTimeout: 10000,
    hookTimeout: 10000,
    teardownTimeout: 10000,
    isolate: true,
    threads: true,
    mockReset: true,
    restoreMocks: true,
    clearMocks: true
  },
  resolve: {
    alias: {
      '@mikoshi/core': resolve(__dirname, './packages/core/src'),
      '@mikoshi/types': resolve(__dirname, './packages/types/src'),
      '@mikoshi/test-utils': resolve(__dirname, './packages/test-utils/src'),
      '@mikoshi/shared': resolve(__dirname, './packages/shared/src')
    }
  }
});