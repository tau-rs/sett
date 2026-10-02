import { LitElement, css, html, nothing } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { scopeStyles } from '../scope.js';
import type { SessionId } from '../session.js';
import { SettRow, letterStyles, rowStyles, type StatusLetter } from './row.js';
import { TreeKeys } from './tree.js';
import '../tabs/sett-tabs.js';
import '../pill/sett-pill.js';

/** the two projections of one worktree: the tree as on disk, or the architecture */
export type Projection = 'directory' | 'layers';

/** what a tree row is: a folder or a file (directory), an area or an item (layers) */
export type TreeKind = 'folder' | 'file' | 'area' | 'item';

/** the scope a presence bar names: an agent's session, or your own work (`sel`) */
export type PresenceScope = 'session' | 'you';

/**
 * The Files view: the focused worktree in two projections, directory and
 * layers, under the scope line (arch spec §4, LEFT-3). The projection seg
 * reports and never switches itself; the filter is Theia's and sits in the
 * `tools` slot as words. When a session is the scope, its agent strip sits
 * under the scope line (LEFT-8) and `scoped` lets the rows show who writes
 * each file; the colour bar is the only presence mark otherwise (LEFT-6).
 * A tree with the keyboard of the Sessions view.
 *
 * @slot scope - a sett-scope-line
 * @slot agents - a sett-agent-strip, when a session is the scope
 * @slot tools - mute words at the right of the seg, e.g. `filter · ⌘⇧F`
 * @slot - sett-tree-row elements
 * @fires sett-projection - `{ value }` from the seg; the app sets `projection`
 * @fires sett-select - from a row: `{ kind, name }`
 * @fires sett-open - from a row's Enter or double click: `{ kind, name }`
 * @fires sett-fold - from a folder or area chevron: `{ kind, name, open }`
 * @csspart head - the scope line, the strip and the seg
 * @csspart tree - the rows
 */
@customElement('sett-files-view')
export class SettFilesView extends LitElement {
  /** which projection the rows are: the seg marks it */
  @property({ reflect: true }) projection: Projection = 'directory';

  /** a session or a you session is the scope: rows show their writer */
  @property({ type: Boolean, reflect: true }) scoped = false;

  private keys = new TreeKeys(this);

  static styles = css`
    :host { display: flex; flex-direction: column; flex: 1; min-width: 0; min-height: 0; box-sizing: border-box; background: var(--sett-color-paper); font-family: var(--sett-font-sans); font-size: var(--sett-font-size-base); color: var(--sett-color-ink2); }
    .head { display: flex; flex-direction: column; gap: var(--sett-space-2); flex: none; box-sizing: border-box; padding: var(--sett-space-2) var(--sett-space-2) var(--sett-space-2); border-bottom: var(--sett-stroke-hair) solid var(--sett-color-line2); }
    .proj { display: flex; align-items: center; gap: var(--sett-space-2); padding: 0 var(--sett-space-1); font-size: var(--sett-font-size-md); color: var(--sett-color-mute); white-space: nowrap; }
    .tools { margin-left: auto; }
    .tree { flex: 1; min-height: 0; overflow: auto; padding: var(--sett-space-1) 0; }
  `;

  /** the seg's own select is not a row's: it becomes the projection asked for */
  private onSeg = (e: Event) => {
    e.stopPropagation();
    const value = (e as CustomEvent<{ value: Projection }>).detail.value;
    this.dispatchEvent(new CustomEvent('sett-projection', { bubbles: true, composed: true, detail: { value } }));
  };

  connectedCallback() { super.connectedCallback(); this.keys.attach(); }
  disconnectedCallback() { super.disconnectedCallback(); this.keys.detach(); }
  updated(changed: Map<string, unknown>) {
    this.keys.sync();
    // the rows read `scoped` from the view: tell them when it moves
    if (changed.has('scoped')) for (const r of Array.from(this.querySelectorAll('sett-tree-row'))) (r as SettTreeRow).requestUpdate();
  }

