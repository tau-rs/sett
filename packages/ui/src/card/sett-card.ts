import { LitElement, css, html, nothing } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import '../tag/sett-tag.js';
import { sessionStyles, type SessionId } from '../session.js';
import { buttonStyles } from '../thread/buttons.js';

export type CardVariant = 'plain' | 'fix' | 'delta' | 'impact' | 'checklist' | 'pipeline' | 'result' | 'whatsnew';
export type RowKind = 'ok' | 'bad' | 'sug' | 'mute' | 'sel' | 'session';

/**
 * One card shape for seven uses: fix (dashed blue), plan delta (amber),
 * impact, merge checklist, pipeline, result (green), what's new. A heading
 * with a state (pill) or count (tag) on the right, an optional `sub` line
 * under it, then rows; under the rows a `how` block (the merge's how), the
 * verbs, and a `note` (the small mute line that says what happens next).
 *
 * @slot - sett-card-row and sett-kv-row elements (and a sett-pipe for the pipeline), or a sett-hunk
 * @slot title - the heading text
 * @slot state - a sett-pill (state) or sett-tag (count) at the right of the heading; the result carries two pills
 * @slot sub - the secondary line under the heading, e.g. What's new's `from: your save · a pull`
 * @slot how - the block under the rows: the merge's `squash · from the forge's default · delete branch · archive session`
 * @slot acts - buttons; the fix card, the delta, What's new and the merge checklist have them, agent door first
 * @slot note - the small mute line at the bottom: `the row moves to Done`
 * @csspart heading - the heading row
 */
@customElement('sett-card')
export class SettCard extends LitElement {
  @property({ reflect: true }) variant: CardVariant = 'plain';
  static styles = [
    buttonStyles,
    css`
      :host { display: block; border: var(--sett-stroke-hair) solid var(--sett-color-line); border-radius: var(--sett-radius-card); padding: var(--sett-space-2); background: var(--sett-color-paper); font-family: var(--sett-font-sans); font-size: var(--sett-font-size-base); color: var(--sett-color-ink); }
      :host([variant='fix']) { border-style: dashed; border-color: var(--sett-color-sel); }
      :host([variant='fix']) h5 { color: var(--sett-color-sel); }
      :host([variant='delta']) { border-color: var(--sett-color-sug); }
      :host([variant='result']) { border-color: var(--sett-color-ok); background: var(--sett-color-ok-bg); }
      :host([variant='result']) h5 { color: var(--sett-color-ok); }
      :host([variant='impact']) ::slotted(sett-card-row) { font-family: var(--sett-font-mono); font-size: var(--sett-font-size-md); }
      h5 { margin: 0 0 var(--sett-space-1); font-size: var(--sett-font-size-base); font-weight: var(--sett-font-weight-semibold); display: flex; gap: var(--sett-space-2); align-items: center; }
      h5 .r { margin-left: auto; font-weight: var(--sett-font-weight-normal); display: inline-flex; gap: var(--sett-space-1); align-items: center; }
      .sub { margin: 0 0 var(--sett-space-1); font-size: var(--sett-font-size-sm); color: var(--sett-color-mute); line-height: var(--sett-font-line-height-ui); }
      .how { margin-top: var(--sett-space-1); padding: var(--sett-space-1) var(--sett-space-2); border-radius: var(--sett-radius-item); background: var(--sett-color-well); font-size: var(--sett-font-size-md); color: var(--sett-color-ink2); line-height: var(--sett-font-line-height-ui); }
      .acts { display: flex; gap: var(--sett-space-1); margin-top: var(--sett-space-2); flex-wrap: wrap; align-items: flex-start; }
      .note { margin-top: var(--sett-space-2); font-size: var(--sett-font-size-sm); color: var(--sett-color-mute); line-height: var(--sett-font-line-height-ui); }
      ::slotted(button) { font: inherit; }
      ::slotted(sett-kv-row) { padding-left: 0; padding-right: 0; }
      ::slotted(sett-hunk) { margin: var(--sett-space-2) 0; }
    `,
  ];
  /* a block exists only when its slot has content: an empty how or note must not leave a bar */
  private observer?: MutationObserver;
  private has = (name: string) => Array.from(this.children).some((c) => c.slot === name);
  connectedCallback() {
    super.connectedCallback();
    this.observer = new MutationObserver(() => this.requestUpdate());
    this.observer.observe(this, { childList: true });
  }
  disconnectedCallback() {
    super.disconnectedCallback();
    this.observer?.disconnect();
  }
  render() {
    const block = (name: string) => (this.has(name) ? html`<div class=${name}><slot name=${name}></slot></div>` : nothing);
    return html`<h5 part="heading"><slot name="title"></slot><span class="r"><slot name="state"></slot></span></h5>${block('sub')}<slot></slot>${block('how')}${block('acts')}${block('note')}`;
  }
}

