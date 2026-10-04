import { LitElement, css, html } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { sessionStyles, type SessionId } from '../session.js';
import { dotStyles } from '../status.js';
import { buttonStyles } from './buttons.js';
import { ChatEnd } from './chat-end.js';
import { state } from 'lit/decorators.js';

export type ThreadIdentity = 'session' | 'planner' | 'framer' | 'fixer';
export type MsgFrom = 'me' | 'agent' | 'sub';
export type VerbsState = 'running' | 'paused' | 'taken-over';
export type ComposerMode = 'send' | 'handback';

/**
 * One pane shape for every conversation. The top border says who you talk to:
 * the session colour for a session, amber for the planner, blue for the framer
 * and the fixer. Header, scrolling messages, fixed verbs bar, composer.
 * The messages open at their end and follow new ones while you are there;
 * scroll up and they stay put, and the slotted sett-verbs shows
 * `n new · latest` (rule 13). The messages area is a `log`.
 *
 * @slot - messages (sett-msg, sett-question, sett-deviation)
 * @slot name - who, in the header
 * @slot context - what, next to the name
 * @slot role - the role, right-aligned in the header
 * @slot verbs - a sett-verbs
 * @slot composer - a sett-composer
 * @csspart header - the header
 * @csspart messages - the scrolling area
 */
@customElement('sett-thread')
export class SettThread extends LitElement {
  @property({ reflect: true }) identity: ThreadIdentity = 'session';
  @property({ reflect: true }) session?: SessionId;
  private chat = new ChatEnd(this, () => this.renderRoot.querySelector<HTMLElement>('.msgs'));
  constructor() {
    super();
    this.addEventListener('sett-verb', (e) => { if ((e as CustomEvent).detail?.verb === 'latest') this.chat.jump(); });
  }
  static styles = [
    sessionStyles,
    css`
      :host { display: flex; flex-direction: column; min-height: 0; min-width: 0; background: var(--sett-color-paper); font-family: var(--sett-font-sans); font-size: var(--sett-font-size-lg); color: var(--sett-color-ink); border-top: var(--sett-stroke-frame) solid var(--_session); }
      :host([identity='planner']) { border-top-color: var(--sett-color-sug); }
      :host([identity='framer']), :host([identity='fixer']) { border-top-color: var(--sett-color-sel); }
      .hd { display: flex; gap: var(--sett-space-2); align-items: baseline; padding: var(--sett-space-2) var(--sett-space-3); border-bottom: var(--sett-stroke-hair) solid var(--sett-color-line2); font-size: var(--sett-font-size-md); color: var(--sett-color-mute); }
      .hd ::slotted([slot='name']) { font-family: var(--sett-font-mono); color: var(--sett-color-ink); font-weight: var(--sett-font-weight-medium); font-size: var(--sett-font-size-xl); }
      .hd .r { margin-left: auto; }
      .msgs { flex: 1; overflow: auto; padding: var(--sett-space-2) var(--sett-space-3); display: flex; flex-direction: column; gap: var(--sett-space-2); min-height: 0; }
    `,
  ];
  render() {
    return html`
      <div class="hd" part="header"><slot name="name"></slot><slot name="context"></slot><span class="r"><slot name="role"></slot></span></div>
      <div class="msgs" part="messages" tabindex="0" role="log" aria-relevant="additions" aria-label="messages"><slot></slot></div>
      <slot name="verbs" @slotchange=${this.tell}></slot>
      <slot name="composer"></slot>`;
  }
  updated() { this.tell(); }
  /** the verbs bar draws the unseen count; the thread owns it */
  private tell = () => {
    const verbs = this.querySelector<SettVerbs>(':scope > sett-verbs[slot="verbs"]');
    if (verbs) verbs.unseen = this.chat.unseen;
  };
}

/**
 * A message. Yours sit on the right in the selection tint; an agent's on the
 * left outlined in its colour; a sub-agent's in the sub shade. Every message
 * opens with an author line: dot, name in the author's colour, time.
 *
 * @slot - the body; may contain sett-tool and sett-changed
 */
