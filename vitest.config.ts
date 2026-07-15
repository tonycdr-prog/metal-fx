import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'jsdom',
    include: ['src/**/*.test.{ts,tsx}', 'demo/**/*.test.{ts,tsx}', 'tests/package/**/*.test.ts'],
    setupFiles: ['tests/setup.ts']
  }
});
