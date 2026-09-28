import { defineConfig } from 'vite';

export default defineConfig({
  build: {
    lib: { entry: 'src/index.ts', formats: ['es'], fileName: () => 'sett.js' },
    rollupOptions: { external: [/^lit/] },
    sourcemap: true,
    emptyOutDir: false,
  },
  test: { environment: 'happy-dom', include: ['test/**/*.test.ts'] },
});