  render() {
    return html`<div class="head" part="head">
        <slot name="scope"></slot>
        <slot name="agents"></slot>
        <div class="proj">
          <sett-seg aria-label="projection" @sett-select=${this.onSeg}>
            <sett-seg-item value="directory" ?active=${this.projection === 'directory'}>directory</sett-seg-item>
            <sett-seg-item value="layers" ?active=${this.projection === 'layers'}>layers</sett-seg-item>
          </sett-seg>
          <span class="tools"><slot name="tools"></slot></span>
        </div>
      </div>
      <div class="tree" part="tree" role="tree" aria-label="files"><slot @slotchange=${this.keys.sync}></slot></div>`;
  }
}

/**
 * The agent strip: the session's path under the scope line when a session is
 * the scope, `refund flow › group 1 › a2`, the selected agent in medium,
 * with a chevron. Open, it reveals the session's groups and sub-agents as
 * rows (the same sett-group-row and sett-agent-row as the Sessions view);
 * selecting one re-inks the tree and never changes the scope (LEFT-8). The
 * header asks to fold with `sett-fold`; the app sets `open`.
 *
 * @slot - sett-group-row and sett-agent-row elements, at their depth
 * @fires sett-fold - `{ kind: 'strip', name, open }` with the state asked for
 * @fires sett-select - from a row: `{ kind, name, session }`
 */
@customElement('sett-agent-strip')
export class SettAgentStrip extends LitElement {
  /** the session's name, first in the path */
  @property() name = '';

  /** the selected agent's group, e.g. `group 1` */
  @property() group?: string;

  /** the selected agent, e.g. `a2`, in medium */
  @property() agent?: string;

  /** rows shown */
  @property({ type: Boolean, reflect: true }) open = false;

  private keys = new TreeKeys(this);

  static styles = css`
    :host { display: block; box-sizing: border-box; border: var(--sett-stroke-hair) solid var(--sett-color-line2); border-radius: var(--sett-radius-card); overflow: hidden; font-family: var(--sett-font-sans); font-size: var(--sett-font-size-base); }
    .ah { display: flex; align-items: center; gap: var(--sett-space-1); box-sizing: border-box; width: 100%; padding: var(--sett-space-1) var(--sett-space-2); border: 0; background: var(--sett-color-well); font: inherit; color: var(--sett-color-ink2); text-align: left; white-space: nowrap; cursor: pointer; }
    .ah:focus-visible { outline: var(--sett-stroke-lit) solid var(--sett-color-sel); outline-offset: calc(-1 * var(--sett-stroke-lit)); }
    .ah b { font-weight: var(--sett-font-weight-medium); color: var(--sett-color-ink); }
    .ah i { font-style: normal; color: var(--sett-color-mute); }
    .ah .cv { margin-left: auto; color: var(--sett-color-mute); font-size: var(--sett-font-size-xs); }
    .rows { padding: var(--sett-space-1) 0; }
  `;

  private fold = () => this.dispatchEvent(new CustomEvent('sett-fold', { bubbles: true, composed: true, detail: { kind: 'strip', name: this.name, open: !this.open } }));

  connectedCallback() { super.connectedCallback(); this.keys.attach(); }
  disconnectedCallback() { super.disconnectedCallback(); this.keys.detach(); }
  updated() { this.keys.sync(); }

  render() {
    return html`<button class="ah" type="button" aria-expanded=${this.open} @click=${this.fold}>
        <span>${this.name}</span>
        ${this.group ? html`<i>›</i><span>${this.group}</span>` : nothing}
        ${this.agent ? html`<i>›</i><b>${this.agent}</b>` : nothing}
        <span class="cv" aria-hidden="true">${this.open ? '▾' : '▸'}</span>
      </button>
      ${this.open ? html`<div class="rows" role="tree" aria-label="agents"><slot @slotchange=${this.keys.sync}></slot></div>` : nothing}`;
  }
}

