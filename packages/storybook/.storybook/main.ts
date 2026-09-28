import type { StorybookConfig } from '@storybook/web-components-vite';

const config: StorybookConfig = {
  stories: ['../../ui/src/**/*.stories.ts', '../docs/**/*.mdx'],
  addons: ['@storybook/addon-docs', '@storybook/addon-themes', '@storybook/addon-a11y', '@storybook/addon-vitest'],
  framework: { name: '@storybook/web-components-vite', options: {} },
  core: { disableTelemetry: true },
};
export default config;
