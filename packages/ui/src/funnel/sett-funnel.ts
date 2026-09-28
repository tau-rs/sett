import { LitElement, css, html } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { base } from '@tau-rs/sett-tokens';

/**
 * Onboarding progress: a stepper. A circle per step, ✓ when done, filled for
 * the current one, a number for the rest, a thin line between.
 *
 * @slot - sett-funnel-step elements
 */
@customElement('sett-funnel')
export class SettFunnel extends LitElement {
  /** 1-based index of the current step */
  @property({ type: Number }) current = 1;
  static styles = css`
    :host { display: inline-flex; align-items: center; font-family: var(--sett-font-sans); font-size: var(--sett-font-size-md); }
  `;
  private apply() {
    Array.from(this.querySelectorAll('sett-funnel-step')).forEach((el, i) => {
      const n = i + 1;
      (el as SettFunnelStep).index = n;
      (el as SettFunnelStep).state = n < this.current ? 'done' : n === this.current ? 'current' : 'pending';
      (el as SettFunnelStep).first = i === 0;
    });
  }
  updated() { this.apply(); }
  render() { return html`<slot @slotchange=${this.apply}></slot>`; }
}

/** One step of the funnel. State and number are set by the parent. @slot - the label */
@customElement('sett-funnel-step')
export class SettFunnelStep extends LitElement {
  @property({ reflect: true }) state: 'done' | 'current' | 'pending' = 'pending';
  @property({ type: Number }) index = 1;
  @property({ type: Boolean, reflect: true }) first = false;
  static styles = css`
    :host { display: inline-flex; align-items: center; gap: var(--sett-space-1); color: var(--sett-color-ink2); white-space: nowrap; }
    :host([state='current']) { color: var(--sett-color-ink); font-weight: var(--sett-font-weight-medium); }
    .l { width: var(--sett-space-5); height: var(--sett-stroke-hair); background: var(--sett-color-line); margin: 0 var(--sett-space-2) 0 var(--sett-space-1); }
    :host([first]) .l { display: none; }
    :host([state='done']) .l { background: var(--sett-color-ok); }
    :host([state='current']) .l { background: var(--sett-color-ok); }
    i { width: var(--sett-space-4); height: var(--sett-space-4); box-sizing: border-box; border-radius: var(--sett-radius-node); border: var(--sett-stroke-hair) solid var(--sett-color-line); display: inline-grid; place-items: center; font-style: normal; font-size: var(--sett-font-size-xs); color: var(--sett-color-mute); }
    :host([state='done']) i { background: var(--sett-color-ok-bg); border-color: var(--sett-color-ok); color: var(--sett-color-ok); }
    :host([state='current']) i { background: var(--sett-color-sel); border-color: var(--sett-color-sel); color: var(--sett-color-paper); }
  `;
  render() { return html`<span class="l"></span><i>${this.state === 'done' ? base.glyph.done : this.index}</i><slot></slot>`; }
}

declare global { interface HTMLElementTagNameMap { 'sett-funnel': SettFunnel; 'sett-funnel-step': SettFunnelStep } }
