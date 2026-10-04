import { LitElement, css, html, nothing } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { SettRow, rowStyles } from './row.js';
import { ROW_TAGS, TreeKeys } from './tree.js';

/** a rule's level, in the words of the panel's Findings table: it blocks, or it warns */
export type FindingLevel = 'blocks' | 'warns';

/**
 * The Findings view: the scope's findings grouped by rule, for navigating
 * while reading code (arch spec §4, arch-design#40). Under the scope line, a
 * count line (`2 · 1 block`), then a rule row per rule with its findings
 * under it. Only what the scope introduced, the same set as the panel's
 * Findings tab, which stays the full table. The view computes nothing: the
 * app orders the rules (blocking first), writes the counts, and answers a
 * finding row's `sett-select` by moving the Map to it with the findings
 * overlay and the fix card. With nothing in it, the body is a sett-empty.
 * A tree with the keyboard of the Sessions view.
 *
 * @slot scope - a sett-scope-line
 * @slot - sett-rule-row elements, blocking rules first; or a sett-empty
 * @fires sett-select - from a row: `{ kind, name }`; a finding adds `{ rule, at }`
 * @fires sett-open - from a row's Enter or double click, the same detail
 * @fires sett-fold - from a rule's chevron, Left or Right: `{ kind, name, open }` with the state asked for
 * @csspart head - the scope line and the count line
 * @csspart tree - the rows
 */
@customElement('sett-findings-view')
export class SettFindingsView extends LitElement {
  /** how many findings the scope introduced, first on the count line */
  @property() count?: string;

  /** how many of them block: `· 1 block` after the count, left out at 0 */
  @property() blocks?: string;

  private keys = new TreeKeys(this);

  static styles = css`
    :host { display: flex; flex-direction: column; flex: 1; min-width: 0; min-height: 0; box-sizing: border-box; background: var(--sett-color-paper); font-family: var(--sett-font-sans); font-size: var(--sett-font-size-base); color: var(--sett-color-ink2); }
    .head { display: flex; flex-direction: column; gap: var(--sett-space-2); flex: none; box-sizing: border-box; padding: var(--sett-space-2); border-bottom: var(--sett-stroke-hair) solid var(--sett-color-line2); }
    .count { padding: 0 var(--sett-space-1); font-size: var(--sett-font-size-md); color: var(--sett-color-mute); white-space: nowrap; }
    .tree { flex: 1; min-height: 0; overflow: auto; padding: var(--sett-space-1) 0; }
  `;

  /** the body holds rules, not only an empty state: a tree with nothing in it is not one */
  private get hasRows() { return !!this.querySelector(`:scope > :is(${ROW_TAGS})`); }
  private onSlot = () => { this.requestUpdate(); this.keys.sync(); };

  connectedCallback() { super.connectedCallback(); this.keys.attach(); }
  disconnectedCallback() { super.disconnectedCallback(); this.keys.detach(); }
  updated() { this.keys.sync(); }

  render() {
    const tree = this.hasRows;
    const blocks = this.blocks && this.blocks !== '0' ? ` · ${this.blocks} block` : '';
    return html`<div class="head" part="head">
        <slot name="scope"></slot>
        ${this.count ? html`<div class="count">${this.count}${blocks}</div>` : nothing}
      </div>
      <div class="tree" part="tree" role=${tree ? 'tree' : nothing} aria-label=${tree ? 'findings' : nothing}><slot @slotchange=${this.onSlot}></slot></div>`;
  }
}

/**
 * A rule row of the Findings view: the rule's name in medium, then at the
 * right its count (mono, mute) and the finding glyph `⚠` in its level's
 * colour, `bad` when it blocks, `sug` when it warns. It folds to its
 * findings with the chevron; the app sets `open`.
 *
 * @slot - sett-finding-row children; rendered only while open
 * @fires sett-select - `{ kind: 'rule', name }`
 * @fires sett-open - `{ kind: 'rule', name }`
 * @fires sett-fold - `{ kind: 'rule', name, open }`
 */
@customElement('sett-rule-row')
export class SettRuleRow extends SettRow {
  readonly kind = 'rule' as const;

  /** blocks (`bad`) or warns (`sug`): the glyph's colour, and its spoken word */
  @property({ reflect: true }) level: FindingLevel = 'warns';

  /** how many findings break the rule in this scope */
  @property() count?: string;

  static styles = [
    rowStyles,
    css`
      .nm { font-weight: var(--sett-font-weight-medium); color: var(--sett-color-ink); }
      .lv { flex: none; width: var(--sett-space-3); text-align: center; color: var(--sett-color-sug); }
      :host([level='blocks']) .lv { color: var(--sett-color-bad); }
      :host([selected]) .lv { color: var(--sett-color-ink); }
    `,
  ];

  get foldable() { return true; }

  render() {
    return html`<div class="row" part="row">
      ${this.chevron()}
      <span class="nm">${this.name}</span>
      ${this.count ? html`<span class="mt">${this.count}</span>` : nothing}
      <span class="lv" role="img" aria-label=${this.level}>⚠</span>
    </div>${this.kids()}`;
  }
}

/**
 * A finding row, under its rule: what breaks it, a link (`Order →
 * PaymentsHttp`) or an item, on the first line, and where, the witness's
 * `file:line` in mono mute, on the second. Selecting it is the app's cue to
 * move the Map to the finding and show the fix card.
 *
 * @fires sett-select - `{ kind: 'finding', name, rule, at }`
 * @fires sett-open - `{ kind: 'finding', name, rule, at }`
 */
@customElement('sett-finding-row')
export class SettFindingRow extends SettRow {
  readonly kind = 'finding' as const;

  /** the witness, `file:line`, e.g. `order.rs:41` */
  @property() at?: string;

  static styles = [
    rowStyles,
    css`
      .row { flex-direction: column; align-items: stretch; gap: 0; height: auto; padding-top: var(--sett-space-1); padding-bottom: var(--sett-space-1); padding-left: calc(var(--sett-space-3) * (1 + var(--_depth, 0)) + var(--sett-space-2)); line-height: var(--sett-space-4); }
      .nm { color: var(--sett-color-ink); }
      .at { overflow: hidden; text-overflow: ellipsis; font-family: var(--sett-font-mono); font-size: var(--sett-font-size-sm); color: var(--sett-color-mute); }
    `,
  ];

  /** the rule it breaks is the row it sits under: the app needs both to find it */
  protected get detail() {
    return { ...super.detail, rule: this.closest('sett-rule-row')?.name, at: this.at };
  }

  render() {
    return html`<div class="row" part="row">
      <span class="nm">${this.name}</span>
      ${this.at ? html`<span class="at">${this.at}</span>` : nothing}
    </div>`;
  }
}

declare global {
  interface HTMLElementTagNameMap { 'sett-findings-view': SettFindingsView; 'sett-rule-row': SettRuleRow; 'sett-finding-row': SettFindingRow }
}
