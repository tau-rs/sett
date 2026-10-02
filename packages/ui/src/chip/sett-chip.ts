import { LitElement, css, html, nothing } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { sessionStyles, type SessionId } from '../session.js';
import '../tag/sett-tag.js';
import type { TagKind } from '../tag/sett-tag.js';

export type ChipKind = 'git' | 'agent' | 'finding' | 'review' | 'pipeline' | 'tree' | 'gate' | 'detected';
export type ChipState = 'normal' | 'blocking' | 'waiting' | 'done';

const TAG_KIND: Record<ChipKind, TagKind> = { git: 'sel', agent: 'session', finding: 'bad', review: 'sug', pipeline: 'ok', tree: 'default', gate: 'session', detected: 'sel' };

/**
 * Actions-strip chip: a kind label, a fact, then the verbs. Two doors, agent
 * door first and bold, manual door second and plain (P-1); `me-first` swaps
 * them. A chip always carries a verb (DESIGN.md "The shell" rule 1); a
 * separator stands before each verb that is there. A done chip keeps full
 * contrast, its label turns ok with ✓ and it gains a plain `dismiss` verb.
 * The `gate` kind is a group's gate (`gate · group 1 → group 2 · judge
 * running`, verb `open`): its label takes the colour of the session that runs
 * it, and a failed gate (`failed 1/2`) is the `blocking` state. The
 * `detected` kind is your own work, found by the watcher and never declared
 * (`changes detected · 3 files`, spec §4 "Work by hand"): its label is `sel`
 * like everything that is yours; agent door `delegate the rest`, manual door
 * `commit`. Never animates.
 *
 * @slot - the fact, lowercase
 * @slot count - a mono count or identifier after the fact, e.g. `· 2`
 * @slot agent - the agent door verb (an `<a>`)
 * @slot manual - the manual door verb (an `<a>`)
 * @slot verb - further verbs, in order
 * @fires sett-dismiss - when the done chip's dismiss verb is used
 * @csspart label - the kind label (a sett-tag)
 * @csspart verbs - the verbs group
 */
@customElement('sett-chip')
export class SettChip extends LitElement {
  /** what the chip is about */
  @property({ reflect: true }) kind: ChipKind = 'git';

  /** normal · blocking (red border, red label) · waiting (amber fill and border) · done (ok label with ✓) */
  @property({ reflect: true }) state: ChipState = 'normal';

  /** session id for the agent and gate kinds; unknown ids fall back to yk; a gate with no session keeps a neutral label; detected is yours and takes none */
  @property({ reflect: true }) session?: SessionId;

  /** the "me first" setting: manual door first and bold */
  @property({ type: Boolean, reflect: true, attribute: 'me-first' }) meFirst = false;

  static styles = [
    sessionStyles,
    css`
      :host {
        display: inline-flex;
        align-items: center;
        gap: var(--sett-space-2);
        padding: var(--sett-space-1) var(--sett-space-2);
        line-height: var(--sett-space-4);
        font-family: var(--sett-font-sans);
        font-size: var(--sett-font-size-base);
        color: var(--sett-color-ink);
        background: var(--sett-color-paper);
        border: var(--sett-stroke-hair) solid var(--sett-color-line);
        border-radius: var(--sett-radius-chip);
        white-space: nowrap;
        vertical-align: middle;
      }
      :host([state='blocking']) { border-color: var(--sett-color-bad); }
      :host([state='waiting']) { border-color: var(--sett-color-sug); background: var(--sett-color-sug-bg); }
      .fact { display: inline-flex; align-items: center; gap: var(--sett-space-1); }
      ::slotted([slot='count']) { font-family: var(--sett-font-mono); color: var(--sett-color-ink2); }
      .verbs { display: inline-flex; align-items: center; gap: var(--sett-space-2); }
      .sep::before { content: var(--sett-glyph-sep); color: var(--sett-color-mute); }
      ::slotted(a), a { color: var(--sett-color-sel); cursor: pointer; text-decoration: none; text-transform: lowercase; }
      .primary { display: contents; }
      .primary ::slotted(a) { font-weight: var(--sett-font-weight-semibold); }
    `,
  ];

  private dismiss() {
    this.dispatchEvent(new CustomEvent('sett-dismiss', { bubbles: true, composed: true }));
  }

  private has(slot: string) {
    return Array.from(this.children).some((c) => c.getAttribute('slot') === slot);
  }
  private onSlotChange = () => this.requestUpdate();

  render() {
    const done = this.state === 'done';
    // a gate belongs to the session that runs it; with none named it does not borrow a session's colour
    const kind: TagKind = this.kind === 'gate' && !this.session ? 'default' : TAG_KIND[this.kind];
    const tagKind: TagKind = this.state === 'blocking' ? 'bad' : done ? 'ok' : kind;
    const doors = this.meFirst ? ['manual', 'agent'] : ['agent', 'manual'];
    const sep = (slot: string) => (this.has(slot) ? html`<span class="sep"></span>` : nothing);
    return html`
      <sett-tag part="label" kind=${tagKind} session=${this.session ?? ''}>${done ? html`${'✓'} ` : nothing}${this.kind}</sett-tag>
      <span class="fact"><slot></slot><slot name="count"></slot></span>
      <span class="verbs" part="verbs" @slotchange=${this.onSlotChange}>
        ${sep(doors[0])}<span class="primary"><slot name=${doors[0]}></slot></span>
        ${sep(doors[1])}<slot name=${doors[1]}></slot>
        ${sep('verb')}<slot name="verb"></slot>
        ${done ? html`<span class="sep"></span><a @click=${this.dismiss}>dismiss</a>` : nothing}
      </span>`;
  }
}

declare global {
  interface HTMLElementTagNameMap { 'sett-chip': SettChip }
}
