import { LitElement, css, html, nothing } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import { base } from '@tau-rs/sett-tokens';
import { sessionStyles, type SessionId } from '../session.js';
import { dotStyles } from '../status.js';

export type PlanState = 'done' | 'running' | 'paused' | 'stepped-in' | 'deviation' | 'asks' | 'resolve' | 'pending';
export type SubState = 'done' | 'running' | 'pending';

const GLYPH: Record<PlanState | SubState, string> = {
  done: base.glyph.done, running: base.glyph.running, paused: base.glyph.paused, 'stepped-in': base.glyph.steppedIn,
  deviation: base.glyph.deviation, asks: base.glyph.asks, resolve: base.glyph.resolve, pending: base.glyph.pending,
};

const rowStyles = css`
  :host { display: flex; align-items: center; gap: var(--sett-space-1); height: var(--sett-space-5); box-sizing: border-box; padding: 0; font-family: var(--sett-font-mono); font-size: var(--sett-font-size-sm); color: var(--sett-color-ink2); white-space: nowrap; }
  .g { width: var(--sett-space-3); text-align: center; font-family: var(--sett-font-sans); flex: none; color: var(--sett-color-mute); }
  .g[data-state='done'] { color: var(--sett-color-ok); }
  .g[data-state='running'] { color: var(--_session); }
  .g[data-state='paused'], .g[data-state='asks'], .g[data-state='resolve'] { color: var(--sett-color-sug); }
  .g[data-state='stepped-in'] { color: var(--sett-color-sel); }
  .g[data-state='deviation'] { color: var(--sett-color-bad); }
  .name { overflow: hidden; text-overflow: ellipsis; min-width: 0; }
`;

/**
 * Pinned at the top of the left pane while a session owns the branch. Header:
 * session name in its colour, the driver, then n/m. One sett-plan-row per plan
 * element. Foot: when it started and a link to the thread.
 *
 * @slot - sett-plan-row elements
 * @slot foot - the foot text, e.g. `started 14 min ago`
 * @slot thread - the link to the thread
 * @csspart header - the header row
 */
@customElement('sett-session-card')
export class SettSessionCard extends LitElement {
  /** session name, shown in the session colour */
  @property() name = '';
  /** what drives the session, e.g. `claude code` */
  @property() driver = '';
  /** session id; unknown ids fall back to yk */
  @property({ reflect: true }) session?: SessionId;
  /** current plan element (1-based) and total */
  @property({ type: Number }) step?: number;
  @property({ type: Number }) of?: number;
  /** the session is working now: the dot pulses */
  @property({ type: Boolean, reflect: true }) running = false;
  /** force the reduced-motion rendering */
  @property({ type: Boolean, reflect: true }) still = false;

  static styles = [
    sessionStyles,
    dotStyles,
    css`
      :host {
        display: block;
        padding: var(--sett-space-2);
        border: var(--sett-stroke-hair) solid var(--sett-color-line);
        border-left: var(--sett-stroke-frame) solid var(--_session);
        border-radius: var(--sett-radius-card);
        background: var(--sett-color-paper);
        font-family: var(--sett-font-sans);
        font-size: var(--sett-font-size-md);
        color: var(--sett-color-ink);
      }
      .h { display: flex; gap: var(--sett-space-2); align-items: center; font-weight: var(--sett-font-weight-medium); margin-bottom: var(--sett-space-1); }
      .h b { color: var(--_session); font-weight: var(--sett-font-weight-medium); }
      .h .driver { color: var(--sett-color-mute); font-weight: var(--sett-font-weight-normal); }
      .h .n { margin-left: auto; font-family: var(--sett-font-mono); font-weight: var(--sett-font-weight-normal); color: var(--sett-color-ink2); font-size: var(--sett-font-size-sm); }
      .foot { margin-top: var(--sett-space-1); font-size: var(--sett-font-size-xs); color: var(--sett-color-mute); display: flex; gap: var(--sett-space-2); }
      .foot .thread { margin-left: auto; }
      ::slotted(a), .foot a { color: var(--sett-color-sel); cursor: pointer; text-decoration: none; }
    `,
  ];

  render() {
    return html`
      <div class="h" part="header">
        <span class="dot" data-kind="session" ?data-pulse=${this.running}></span>
        <b>${this.name}</b><span class="driver">${this.driver}</span>
        ${this.step != null && this.of != null ? html`<span class="n">${this.step}/${this.of}</span>` : nothing}
      </div>
      <slot></slot>
      <div class="foot"><slot name="foot"></slot><span class="thread"><slot name="thread"></slot></span></div>`;
  }
}

/**
 * One plan element: glyph, name in mono, and on the right only what the glyph
 * cannot say (asks · n, paused, deviation, resolve, you). A `resolve` element is
 * the one a conflict adds to the plan, both intents in context (spec §13.19).
 * Sub-agents go in the `sub`
 * slot and fold under the row, folded by default; the row then shows the
 * count and a glyph run.
 *
 * @slot - the element name
 * @slot sub - sett-sub-agent elements
 * @fires sett-toggle - when the sub-agent list folds or unfolds
 * @csspart row - the row itself
 * @csspart subs - the sub-agent list
 */
