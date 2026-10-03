import { LitElement, css, html, nothing, unsafeCSS } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import { base } from '@tau-rs/sett-tokens';
import { sessionOrder, sessionStyles, type SessionId } from '../session.js';
import { arrive, beatStyles, durationMs, flash, leave, presenceStyles } from './motion.js';
import '../tag/sett-tag.js';

/** where an item stands against main, for the delta overlay */
export type ItemDelta = 'added' | 'changed' | 'removed' | 'unchanged';
export type ItemKind = 'fn' | 'struct' | 'enum' | 'trait' | 'impl' | 'mod' | 'macro' | 'external';
export const ITEM_KINDS: ItemKind[] = ['fn', 'struct', 'enum', 'trait', 'impl', 'mod', 'macro', 'external'];

/**
 * One function, struct or trait inside an area: an 18 px box in a 22 px row,
 * its name in mono at the base size. The name never moves, fades or resizes;
 * everything else is drawn around or behind it (DESIGN.md § Motion):
 * the item's own colour, an agent's sheen, your selection tight to the box,
 * the session ring one step out, a change flash past everything.
 *
 * `session` alone is a thin still ring: an agent touched this earlier. With
 * `live` the ring breathes and a sheen sweeps: an agent is here now. When
 * `live` flips, the item plays its own arrival or departure pulse. `lit`
 * is the response to a pointer on one of its links: a blue border. `far`
 * is an item unrelated to the focused area: it recedes by colour, never by
 * opacity, so its name stays readable; a finding never recedes.
 *
 * @slot - the item's name
 * @fires sett-select - `{ kind }` on click, Enter or Space
 * @csspart ring - the session ring
 */
@customElement('sett-item')
export class SettItem extends LitElement {
  /** the name a `sett-link` ends on (`from` / `to`); the sheet also accepts `data-id` */
  @property({ reflect: true }) key?: string;
  @property({ reflect: true }) kind: ItemKind = 'fn';
  /** a family count shown as a pill at the end, e.g. `214 impls` */
  @property() family?: string;
  /** links the analyser could not resolve (dyn, spawn), folded to one pill with their count (rule 6) */
  @property({ type: Number }) unresolved?: number;
  /** the session that touched or is working on this item; the ring takes its colour */
  @property({ reflect: true }) session?: SessionId;
  /** a second session on the same item: the one ring is split in their two colours, never stacked */
  @property({ reflect: true }) also?: SessionId;
  /** the session is working here right now: the ring breathes and a sheen sweeps */
  @property({ type: Boolean, reflect: true }) live = false;
  /** called from outside the unit: blue fill */
  @property({ type: Boolean, reflect: true }) entry = false;
  /** a trait the domain depends on: amber pill shape */
  @property({ type: Boolean, reflect: true }) port = false;
  /** a rule is broken here: dashed red */
  @property({ type: Boolean, reflect: true }) finding = false;
  /** the plan overlay: the plan will add or change this item, nothing is written yet: dashed amber on the amber tint (rule 12) */
  @property({ type: Boolean, reflect: true }) planned = false;
  /** the plan group the item belongs to, shown as a plain tag at the end (`g1`) */
  @property() group?: string;
  /** the delta overlay, against main: `unchanged` recedes, `removed` is a dashed ghost with its name struck, `added` and `changed` are drawn as they are */
  @property({ reflect: true }) delta?: ItemDelta;
  @property({ type: Boolean, reflect: true }) selected = false;
  /** at the other end of a link being pointed at: blue border, with the link (DESIGN.md § Motion, response) */
  @property({ type: Boolean, reflect: true }) lit = false;
  /** unrelated to the focused area: recedes to mute ink and a faint border (the name stays above 4.5:1); a finding ignores it */
  @property({ type: Boolean, reflect: true }) far = false;

  @state() private kick = false;
  @state() private cooling = false;

