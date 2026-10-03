import { LitElement, css, html } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { base } from '@tau-rs/sett-tokens';
import { durationMs } from './motion.js';

/**
 * The map's own panel, docked on the right edge of the map's pane (map rule 8:
 * chrome docks, nothing floats over the drawing). It is not the shell's
 * inspector: the inspector is about the selection, the panel is about where
 * you are on the map, and it goes away with the map tab.
 *
 * Its first row is the status line, the place of the toast sett does not
 * have: set `status` and the row takes the well tint and says it; the panel
 * clears it after `map.statusHold`, or at the next action (a click or a key
 * inside the panel, or the host calling `clear()` for an action on the map).
 * The row keeps its height when empty, so nothing under it moves, and it
 * never animates.
 *
 * @slot - the panel's sections, top down: a sett-position, then whatever the map needs
 * @slot foot - held at the bottom, outside the scroll: the sett-minimap, when the map exceeds the viewport
 * @fires sett-status-clear - the status line was cleared, by the hold or by an action
 * @csspart status - the status line
 * @csspart body - the scrolling body
 */
@customElement('sett-panel')
export class SettPanel extends LitElement {
  /** the transient message of the status line; empty is no message */
  @property() status = '';

  static styles = css`
    :host {
      display: flex;
      flex-direction: column;
      flex: none;
      box-sizing: border-box;
      width: var(--sett-map-size-panel);
      min-height: 0;
      border-left: var(--sett-stroke-hair) solid var(--sett-color-line2);
      background: var(--sett-color-paper);
      color: var(--sett-color-ink);
      font-family: var(--sett-font-sans);
      font-size: var(--sett-font-size-base);
    }
    .st { display: flex; align-items: center; flex: none; box-sizing: border-box; height: var(--sett-map-size-tabs); padding: 0 var(--sett-space-3); border-bottom: var(--sett-stroke-hair) solid var(--sett-color-line2); white-space: nowrap; }
    .st.on { background: var(--sett-color-well); }
    .st span { min-width: 0; overflow: hidden; text-overflow: ellipsis; }
    .body { display: flex; flex-direction: column; flex: 1; min-height: 0; overflow: auto; }
    .body:focus-visible { outline: var(--sett-stroke-lit) solid var(--sett-color-sel); outline-offset: calc(-1 * var(--sett-stroke-lit)); }
    .foot { flex: none; }
  `;

  private timer?: ReturnType<typeof setTimeout>;
  private onAction = () => this.clear();

  /** clear the status line now: the host calls it at the next action on the map */
  clear() {
    clearTimeout(this.timer);
    if (!this.status) return;
    this.status = '';
    this.dispatchEvent(new CustomEvent('sett-status-clear', { bubbles: true, composed: true }));
  }

  connectedCallback() {
    super.connectedCallback();
    // capture: an action in the panel clears the old message before its own handler says a new one
    this.addEventListener('click', this.onAction, true);
    this.addEventListener('keydown', this.onAction, true);
  }
  disconnectedCallback() {
    super.disconnectedCallback();
    this.removeEventListener('click', this.onAction, true);
    this.removeEventListener('keydown', this.onAction, true);
    clearTimeout(this.timer);
  }
  willUpdate(changed: Map<string, unknown>) {
    if (!changed.has('status')) return;
    clearTimeout(this.timer);
    if (this.status) this.timer = setTimeout(() => this.clear(), durationMs(base.map.statusHold));
  }

  render() {
    return html`
      <div class="st ${this.status ? 'on' : ''}" part="status" role="status"><span>${this.status}</span></div>
      <div class="body" part="body" tabindex="0"><slot></slot></div>
      <div class="foot"><slot name="foot"></slot></div>`;
  }
}

declare global {
  interface HTMLElementTagNameMap { 'sett-panel': SettPanel }
}
