import { defineConfig } from 'vitest/config';
import { playwright } from '@vitest/browser-playwright';
import { storybookTest } from '@storybook/addon-vitest/vitest-plugin';

// Every story is a test, and runs once per theme: the a11y checks (contrast included) must
// pass on light and on dark. Each project pins the addon-themes toolbar global for its run.
const themes = ['light', 'dark'] as const;

export default defineConfig({
  test: {
    onConsoleLog: (log) => !log.includes('Lit is in dev mode'),
    projects: [
      // the static build, loaded in a real browser the way a reader gets it (test/smoke.test.ts)
      { test: { name: 'smoke', include: ['test/smoke.test.ts'], environment: 'node' } },
      ...themes.map((theme) => ({
        plugins: [storybookTest({ configDir: '.storybook', initialGlobals: { theme } })],
        test: {
          name: `storybook · ${theme}`,
          browser: { enabled: true, headless: true, provider: playwright(), instances: [{ browser: 'chromium' }] },
        },
      })),
    ],
  },
});
