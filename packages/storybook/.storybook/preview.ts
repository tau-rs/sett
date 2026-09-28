import type { Preview } from '@storybook/web-components-vite';
import { setCustomElementsManifest } from '@storybook/web-components-vite';
import { withThemeByDataAttribute } from '@storybook/addon-themes';
import manifest from '@tau-rs/sett/custom-elements.json' with { type: 'json' };
import '@tau-rs/sett-tokens/sett.css';
import './preview.css';
import '@tau-rs/sett';

setCustomElementsManifest(manifest);

const preview: Preview = {
  decorators: [
    withThemeByDataAttribute({
      themes: { light: 'light', dark: 'dark' },
      defaultTheme: 'light',
      attributeName: 'data-theme',
      parentSelector: 'html',
    }),
  ],
  parameters: {
    backgrounds: { disable: true },
    controls: { expanded: true },
  },
};
export default preview;
