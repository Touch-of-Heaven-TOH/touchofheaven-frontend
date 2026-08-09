import react from '@vitejs/plugin-react';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  resolve: { tsconfigPaths: true },
  plugins: [react()],
  test: {
    environment: 'jsdom',
    include: ['**/*.test.ts', '**/*.test.tsx'],
    exclude: ['node_modules/**', '.next/**', 'tests/e2e/**'],
    setupFiles: ['tests/setup.ts'],
    // The default forked-process pool can exceed Vitest's worker-startup
    // timeout on a slow filesystem (this repo's dev servers hit the same
    // thing - see the "Slow filesystem detected" warning `next dev` logs).
    // worker_threads start faster than forked processes; one worker avoids
    // spawning several workers that can time out concurrently on this machine.
    pool: 'threads',
    maxWorkers: 1,
    fileParallelism: false,
    testTimeout: 20_000,
  },
});
