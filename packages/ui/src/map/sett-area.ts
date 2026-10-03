import { LitElement, css, html, nothing } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import { base } from '@tau-rs/sett-tokens';
import { arrive, beatOf, durationMs, leave, presenceStyles } from './motion.js';
import '../tag/sett-tag.js';

interface Counts { count: number; findings: number; selected: number; sessions: string[]; live: string[] }
const EMPTY: Counts = { count: 0, findings: 0, selected: 0, sessions: [], live: [] };

/**
 * A module-sized group of items inside a column. The header carries what the
 * area holds: its name, how many items, a red count for findings, and one dot
 * per session with an item here. It counts its own `sett-item` children; the
 * `count`, `findings` and `sessions` attributes override that for a folded
 * area whose items the application chose not to render.
 *
 * Folded, the header also carries what the fold hides (DESIGN.md § Motion,
 * "where it lands"): a session whose live item is hidden keeps its dot
 * breathing, the area takes that agent's arrival and departure pulse, and a
 * blue count says how many selected items are inside.
 *
 * The header holds two controls: the name focuses the area, the arrow folds
 * it. The area only asks: the name fires `sett-focus` and the `sett-sheet`
 * around it sets `focused` here and `far` on what is unrelated. `far`
 * recedes by colour, never by opacity; the red count of findings stays red.
 *
 * @slot - `sett-item` children
 * @fires sett-fold - `{ folded }` when the arrow is used
 * @fires sett-focus - `{ key, focused }` when the name is used: `focused` is what the reader asks for
 * @csspart header - the header row
 * @csspart name - the name, the control that focuses the area
 * @csspart fold - the arrow, the control that folds the area
 * @csspart body - the items' container
 */
@customElement('sett-area')
export class SettArea extends LitElement {
  /** the name a `sett-link` ends on (`from` / `to`); the sheet also accepts `data-id` */
  @property({ reflect: true }) key?: string;
  @property() name = '';
  @property({ type: Boolean, reflect: true }) folded = false;
  /** the focused area: its links are drawn down to the items, everything unrelated recedes; the sheet sets it */
  @property({ type: Boolean, reflect: true }) focused = false;
  /** unrelated to the focused area: recedes to mute ink and a faint border (the name stays above 4.5:1); the sheet sets it */
  @property({ type: Boolean, reflect: true }) far = false;
  /** override: how many items, when they are not rendered */
  @property({ type: Number }) count?: number;
  /** override: how many findings, when the items are not rendered */
  @property({ type: Number }) findings?: number;
  /** override: the session ids present, space-separated, when the items are not rendered */
  @property() sessions?: string;

  @state() private seen: Counts = EMPTY;
  @state() private popping = false;
  @state() private leavingFindings = 0;
  @state() private igniting: string | null = null;
  private observer?: MutationObserver;

  static styles = [
    presenceStyles,
    css`
      :host {
        --_radius: var(--sett-map-radius-area);
        position: relative;
        display: block;
        box-sizing: border-box;
        background: var(--sett-color-paper);
        color: var(--sett-color-ink);
        border: var(--sett-stroke-hair) solid var(--sett-color-line);
        border-radius: var(--_radius);
        font-family: var(--sett-font-sans);
        font-size: var(--sett-font-size-base);
      }
      :host([focused]) { border-color: var(--sett-color-sel); }
      :host([far]) { color: var(--sett-color-mute); border-color: var(--sett-color-line2); }
      .ah {
        display: flex;
        align-items: center;
        gap: var(--sett-space-1);
        box-sizing: border-box;
        height: var(--sett-map-size-area-header);
        padding: 0 var(--sett-space-2);
        border-radius: inherit;
        white-space: nowrap;
        user-select: none;
        transition: height var(--sett-motion-fold) var(--sett-motion-ease-fold);
      }
      :host([folded]) .ah { height: var(--sett-map-size-area-folded); }
      button {
        all: unset;
        box-sizing: border-box;
        display: inline-flex;
        align-items: center;
        align-self: stretch;
        border-radius: var(--sett-map-radius-item);
        cursor: pointer;
        transition: background-color var(--sett-motion-hover) ease;
      }
      button:hover { background: var(--sett-color-well); }
      button:focus-visible { outline: var(--sett-stroke-lit) solid var(--sett-color-sel); outline-offset: calc(-1 * var(--sett-stroke-lit)); }
      .nm { min-width: 0; margin-inline-start: calc(-1 * var(--sett-space-1)); padding-inline: var(--sett-space-1); }
      :host([focused]) .nm { color: var(--sett-color-sel); }
      b { font-weight: var(--sett-font-weight-semibold); min-width: 0; overflow: hidden; text-overflow: ellipsis; }
      em { font-style: normal; font-family: var(--sett-font-mono); font-size: var(--sett-font-size-sm); color: var(--sett-color-mute); flex: 0 0 auto; font-variant-numeric: tabular-nums; }
      sett-tag, .sd, .tw { flex: 0 0 auto; }
      sett-tag.pop { animation: sett-pop var(--sett-motion-pop) var(--sett-motion-ease-out) 1; }
      .sd { width: var(--sett-space-2); height: var(--sett-space-2); border-radius: 50%; background: var(--_session); }
      .sd.live { animation: sett-badge var(--sett-motion-breath) ease-in-out infinite; animation-delay: calc(var(--sett-motion-breath) * var(--_beat, 0) / -4); }
      .sd.ignite { animation: sett-ignite var(--sett-motion-ignite) var(--sett-motion-ease-spring) 1; }
      .tw { margin-inline: auto calc(-1 * var(--sett-space-1)); padding-inline: var(--sett-space-1); color: var(--sett-color-mute); font-size: var(--sett-font-size-xs); }
      .tw span { display: inline-block; transition: transform var(--sett-motion-fold) var(--sett-motion-ease-fold); }
      :host([folded]) .tw span { transform: rotate(-90deg); }
      .body { display: grid; grid-template-rows: 1fr; transition: grid-template-rows var(--sett-motion-fold) var(--sett-motion-ease-fold); }
      :host([folded]) .body { grid-template-rows: 0fr; }
      .inner { min-height: 0; overflow: hidden; }
      .pad { padding-block: var(--sett-map-size-ring-gap); }
      ::slotted(sett-item) { margin-inline: var(--sett-space-2); }
      @media (prefers-reduced-motion: reduce) {
        .ah, button, .tw span, .body { transition: none; }
        sett-tag.pop, .sd.live, .sd.ignite { animation: none; }
      }
    `,
  ];

