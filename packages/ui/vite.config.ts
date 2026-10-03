import { defineConfig } from 'vite';

export default defineConfig({
  build: {
    // two entries: the elements, and the sample datasets kept out of them (@tau-rs/sett/fixtures)
    lib: { entry: { sett: 'src/index.ts', fixtures: 'src/fixtures.ts' }, formats: ['es'], fileName: (_format, name) => `${name}.js` },
    rollupOptions: { external: [/^lit/] },
    sourcemap: true,
    emptyOutDir: false,
  },
  test: { environment: 'happy-dom', include: ['test/**/*.test.ts'] },
});
