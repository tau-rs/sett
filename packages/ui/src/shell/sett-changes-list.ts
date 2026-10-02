import { LitElement, css, html, nothing } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { SettRow, rowStyles } from './row.js';
import { TreeKeys } from './tree.js';
import '../tabs/sett-tabs.js';
import '../tag/sett-tag.js';

/** the two shapes of one list: by stage, or the whole worktree with the changed files marked */
export type ChangesMode = 'changed' | 'all';

/** what a header line opens */
export type ChangesWhat = 'mr' | 'plan';

/**
 * The Changes list of a session, laid out like Magit's status buffer (the
 * sessions wireflow): the branch's state in a header card, then one section
 * per stage, top to bottom, not staged · next commit · commits ahead. A file
 * is in exactly one section. `all` is the other shape of the same list: the
 * whole worktree as a tree with the changed files marked and their stage as
 * a pill. The consumer passes stages or tree rows; the list transforms
 * nothing. The mode seg reports and never switches itself; so does the
 * full-paths toggle at its right (`flat`, one setting for the whole list,
 * remembered per session). The stage verbs (stage, unstage, commit) are the
 * app's and live in the right pane.
 *
 * @slot header - a sett-changes-header
 * @slot - sett-stage sections (changed), or sett-tree-row rows (all)
 * @fires sett-mode - `{ value }` from the seg; the app sets `mode`
 * @fires sett-flat - `{ flat }` from the toggle, the state asked for; the app sets `flat` here and on the stages
 * @fires sett-select - from a row
 * @fires sett-open - from a row's Enter or double click, or a header line `{ what }`
 * @fires sett-fold - from a folder or commit chevron
 * @csspart tree - the sections or rows
 */
@customElement('sett-changes-list')
export class SettChangesList extends LitElement {
  /** which shape the rows are: the seg marks it */
  @property({ reflect: true }) mode: ChangesMode = 'changed';

  /** the stages list full paths instead of folders: the toggle is pressed */
  @property({ type: Boolean, reflect: true }) flat = false;

  private keys = new TreeKeys(this);

  static styles = css`
    :host { display: flex; flex-direction: column; flex: 1; min-width: 0; min-height: 0; box-sizing: border-box; background: var(--sett-color-paper); font-family: var(--sett-font-sans); font-size: var(--sett-font-size-base); color: var(--sett-color-ink2); }
    .head { display: flex; flex-direction: column; gap: var(--sett-space-2); flex: none; box-sizing: border-box; padding: var(--sett-space-2); border-bottom: var(--sett-stroke-hair) solid var(--sett-color-line2); }
    .modes { display: flex; align-items: center; gap: var(--sett-space-2); padding: 0 var(--sett-space-1); }
    .flat { margin-left: auto; font: inherit; padding: 0 var(--sett-space-1); border: 0; border-radius: var(--sett-radius-item); background: none; color: var(--sett-color-mute); cursor: pointer; }
    .flat:hover, .flat[aria-pressed='true'] { color: var(--sett-color-ink); }
    .flat:focus-visible { outline: var(--sett-stroke-lit) solid var(--sett-color-sel); }
    .tree { flex: 1; min-height: 0; overflow: auto; padding: var(--sett-space-1) 0; }
  `;

  private onSeg = (e: Event) => {
    e.stopPropagation();
    const value = (e as CustomEvent<{ value: ChangesMode }>).detail.value;
    this.dispatchEvent(new CustomEvent('sett-mode', { bubbles: true, composed: true, detail: { value } }));
  };
  private flip = () => this.dispatchEvent(new CustomEvent('sett-flat', { bubbles: true, composed: true, detail: { flat: !this.flat } }));

  connectedCallback() { super.connectedCallback(); this.keys.attach(); }
  disconnectedCallback() { super.disconnectedCallback(); this.keys.detach(); }
  updated() { this.keys.sync(); }

  render() {
    return html`<div class="head">
        <slot name="header"></slot>
        <div class="modes">
          <sett-seg aria-label="mode" @sett-select=${this.onSeg}>
            <sett-seg-item value="changed" ?active=${this.mode === 'changed'}>changed</sett-seg-item>
            <sett-seg-item value="all" ?active=${this.mode === 'all'}>all files</sett-seg-item>
          </sett-seg>
          ${this.mode === 'changed' ? html`<button class="flat" type="button" aria-pressed=${this.flat} aria-label="full paths" title="full paths" @click=${this.flip}>☰</button>` : nothing}
        </div>
      </div>
      <div class="tree" part="tree" role="tree" aria-label="changes"><slot @slotchange=${this.keys.sync}></slot></div>`;
  }
}

