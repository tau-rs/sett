import { LitElement, css, html, nothing } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { badgeStyles, type BadgeTone } from '../badge.js';
import { clickOnEnter, hostLinkStyles, syncHostLink } from './host-link.js';

/**
 * The bottom panel, under the centre: it lists what already exists, Findings ·
 * Checks · Terminal · What's new, nothing else (DESIGN.md "The shell" rule 7).
 * Open, it shows the body of the `active` tab; `closed`, it is a strip of its
 * tabs with their counts. It reports and never changes `active` or `closed`
 * itself; it only marks which of its tabs is the open one.
 *
 * @slot tabs - sett-panel-tab elements
 * @slot act - the right end of the strip, e.g. the terminal's worktree name
 * @slot findings - the body of the Findings tab (a sett-panel-table, or an empty state). A body's slot is its tab's value; only the active one is shown
 * @slot checks - the body of the Checks tab (a sett-panel-table, then a sett-panel-output)
 * @slot terminal - the body of the Terminal tab
 * @slot whatsnew - the body of the What's new tab (sett-panel-line elements)
 * @fires sett-select - `{ value }` from a tab that was chosen (choosing a tab implies open)
 * @fires sett-toggle - `{ closed }` from the caret: the state asked for
 * @csspart strip - the row of tabs
 * @csspart body - the open tab's body
 */
@customElement('sett-bottom-panel')
export class SettBottomPanel extends LitElement {
  /** the value of the open tab */
  @property({ reflect: true }) active = '';

  /** only the strip of tabs and counts is shown */
  @property({ type: Boolean, reflect: true }) closed = false;

  static styles = css`
    :host {
      display: flex;
      flex-direction: column;
      box-sizing: border-box;
      min-height: 0;
      background: var(--sett-color-paper);
      border-top: var(--sett-stroke-hair) solid var(--sett-color-line);
      color: var(--sett-color-ink);
      font-family: var(--sett-font-sans);
      font-size: var(--sett-font-size-base);
    }
    .strip {
      display: flex;
      align-items: stretch;
      flex: none;
      box-sizing: border-box;
      height: var(--sett-size-shell-strip);
      background: var(--sett-color-well);
      color: var(--sett-color-ink2);
    }
    :host(:not([closed])) .strip { border-bottom: var(--sett-stroke-hair) solid var(--sett-color-line2); }
    .tabs { display: contents; }
    .sp { flex: 1; }
    .act { display: flex; align-items: center; gap: var(--sett-space-2); color: var(--sett-color-mute); font-size: var(--sett-font-size-sm); white-space: nowrap; }
    .caret { font: inherit; padding: 0 var(--sett-space-3); border: 0; background: none; color: var(--sett-color-mute); cursor: pointer; }
    .caret:hover { color: var(--sett-color-ink); }
    .caret:focus-visible, .body:focus-visible { outline: var(--sett-stroke-lit) solid var(--sett-color-sel); outline-offset: calc(-1 * var(--sett-stroke-lit)); }
    .body { flex: 1; min-height: 0; overflow: auto; font-size: var(--sett-font-size-lg); }
  `;

  /** the open tab is the selected one; closed, none is */
  private mark = () => {
    for (const tab of Array.from(this.children)) if (tab instanceof SettPanelTab) tab.active = !this.closed && tab.value === this.active;
  };
  private toggle() {
    this.dispatchEvent(new CustomEvent('sett-toggle', { bubbles: true, composed: true, detail: { closed: !this.closed } }));
  }
  updated() { this.mark(); }

  render() {
    const open = !this.closed && this.active !== '';
    return html`
      <div class="strip" part="strip">
        <div class="tabs" role="tablist"><slot name="tabs" @slotchange=${this.mark}></slot></div>
        <span class="sp"></span>
        <span class="act"><slot name="act"></slot></span>
        <button class="caret" type="button" aria-expanded=${!this.closed} aria-label=${this.closed ? 'open the panel' : 'close the panel'} @click=${this.toggle}>${this.closed ? '▴' : '▾'}</button>
      </div>
      ${open ? html`<div class="body" part="body" role="tabpanel" tabindex="0" aria-label=${this.active}><slot name=${this.active}></slot></div>` : nothing}`;
  }
}

