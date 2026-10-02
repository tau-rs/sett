import { LitElement, css, html, nothing } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { scopeStyles } from '../scope.js';
import { sessionStyles, type SessionId } from '../session.js';
import { dotStyles } from '../status.js';
import type { TagKind } from '../tag/sett-tag.js';
import { clickOnEnter, hostLinkStyles, syncHostLink } from './host-link.js';
import { SettRow, letterStyles, rowStyles, type StatusLetter } from './row.js';
import { TreeKeys } from './tree.js';
import '../tag/sett-tag.js';
import '../button/sett-button.js';

/** the scope a session row names: an agent's session, your own detected work, or a plan not yet run (sug) */
export type SessionRowScope = 'session' | 'you' | 'plan';

/** the tint of a session row's state tag */
export type SessionTone = Extract<TagKind, 'sug' | 'ok' | 'session' | 'default'>;

/** a group row's words, DESIGN.md rule 7; `failed n/m` carries its count */
export const GROUP_STATES = ['done', 'running', 'gate', 'failed n/m', 'waiting'] as const;

/** the tint each group state implies, by its first word; `judge` is the gate row's state */
export const GROUP_TONE: Record<string, TagKind> = { done: 'ok', running: 'default', gate: 'sug', failed: 'bad', waiting: 'sug', judge: 'sug' };

/** the tint each sub-agent state implies */
export const AGENT_TONE: Record<string, TagKind> = { done: 'ok', writing: 'default', asks: 'sug', paused: 'default' };

const toneOf = (table: Record<string, TagKind>, state: string): TagKind => table[state.split(' ')[0]] ?? 'default';

/**
 * The Sessions view: every session, grouped by section, each unfolding into
 * groups › sub-agents › files edited, with a Changes row per session and the
 * new-session door at the end (arch spec §4). A tree with one tab stop: Up
 * and Down move, Right and Left fold, Enter focuses a session or opens a
 * file, Space selects. The view never changes its own rows: it fires, the
 * app sets `selected`, `open`, `scoped`.
 *
 * `isolated`: the view shows one focused session under a header
 * `‹ all sessions · N`, a link that gives the scope back; Esc does the same.
 * Filtering is Theia's and is not here.
 *
 * @slot - sett-view-section elements (or rows, when isolated)
 * @slot foot - the sett-new-session-row door, after the tree
 * @fires sett-unfocus - the header link or Esc: the app returns to all sessions and to main
 * @fires sett-focus - from a session row: `{ kind, name, session }`
 * @fires sett-select - from a row: `{ kind, name, session? }`
 * @fires sett-open - from a file or changes row: `{ kind, name }`
 * @fires sett-fold - from a chevron, Left or Right: `{ kind, name, open }` with the state asked for
 * @csspart header - the `‹ all sessions` line when isolated
 * @csspart tree - the rows
 */
@customElement('sett-sessions-view')
export class SettSessionsView extends LitElement {
  /** one focused session only, under the `‹ all sessions` header */
  @property({ type: Boolean, reflect: true }) isolated = false;

  /** how many sessions the header's link leads back to */
  @property() count?: string;

  private keys = new TreeKeys(this);

  static styles = css`
    :host { display: flex; flex-direction: column; min-height: 0; box-sizing: border-box; padding: var(--sett-space-1) 0; background: var(--sett-color-paper); font-family: var(--sett-font-sans); font-size: var(--sett-font-size-base); color: var(--sett-color-ink2); }
    .all { display: flex; align-items: center; gap: var(--sett-space-1); box-sizing: border-box; padding: var(--sett-space-2) var(--sett-space-3) calc(var(--sett-space-1) / 2); font-size: var(--sett-font-size-sm); color: var(--sett-color-mute); cursor: pointer; white-space: nowrap; }
    .all b { color: var(--sett-color-sel); font-weight: var(--sett-font-weight-normal); }
    .all:hover b { text-decoration: underline; }
    .all:focus-visible { outline: var(--sett-stroke-lit) solid var(--sett-color-sel); outline-offset: calc(-1 * var(--sett-stroke-lit)); }
    .all .esc { margin-left: auto; font-family: var(--sett-font-mono); }
    .tree { flex: 1; min-height: 0; overflow: auto; }
  `;

  private unfocus = () => this.dispatchEvent(new CustomEvent('sett-unfocus', { bubbles: true, composed: true }));
  private onKey = (e: KeyboardEvent) => { if (e.key === 'Escape' && this.isolated) { e.preventDefault(); this.unfocus(); } };
  private onHeaderKey = (e: KeyboardEvent) => { if (e.key === 'Enter') { e.preventDefault(); this.unfocus(); } };

