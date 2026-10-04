import { LitElement, css, html } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { sessionStyles, type SessionId } from '../session.js';

export type FrameState = 'idle' | 'live' | 'waiting' | 'editing' | 'collision' | 'planning' | 'focus';

/**
 * The one frame that changes colour: it says the state of the scope (DESIGN.md
 * "The shell" rule 5). Wraps a pane; the slot is the pane's paper. idle grey ·
 * live session gradient (rotates) · waiting amber (pulses) · editing sel ·
 * collision bad · planning dashed amber, always still. `focus` is the sel ring
 * for the selection, at the lit stroke inside the idle frame, not a state of
 * the scope. The only two animations in the chrome live here (live and
 * waiting); `prefers-reduced-motion` and the `still` attribute stop both.
 * Planning is dashed because the waiting frame's still twin is solid amber.
 * A state change never moves or resizes the pane inside. A host with a
 * height is filled: the paper takes the whole frame and the pane the whole
 * paper (a Theia dock panel, a terminal); a host without one takes its
 * height from the pane, as before.
 *
 * @slot - the pane content; with a host height, it fills the paper
 * @csspart inner - the paper inside the frame
 */
@customElement('sett-frame')
export class SettFrame extends LitElement {
  @property({ reflect: true }) state: FrameState = 'idle';

  /** session id for the live state; unknown ids fall back to yk */
  @property({ reflect: true }) session?: SessionId;

  /** force the reduced-motion rendering (solid colours, no animation) */
  @property({ type: Boolean, reflect: true }) still = false;

  static styles = [
    sessionStyles,
    css`
      :host {
        display: flex;
        flex-direction: column;
        position: relative;
        padding: var(--sett-stroke-frame);
        border-radius: var(--sett-radius-pane);
        background: var(--sett-color-line2);
      }
      .inner {
        flex: 1 1 auto;
        min-height: 0;
        display: flex;
        flex-direction: column;
        position: relative;
        z-index: 1;
        background: var(--sett-color-paper);
        border-radius: calc(var(--sett-radius-pane) - var(--sett-stroke-frame));
        overflow: hidden;
      }
      /* the pane fills the paper; with no host height there is no room to grow into */
      ::slotted(*) { flex: 1 1 auto; min-height: 0; }
      :host([state='editing']) { background: var(--sett-color-sel); }
      :host([state='collision']) { background: var(--sett-color-bad); }
      :host([state='planning']) { padding: 0; border: var(--sett-stroke-frame) dashed var(--sett-color-sug); background: var(--sett-color-paper); }
      :host([state='focus']) .inner { box-shadow: inset 0 0 0 var(--sett-stroke-lit) var(--sett-color-sel); }
      :host([state='live']) {
        background: linear-gradient(120deg, var(--_session), var(--_session-sub), var(--_session), var(--_session-sub), var(--_session));
        background-size: 300% 100%;
        animation: sett-frame-rotate var(--sett-motion-frame-rotate) linear infinite;
      }
      :host([state='waiting']) { background: var(--sett-color-sug-bg); }
      :host([state='waiting'])::before {
        content: '';
        position: absolute;
        inset: 0;
        border-radius: inherit;
        background: var(--sett-color-sug);
        animation: sett-frame-pulse var(--sett-motion-frame-pulse) ease-in-out infinite;
      }
      @keyframes sett-frame-rotate { from { background-position: 0% 50%; } to { background-position: 300% 50%; } }
      @keyframes sett-frame-pulse { 0%, 100% { opacity: 0.45; } 50% { opacity: 1; } }
      :host([still][state='live']) { animation: none; background: var(--_session); }
      :host([still][state='waiting'])::before { animation: none; opacity: 1; }
      @media (prefers-reduced-motion: reduce) {
        :host([state='live']) { animation: none; background: var(--_session); }
        :host([state='waiting'])::before { animation: none; opacity: 1; }
      }
    `,
  ];

  render() {
    return html`<div class="inner" part="inner"><slot></slot></div>`;
  }
}

declare global {
  interface HTMLElementTagNameMap { 'sett-frame': SettFrame }
}