@customElement('sett-msg')
export class SettMsg extends LitElement {
  @property({ reflect: true }) from: MsgFrom = 'agent';
  /** who wrote it: `you`, the session name, or `sub · store` */
  @property() author = '';
  @property() time = '';
  @property({ reflect: true }) session?: SessionId;
  static styles = [
    sessionStyles,
    css`
      :host { display: block; align-self: flex-start; max-width: 94%; padding: var(--sett-space-1) var(--sett-space-2); border-radius: var(--sett-radius-node); background: transparent; border: var(--sett-stroke-hair) solid var(--_session); border-left-width: var(--sett-stroke-frame); line-height: var(--sett-font-line-height-ui); }
      :host([from='sub']) { border-color: var(--_session-sub); }
      :host([from='me']) { align-self: flex-end; background: var(--sett-color-sel-bg); border-color: transparent; }
      .who { display: flex; align-items: center; gap: var(--sett-space-1); font-size: var(--sett-font-size-sm); font-weight: var(--sett-font-weight-medium); color: var(--_session); margin-bottom: var(--sett-space-1); }
      :host([from='sub']) .who .d { background: var(--_session-sub); }
      :host([from='me']) .who { color: var(--sett-color-sel); }
      .who .d { width: var(--sett-space-2); height: var(--sett-space-2); border-radius: var(--sett-radius-chip); background: currentColor; flex: none; }
      .who .t { color: var(--sett-color-mute); font-weight: var(--sett-font-weight-normal); }
    `,
  ];
  render() {
    return html`<div class="who"><span class="d"></span>${this.author}${this.time ? html`<span class="t">${this.time}</span>` : ''}</div><slot></slot>`;
  }
}

/** A tool block inside a message: mono, one line per call. @slot - the lines */
@customElement('sett-tool')
export class SettTool extends LitElement {
  static styles = css`:host { display: block; font-family: var(--sett-font-mono); font-size: var(--sett-font-size-sm); color: var(--sett-color-ink2); background: var(--sett-color-well); border-radius: var(--sett-radius-chip); padding: var(--sett-space-1) var(--sett-space-2); line-height: var(--sett-font-line-height-code); margin-top: var(--sett-space-1); white-space: pre-line; }`;
  render() { return html`<slot></slot>`; }
}

/** The line that ends every agent reply: `changed · what`, or `no change` with `none`. @slot - the words */
@customElement('sett-changed')
export class SettChanged extends LitElement {
  @property({ type: Boolean, reflect: true }) none = false;
  static styles = css`
    :host { display: inline-block; font-size: var(--sett-font-size-sm); margin-top: var(--sett-space-1); padding: 0 var(--sett-space-2); line-height: var(--sett-space-4); border-radius: var(--sett-radius-chip); background: var(--sett-color-ok-bg); color: var(--sett-color-ok); }
    :host([none]) { background: var(--sett-color-well); color: var(--sett-color-mute); }
  `;
  render() { return html`<slot></slot>`; }
}

/**
 * One option in a question or a deviation: a row that reads left to right,
 * with what it changes on the right (`effect`) or a label on the left (`label`).
 * @slot - the option text
 * @fires sett-choose - with `{ value }` from the `value` attribute
 */
@customElement('sett-option')
export class SettOption extends LitElement {
  @property() value = '';
  /** what choosing it changes, e.g. `+1 item in domain` */
  @property() effect = '';
  /** a left column label, e.g. `back on the plan` */
  @property() label = '';
  @property({ type: Boolean, reflect: true }) quiet = false;
  static styles = [
    buttonStyles,
    css`
      :host { display: block; }
      button { display: flex; width: 100%; gap: var(--sett-space-2); align-items: baseline; text-align: left; font-size: var(--sett-font-size-base); text-transform: none; white-space: normal; }
      :host([quiet]) button { border-color: transparent; background: transparent; color: var(--sett-color-ink2); }
      .l { font-size: var(--sett-font-size-xs); color: var(--sett-color-mute); flex: none; width: calc(var(--sett-space-6) * 4); }
      .e { margin-left: auto; color: var(--sett-color-mute); font-size: var(--sett-font-size-sm); font-family: var(--sett-font-mono); flex: none; }
    `,
  ];
  private choose() { this.dispatchEvent(new CustomEvent('sett-choose', { bubbles: true, composed: true, detail: { value: this.value } })); }
  render() {
    return html`<button @click=${this.choose}>${this.label ? html`<span class="l">${this.label}</span>` : ''}<span><slot></slot></span>${this.effect ? html`<span class="e">${this.effect}</span>` : ''}</button>`;
  }
}

/**
 * The agent asks. Each option says what it changes; `later` leaves it waiting.
 * A gate that failed asks the same way (spec §6 "Gate failed"): the four doors
 * are option rows, and the `input` slot holds the one-line hint for `one more
 * round with a hint`.
 * @slot - the question
 * @slot input - a one-line `input` under the question, e.g. the hint for one more round
 * @slot option - sett-option elements
 * @fires sett-later
 */
