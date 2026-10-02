import { LitElement, css, html, nothing } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import '../thread/sett-thread.js';
import '../tag/sett-tag.js';
import '../button/sett-button.js';

/**
 * The Ask thread in the inspector (spec §6 Daily): your question on the right
 * in the selection tint, the `ran` block (one line per query, a sett-tool),
 * the answer (a sett-msg from the framer, blue; its items are small mono tags),
 * the witnesses it cites as mono tags that are links (`open all` after them),
 * then, when there is one, the **judgement** block, labelled and standing on
 * facts with its resolve rows, and the **can't compute** block that offers the
 * nearest queries as links. The `make it so` door hands the answer to a plan.
 * The composer under it is the inspector's, not this element's.
 *
 * @slot question - your question, the words only
 * @slot ran - a sett-tool with one `ran …` line per query
 * @slot answer - a sett-msg from the agent; items inside it are `sett-tag mono`
 * @slot judgement - the judgement's words and its sett-resolve-row elements
 * @slot cant - the can't-compute words
 * @fires sett-go - `{ place }` from a witness, `{ places }` from open all
 * @fires sett-query - `{ query }` from a nearest query
 * @fires sett-plan - make it so was pressed
 */
@customElement('sett-ask')
export class SettAsk extends LitElement {
  /** the witnesses the answer cites, space-separated: `service.rs:14 ports.rs:6 pg.rs:14` */
  @property() witnesses = '';
  /** the nearest queries a can't-compute offers, separated by ` | `: `path ship() → postgres | why OrderRepo::save` */
  @property() nearest = '';

  static styles = css`
    :host { display: flex; flex-direction: column; gap: var(--sett-space-2); padding: var(--sett-space-2) var(--sett-space-3); font-family: var(--sett-font-sans); font-size: var(--sett-font-size-lg); color: var(--sett-color-ink); }
    sett-msg[from='me'] { align-self: flex-end; }
    ::slotted(sett-msg[slot='answer']) { --_session: var(--sett-color-sel); }
    .wit { display: flex; flex-wrap: wrap; align-items: center; gap: var(--sett-space-1); padding-left: var(--sett-space-2); }
    .wit [role='link'] { cursor: pointer; border-radius: var(--sett-radius-item); }
    .wit [role='link']:focus-visible { outline: var(--sett-stroke-lit) solid var(--sett-color-sel); outline-offset: var(--sett-stroke-hair); }
    .wit .all { font-size: var(--sett-font-size-sm); color: var(--sett-color-sel); padding: 0 var(--sett-space-1); }
    .blk { border: var(--sett-stroke-hair) solid var(--sett-color-line); border-radius: var(--sett-radius-node); padding: var(--sett-space-2); line-height: var(--sett-font-line-height-ui); }
    .blk .lbl { display: block; font-size: var(--sett-font-size-sm); font-weight: var(--sett-font-weight-medium); color: var(--sett-color-ink2); margin-bottom: var(--sett-space-1); }
    .judgement { border-color: var(--sett-color-sug); }
    .judgement .lbl { color: var(--sett-color-sug); }
    .cant .lbl { color: var(--sett-color-mute); }
    .near { display: flex; flex-wrap: wrap; align-items: center; gap: var(--sett-space-1) var(--sett-space-2); margin-top: var(--sett-space-1); font-size: var(--sett-font-size-md); color: var(--sett-color-mute); }
    .near .q { font-family: var(--sett-font-mono); font-size: var(--sett-font-size-sm); color: var(--sett-color-sel); cursor: pointer; border-radius: var(--sett-radius-item); }
    .near .q:hover { text-decoration: underline; }
    .near .q:focus-visible { outline: var(--sett-stroke-lit) solid var(--sett-color-sel); outline-offset: var(--sett-stroke-hair); }
    .door { display: flex; gap: var(--sett-space-1); align-items: center; }
  `;

