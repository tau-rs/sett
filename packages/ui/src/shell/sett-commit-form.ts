import { LitElement, css, html, nothing } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import '../card/sett-card.js';
import '../button/sett-button.js';

export type CommitThen = 'main' | 'branch';

/**
 * The ready commit in the inspector, one click from the `you` chip (spec §4,
 * §6 Daily; ADR 0016): the message, the description prefilled from the diff,
 * then the `files` line with `pick hunks`, the `checks` that ran on save, the
 * `then` choice (stay on main · push to a branch · open MR), and, when main
 * moved, the `behind` line in amber with both doors, agent door first. The
 * primary verb is `commit · ⌘↩`. "Behind main" is a line here, never a dialog.
 * The form owns its fields and `then`; it reports the rest.
 *
 * @slot note - the small mute line under the verb
 * @fires sett-commit - `{ message, description, then }` from the verb or ⌘↩ in a field
 * @fires sett-pick - `pick hunks` was pressed
 * @fires sett-then - `{ then }` when the choice changes
 * @fires sett-update - `{ door: 'agent' | 'manual' }` from the behind line
 * @csspart message - the message input
 * @csspart description - the description textarea
 */
@customElement('sett-commit-form')
export class SettCommitForm extends LitElement {
  /** the commit message, prefilled from the diff or the plan element */
  @property() value = '';
  /** the description, prefilled from the diff */
  @property() description = '';
  @property() placeholder = 'description · prefilled from the diff';
  /** the files line, mono: `store/pg.rs +12 · store/pool.rs +8` */
  @property() files = '';
  /** the checks line: `ran on save · check 0 · tests 41 ✓` */
  @property() checks = '';
  /** what happens next: stay on `main`, or push to a `branch` and open an MR */
  @property({ reflect: true }) then: CommitThen = 'main';
  /** main moved: `main moved 2 commits`; the line and its two doors appear */
  @property() behind = '';

  static styles = css`
    :host { display: flex; flex-direction: column; font-family: var(--sett-font-sans); font-size: var(--sett-font-size-lg); color: var(--sett-color-ink); }
    .fields { display: flex; flex-direction: column; gap: var(--sett-space-2); padding: var(--sett-space-2) var(--sett-space-3); }
    input, textarea { font: inherit; font-size: var(--sett-font-size-lg); line-height: var(--sett-font-line-height-ui); color: var(--sett-color-ink); background: var(--sett-color-paper); border: var(--sett-stroke-hair) solid var(--sett-color-line); border-radius: var(--sett-radius-chip); padding: var(--sett-space-1) var(--sett-space-2); min-width: 0; box-sizing: border-box; width: 100%; }
    input { font-weight: var(--sett-font-weight-medium); }
    textarea { resize: none; min-height: calc(var(--sett-space-6) * 2.5); font-size: var(--sett-font-size-base); }
    input:focus-visible, textarea:focus-visible { outline: none; box-shadow: 0 0 0 var(--sett-stroke-lit) var(--sett-color-sel); }
    .kv { border-top: var(--sett-stroke-hair) solid var(--sett-color-line2); padding: var(--sett-space-1) 0; }
    .lnk { font: inherit; font-size: var(--sett-font-size-md); padding: 0; border: 0; background: none; color: var(--sett-color-sel); cursor: pointer; text-transform: lowercase; }
    .lnk:hover { text-decoration: underline; }
    .lnk:focus-visible { outline: var(--sett-stroke-lit) solid var(--sett-color-sel); outline-offset: var(--sett-stroke-hair); border-radius: var(--sett-radius-item); }
    .lnk.agent { font-weight: var(--sett-font-weight-semibold); }
    .then { display: flex; flex-wrap: wrap; gap: var(--sett-space-1) var(--sett-space-3); }
    label { display: inline-flex; align-items: center; gap: var(--sett-space-1); cursor: pointer; white-space: nowrap; }
    input[type='radio'] { width: auto; margin: 0; accent-color: var(--sett-color-sel); }
    input[type='radio']:focus-visible { box-shadow: none; outline: var(--sett-stroke-lit) solid var(--sett-color-sel); outline-offset: var(--sett-stroke-hair); }
    .sep { color: var(--sett-color-mute); }
    .acts { display: flex; flex-wrap: wrap; align-items: center; gap: var(--sett-space-1); padding: var(--sett-space-2) var(--sett-space-3); border-top: var(--sett-stroke-hair) solid var(--sett-color-line2); margin-top: auto; }
    .n { flex-basis: 100%; font-size: var(--sett-font-size-sm); color: var(--sett-color-mute); line-height: var(--sett-font-line-height-ui); }
  `;

  private fire = (type: string, detail?: unknown) => this.dispatchEvent(new CustomEvent(type, { bubbles: true, composed: true, detail }));
  private field = (sel: string) => this.shadowRoot!.querySelector(sel) as HTMLInputElement | HTMLTextAreaElement;
  private commit = () => this.fire('sett-commit', { message: this.field('input.msg').value, description: this.field('textarea').value, then: this.then });
  private onKey = (e: KeyboardEvent) => { if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) { e.preventDefault(); this.commit(); } };
  private choose = (then: CommitThen) => { this.then = then; this.fire('sett-then', { then }); };

  render() {
    const radio = (v: CommitThen, words: string) => html`<label><input type="radio" name="then" value=${v} .checked=${this.then === v} @change=${() => this.choose(v)}>${words}</label>`;
    return html`
      <div class="fields">
        <input class="msg" part="message" .value=${this.value} aria-label="message" @keydown=${this.onKey}>
        <textarea part="description" placeholder=${this.placeholder} .value=${this.description} aria-label="description" @keydown=${this.onKey}></textarea>
      </div>
      <div class="kv">
        <sett-kv-row label="files" mono>${this.files}<button slot="right" class="lnk" type="button" @click=${() => this.fire('sett-pick')}>pick hunks</button></sett-kv-row>
        ${this.checks ? html`<sett-kv-row label="checks">${this.checks}</sett-kv-row>` : nothing}
        <sett-kv-row label="then"><span class="then" role="radiogroup" aria-label="then">${radio('main', 'stay on main')}${radio('branch', 'push to a branch · open MR')}</span></sett-kv-row>
        ${this.behind ? html`<sett-kv-row label="behind" tone="sug">${this.behind} <span class="sep">·</span> <button class="lnk agent" type="button" @click=${() => this.fire('sett-update', { door: 'agent' })}>with an agent</button> <span class="sep">·</span> <button class="lnk" type="button" @click=${() => this.fire('sett-update', { door: 'manual' })}>update myself</button></sett-kv-row>` : nothing}
      </div>
      <div class="acts"><sett-button variant="primary" @click=${this.commit}>commit · ⌘↩</sett-button><span class="n"><slot name="note"></slot></span></div>`;
  }
}

declare global {
  interface HTMLElementTagNameMap { 'sett-commit-form': SettCommitForm }
}