  static styles = [
    sessionStyles,
    beatStyles,
    presenceStyles,
    css`
      ${unsafeCSS(sessionOrder.map((id) => `:host([also="${id}"]) { --_also: var(--sett-session-${id}-main); }`).join('\n'))}
      :host {
        --_radius: var(--sett-map-radius-item);
        position: relative;
        display: flex;
        align-items: center;
        gap: var(--sett-space-1);
        box-sizing: border-box;
        height: var(--sett-map-size-item);
        margin-block: calc((var(--sett-map-size-item-row) - var(--sett-map-size-item)) / 2);
        padding: 0 var(--sett-space-2);
        border: var(--sett-stroke-hair) solid var(--sett-color-line);
        border-radius: var(--_radius);
        background: var(--sett-color-paper);
        color: var(--sett-color-ink);
        font-family: var(--sett-font-mono);
        font-size: var(--sett-font-size-base);
        white-space: nowrap;
        cursor: pointer;
        user-select: none;
        transition: border-color var(--sett-motion-hover) ease, background-color var(--sett-motion-fold) ease, box-shadow var(--sett-motion-hover) ease;
      }
      :host(:hover) { border-color: var(--sett-color-ink2); }
      :host([lit]) { border-color: var(--sett-color-sel); }
      :host(:focus-visible) { outline: var(--sett-stroke-lit) solid var(--sett-color-sel); outline-offset: var(--sett-stroke-hair); }
      :host([kind='trait']) { font-weight: var(--sett-font-weight-medium); }
      :host([kind='external']) { background: var(--sett-map-status-external-bg); border-color: var(--sett-map-status-external-border); }
      :host([entry]) { background: var(--sett-map-status-entry-bg); border-color: var(--sett-map-status-entry-border); }
      :host([port]) { --_radius: var(--sett-map-radius-pill); background: var(--sett-map-status-port-bg); border-color: var(--sett-map-status-port-border); }
      /* the delta overlay recedes by colour, never by opacity: the name stays above 4.5:1 */
      :host([delta='unchanged']) { color: var(--sett-color-mute); border-color: var(--sett-color-line2); }
      :host([delta='removed']) { color: var(--sett-color-mute); background: transparent; border-color: var(--sett-color-line); border-style: dashed; }
      :host([delta='removed']) .t { text-decoration: line-through; }
      /* the plan overlay is a fill; a finding outranks it, the selection keeps its line */
      :host([planned]) { background: var(--sett-color-sug-bg); border-color: var(--sett-color-sug); border-style: dashed; }
      :host([finding]) { background: var(--sett-map-status-finding-bg); border-color: var(--sett-map-status-finding-border); border-style: dashed; }
      :host([far]:not([finding]):not([selected])) { color: var(--sett-color-mute); border-color: var(--sett-color-line2); }
      :host([far]:not([finding]):not([selected]):hover) { border-color: var(--sett-color-ink2); }
      :host([far][lit]:not([finding]):not([selected])) { border-color: var(--sett-color-sel); }
      :host([selected]) { border-color: var(--sett-color-sel); border-style: solid; box-shadow: 0 0 0 var(--sett-stroke-hair) var(--sett-color-sel); }
      .t { position: relative; z-index: 1; flex: 1 1 auto; min-width: 0; overflow: hidden; text-overflow: ellipsis; }
      sett-tag { position: relative; z-index: 1; flex: 0 0 auto; }

      /* the session ring: one step outside the box, so the item's own border stays readable */
      .ring {
        position: absolute;
        inset: calc(-1 * (var(--sett-map-size-ring-gap) + var(--sett-stroke-hair)));
        border: var(--sett-stroke-hair) solid var(--_session);
        border-radius: calc(var(--_radius) + var(--sett-map-size-ring-gap));
        opacity: var(--sett-map-presence-touched);
        pointer-events: none;
      }
      .ring.live {
        border-width: var(--sett-stroke-lit);
        opacity: 1;
        animation: sett-breathe var(--sett-motion-breath) ease-in-out infinite;
        animation-delay: calc(var(--sett-motion-breath) * var(--_beat, 0) / -4);
      }
      .ring.cool { animation: sett-cool var(--sett-motion-cool) ease-out 1; }
      :host([also]) .ring {
        border: 0;
        padding: var(--sett-stroke-lit);
        background: linear-gradient(90deg, var(--_session) 0 50%, var(--_also) 50% 100%);
        -webkit-mask: linear-gradient(black 0 0) content-box, linear-gradient(black 0 0);
        -webkit-mask-composite: xor;
        mask: linear-gradient(black 0 0) content-box exclude, linear-gradient(black 0 0);
      }
      /* the sheen sweeps behind the name; the item's own fill stays visible around it */
      .sheen {
        position: absolute;
        inset: 0;
        border-radius: inherit;
        pointer-events: none;
        background: linear-gradient(100deg, transparent 0%, transparent 38%, color-mix(in srgb, var(--_session) calc(var(--sett-map-presence-sheen) * 100%), transparent) 50%, transparent 62%, transparent 100%);
        background-size: 300% 100%;
        animation: sett-sheen var(--sett-motion-breath) ease-in-out infinite;
        animation-delay: calc(var(--sett-motion-breath) * var(--_beat, 0) / -4);
      }
      .sheen.kick { animation: sett-kick var(--sett-motion-kick) var(--sett-motion-ease-out) 1; }
      @media (prefers-reduced-motion: reduce) {
        :host { transition: none; }
        .ring.live, .ring.cool { animation: none; }
        .sheen { display: none; }
      }
    `,
  ];

