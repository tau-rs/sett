import { css } from 'lit';

/** buttons inside thread parts: grid metrics, lowercase, tokens only */
export const buttonStyles = css`
  button {
    font: inherit;
    font-size: var(--sett-font-size-md);
    line-height: var(--sett-space-4);
    padding: var(--sett-space-1) var(--sett-space-2);
    color: var(--sett-color-ink);
    background: var(--sett-color-paper);
    border: var(--sett-stroke-hair) solid var(--sett-color-line);
    border-radius: var(--sett-radius-chip);
    cursor: pointer;
    text-transform: lowercase;
    white-space: nowrap;
  }
  button:hover { background: var(--sett-color-well); }
  button:focus-visible { outline: none; box-shadow: 0 0 0 var(--sett-stroke-lit) var(--sett-color-sel); }
  button.primary { background: var(--sett-color-sel); color: var(--sett-color-paper); border-color: var(--sett-color-sel); }
  button.quiet { border-color: transparent; background: transparent; color: var(--sett-color-ink2); }
  button:disabled { opacity: var(--sett-map-faded-opacity); cursor: not-allowed; }
`;