/**
 * A row of the Files view and of the Changes list's all-files mode: a folder
 * or a file (directory), an area or an item (layers). Folders and areas fold.
 * A file an agent is writing carries a bar in the session's colour on the
 * left edge, the only presence mark (LEFT-6); `scope="you"` gives it `sel`.
 * The writer's mono label shows only when the Files view is `scoped`. The
 * status letter marks a file changed in this worktree; `stage` is its stage's
 * words as a pill in all-files mode; `meta` is the item's file in layers, or
 * a count on a folder or area.
 *
 * @slot - child rows; rendered only while open
 * @fires sett-select - `{ kind, name }`
 * @fires sett-open - `{ kind, name }`
 * @fires sett-fold - `{ kind, name, open }`
 */
@customElement('sett-tree-row')
export class SettTreeRow extends SettRow {
  /** folder · file · area · item */
  @property({ reflect: true }) kind: TreeKind = 'file';

  /** `M` `A` `D` `R` `?`, when the file changed in this worktree */
  @property({ reflect: true }) letter?: StatusLetter;

  /** the session writing this file: a bar in its colour. Alone, it means `scope="session"` */
  @property({ reflect: true }) session?: SessionId;

  /** `you` for your own writes (a `sel` bar); `session` is implied by `session` */
  @property({ reflect: true }) scope?: PresenceScope;

  /** who writes it, mono at the right; shown only in a scoped Files view */
  @property() writer?: string;

  /** mono mute at the right: the item's file in layers, `4 items` on an area, `1 of 3` on a folder */
  @property() meta?: string;

  /** the stage's words as a pill: `not staged` · `E3` (all-files mode of the Changes list) */
  @property() stage?: string;

  static styles = [
    scopeStyles,
    rowStyles,
    letterStyles,
    css`
      :host([session]:not([scope])) { --_scope: var(--_session); }
      .row { position: relative; }
      .bar { position: absolute; left: 0; top: var(--sett-space-1); bottom: var(--sett-space-1); width: var(--sett-size-shell-presence-bar); border-radius: 0 var(--sett-radius-item) var(--sett-radius-item) 0; background: var(--_scope); }
      :host([kind='folder']) .nm, :host([kind='area']) .nm { font-weight: var(--sett-font-weight-medium); color: var(--sett-color-ink); }
      :host([kind='file']) .nm, :host([kind='item']) .nm { font-family: var(--sett-font-mono); font-size: var(--sett-font-size-md); }
      :host([session]) .nm, :host([scope]) .nm, :host([letter]) .nm, :host([selected]) .nm { color: var(--sett-color-ink); }
      :host([dim]) .nm { color: var(--sett-color-mute); }
      .wr { flex: none; margin-left: auto; font-family: var(--sett-font-mono); font-size: var(--sett-font-size-sm); color: var(--sett-color-ink2); }
      .wr ~ .mt, .wr ~ .stage, .stage ~ .mt { margin-left: 0; }
      .stage { flex: none; margin-left: auto; }
    `,
  ];

  get foldable() { return this.kind === 'folder' || this.kind === 'area'; }

  /** the writer is for a scoped view: inside a Files view it waits for `scoped`; elsewhere it is simply shown */
  private get showWriter() {
    if (!this.writer) return false;
    const view = this.closest('sett-files-view');
    return !view || view.hasAttribute('scoped');
  }

  render() {
    return html`<div class="row" part="row">
      ${this.session || this.scope ? html`<span class="bar"></span>` : nothing}
      ${this.chevron()}
      ${this.letter ? html`<span class="sl" data-letter=${this.letter}>${this.letter}</span>` : nothing}
      <span class="nm">${this.name}</span>
      ${this.showWriter ? html`<span class="wr">${this.writer}</span>` : nothing}
      ${this.stage ? html`<sett-pill class="stage">${this.stage}</sett-pill>` : nothing}
      ${this.meta ? html`<span class="mt">${this.meta}</span>` : nothing}
    </div>${this.kids()}`;
  }
}

declare global {
  interface HTMLElementTagNameMap { 'sett-files-view': SettFilesView; 'sett-agent-strip': SettAgentStrip; 'sett-tree-row': SettTreeRow }
}