@customElement('sett-question')
export class SettQuestion extends LitElement {
  @property() author = '';
  @property({ type: Number }) count?: number;
  static styles = css`
    :host { display: block; border: var(--sett-stroke-hair) dashed var(--sett-color-sug); background: var(--sett-color-sug-bg); border-radius: var(--sett-radius-node); padding: var(--sett-space-2); line-height: var(--sett-font-line-height-ui); }
    b { font-weight: var(--sett-font-weight-semibold); }
    .sub { font-size: var(--sett-font-size-sm); color: var(--sett-color-mute); }
    .q { margin-top: var(--sett-space-1); }
    ::slotted(input) { box-sizing: border-box; width: 100%; margin-top: var(--sett-space-2); font: inherit; font-size: var(--sett-font-size-base); color: var(--sett-color-ink); background: var(--sett-color-paper); border: var(--sett-stroke-hair) solid var(--sett-color-line); border-radius: var(--sett-radius-chip); padding: var(--sett-space-1) var(--sett-space-2); }
    ::slotted(input:focus-visible) { outline: none; box-shadow: 0 0 0 var(--sett-stroke-lit) var(--sett-color-sel); }
    .opts { display: flex; flex-direction: column; gap: var(--sett-space-1); margin-top: var(--sett-space-2); }
    .later { margin-top: var(--sett-space-2); font-size: var(--sett-font-size-sm); color: var(--sett-color-ink2); cursor: pointer; }
  `;
  private later() { this.dispatchEvent(new CustomEvent('sett-later', { bubbles: true, composed: true })); }
  render() {
    return html`<b>${this.author} asks${this.count != null ? html` · ${this.count}` : ''}</b><div class="sub">one question, with what each option changes</div>
      <div class="q"><slot></slot></div><slot name="input"></slot><div class="opts"><slot name="option"></slot></div>
      <div class="later" @click=${this.later}>later · leaves it waiting, no nagging</div>`;
  }
}

/**
 * The agent left the plan. Reason, then the three ways back (and discuss). A
 * denied write (spec §6 "Deviation") names the check that denied it in
 * `check`, mono: `core · element scope`.
 * @slot - the reason
 * @slot way - sett-option elements with a `label`
 */
@customElement('sett-deviation')
export class SettDeviation extends LitElement {
  @property() subject = '';
  /** the check that denied the write, mono: `core · element scope` */
  @property() check = '';
  static styles = css`
    :host { display: block; border: var(--sett-stroke-hair) solid var(--sett-color-bad); background: var(--sett-color-bad-bg); border-radius: var(--sett-radius-node); padding: var(--sett-space-2); font-size: var(--sett-font-size-lg); }
    b { font-weight: var(--sett-font-weight-semibold); color: var(--sett-color-bad); }
    .check { display: block; margin-top: var(--sett-space-1); font-family: var(--sett-font-mono); font-size: var(--sett-font-size-sm); color: var(--sett-color-mute); }
    .reason { margin: var(--sett-space-1) 0 var(--sett-space-2); color: var(--sett-color-ink2); }
    .typ { display: grid; gap: var(--sett-space-1); }
  `;
  render() {
    return html`<b>${'≠'} deviation</b> · ${this.subject}${this.check ? html`<span class="check">check · ${this.check}</span>` : ''}<div class="reason"><slot></slot></div><div class="typ"><slot name="way"></slot></div>`;
  }
}

/**
 * The fixed bar above the composer. With a `state`, it draws the take-over
 * verbs: running `pause · stop`, paused `resume · take over · stop`, taken
 * over `stop` (hand back lives in the composer). Without one, the slots draw
 * whatever the identity needs. While you are scrolled up in the thread and
 * something new arrives, `unseen` is set by the thread and the bar opens its
 * verbs with `n new · latest` (rule 13).
 *
 * @slot - the status words on the left (used when no state)
 * @slot actions - extra verbs on the right
 * @fires sett-verb - with `{ verb }`; `latest` asks the thread for its end
 */