  connectedCallback() {
    super.connectedCallback();
    this.addEventListener('keydown', this.onKey);
    this.keys.attach();
  }
  disconnectedCallback() {
    super.disconnectedCallback();
    this.removeEventListener('keydown', this.onKey);
    this.keys.detach();
  }
  updated() { this.keys.sync(); }

  render() {
    return html`${this.isolated
      ? html`<div class="all" part="header" role="link" tabindex="0" @click=${this.unfocus} @keydown=${this.onHeaderKey}><b>‹ all sessions</b>${this.count ? html` · ${this.count}` : nothing}<span class="esc" aria-hidden="true">esc</span></div>`
      : nothing}
      <div class="tree" part="tree" role="tree" aria-label="sessions"><slot @slotchange=${this.keys.sync}></slot></div>
      <slot name="foot"></slot>`;
  }
}

/**
 * A section of the Sessions view: a lowercase label and a count on the
 * right, then its rows. The sections are fixed: planning · yours · needs you
 * · running · in review · done.
 *
 * @slot - the rows
 */
@customElement('sett-view-section')
export class SettViewSection extends LitElement {
  /** the section's name, lowercase */
  @property() label = '';

  /** how many rows, mono at the right */
  @property() count?: string;

  static styles = css`
    :host { display: block; font-family: var(--sett-font-sans); }
    .h { display: flex; box-sizing: border-box; padding: var(--sett-space-2) var(--sett-space-3) calc(var(--sett-space-1) / 2); font-size: var(--sett-font-size-sm); color: var(--sett-color-mute); white-space: nowrap; }
    .h .n { margin-left: auto; font-family: var(--sett-font-mono); }
  `;

  connectedCallback() {
    super.connectedCallback();
    this.setAttribute('role', 'group');
  }
  updated() { this.setAttribute('aria-label', this.label); }

  render() { return html`<div class="h" aria-hidden="true">${this.label}${this.count ? html`<span class="n">${this.count}</span>` : nothing}</div><slot></slot>`; }
}

/**
 * A session row: a dot in the session's colour (or `sel` for a you session),
 * the name in semibold, and its state as a small tag at the right: `asks you`
 * (sug), `gate · group 1 → group 2` (session tint), `done` (ok), `2 remarks`
 * (default). A merged session is `dim` with `merged` as its meta. Selected,
 * it shows the Focus button, the only way its worktree becomes the scope
 * (DESIGN.md "The shell" rule 4); scoped, a `scope` tag in its tint takes the
 * button's place. The dot breathes while `running`.
 *
 * @slot - its children: sett-group-row, sett-agent-row, sett-file-row, sett-changes-row; rendered only while open
 * @fires sett-focus - the Focus button, Enter or a double click: `{ kind, name, session }`
 * @csspart row - the line
 */
@customElement('sett-session-row')
export class SettSessionRow extends SettRow {
  readonly kind = 'session' as const;

  /** an agent's session, your own detected work (dot and tint in `sel`), or a plan under planning (sug) */
  @property({ reflect: true }) scope: SessionRowScope = 'session';

  /** session id; unknown ids fall back to yk */
  @property({ reflect: true }) session?: SessionId;

  /** the state's words, lowercase */
  @property() state?: string;

  /** the state tag's tint */
  @property() tone: SessionTone = 'default';

  /** mono mute note after the name, e.g. `main · 2 files` or `merged`; hidden while selected or scoped */
  @property() meta?: string;

  /** this session's worktree is the scope: a `scope` tag instead of the Focus button */
  @property({ type: Boolean, reflect: true }) scoped = false;

  /** the session is working now: the dot breathes */
  @property({ type: Boolean, reflect: true }) running = false;

  static styles = [
    scopeStyles,
    dotStyles,
    rowStyles,
    css`
      :host { font-size: var(--sett-font-size-lg); }
      .row { height: calc(var(--sett-space-6) + var(--sett-space-1)); }
      .dot { background: var(--_scope); }
      /* the name wins the row: it only gives way past half the line; the state tag shrinks and ends in an ellipsis, its full words in its title */
      .nm { flex: 0 0 auto; max-width: 55%; font-weight: var(--sett-font-weight-semibold); color: var(--sett-color-ink); }
      .st { flex: 0 1 auto; min-width: 0; overflow: hidden; text-overflow: ellipsis; margin-left: auto; }
      .mt { flex: 0 1 auto; min-width: 0; }
      .scope, sett-button { flex: none; margin-left: auto; }
      .st ~ .mt, .st ~ .scope, .st ~ sett-button { margin-left: 0; }
    `,
  ];