/**
 * A tab of the bottom panel: a name and a count. The count stays when the
 * panel is closed. Active: paper, ink, medium, a top bar in `sel`, like
 * `sett-tab`. The panel sets `active` from its own `active` and `closed`.
 *
 * @slot - the name
 * @fires sett-select - `{ value }` when the tab is chosen
 */
@customElement('sett-panel-tab')
export class SettPanelTab extends LitElement {
  @property() value = '';
  @property({ type: Boolean, reflect: true }) active = false;

  /** a count after the name; no attribute, no badge */
  @property() count?: string;

  /** the count's fill: bad (blocking), sug (needs you); none is the quiet well */
  @property({ reflect: true }) tone?: BadgeTone;

  static styles = [
    badgeStyles,
    css`
      :host { display: flex; align-items: center; gap: var(--sett-space-2); padding: 0 var(--sett-space-3); border-right: var(--sett-stroke-hair) solid var(--sett-color-line2); color: var(--sett-color-ink2); cursor: pointer; white-space: nowrap; user-select: none; }
      :host(:hover) { color: var(--sett-color-ink); }
      :host([active]) { background: var(--sett-color-paper); color: var(--sett-color-ink); font-weight: var(--sett-font-weight-medium); box-shadow: inset 0 var(--sett-stroke-lit) 0 var(--sett-color-sel); }
      :host(:focus-visible) { outline: none; box-shadow: inset 0 0 0 var(--sett-stroke-lit) var(--sett-color-sel); }
    `,
  ];

  private select = () => this.dispatchEvent(new CustomEvent('sett-select', { bubbles: true, composed: true, detail: { value: this.value } }));
  private onKey = (e: KeyboardEvent) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); this.click(); } };

  connectedCallback() {
    super.connectedCallback();
    this.setAttribute('role', 'tab');
    this.tabIndex = 0;
    this.addEventListener('click', this.select);
    this.addEventListener('keydown', this.onKey);
  }
  disconnectedCallback() {
    super.disconnectedCallback();
    this.removeEventListener('click', this.select);
    this.removeEventListener('keydown', this.onKey);
  }
  updated() { this.setAttribute('aria-selected', String(this.active)); }

  render() {
    return html`<slot></slot>${this.count ? html`<span class="badge" data-tone=${this.tone ?? nothing}>${this.count}</span>` : nothing}`;
  }
}

export type PanelTableKind = 'findings' | 'checks';
export type PanelRowLevel = 'bad' | 'sug' | 'ok' | 'mute';

/** the header of each kind: what the leading dot says, then the four columns */
const HEADERS: Record<PanelTableKind, [string, string[]]> = {
  findings: ['level', ['finding', 'rule', 'witness', 'origin']],
  checks: ['state', ['check', 'where', 'result', 'when']],
};

/**
 * The table of the Findings and Checks tabs: a header row, then
 * `sett-panel-row` children on the same column grid. Every finding and every
 * check names its origin or its place (DESIGN.md "The shell" rule 7).
 *
 * @slot - sett-panel-row elements
 */
@customElement('sett-panel-table')
export class SettPanelTable extends LitElement {
  /** findings: dot · finding · rule · witness · origin; checks: dot · check · where · result · when */
  @property({ reflect: true }) kind: PanelTableKind = 'findings';

