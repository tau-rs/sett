import { LitElement, css, html, nothing } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { sessionStyles, type SessionId } from '../session.js';
import type { ThreadIdentity } from '../thread/sett-thread.js';

export type InspectorTone = 'default' | 'bad' | 'sug' | 'ok' | 'mute';

/**
 * The inspector, the right pane: it is about the selection (DESIGN.md "The
 * shell" rule 6). A header (heading, sub, state), a scrolling body, a fixed
 * verbs bar with its small note, and a composer row shown only when one is
 * slotted. The top border says who the pane is about, in the thread family's
 * words: a `session` takes the session colour; `kind` planner is amber, framer
 * and fixer blue. `folded`, it is the handle (`size.shell.handle` wide) with
 * the heading as its title. Width is the app's (`size.shell.inspector`).
 *
 * @slot - the body: a card, kv rows, messages, a hunk, a form
 * @slot verbs - the fixed bar's sett-button elements, agent door first
 * @slot note - the small mute line under the verbs
 * @slot composer - a sett-composer; the row exists only when slotted
 * @fires sett-unfold - the folded handle was pressed
 * @csspart header - the header row
 * @csspart body - the scrolling body
 * @csspart verbs - the fixed verbs bar
 */
@customElement('sett-inspector')
export class SettInspector extends LitElement {
  /** the heading, bold */
  @property() heading = '';
  /** the secondary words after the heading */
  @property() sub = '';
  /** the state words at the right: `running`, `draft`, `🔒 locked`, `new` */
  @property() state = '';
  /** the state's colour: bad, sug, ok, mute; default is secondary ink */
  @property({ reflect: true }) tone: InspectorTone = 'default';
  /** session id: a 3 px top border in the session colour and the heading in it */
  @property({ reflect: true }) session?: SessionId;
  /** the thread kind the pane holds: session (session colour), planner (amber), framer or fixer (blue) */
  @property({ reflect: true }) kind?: ThreadIdentity;
  /** the pane is the 28 px handle */
  @property({ type: Boolean, reflect: true }) folded = false;

  static styles = [
    sessionStyles,
    css`
      :host {
        display: flex;
        flex-direction: column;
        box-sizing: border-box;
        min-height: 0;
        min-width: 0;
        background: var(--sett-color-paper);
        border-top: var(--sett-stroke-frame) solid transparent;
        color: var(--sett-color-ink);
        font-family: var(--sett-font-sans);
        font-size: var(--sett-font-size-base);
      }
      :host([session]) { border-top-color: var(--_session); }
      :host([kind='session']) { border-top-color: var(--_session); }
      :host([kind='planner']) { border-top-color: var(--sett-color-sug); }
      :host([kind='framer']), :host([kind='fixer']) { border-top-color: var(--sett-color-sel); }
      :host([folded]) { flex: none; width: var(--sett-size-shell-handle); border-top-color: transparent; }
      .handle { flex: 1; font: inherit; font-size: var(--sett-font-size-h); padding: 0; border: 0; background: none; color: var(--sett-color-mute); cursor: pointer; }
      .handle:hover { color: var(--sett-color-ink); }
      .handle:focus-visible { outline: var(--sett-stroke-lit) solid var(--sett-color-sel); outline-offset: calc(-1 * var(--sett-stroke-lit)); }
      .hd { display: flex; align-items: baseline; gap: var(--sett-space-2); flex: none; padding: var(--sett-space-2) var(--sett-space-3); border-bottom: var(--sett-stroke-hair) solid var(--sett-color-line2); color: var(--sett-color-ink2); white-space: nowrap; }
      .hd b { font-weight: var(--sett-font-weight-semibold); color: var(--sett-color-ink); }
      :host([session]) .hd b { color: var(--_session); }
      .hd .sub { min-width: 0; overflow: hidden; text-overflow: ellipsis; }
      .st { margin-left: auto; flex: none; font-family: var(--sett-font-mono); font-size: var(--sett-font-size-sm); color: var(--sett-color-mute); }
      :host([tone='bad']) .st { color: var(--sett-color-bad); }
      :host([tone='sug']) .st { color: var(--sett-color-sug); }
      :host([tone='ok']) .st { color: var(--sett-color-ok); }
      :host([tone='mute']) .st { color: var(--sett-color-mute); }
      .body { display: flex; flex-direction: column; align-items: stretch; flex: 1; min-height: 0; overflow: auto; }
      .body:focus-visible { outline: var(--sett-stroke-lit) solid var(--sett-color-sel); outline-offset: calc(-1 * var(--sett-stroke-lit)); }
      /* messages slot straight into the body, at the thread's rhythm; the pane is the thread's header and bars */
      ::slotted(sett-msg), ::slotted(sett-question), ::slotted(sett-deviation) { margin: var(--sett-space-1) var(--sett-space-3); }
      ::slotted(sett-msg[from='me']) { align-self: flex-end; }
      .verbs { display: flex; flex-wrap: wrap; align-items: center; gap: var(--sett-space-1); flex: none; padding: var(--sett-space-2) var(--sett-space-3); border-top: var(--sett-stroke-hair) solid var(--sett-color-line2); }
      .n { flex-basis: 100%; font-size: var(--sett-font-size-sm); color: var(--sett-color-mute); line-height: var(--sett-font-line-height-ui); }
      .comp { display: flex; flex-direction: column; flex: none; }
    `,
  ];

  private observer?: MutationObserver;
  private has = (name: string) => Array.from(this.children).some((c) => c.slot === name);
  private unfold = () => this.dispatchEvent(new CustomEvent('sett-unfold', { bubbles: true, composed: true }));

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
    if (this.folded) return html`<button class="handle" type="button" title=${this.heading} aria-label=${`unfold · ${this.heading}`} @click=${this.unfold}>›</button>`;
    return html`
      <div class="hd" part="header"><b>${this.heading}</b>${this.sub ? html`<span class="sub">${this.sub}</span>` : nothing}${this.state ? html`<span class="st">${this.state}</span>` : nothing}</div>
      <div class="body" part="body" tabindex="0"><slot></slot></div>
      ${this.has('verbs') ? html`<div class="verbs" part="verbs"><slot name="verbs"></slot>${this.has('note') ? html`<span class="n"><slot name="note"></slot></span>` : nothing}</div>` : nothing}
      ${this.has('composer') ? html`<div class="comp"><slot name="composer"></slot></div>` : nothing}`;
  }
}

declare global {
  interface HTMLElementTagNameMap { 'sett-inspector': SettInspector }
}
