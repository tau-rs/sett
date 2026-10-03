import { LitElement, css, html } from 'lit';
import { customElement, property } from 'lit/decorators.js';

/**
 * A label and a bar that fills toward a threshold: it says how far the hand
 * is from something the map does by on-screen size (a tier, the fold floor).
 * The values are the host's: `value` now, `from` where the cue starts,
 * `threshold` where the thing happens. The bar is a reading, not a motion: it
 * follows the wheel and never eases. Once the threshold is `reached` the bar
 * turns `sel`.
 *
 * @slot - the label, lowercase: `keep zooming · areas fold`
 */
@customElement('sett-cue')
export class SettCue extends LitElement {
  /** where the hand is now, in the threshold's unit (px of on-screen width, a scale) */
  @property({ type: Number }) value = 0;
  /** where the bar starts, e.g. `map.threshold.cue` */
  @property({ type: Number }) from = 0;
  /** where the bar is full */
  @property({ type: Number }) threshold = 1;
  /** the value is at or past the threshold; set by the element */
  @property({ type: Boolean, reflect: true }) reached = false;

  static styles = css`
    :host { display: inline-flex; align-items: center; gap: var(--sett-space-2); flex: none; color: var(--sett-color-ink2); font-family: var(--sett-font-sans); font-size: var(--sett-font-size-sm); white-space: nowrap; }
    .bar { flex: none; width: calc(var(--sett-space-6) * 4); height: var(--sett-stroke-frame); border-radius: var(--sett-stroke-frame); background: var(--sett-color-line); overflow: hidden; }
    .fill { height: 100%; background: var(--sett-color-ink2); }
    :host([reached]) .fill { background: var(--sett-color-sel); }
  `;

  /** how full the bar is, 0 to 1 */
  get progress(): number {
    const span = this.threshold - this.from;
    return span > 0 ? Math.min(1, Math.max(0, (this.value - this.from) / span)) : this.value >= this.threshold ? 1 : 0;
  }
  willUpdate() { this.reached = this.progress >= 1; }

  render() {
    const pct = Math.round(this.progress * 100);
    return html`<span id="l"><slot></slot></span><span class="bar" role="progressbar" aria-labelledby="l" aria-valuemin="0" aria-valuemax="100" aria-valuenow=${pct}><span class="fill" style="display:block;width:${pct}%"></span></span>`;
  }
}

declare global {
  interface HTMLElementTagNameMap { 'sett-cue': SettCue }
}