/**
 * A card row: glyph · fact · where it leads. With `place` (a spot in code) or
 * `nav` (another pane) the whole row is the link: it lights on hover and ends
 * with ›. A place is drawn as the small mono tag; a nav as a grey word. The
 * glyph takes the kind's colour; `session` with a session id draws it in
 * that session's colour (What's new's `●` for a session told at idle).
 *
 * @slot - the fact
 * @slot right - a mono note at the right when the row leads nowhere (e.g. `41 s`, `new`)
 * @fires sett-go - with `{ place }` or `{ nav }`
 */
@customElement('sett-card-row')
export class SettCardRow extends LitElement {
  /** the glyph character, from the vocabulary (✓ ✕ ⚠ · + ~ → ▸ ◦ ◆ ●), or a short count (`+1`) */
  @property() mark = '';
  /** colour of the glyph */
  @property({ reflect: true }) kind: RowKind = 'mute';
  /** session id, for `kind="session"` */
  @property({ reflect: true }) session?: SessionId;
  /** a spot in code, e.g. `service.rs:61` */
  @property() place?: string;
  /** a destination, e.g. `pipeline` */
  @property() nav?: string;
  static styles = [
    sessionStyles,
    css`
      :host { display: flex; gap: var(--sett-space-2); align-items: center; padding: var(--sett-space-1) 0; line-height: var(--sett-space-4); color: var(--sett-color-ink2); }
      :host([place]), :host([nav]) { cursor: pointer; margin: 0 calc(-1 * var(--sett-space-2)); padding: var(--sett-space-1) var(--sett-space-2); border-radius: var(--sett-radius-item); }
      :host([place]:hover), :host([nav]:hover) { background: var(--sett-color-well); }
      :host(:focus-visible) { outline: none; box-shadow: inset 0 0 0 var(--sett-stroke-lit) var(--sett-color-sel); }
      ::slotted(b) { font-weight: var(--sett-font-weight-medium); color: var(--sett-color-ink); }
      .g { min-width: var(--sett-space-3); text-align: center; flex: none; font-weight: var(--sett-font-weight-semibold); }
      :host([kind='ok']) .g { color: var(--sett-color-ok); }
      :host([kind='bad']) .g { color: var(--sett-color-bad); }
      :host([kind='sug']) .g { color: var(--sett-color-sug); }
      :host([kind='sel']) .g { color: var(--sett-color-sel); }
      :host([kind='mute']) .g { color: var(--sett-color-mute); }
      :host([kind='session']) .g { color: var(--_session); }
      .fact { min-width: 0; }
      .end { margin-left: auto; display: inline-flex; align-items: center; gap: var(--sett-space-1); flex: none; white-space: nowrap; }
      .nav { color: var(--sett-color-mute); }
      .chev { color: var(--sett-color-mute); }
      ::slotted([slot='right']) { margin-left: auto; font-family: var(--sett-font-mono); font-size: var(--sett-font-size-sm); color: var(--sett-color-mute); white-space: nowrap; }
    `,
  ];
  private go() {
    if (!this.place && !this.nav) return;
    this.dispatchEvent(new CustomEvent('sett-go', { bubbles: true, composed: true, detail: this.place ? { place: this.place } : { nav: this.nav } }));
  }
  connectedCallback() {
    super.connectedCallback();
    this.addEventListener('click', this.go);
    if (this.place || this.nav) { this.setAttribute('role', 'link'); this.tabIndex = 0; }
  }
  render() {
    const end = this.place ? html`<span class="end"><sett-tag mono>${this.place}</sett-tag><span class="chev">›</span></span>`
      : this.nav ? html`<span class="end"><span class="nav">${this.nav}</span><span class="chev">›</span></span>` : nothing;
    return html`<span class="g">${this.mark}</span><span class="fact"><slot></slot></span><slot name="right"></slot>${end}`;
  }
}