  private has = (name: string) => Array.from(this.children).some((c) => c.slot === name);
  private fire = (type: string, detail?: unknown) => this.dispatchEvent(new CustomEvent(type, { bubbles: true, composed: true, detail }));
  private enter = (fn: () => void) => (e: KeyboardEvent) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); fn(); } };

  render() {
    const places = this.witnesses.split(/\s+/).filter(Boolean);
    const near = this.nearest.split('|').map((q) => q.trim()).filter(Boolean);
    const link = (cls: string, fn: () => void, body: unknown) => html`<span class=${cls} role="link" tabindex="0" @click=${fn} @keydown=${this.enter(fn)}>${body}</span>`;
    return html`
      <sett-msg from="me" author="you"><slot name="question"></slot></sett-msg>
      <slot name="ran"></slot>
      <slot name="answer"></slot>
      ${places.length ? html`<div class="wit" aria-label="witnesses">${places.map((p) => link('w', () => this.fire('sett-go', { place: p }), html`<sett-tag mono>${p}</sett-tag>`))}${places.length > 1 ? link('all', () => this.fire('sett-go', { places }), 'open all') : nothing}</div>` : nothing}
      ${this.has('judgement') ? html`<div class="blk judgement"><span class="lbl">judgement · labelled, stands on the facts below</span><slot name="judgement"></slot></div>` : nothing}
      ${this.has('cant') || near.length ? html`<div class="blk cant"><span class="lbl">can't compute</span><slot name="cant"></slot>${near.length ? html`<div class="near">nearest:${near.map((q) => link('q', () => this.fire('sett-query', { query: q }), q))}</div>` : nothing}</div>` : nothing}
      ${this.has('answer') || this.has('judgement') ? html`<div class="door"><sett-button size="sm" @click=${() => this.fire('sett-plan')}>make it so → plan</sett-button></div>` : nothing}`;
  }
}

/**
 * A resolve row of a judgement: `⇄` in amber (it needs a hand, not a fix), the
 * fact, its source in mono, and the `resolve` link at the end.
 *
 * @slot - the fact
 * @fires sett-resolve - `{ source }` from the resolve link
 */
@customElement('sett-resolve-row')
export class SettResolveRow extends LitElement {
  /** where the fact comes from, mono: `rules:3`, `service.rs:14` */
  @property() source = '';
  /** the verb at the end, lowercase */
  @property() verb = 'resolve';
  static styles = css`
    :host { display: flex; align-items: center; gap: var(--sett-space-2); padding: var(--sett-space-1) 0; font-size: var(--sett-font-size-base); color: var(--sett-color-ink2); line-height: var(--sett-space-4); }
    .g { flex: none; min-width: var(--sett-space-3); text-align: center; color: var(--sett-color-sug); font-weight: var(--sett-font-weight-semibold); }
    .fact { min-width: 0; }
    .end { margin-left: auto; display: inline-flex; align-items: center; gap: var(--sett-space-1); flex: none; white-space: nowrap; }
    .v { color: var(--sett-color-sel); cursor: pointer; font-size: var(--sett-font-size-md); border-radius: var(--sett-radius-item); }
    .v:hover { text-decoration: underline; }
    .v:focus-visible { outline: var(--sett-stroke-lit) solid var(--sett-color-sel); outline-offset: var(--sett-stroke-hair); }
  `;
  private go = () => this.dispatchEvent(new CustomEvent('sett-resolve', { bubbles: true, composed: true, detail: { source: this.source } }));
  render() {
    return html`<span class="g">⇄</span><span class="fact"><slot></slot></span><span class="end">${this.source ? html`<sett-tag mono>${this.source}</sett-tag>` : nothing}<span class="v" role="link" tabindex="0" @click=${this.go} @keydown=${(e: KeyboardEvent) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); this.go(); } }}>${this.verb} ›</span></span>`;
  }
}

declare global {
  interface HTMLElementTagNameMap { 'sett-ask': SettAsk; 'sett-resolve-row': SettResolveRow }
}