  static styles = css`
    :host {
      --_cols: var(--sett-space-3) minmax(0, 2fr) minmax(0, 1.4fr) calc(var(--sett-space-5) * 5.5) calc(var(--sett-space-5) * 4.5);
      display: block;
      font-family: var(--sett-font-sans);
      font-size: var(--sett-font-size-lg);
    }
    :host([kind='checks']) { --_cols: var(--sett-space-3) minmax(0, 1.6fr) minmax(0, 1.6fr) calc(var(--sett-space-5) * 6) calc(var(--sett-space-5) * 4); }
    .head {
      display: grid;
      grid-template-columns: var(--_cols);
      gap: 0 var(--sett-space-3);
      align-items: center;
      box-sizing: border-box;
      height: calc(var(--sett-size-shell-row) - var(--sett-space-1));
      padding: 0 var(--sett-space-3);
      border-bottom: var(--sett-stroke-hair) solid var(--sett-color-line2);
      font-size: var(--sett-font-size-xs);
      color: var(--sett-color-mute);
      white-space: nowrap;
    }
    /* the dot column's header is read, not shown */
    .vh { position: absolute; width: var(--sett-stroke-hair); height: var(--sett-stroke-hair); overflow: hidden; clip-path: inset(50%); }
  `;

  connectedCallback() {
    super.connectedCallback();
    this.setAttribute('role', 'table');
  }

  render() {
    const [dot, columns] = HEADERS[this.kind] ?? HEADERS.findings;
    return html`<div class="head" role="row"><span role="columnheader"><span class="vh">${dot}</span></span>${columns.map((c) => html`<span role="columnheader">${c}</span>`)}</div><slot></slot>`;
  }
}

/**
 * A row of the panel's table: a leading dot for the level, then the cells.
 * The row never wraps; a cell too long for its column ends in an ellipsis.
 * The whole row opens what it names.
 *
 * @slot - the cells, plain elements in column order: `[data-mono]` is a mono identifier (file:line, origin, time); `[data-tone="sug" | "bad" | "ok"]` takes that accent
 * @fires sett-open - the row was clicked or Enter was pressed on it (the consumer moves the map or opens the fix card)
 */
@customElement('sett-panel-row')
export class SettPanelRow extends LitElement {
  /** the leading dot: bad (blocks, failed), sug (warns, running), ok (passed), mute */
  @property({ reflect: true }) level: PanelRowLevel = 'mute';

  /** the row the inspector and the map are about: the sel tint */
  @property({ type: Boolean, reflect: true }) selected = false;

  static styles = css`
    :host {
      display: grid;
      grid-template-columns: var(--_cols, var(--sett-space-3) minmax(0, 2fr) minmax(0, 1.4fr) calc(var(--sett-space-5) * 5.5) calc(var(--sett-space-5) * 4.5));
      gap: 0 var(--sett-space-3);
      align-items: center;
      box-sizing: border-box;
      height: var(--sett-size-shell-row);
      padding: 0 var(--sett-space-3);
      color: var(--sett-color-ink2);
      white-space: nowrap;
      cursor: pointer;
    }
    :host([selected]) { background: var(--sett-color-sel-bg); }
    :host(:focus-visible) { outline: var(--sett-stroke-lit) solid var(--sett-color-sel); outline-offset: calc(-1 * var(--sett-stroke-lit)); }
    .lv { display: block; width: var(--sett-space-2); height: var(--sett-space-2); border-radius: var(--sett-radius-chip); background: var(--sett-color-mute); }
    :host([level='bad']) .lv { background: var(--sett-color-bad); }
    :host([level='sug']) .lv { background: var(--sett-color-sug); }
    :host([level='ok']) .lv { background: var(--sett-color-ok); }
    ::slotted(*) { min-width: 0; overflow: hidden; text-overflow: ellipsis; }
    ::slotted([data-mono]) { font-family: var(--sett-font-mono); font-size: var(--sett-font-size-sm); color: var(--sett-color-mute); }
    ::slotted([data-tone='sug']) { color: var(--sett-color-sug); }
    ::slotted([data-tone='bad']) { color: var(--sett-color-bad); }
    ::slotted([data-tone='ok']) { color: var(--sett-color-ok); }
    :host([selected]) ::slotted([data-tone]) { color: var(--sett-color-ink); }
  `;

  private open = () => this.dispatchEvent(new CustomEvent('sett-open', { bubbles: true, composed: true }));
  private onKey = (e: KeyboardEvent) => { if (e.key === 'Enter' && e.target === this) this.click(); };
  /** the cells are plain elements: the row gives them their role */
  private cells = () => { for (const c of Array.from(this.children)) if (!c.hasAttribute('role')) c.setAttribute('role', 'cell'); };