/**
 * The header card of the Changes list: the branch in mono and its worktree,
 * ahead and behind, when it was last rebased, then the MR row (`MR !42 ·
 * checks ✓ · merge gated`) and the plan row (`plan · 5 elements · group 2 of
 * 2`), each a row that is the link to what it names, ending in `›` (DESIGN.md
 * rule 10). The verbs sit under them in the `verbs` slot: the app decides
 * which, agent door first where there is a pair.
 *
 * @slot verbs - sett-button elements: open MR · rebase · review so far
 * @fires sett-open - `{ what: 'mr' | 'plan' }` from a row
 */
@customElement('sett-changes-header')
export class SettChangesHeader extends LitElement {
  /** the branch name, mono */
  @property() branch = '';

  /** the worktree, mono mute after the branch, e.g. `w1` */
  @property() worktree?: string;

  /** commits ahead of main */
  @property() ahead?: string;

  /** commits behind main */
  @property() behind?: string;

  /** `rebased 2 h ago` */
  @property() rebased?: string;

  /** the MR row's words, e.g. `MR !42 · checks ✓ · merge gated` */
  @property() mr?: string;

  /** the plan row's words, e.g. `plan · 5 elements · group 2 of 2` */
  @property() plan?: string;

  static styles = css`
    :host { display: block; box-sizing: border-box; border: var(--sett-stroke-hair) solid var(--sett-color-line2); border-radius: var(--sett-radius-card); background: var(--sett-color-paper); font-family: var(--sett-font-sans); font-size: var(--sett-font-size-base); color: var(--sett-color-ink2); }
    .line { display: flex; align-items: center; gap: var(--sett-space-2); box-sizing: border-box; min-height: var(--sett-space-6); padding: 0 var(--sett-space-2); white-space: nowrap; }
    .line + .line { border-top: var(--sett-stroke-hair) solid var(--sett-color-line2); }
    .branch { font-family: var(--sett-font-mono); font-weight: var(--sett-font-weight-medium); color: var(--sett-color-ink); min-width: 0; overflow: hidden; text-overflow: ellipsis; }
    .mt { margin-left: auto; font-family: var(--sett-font-mono); font-size: var(--sett-font-size-sm); color: var(--sett-color-mute); }
    .git { font-family: var(--sett-font-mono); font-size: var(--sett-font-size-sm); color: var(--sett-color-ink2); }
    .link { cursor: pointer; }
    .link .w { min-width: 0; overflow: hidden; text-overflow: ellipsis; }
    .link .go { margin-left: auto; color: var(--sett-color-mute); }
    .link:hover { color: var(--sett-color-ink); }
    .link:hover .go { color: var(--sett-color-ink); }
    .link:focus-visible { outline: var(--sett-stroke-lit) solid var(--sett-color-sel); outline-offset: calc(-1 * var(--sett-stroke-lit)); }
    .verbs { display: flex; flex-wrap: wrap; gap: var(--sett-space-1); padding: var(--sett-space-1) var(--sett-space-2); }
    .verbs:not(:has(*)) { display: none; }
  `;

  private open(what: ChangesWhat) {
    this.dispatchEvent(new CustomEvent('sett-open', { bubbles: true, composed: true, detail: { what } }));
  }
  private onKey(e: KeyboardEvent, what: ChangesWhat) { if (e.key === 'Enter') { e.preventDefault(); this.open(what); } }
  private link(what: ChangesWhat, words: string) {
    return html`<div class="line link" role="link" tabindex="0" data-what=${what} @click=${() => this.open(what)} @keydown=${(e: KeyboardEvent) => this.onKey(e, what)}><span class="w">${words}</span><span class="go" aria-hidden="true">›</span></div>`;
  }

  render() {
    const git = [this.ahead != null ? `${this.ahead} ahead` : '', this.behind != null ? `${this.behind} behind` : '', this.rebased ?? ''].filter(Boolean).join(' · ');
    return html`<div class="line"><span class="branch">${this.branch}</span>${this.worktree ? html`<span class="mt">${this.worktree}</span>` : nothing}</div>
      ${git ? html`<div class="line git">${git}</div>` : nothing}
      ${this.mr ? this.link('mr', this.mr) : nothing}
      ${this.plan ? this.link('plan', this.plan) : nothing}
      <div class="verbs"><slot name="verbs"></slot></div>`;
  }
}