@customElement('sett-verbs')
export class SettVerbs extends LitElement {
  @property({ reflect: true }) state?: VerbsState;
  /** what the session is on, e.g. `PgRefundRepo` */
  @property() subject = '';
  @property({ reflect: true }) session?: SessionId;
  @property({ type: Boolean, reflect: true }) still = false;
  /** entries that arrived below while you were scrolled up; set by the thread */
  @property({ type: Number }) unseen = 0;
  static styles = [
    sessionStyles,
    dotStyles,
    buttonStyles,
    css`
      :host { display: flex; align-items: center; gap: var(--sett-space-2); padding: var(--sett-space-1) var(--sett-space-2); border-top: var(--sett-stroke-hair) solid var(--sett-color-line2); font-size: var(--sett-font-size-md); background: var(--sett-color-well); }
      .st { display: flex; align-items: center; gap: var(--sett-space-1); font-weight: var(--sett-font-weight-medium); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; min-width: 0; }
      .ac { margin-left: auto; display: flex; gap: var(--sett-space-1); flex: none; }
      button { font-size: var(--sett-font-size-md); padding: 0 var(--sett-space-2); }
    `,
  ];
  private verb(v: string) { this.dispatchEvent(new CustomEvent('sett-verb', { bubbles: true, composed: true, detail: { verb: v } })); }
  render() {
    const b = (v: string, cls = '') => html`<button class=${cls} @click=${() => this.verb(v)}>${v}</button>`;
    const st = this.state;
    const status = st === 'running' ? html`<span class="dot" data-kind="session" data-pulse></span>running · ${this.subject}`
      : st === 'paused' ? html`<span class="dot" data-kind="mute"></span>paused · ${this.subject}`
      : st === 'taken-over' ? html`<span class="dot" data-kind="sel"></span>you · ${this.subject}` : html`<slot></slot>`;
    const verbs = st === 'running' ? html`${b('pause')}${b('stop', 'quiet')}`
      : st === 'paused' ? html`${b('resume', 'primary')}${b('take over')}${b('stop', 'quiet')}`
      : st === 'taken-over' ? html`${b('stop', 'quiet')}` : '';
    const latest = this.unseen > 0 ? html`<button class="quiet latest" @click=${() => this.verb('latest')}>${this.unseen} new · latest</button>` : '';
    return html`<span class="st">${status}</span><span class="ac">${latest}${verbs}<slot name="actions"></slot></span>`;
  }
}

/**
 * The composer. `send` is an input and a send button. `handback` turns it into
 * the hand-back note: blue, a few lines, the touched files under it, and
 * "hand back" as its button.
 *
 * @slot files - the touched files line, shown in handback mode
 * @fires sett-send - with `{ text, mode }`
 */
@customElement('sett-composer')
export class SettComposer extends LitElement {
  @property({ reflect: true }) mode: ComposerMode = 'send';
  @property() placeholder = '';
  @property() session?: string;
  @state() private empty = true;
  static styles = [
    buttonStyles,
    css`
      button:disabled { background: transparent; border-style: dashed; color: var(--sett-color-sel); border-color: var(--sett-color-sel); opacity: 1; }
      :host { display: flex; gap: var(--sett-space-1); padding: var(--sett-space-2); border-top: var(--sett-stroke-hair) solid var(--sett-color-line2); background: var(--sett-color-paper); }
      :host([mode='handback']) { flex-direction: column; align-items: stretch; background: var(--sett-color-sel-bg); }
      input, textarea { flex: 1; font: inherit; font-size: var(--sett-font-size-lg); color: var(--sett-color-ink); background: var(--sett-color-paper); border: var(--sett-stroke-hair) solid var(--sett-color-line); border-radius: var(--sett-radius-chip); padding: var(--sett-space-1) var(--sett-space-2); min-width: 0; }
      textarea { resize: none; min-height: calc(var(--sett-space-6) * 2); line-height: var(--sett-font-line-height-ui); }
      input:focus-visible, textarea:focus-visible { outline: none; box-shadow: 0 0 0 var(--sett-stroke-lit) var(--sett-color-sel); }
      .row { display: flex; gap: var(--sett-space-1); align-items: center; }
      .hint { flex: 1; font-size: var(--sett-font-size-xs); color: var(--sett-color-ink2); }
    `,
  ];
  private send() {
    const field = this.shadowRoot!.querySelector('input, textarea') as HTMLInputElement | HTMLTextAreaElement;
    this.dispatchEvent(new CustomEvent('sett-send', { bubbles: true, composed: true, detail: { text: field.value, mode: this.mode } }));
    field.value = '';
  }
  render() {
    if (this.mode === 'handback') {
      return html`<textarea placeholder=${this.placeholder || 'what you changed, and where to pick up…'} @input=${(e: Event) => (this.empty = !(e.target as HTMLTextAreaElement).value.trim())}></textarea>
        <div class="row"><span class="hint"><slot name="files"></slot></span><button class="primary" ?disabled=${this.empty} @click=${this.send}>hand back</button></div>`;
    }
    return html`<input placeholder=${this.placeholder} @keydown=${(e: KeyboardEvent) => { if (e.key === 'Enter') this.send(); }}><button class="primary" @click=${this.send}>send</button>`;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'sett-thread': SettThread; 'sett-msg': SettMsg; 'sett-tool': SettTool; 'sett-changed': SettChanged; 'sett-option': SettOption;
    'sett-question': SettQuestion; 'sett-deviation': SettDeviation; 'sett-verbs': SettVerbs; 'sett-composer': SettComposer;
  }
}