  connectedCallback() {
    super.connectedCallback();
    if (typeof MutationObserver === 'function') {
      this.observer = new MutationObserver((records) => this.onItems(records));
      this.observer.observe(this, { childList: true, subtree: true, attributes: true, attributeFilter: ['live', 'session', 'also', 'finding', 'selected'] });
    }
  }
  disconnectedCallback() {
    super.disconnectedCallback();
    this.observer?.disconnect();
  }
  willUpdate() { if (!this.hasUpdated) this.seen = this.read(); }

  private read(): Counts {
    const items = Array.from(this.querySelectorAll(':scope > sett-item'));
    const ids = (attr: string, only?: (i: Element) => boolean) => items.filter((i) => !only || only(i)).flatMap((i) => [i.getAttribute(attr)]).filter((v): v is string => !!v);
    const uniq = (a: string[]) => Array.from(new Set(a)).sort((x, y) => beatOf(x) - beatOf(y));
    return {
      count: items.length,
      findings: items.filter((i) => i.hasAttribute('finding')).length,
      selected: items.filter((i) => i.hasAttribute('selected')).length,
      sessions: uniq([...ids('session'), ...ids('also')]),
      live: uniq(ids('session', (i) => i.hasAttribute('live'))),
    };
  }
  private recount() {
    const next = this.read();
    const before = this.seen.findings;
    this.seen = next;
    if (this.hasUpdated && next.findings !== before) {
      if (next.findings === 0) this.leavingFindings = before;      // the count pops, then leaves
      this.popping = true;
      setTimeout(() => { this.popping = false; this.leavingFindings = 0; }, durationMs(base.motion.pop));
    }
  }

  /** an agent arriving in, or leaving, a folded area lands on the area itself: the item is hidden */
  private onItems(records: MutationRecord[]) {
    if (this.folded) {
      for (const r of records) {
        if (r.type !== 'attributes' || r.attributeName !== 'live') continue;
        const it = r.target as Element;
        const who = it.getAttribute('session') ?? undefined;
        if (it.hasAttribute('live')) {
          void arrive(this, false, who);
          this.igniting = who ?? null;
          setTimeout(() => { this.igniting = null; }, durationMs(base.motion.ignite));
        } else void leave(this, false, who);
      }
    }
    this.recount();
  }

  private toggle = () => {
    this.folded = !this.folded;
    this.dispatchEvent(new CustomEvent('sett-fold', { bubbles: true, composed: true, detail: { folded: this.folded } }));
  };
  private ask = () => {
    this.dispatchEvent(new CustomEvent('sett-focus', { bubbles: true, composed: true, detail: { key: this.key ?? this.dataset.id, focused: !this.focused } }));
  };

  render() {
    const count = this.count ?? this.seen.count;
    const findings = this.findings ?? (this.seen.findings || this.leavingFindings);
    const sessions = this.sessions ? this.sessions.split(/\s+/).filter(Boolean) : this.seen.sessions;
    return html`
      <div class="ah" part="header">
        <button class="nm" part="name" type="button" aria-pressed=${String(this.focused)} title=${this.focused ? 'leave focus' : 'focus this area'} @click=${this.ask}><b>${this.name}</b></button><em>${count}</em>
        ${findings ? html`<sett-tag kind="bad" class=${this.popping ? 'pop' : ''} title="findings">${findings}</sett-tag>` : nothing}
        ${this.folded && this.seen.selected ? html`<sett-tag kind="sel" title="selected inside">${this.seen.selected}</sett-tag>` : nothing}
        ${sessions.map((id) => html`<i class="sd ${this.igniting === id ? 'ignite' : this.folded && this.seen.live.includes(id) ? 'live' : ''}" style="--_session: var(--sett-session-${id}-main); --_beat: ${beatOf(id)}" title=${id}></i>`)}
        <button class="tw" part="fold" type="button" aria-expanded=${String(!this.folded)} aria-label=${`${this.folded ? 'open' : 'fold'} ${this.name}`} @click=${this.toggle}><span>▾</span></button>
      </div>
      <div class="body" part="body" ?inert=${this.folded}><div class="inner"><div class="pad"><slot @slotchange=${this.recount}></slot></div></div></div>`;
  }
}

declare global {
  interface HTMLElementTagNameMap { 'sett-area': SettArea }
}