  get foldable() { return true; }
  protected get detail() { return { kind: this.kind, name: this.name, session: this.session }; }

  /** a session row's Enter is Focus, never a plain open */
  activate() { this.fire('sett-focus'); }

  private onFocusButton = (e: Event) => { e.preventDefault(); e.stopPropagation(); this.activate(); };

  render() {
    return html`<div class="row" part="row">
      ${this.chevron()}
      <span class="dot" ?data-pulse=${this.running}></span>
      <span class="nm">${this.name}</span>
      ${this.state ? html`<sett-tag class="st" kind=${this.tone} session=${this.session ?? nothing} title=${this.state}>${this.state}</sett-tag>` : nothing}
      ${this.scoped
        ? html`<sett-tag class="scope" kind=${this.scope === 'you' ? 'sel' : this.scope === 'plan' ? 'sug' : 'session'} session=${this.session ?? nothing}>scope</sett-tag>`
        : this.selected
          ? html`<sett-button size="sm" @click=${this.onFocusButton} @dblclick=${this.onFocusButton}>focus</sett-button>`
          : this.meta ? html`<span class="mt">${this.meta}</span>` : nothing}
    </div>${this.kids()}`;
  }
}

/**
 * A group row: a lane of the plan with its gate, under a session. Its state
 * is one of rule 7's words, `done` · `running` · `gate` · `failed n/m` ·
 * `waiting`, with the tone each implies. `kind="gate"` is the gate itself,
 * `gate · group 1 → group 2`, with state `judge`; it has no children.
 *
 * @slot - sett-agent-row children; rendered only while open
 */
@customElement('sett-group-row')
export class SettGroupRow extends SettRow {
  readonly kind = 'group' as const;

  /** `gate`: the gate row between two groups */
  @property({ reflect: true, attribute: 'kind' }) rowKind?: 'gate';

  /** rule 7's words; `judge` on a gate row */
  @property() state?: string;

  static styles = [
    rowStyles,
    css`
      .nm { font-weight: var(--sett-font-weight-medium); color: var(--sett-color-ink); }
      :host([kind='gate']) .nm { font-weight: var(--sett-font-weight-normal); color: var(--sett-color-ink2); }
      .st { flex: none; margin-left: auto; }
    `,
  ];

  get foldable() { return this.rowKind !== 'gate'; }

  render() {
    return html`<div class="row" part="row">
      ${this.chevron()}
      <span class="nm">${this.name}</span>
      ${this.state ? html`<sett-tag class="st" kind=${toneOf(GROUP_TONE, this.state)}>${this.state}</sett-tag>` : nothing}
    </div>${this.kids()}`;
  }
}

/**
 * A sub-agent row under a group: a dot in the session's sub shade, the
 * element it is on (`a2 · PgOrderRepo: implement refund()`), its state as a
 * tag: `done` (ok) · `writing` · `asks` (sug) · `paused`. The dot is the
 * whole sub-agent idiom here: a 24 px row with a name and a state has no
 * room for the session card's glyph run.
 *
 * @slot - sett-file-row children; rendered only while open
 */
@customElement('sett-agent-row')
export class SettAgentRow extends SettRow {
  readonly kind = 'agent' as const;

  /** session id; the dot takes its sub shade */
  @property({ reflect: true }) session?: SessionId;

  /** `done` · `writing` · `asks` · `paused` */
  @property() state?: string;

  static styles = [
    sessionStyles,
    rowStyles,
    css`
      .dot { flex: none; width: var(--sett-space-2); height: var(--sett-space-2); border-radius: var(--sett-radius-chip); background: var(--_session-sub); }
      .nm { color: var(--sett-color-ink); }
      .st { flex: none; margin-left: auto; }
    `,
  ];

  get foldable() { return true; }
  protected get detail() { return { kind: this.kind, name: this.name, session: this.session }; }

  render() {
    return html`<div class="row" part="row">
      ${this.chevron()}
      <span class="dot"></span>
      <span class="nm">${this.name}</span>
      ${this.state ? html`<sett-tag class="st" kind=${toneOf(AGENT_TONE, this.state)}>${this.state}</sett-tag>` : nothing}
    </div>${this.kids()}`;
  }
}

