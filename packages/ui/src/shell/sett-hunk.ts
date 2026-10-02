import { LitElement, css, html, nothing } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { sessionStyles, type SessionId } from '../session.js';
import { buttonStyles } from '../thread/buttons.js';
import '../pill/sett-pill.js';

export type HunkLineKind = 'add' | 'del' | 'ctx' | 'flag';
export type RemarkKind = 'comment' | 'change';

/**
 * One hunk of a review, or the fix card's proposed change. Header: `file:line ·
 * item · sub-agent` (the sub-agent in its session colour), then the review
 * verbs at the right: `viewed` once seen (else `v · viewed`), `r · remark`,
 * `show on map`. Lines slot in as `sett-hunk-line`; a `sett-remark` goes in
 * the `remark` slot under them. `proposed` swaps the right side for
 * `proposed · verified: …` and drops the verbs: the hunk is a proposal, not a
 * diff to review. It reports and never flips `viewed` itself.
 *
 * @slot - sett-hunk-line elements
 * @slot remark - a sett-remark under the lines
 * @fires sett-viewed - `{ viewed }`, the state asked for
 * @fires sett-remark - `r · remark` was pressed
 * @fires sett-show - `show on map` was pressed
 * @csspart header - the header row
 */
@customElement('sett-hunk')
export class SettHunk extends LitElement {
  /** where, in mono: `service.rs:22` */
  @property() file = '';
  /** the item the hunk belongs to: `pay()` */
  @property() item = '';
  /** the sub-agent that wrote it: `a3`, drawn in the session colour */
  @property() agent = '';
  @property({ reflect: true }) session?: SessionId;
  /** the file was marked viewed: the ok word replaces the button */
  @property({ type: Boolean, reflect: true }) viewed = false;
  /** the fix card's hunk: a proposal, with how it was verified */
  @property({ type: Boolean, reflect: true }) proposed = false;
  /** how the proposal was verified, after `verified:` (e.g. `check green`) */
  @property() verified = '';

  static styles = [
    sessionStyles,
    buttonStyles,
    css`
      :host { display: block; margin: var(--sett-space-2) var(--sett-space-3); border: var(--sett-stroke-hair) solid var(--sett-color-line); border-radius: var(--sett-radius-card); overflow: hidden; background: var(--sett-color-paper); font-family: var(--sett-font-sans); font-size: var(--sett-font-size-md); color: var(--sett-color-ink2); }
      .hh { display: flex; align-items: center; gap: var(--sett-space-1); padding: var(--sett-space-1) var(--sett-space-2); background: var(--sett-color-well); white-space: nowrap; }
      .file { font-family: var(--sett-font-mono); font-size: var(--sett-font-size-sm); color: var(--sett-color-ink2); }
      .agent { color: var(--_session); font-weight: var(--sett-font-weight-medium); }
      .sep { color: var(--sett-color-mute); }
      .r { margin-left: auto; display: flex; align-items: center; gap: var(--sett-space-1); flex: none; }
      .viewed { color: var(--sett-color-ok); font-size: var(--sett-font-size-sm); padding: 0 var(--sett-space-1); }
      .pr { font-size: var(--sett-font-size-sm); color: var(--sett-color-mute); }
      .pr .ok { color: var(--sett-color-ok); }
      button { font-size: var(--sett-font-size-sm); padding: 0 var(--sett-space-2); line-height: var(--sett-size-pill); }
      .lines { display: block; padding: var(--sett-space-1) 0; overflow-x: auto; }
      .lines:focus-visible { outline: var(--sett-stroke-lit) solid var(--sett-color-sel); outline-offset: calc(-1 * var(--sett-stroke-lit)); }
    `,
  ];

  private fire = (type: string, detail?: unknown) => this.dispatchEvent(new CustomEvent(type, { bubbles: true, composed: true, detail }));

  render() {
    const right = this.proposed
      ? html`<span class="pr">proposed${this.verified ? html` <span class="sep">·</span> verified: <span class="ok">${this.verified}</span>` : nothing}</span>`
      : html`${this.viewed ? html`<span class="viewed">viewed</span>` : html`<button class="v" type="button" @click=${() => this.fire('sett-viewed', { viewed: !this.viewed })}>v · viewed</button>`}<button class="rm" type="button" @click=${() => this.fire('sett-remark')}>r · remark</button><button class="show" type="button" @click=${() => this.fire('sett-show')}>show on map</button>`;
    return html`
      <div class="hh" part="header"><span class="file">${this.file}</span>${this.item ? html`<span class="sep">·</span><span class="item">${this.item}</span>` : nothing}${this.agent ? html`<span class="sep">·</span><span class="agent">${this.agent}</span>` : nothing}<span class="r">${right}</span></div>
      <div class="lines" tabindex="0"><slot></slot></div>
      <slot name="remark"></slot>`;
  }
}

const SIGN: Record<HunkLineKind, string> = { add: '+', del: '-', ctx: ' ', flag: '+' };