  connectedCallback() {
    super.connectedCallback();
    if (!this.hasAttribute('role')) this.setAttribute('role', 'button');
    if (!this.hasAttribute('tabindex')) this.tabIndex = 0;
    this.addEventListener('click', this.select);
    this.addEventListener('keydown', this.onKey);
  }
  disconnectedCallback() {
    super.disconnectedCallback();
    this.removeEventListener('click', this.select);
    this.removeEventListener('keydown', this.onKey);
  }

  private select = () => {
    this.dispatchEvent(new CustomEvent('sett-select', { bubbles: true, composed: true, detail: { kind: this.kind } }));
  };
  private onKey = (e: KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); this.select(); }
  };
  /** hidden inside a folded area: the area's header carries the agent's mark instead */
  private get hiddenByFold(): boolean {
    return !!this.closest('sett-area[folded]');
  }

  /** a change: one ring flashes outward, once. Call it when the agent edits this item. */
  flash(): Promise<void> {
    return this.hiddenByFold ? Promise.resolve() : flash(this);
  }

  updated(changed: Map<string, unknown>) {
    if (changed.has('selected')) this.setAttribute('aria-pressed', String(this.selected));
    if (!changed.has('live') || changed.get('live') === undefined) return;
    const seen = !this.hiddenByFold;
    if (this.live) {
      if (seen) void arrive(this);
      this.kick = true;
      setTimeout(() => { this.kick = false; }, durationMs(base.motion.kick));
    } else {
      if (seen) void leave(this);
      this.cooling = true;
      setTimeout(() => { this.cooling = false; }, durationMs(base.motion.cool));
    }
  }

  render() {
    return html`
      ${this.session ? html`<i class="ring ${this.live ? 'live' : ''} ${this.cooling ? 'cool' : ''}" part="ring"></i>` : nothing}
      ${this.session && this.live ? html`<i class="sheen ${this.kick ? 'kick' : ''}"></i>` : nothing}
      <span class="t"><slot></slot></span>
      ${this.family ? html`<sett-tag kind="sug">${this.family}</sett-tag>` : nothing}
      ${this.unresolved ? html`<sett-tag kind="sug" title="unresolved links">${this.unresolved} unresolved</sett-tag>` : nothing}
      ${this.group ? html`<sett-tag class="group" title="plan group">${this.group}</sett-tag>` : nothing}`;
  }
}

declare global {
  interface HTMLElementTagNameMap { 'sett-item': SettItem }
}