/**
 * One stage of the Changes list: `not staged` · `next commit · E3` ·
 * `commits ahead`, with its count. Rows sit under their folders
 * (sett-tree-row, then sett-file-row); `flat` says the rows are full paths
 * instead (the toggle that asks for it is the list's: a button inside the
 * tree would not pass the a11y gate). In review, `progress` (`3 of 7
 * viewed`) sits at the right.
 *
 * @slot - sett-tree-row folders with sett-file-row rows, or sett-commit-row rows
 */
@customElement('sett-stage')
export class SettStage extends LitElement {
  /** the stage's words, lowercase */
  @property() label = '';

  /** how many rows, mono at the right */
  @property() count?: string;

  /** rows are full paths, not folders */
  @property({ type: Boolean, reflect: true }) flat = false;

  /** review progress, e.g. `3 of 7 viewed` */
  @property() progress?: string;

  static styles = css`
    :host { display: block; font-family: var(--sett-font-sans); }
    .h { display: flex; align-items: center; gap: var(--sett-space-2); box-sizing: border-box; padding: var(--sett-space-2) var(--sett-space-3) calc(var(--sett-space-1) / 2); font-size: var(--sett-font-size-sm); color: var(--sett-color-mute); white-space: nowrap; }
    .h .r { margin-left: auto; display: inline-flex; align-items: center; gap: var(--sett-space-2); font-family: var(--sett-font-mono); }
    .h .ok { color: var(--sett-color-ok); }
  `;

  connectedCallback() { super.connectedCallback(); this.setAttribute('role', 'group'); }
  updated() { this.setAttribute('aria-label', this.label); }

  render() {
    return html`<div class="h"><span aria-hidden="true">${this.label}</span>
        <span class="r">${this.progress ? html`<span class="ok">${this.progress}</span>` : nothing}${this.count ? html`<span aria-hidden="true">${this.count}</span>` : nothing}</span>
      </div><slot></slot>`;
  }
}

/**
 * A commit ahead of main: its sha in mono, its message, the element it
 * realises (`E3`), the writer, and the gate it passed (`gate ✓`, ok). It
 * expands in place to its files (sett-file-row). Enter or a double click
 * opens it in the inspector.
 *
 * @slot - sett-file-row children; rendered only while open
 * @fires sett-open - `{ kind: 'commit', name, sha }`
 * @fires sett-fold - `{ kind: 'commit', name, sha, open }`
 */
@customElement('sett-commit-row')
export class SettCommitRow extends SettRow {
  readonly kind = 'commit' as const;

  /** the short sha, 7 chars, mono */
  @property() sha = '';

  /** the plan element the commit realises, e.g. `E3` */
  @property() element?: string;

  /** who wrote it, mono at the right */
  @property() writer?: string;

  /** the gate it passed: `gate ✓` reads ok; any other words are plain */
  @property() gate?: string;

  static styles = [
    rowStyles,
    css`
      .sha { flex: none; font-family: var(--sett-font-mono); font-size: var(--sett-font-size-sm); color: var(--sett-color-mute); }
      .nm { color: var(--sett-color-ink); }
      .el { flex: none; }
      .r { flex: none; margin-left: auto; display: inline-flex; align-items: center; gap: var(--sett-space-2); font-size: var(--sett-font-size-sm); color: var(--sett-color-ink2); }
      .wr { font-family: var(--sett-font-mono); }
      .gate[data-ok] { color: var(--sett-color-ok); }
    `,
  ];

  get foldable() { return true; }
  protected get detail() { return { kind: this.kind, name: this.name, sha: this.sha }; }

  render() {
    return html`<div class="row" part="row">
      ${this.chevron()}
      <span class="sha">${this.sha}</span>
      <span class="nm">${this.name}</span>
      ${this.element ? html`<sett-tag class="el" mono>${this.element}</sett-tag>` : nothing}
      ${this.writer || this.gate ? html`<span class="r">${this.writer ? html`<span class="wr">${this.writer}</span>` : nothing}${this.gate ? html`<span class="gate" ?data-ok=${this.gate.endsWith('✓')}>${this.gate}</span>` : nothing}</span>` : nothing}
    </div>${this.kids()}`;
  }
}

declare global {
  interface HTMLElementTagNameMap { 'sett-changes-list': SettChangesList; 'sett-changes-header': SettChangesHeader; 'sett-stage': SettStage; 'sett-commit-row': SettCommitRow }
}