/**
 * One line of a hunk, mono, spaces kept. `add` on the ok tint, `del` on the
 * bad tint, `ctx` plain, `flag` on the amber tint: the line a remark points
 * at. The sign comes from the kind; the text is the code only.
 *
 * @slot - the code
 */
@customElement('sett-hunk-line')
export class SettHunkLine extends LitElement {
  @property({ reflect: true }) kind: HunkLineKind = 'ctx';
  static styles = css`
    :host { display: flex; padding: 0 var(--sett-space-2); font-family: var(--sett-font-mono); font-size: var(--sett-font-size-sm); line-height: var(--sett-font-line-height-code); color: var(--sett-color-ink); white-space: pre; }
    :host([kind='add']) { background: var(--sett-color-ok-bg); }
    :host([kind='del']) { background: var(--sett-color-bad-bg); }
    :host([kind='flag']) { background: var(--sett-color-sug-bg); }
    .s { flex: none; width: var(--sett-space-3); color: var(--sett-color-mute); }
    :host([kind='add']) .s, :host([kind='flag']) .s { color: var(--sett-color-ok); }
    :host([kind='del']) .s { color: var(--sett-color-bad); }
  `;
  render() { return html`<span class="s">${SIGN[this.kind] ?? ' '}</span><slot></slot>`; }
}

/**
 * The block under a hunk: an author line (dot and name, like a message), the
 * text, then the two exits: `ask for a change` (a plan element the session
 * realizes) and `comment · no change needed` (an observation; never blocks).
 * Once `kind` is set the verbs go: a change shows the pill `asks for a
 * change` and the element line (`E7 · realized in the session`); a comment
 * shows its plain pill. The remark reports and never sets `kind` itself.
 *
 * @slot - the remark text
 * @fires sett-remark-kind - `{ kind }`: `change` or `comment`
 */
@customElement('sett-remark')
export class SettRemark extends LitElement {
  @property() author = 'you';
  /** the line it points at, mono: `service.rs:23` */
  @property() place = '';
  @property() time = '';
  /** the exit taken; unset while the remark is being written */
  @property({ reflect: true }) kind?: RemarkKind;
  /** the plan element a change became: `E7` */
  @property() element = '';

  static styles = [
    buttonStyles,
    css`
      :host { display: block; padding: var(--sett-space-2); border-top: var(--sett-stroke-hair) dashed var(--sett-color-line); border-left: var(--sett-stroke-frame) solid var(--sett-color-sel); background: var(--sett-color-paper); font-family: var(--sett-font-sans); font-size: var(--sett-font-size-base); color: var(--sett-color-ink); line-height: var(--sett-font-line-height-ui); white-space: normal; }
      .who { display: flex; align-items: center; gap: var(--sett-space-1); font-size: var(--sett-font-size-sm); font-weight: var(--sett-font-weight-medium); color: var(--sett-color-sel); margin-bottom: var(--sett-space-1); }
      .who .d { width: var(--sett-space-2); height: var(--sett-space-2); border-radius: var(--sett-radius-chip); background: currentColor; flex: none; }
      .who .place { font-family: var(--sett-font-mono); font-weight: var(--sett-font-weight-normal); color: var(--sett-color-mute); }
      .who .t { font-weight: var(--sett-font-weight-normal); color: var(--sett-color-mute); }
      .acts { display: flex; gap: var(--sett-space-1); flex-wrap: wrap; align-items: center; margin-top: var(--sett-space-2); }
      .el { font-size: var(--sett-font-size-sm); color: var(--sett-color-ink2); }
      .el b { font-family: var(--sett-font-mono); font-weight: var(--sett-font-weight-medium); color: var(--sett-color-ink); }
    `,
  ];

  private choose = (kind: RemarkKind) => this.dispatchEvent(new CustomEvent('sett-remark-kind', { bubbles: true, composed: true, detail: { kind } }));

  render() {
    const exit = this.kind === 'change'
      ? html`<sett-pill kind="sug">asks for a change</sett-pill>${this.element ? html`<span class="el"><b>${this.element}</b> · realized in the session</span>` : nothing}`
      : this.kind === 'comment' ? html`<sett-pill>comment · no change needed</sett-pill>`
      : html`<button class="primary" type="button" @click=${() => this.choose('change')}>ask for a change</button><button class="quiet" type="button" @click=${() => this.choose('comment')}>comment · no change needed</button>`;
    return html`
      <div class="who"><span class="d"></span>${this.author}${this.place ? html`<span class="place">${this.place}</span>` : nothing}${this.time ? html`<span class="t">${this.time}</span>` : nothing}</div>
      <slot></slot>
      <div class="acts">${exit}</div>`;
  }
}

declare global {
  interface HTMLElementTagNameMap { 'sett-hunk': SettHunk; 'sett-hunk-line': SettHunkLine; 'sett-remark': SettRemark }
}
