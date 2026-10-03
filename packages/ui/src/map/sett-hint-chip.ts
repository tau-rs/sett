import { LitElement, css, html, nothing } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import { base } from '@tau-rs/sett-tokens';
import { arrive, beatOf, durationMs, leave, presenceStyles } from './motion.js';
import type { HintSide } from './hints.js';

const list = { fromAttribute: (v: string | null) => (v ?? '').split(/\s+/).filter(Boolean), toAttribute: (v: string[]) => v.join(' ') };
const names = { fromAttribute: (v: string | null) => (v ?? '').split(',').map((s) => s.trim()).filter(Boolean), toAttribute: (v: string[]) => v.join(', ') };

/**
 * The pill on the window's border for a neighbour that is off-screen
 * (DESIGN.md rule 2). It stands for one unit, or for several merged when
 * their pills would touch: then a double border and `n neighbours · ` the
 * first two names. Where it goes is `placeHints` (`hints.ts`): the app sets
 * `left`/`top` to its anchor and the pill hangs from it by its `side`. It is
 * gone the moment its unit is seen. It stands in for its units on the board: the
 * `sett-edge`s to them end on it (#56).
 *
 * When an agent works in an off-screen unit, the pill is the nearest thing
 * you can see (DESIGN.md § Motion, where it lands): its session dot breathes
 * here, and a session arriving plays the pulse (`arrive`).
 *
 * @fires sett-light - `{ on, keys }` when pointed at; the app lights its edges
 * @csspart pill - the pill
 */
@customElement('sett-hint-chip')
export class SettHintChip extends LitElement {
  /** the keys of the units it stands for, space-separated */
  @property({ converter: list, reflect: true }) keys: string[] = [];
  /** their names, comma-separated, in the order of `keys` */
  @property({ converter: names }) names: string[] = [];
  /** the border it sits on; its edges reach it from the other side */
  @property({ reflect: true }) side: HintSide = 'right';
  /** pointed at, or one of its edges is: blue */
  @property({ type: Boolean, reflect: true }) lit = false;
  /** the sessions with an agent in its units, space-separated ids, one dot each */
  @property() sessions = '';
  /** the sessions working there right now: their dots breathe; a change plays the pulse */
  @property() live = '';

  @state() private igniting: string[] = [];
  private pointed = false;
  private parent: Element | null = null;

  static styles = [presenceStyles, css`
    :host {
      --_radius: var(--sett-map-radius-hint);
      display: inline-block; position: absolute; box-sizing: border-box; z-index: 2;
      font-family: var(--sett-font-sans); font-size: var(--sett-font-size-base); line-height: var(--sett-font-line-height-ui);
      user-select: none;
    }
    /* the app puts left/top on the middle of the pill's outer edge (placeHints' anchor); the pill hangs from it */
    :host([side='right']) { transform: translate(-100%, -50%); }
    :host([side='left']) { transform: translate(0, -50%); }
    :host([side='top']) { transform: translate(-50%, 0); }
    :host([side='bottom']) { transform: translate(-50%, -100%); }
    .pill {
      display: flex; align-items: center; gap: var(--sett-space-2); box-sizing: border-box;
      height: calc(2 * var(--sett-map-radius-hint)); padding: 0 var(--sett-space-3);
      border-radius: var(--sett-map-radius-hint); background: var(--sett-color-paper); color: var(--sett-color-ink);
      border: var(--sett-stroke-hair) solid var(--sett-color-line); white-space: nowrap; cursor: pointer;
      font-weight: var(--sett-font-weight-medium);
    }
    .pill.group { border: calc(3 * var(--sett-stroke-hair)) double var(--sett-color-line); }
    .more { color: var(--sett-color-ink2); font-weight: var(--sett-font-weight-normal); }
    :host([lit]) .pill { border-color: var(--sett-color-sel); box-shadow: 0 0 0 var(--sett-stroke-hair) var(--sett-color-sel); }
    :host([lit]) .pill.group { box-shadow: none; }
    .pill:focus-visible { outline: var(--sett-stroke-lit) solid var(--sett-color-sel); outline-offset: var(--sett-stroke-lit); }
    .sd { flex: 0 0 auto; width: var(--sett-space-2); height: var(--sett-space-2); border-radius: 50%; background: var(--_session); }
    .sd.live { animation: sett-badge var(--sett-motion-breath) ease-in-out infinite; animation-delay: calc(var(--sett-motion-breath) * var(--_beat, 0) / -4); }
    .sd.ignite { animation: sett-ignite var(--sett-motion-ignite) var(--sett-motion-ease-spring) 1; }
    @media (prefers-reduced-motion: reduce) { .sd.live, .sd.ignite { animation: none; } }
  `];

  private ids(v: string): string[] {
    return Array.from(new Set(v.split(/\s+/).filter(Boolean))).sort((a, b) => beatOf(a) - beatOf(b));
  }

  /** before the render, so the igniting dot and the pulse land in the same frame; the pill is always the nearest visible thing */
  willUpdate(changed: Map<string, unknown>) {
    if (!changed.has('live') || changed.get('live') === undefined) return;
    const before = this.ids(changed.get('live') as string), now = this.ids(this.live);
    const came = now.filter((id) => !before.includes(id)), went = before.filter((id) => !now.includes(id));
    if (came.length) {
      void arrive(this, false, came[0]);
      this.igniting = [...this.igniting, ...came];
      setTimeout(() => { this.igniting = this.igniting.filter((id) => !came.includes(id)); }, durationMs(base.motion.ignite));
    }
    if (went.length) void leave(this, false, went[0]);
  }

  connectedCallback() {
    super.connectedCallback();
    this.parent = this.parentElement;
  }
  /** a pill goes the moment its unit is seen, often under the pointer: the light goes out from where it was */
  disconnectedCallback() {
    super.disconnectedCallback();
    if (this.pointed) { this.pointed = false; this.parent?.dispatchEvent(new CustomEvent('sett-light', { bubbles: true, composed: true, detail: { on: false, keys: this.keys } })); }
  }

  private point(on: boolean) {
    this.pointed = on;
    this.dispatchEvent(new CustomEvent('sett-light', { bubbles: true, composed: true, detail: { on, keys: this.keys } }));
  }

  render() {
    const group = this.keys.length > 1, live = this.ids(this.live);
    const shown = this.names.length ? this.names : this.keys;
    const where = { left: 'to the left', right: 'to the right', top: 'above', bottom: 'below' }[this.side] ?? '';
    const label = group ? `${this.keys.length} neighbours off-screen ${where}: ${shown.join(', ')}` : `${shown[0] ?? ''}, off-screen ${where}`;
    return html`<div part="pill" class="pill ${group ? 'group' : ''}" role="button" tabindex="0" aria-label=${label} title=${label}
        @pointerenter=${() => this.point(true)} @pointerleave=${() => this.point(false)} @focus=${() => this.point(true)} @blur=${() => this.point(false)}>
      ${this.ids(this.sessions).map((id) => html`<i class="sd ${this.igniting.includes(id) ? 'ignite' : live.includes(id) ? 'live' : ''}" style="--_session: var(--sett-session-${id}-main); --_beat: ${beatOf(id)}"></i>`)}
      ${group ? html`<span>${this.keys.length} neighbours</span><span class="more">· ${shown.slice(0, 2).join(', ')}</span>` : html`<span>${shown[0] ?? nothing}</span>`}
    </div>`;
  }
}

declare global {
  interface HTMLElementTagNameMap { 'sett-hint-chip': SettHintChip }
}