  connectedCallback() {
    super.connectedCallback();
    this.setAttribute('role', 'row');
    this.tabIndex = 0;
    this.addEventListener('click', this.open);
    this.addEventListener('keydown', this.onKey);
  }
  disconnectedCallback() {
    super.disconnectedCallback();
    this.removeEventListener('click', this.open);
    this.removeEventListener('keydown', this.onKey);
  }
  updated() {
    this.cells();
    if (this.selected) this.setAttribute('aria-selected', 'true'); else this.removeAttribute('aria-selected');
  }

  render() { return html`<span role="cell"><span class="lv"></span></span><slot @slotchange=${this.cells}></slot>`; }
}

/**
 * A block of output in the panel: a run's output or its witness under the
 * Checks table, and the look of the terminal block. Mono, line breaks kept.
 * The real terminal is Theia's; this only styles a block of text.
 *
 * @slot - the text; its line breaks and spaces are kept
 */
@customElement('sett-panel-output')
export class SettPanelOutput extends LitElement {
  static styles = css`
    :host {
      display: block;
      box-sizing: border-box;
      /* the top hairline folds into whatever is above it: the strip's border, or the last row */
      margin-top: calc(-1 * var(--sett-stroke-hair));
      padding: var(--sett-space-2) var(--sett-space-3);
      border-top: var(--sett-stroke-hair) solid var(--sett-color-line2);
      font-family: var(--sett-font-mono);
      font-size: var(--sett-font-size-md);
      line-height: var(--sett-font-line-height-code);
      color: var(--sett-color-ink2);
      white-space: pre;
    }
  `;
  render() { return html`<slot></slot>`; }
}

/**
 * One line of What's new: what changed, and when. The whole line is the link
 * to what it names: the host, or an `<a>` when `href` is set.
 *
 * @slot - the sentence; `b` is its subject (ink, medium)
 */
@customElement('sett-panel-line')
export class SettPanelLine extends LitElement {
  /** how long ago, shown at the right in mono, e.g. `3 min` */
  @property() when?: string;

  /** where the line leads; renders an `<a>`. Without it the host is the link and its click is the consumer's */
  @property() href?: string;

  static styles = [
    hostLinkStyles,
    css`
      :host { display: flex; box-sizing: border-box; padding: var(--sett-space-1) var(--sett-space-3); font-family: var(--sett-font-sans); font-size: var(--sett-font-size-lg); color: var(--sett-color-ink2); }
      :host, a { align-items: baseline; gap: var(--sett-space-3); }
      a { display: flex; flex: 1; min-width: 0; }
      :host(:focus-visible), a:focus-visible { outline-offset: calc(-1 * var(--sett-stroke-lit)); }
      .text { min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
      .when { flex: none; margin-left: auto; font-family: var(--sett-font-mono); font-size: var(--sett-font-size-sm); color: var(--sett-color-mute); white-space: nowrap; }
      ::slotted(b) { font-weight: var(--sett-font-weight-medium); color: var(--sett-color-ink); }
    `,
  ];

  connectedCallback() {
    super.connectedCallback();
    this.addEventListener('keydown', clickOnEnter);
  }
  disconnectedCallback() {
    super.disconnectedCallback();
    this.removeEventListener('keydown', clickOnEnter);
  }
  willUpdate() { syncHostLink(this, this.href); }

  render() {
    const body = html`<span class="text"><slot></slot></span>${this.when ? html`<span class="when">${this.when}</span>` : nothing}`;
    return this.href ? html`<a href=${this.href}>${body}</a>` : body;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'sett-bottom-panel': SettBottomPanel; 'sett-panel-tab': SettPanelTab; 'sett-panel-table': SettPanelTable;
    'sett-panel-row': SettPanelRow; 'sett-panel-output': SettPanelOutput; 'sett-panel-line': SettPanelLine;
  }
}
