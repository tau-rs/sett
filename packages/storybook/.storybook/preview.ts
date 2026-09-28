import type { Preview } from '@storybook/web-components-vite';
import { setCustomElementsManifest } from '@storybook/web-components-vite';
import { withThemeByDataAttribute } from '@storybook/addon-themes';
import manifest from '@tau-rs/sett/custom-elements.json' with { type: 'json' };
import '@tau-rs/sett-tokens/sett.css';
import './preview.css';
// the stories import the sources; importing the dist bundle here too would define every sett-* element twice
import '../../ui/src/index.ts';

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
