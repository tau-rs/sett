import { css } from 'lit';

/** the fill of a count badge: amber needs you, red blocks; none is the quiet well */
export type BadgeTone = 'sug' | 'bad';

/**
 * The count badge: a small rounded count on a solid fill, on the activity
 * rail's items and the bottom panel's tabs. The text on an accent fill is
 * `paper`, which reaches 4.5:1 on `sug` and `bad` in both themes (white does
 * not in dark). Counts are mono. Never animates.
 */
export const badgeStyles = css`
  .badge {
    flex: none;
    box-sizing: border-box;
    min-width: var(--sett-size-tag);
    padding: 0 var(--sett-space-1);
    border-radius: var(--sett-radius-pill);
    font-family: var(--sett-font-mono);
    font-size: var(--sett-font-size-xs);
    font-weight: var(--sett-font-weight-medium);
    line-height: var(--sett-size-tag);
    text-align: center;
    background: var(--sett-color-well);
    color: var(--sett-color-ink2);
  }
  .badge[data-tone='sug'] { background: var(--sett-color-sug); color: var(--sett-color-paper); }
  .badge[data-tone='bad'] { background: var(--sett-color-bad); color: var(--sett-color-paper); }
`;