/**
 * A key · value row of an inspector layout (the pages' `kv`): a mute label in
 * a fixed column, the value after it. `mono` sets the value in the mono face
 * for sites and files. The `right` slot holds a link at the end of the value
 * (`pick hunks`). Inside a sett-card the side padding goes.
 *
 * @slot - the value
 * @slot right - a word or link at the right end of the value
 */
@customElement('sett-kv-row')
export class SettKvRow extends LitElement {
  /** the key, lowercase: `site`, `rule`, `fix`, `files`, `checks`, `then` */
  @property() label = '';
  /** the value in the mono face */
  @property({ type: Boolean, reflect: true }) mono = false;
  /** the value's colour: sug for a line that needs you (`behind`) */
  @property({ reflect: true }) tone?: 'sug' | 'bad' | 'ok';
  static styles = css`
    :host { display: grid; grid-template-columns: calc(var(--sett-space-6) * 3.5) minmax(0, 1fr); gap: var(--sett-space-1) var(--sett-space-2); padding: var(--sett-space-1) var(--sett-space-3); font-family: var(--sett-font-sans); font-size: var(--sett-font-size-lg); line-height: var(--sett-font-line-height-ui); color: var(--sett-color-ink); }
    .k { color: var(--sett-color-mute); }
    .v { display: flex; align-items: baseline; gap: var(--sett-space-2); min-width: 0; }
    .v .t { min-width: 0; }
    :host([mono]) .v .t { font-family: var(--sett-font-mono); font-size: var(--sett-font-size-md); }
    :host([tone='sug']) .v { color: var(--sett-color-sug); }
    :host([tone='bad']) .v { color: var(--sett-color-bad); }
    :host([tone='ok']) .v { color: var(--sett-color-ok); }
    ::slotted([slot='right']) { margin-left: auto; flex: none; white-space: nowrap; }
    ::slotted(a) { color: var(--sett-color-sel); cursor: pointer; text-decoration: none; }
  `;
  render() { return html`<span class="k">${this.label}</span><span class="v"><span class="t"><slot></slot></span><slot name="right"></slot></span>`; }
}

/** The pipeline bar: one segment per step. `steps` is a comma list of ok | bad | run | pending. */
@customElement('sett-pipe')
export class SettPipe extends LitElement {
  @property() steps = '';
  static styles = css`
    :host { display: flex; gap: var(--sett-space-1); margin: var(--sett-space-1) 0; }
    span { flex: 1; height: var(--sett-space-1); border-radius: var(--sett-radius-item); background: var(--sett-color-well); }
    span[data-s='ok'] { background: var(--sett-color-ok); }
    span[data-s='bad'] { background: var(--sett-color-bad); }
    span[data-s='run'] { background: var(--sett-color-sug); }
  `;
  render() { return html`${this.steps.split(',').map((s) => s.trim()).filter(Boolean).map((s) => html`<span data-s=${s}></span>`)}`; }
}

declare global {
  interface HTMLElementTagNameMap { 'sett-card': SettCard; 'sett-card-row': SettCardRow; 'sett-kv-row': SettKvRow; 'sett-pipe': SettPipe }
}