/**
 * A file row, shared by the Sessions view, the Files view and the Changes
 * list: the status letter, the name in mono, `✓` in ok once viewed, the
 * writer and the counts (`+18 −2`) in mono mute at the right. A click
 * selects; Enter or a double click opens the file in the scope's worktree.
 *
 * @slot verb - a row-level sett-button, when the app has one
 * @fires sett-open - `{ kind: 'file', name }`
 */
@customElement('sett-file-row')
export class SettFileRow extends SettRow {
  readonly kind = 'file' as const;

  /** `M` `A` `D` `R` `?` */
  @property({ reflect: true }) letter?: StatusLetter;

  /** `+18 −2`, mono mute at the right */
  @property() counts?: string;

  /** who wrote it, mono at the right before the counts */
  @property() writer?: string;

  /** reviewed: `✓` after the name */
  @property({ type: Boolean, reflect: true }) viewed = false;

  static styles = [
    rowStyles,
    letterStyles,
    css`
      .nm { font-family: var(--sett-font-mono); font-size: var(--sett-font-size-md); color: var(--sett-color-ink); }
      .viewed { flex: none; font-size: var(--sett-font-size-sm); }
      .wr { flex: none; margin-left: auto; font-family: var(--sett-font-mono); font-size: var(--sett-font-size-sm); color: var(--sett-color-ink2); }
      .wr ~ .mt { margin-left: 0; }
      ::slotted([slot='verb']) { flex: none; }
    `,
  ];

  render() {
    return html`<div class="row" part="row">
      ${this.chevron()}
      <span class="sl" data-letter=${this.letter ?? nothing}>${this.letter ?? ''}</span>
      <span class="nm">${this.name}</span>
      ${this.viewed ? html`<span class="viewed ok" role="img" aria-label="viewed">✓</span>` : nothing}
      ${this.writer ? html`<span class="wr">${this.writer}</span>` : nothing}
      ${this.counts ? html`<span class="mt">${this.counts}</span>` : nothing}
      <slot name="verb"></slot>
    </div>`;
  }
}

/**
 * The Changes row of a session: `changes` and, at the right, what the branch
 * holds (`2 ahead · MR !42 · gated`). Enter or a double click opens the
 * Changes list.
 *
 * @fires sett-open - `{ kind: 'changes', name: 'changes' }`
 */
@customElement('sett-changes-row')
export class SettChangesRow extends SettRow {
  readonly kind = 'changes' as const;

  /** commits ahead and MR state, mono mute */
  @property() meta?: string;

  static styles = [rowStyles, css`.nm { color: var(--sett-color-ink); }`];

  connectedCallback() { super.connectedCallback(); this.name = 'changes'; }

  render() {
    return html`<div class="row" part="row">
      ${this.chevron()}
      <span class="nm">changes</span>
      ${this.meta ? html`<span class="mt">${this.meta}</span>` : nothing}
    </div>`;
  }
}

/**
 * The door at the end of the Sessions view: `+ new session · delegate`, mute,
 * the whole row a link (host-as-link, like the status items). The app opens
 * the planner on its click.
 */
@customElement('sett-new-session-row')
export class SettNewSessionRow extends LitElement {
  /** where the door leads; renders an `<a>`. Without it the host is the link and its click is the app's */
  @property() href?: string;

  static styles = [
    hostLinkStyles,
    css`
      :host { display: block; box-sizing: border-box; padding: 0 var(--sett-space-3); line-height: var(--sett-space-6); font-family: var(--sett-font-sans); font-size: var(--sett-font-size-base); color: var(--sett-color-mute); white-space: nowrap; }
      :host(:hover), a:hover { color: var(--sett-color-ink2); }
      :host(:focus-visible), a:focus-visible { outline-offset: calc(-1 * var(--sett-stroke-lit)); }
      a { display: block; }
    `,
  ];

  connectedCallback() { super.connectedCallback(); this.addEventListener('keydown', clickOnEnter); }
  disconnectedCallback() { super.disconnectedCallback(); this.removeEventListener('keydown', clickOnEnter); }
  willUpdate() { syncHostLink(this, this.href); }

  render() {
    const words = '+ new session · delegate';
    return this.href ? html`<a href=${this.href}>${words}</a>` : html`${words}`;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'sett-sessions-view': SettSessionsView; 'sett-view-section': SettViewSection; 'sett-session-row': SettSessionRow; 'sett-group-row': SettGroupRow;
    'sett-agent-row': SettAgentRow; 'sett-file-row': SettFileRow; 'sett-changes-row': SettChangesRow; 'sett-new-session-row': SettNewSessionRow;
  }
}