@customElement('sett-plan-row')
export class SettPlanRow extends LitElement {
  @property({ reflect: true }) state: PlanState = 'pending';
  /** the row the session is on now: takes the session tint */
  @property({ type: Boolean, reflect: true }) current = false;
  /** number of open asks, for the asks state */
  @property({ type: Number }) count?: number;
  /** who is on it when it is not the session, e.g. `you` */
  @property() who?: string;
  /** sub-agent list unfolded */
  @property({ type: Boolean, reflect: true }) open = false;
  @state() private subs: SubState[] = [];

  static styles = [
    sessionStyles,
    rowStyles,
    css`
      :host { display: block; height: auto; }
      .row { display: flex; align-items: center; gap: var(--sett-space-1); height: var(--sett-space-5); box-sizing: border-box; }
      :host([current]) .row { background: var(--_session-bg); margin: 0 calc(-1 * var(--sett-space-2)); padding: 0 var(--sett-space-2); color: var(--sett-color-ink); }
      .right { margin-left: auto; font-family: var(--sett-font-sans); color: var(--sett-color-ink2); flex: none; }
      .sum { margin-left: auto; display: inline-flex; gap: var(--sett-space-1); align-items: center; font-family: var(--sett-font-sans); font-size: var(--sett-font-size-xs); color: var(--sett-color-ink2); cursor: pointer; }
      .sum .mini { font-family: var(--sett-font-sans); }
      .sum .mini [data-state='done'] { color: var(--sett-color-ok); }
      .sum .mini [data-state='running'] { color: var(--_session); }
      .sum .mini [data-state='pending'] { color: var(--sett-color-mute); }
      .sum .car { width: var(--sett-space-3); text-align: center; color: var(--sett-color-mute); }
      .subs { display: none; margin-left: var(--sett-space-1); padding-left: var(--sett-space-2); border-left: var(--sett-stroke-hair) solid var(--_session-sub); }
      :host([open]) .subs { display: block; }
    `,
  ];

  private observer?: MutationObserver;
  private readSubs = () => {
    this.subs = Array.from(this.querySelectorAll(':scope > sett-sub-agent')).map((el) => (el.getAttribute('state') as SubState) || 'pending');
  };
  private onSlot() { this.readSubs(); }
  connectedCallback() {
    super.connectedCallback();
    this.readSubs();
    this.observer = new MutationObserver(this.readSubs);
    this.observer.observe(this, { childList: true, subtree: true, attributes: true, attributeFilter: ['state'] });
  }
  disconnectedCallback() {
    super.disconnectedCallback();
    this.observer?.disconnect();
  }
  private toggle() {
    this.open = !this.open;
    this.dispatchEvent(new CustomEvent('sett-toggle', { bubbles: true, composed: true, detail: { open: this.open } }));
  }

  render() {
    const right = this.state === 'asks' ? `asks ${base.glyph.sep} ${this.count ?? ''}`.trim() : this.state === 'paused' ? 'paused' : this.state === 'deviation' ? 'deviation' : this.state === 'resolve' ? 'resolve' : this.who ?? '';
    const hasSubs = this.subs.length > 0;
    return html`
      <div class="row" part="row">
        <span class="g" data-state=${this.state}>${GLYPH[this.state]}</span>
        <span class="name"><slot></slot></span>
        ${hasSubs
          ? html`<span class="sum" @click=${this.toggle} role="button" aria-expanded=${this.open}>${this.subs.length} sub
              <span class="mini">${this.subs.map((s) => html`<span data-state=${s}>${GLYPH[s]}</span>`)}</span>
              <span class="car">${this.open ? '▾' : '▸'}</span></span>`
          : right ? html`<span class="right">${right}</span>` : nothing}
      </div>
      <div class="subs" part="subs"><slot name="sub" @slotchange=${this.onSlot}></slot></div>`;
  }
}

/**
 * A sub-agent row under a plan element: glyph and name, same rhythm as the
 * plan rows, running glyph in the sub shade.
 * @slot - the sub-agent name
 */
@customElement('sett-sub-agent')
export class SettSubAgent extends LitElement {
  @property({ reflect: true }) state: SubState = 'pending';
  static styles = [
    sessionStyles,
    rowStyles,
    css`.g[data-state='running'] { color: var(--_session-sub); }`,
  ];
  render() { return html`<span class="g" data-state=${this.state}>${GLYPH[this.state]}</span><span class="name"><slot></slot></span>`; }
}

declare global {
  interface HTMLElementTagNameMap { 'sett-session-card': SettSessionCard; 'sett-plan-row': SettPlanRow; 'sett-sub-agent': SettSubAgent }
}
