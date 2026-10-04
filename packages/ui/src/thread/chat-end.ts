import type { ReactiveController, ReactiveControllerHost } from 'lit';
import { base } from '@tau-rs/sett-tokens';

const px = (v: string | number) => (typeof v === 'number' ? v : parseFloat(v));
/** how close to the end still counts as at the end (`size.thread.follow`) */
export const FOLLOW = px(base.size.thread.follow);

type Host = ReactiveControllerHost & HTMLElement;

/**
 * The chat-end rule (DESIGN.md rule 13). A conversation opens at its end and
 * follows new content while the reader is at the end; scrolling up stops it, and
 * it never pulls the reader back. Their own send brings them to the end. While
 * they are up, `unseen` counts the entries that arrived below; the pane draws it
 * as `n new · latest` in its fixed bar. Every jump is instant: § Motion lists no
 * scroll animation.
 *
 * `scroller` returns the shadow scroll box holding the default slot; `active`
 * says whether the pane holds a conversation now (a scroller that comes back,
 * e.g. on unfold, opens at the end again).
 */
export class ChatEnd implements ReactiveController {
  /** entries that arrived below while the reader was up */
  unseen = 0;
  private atEnd = true;
  /** the last scroll position seen, to tell a move up from content growing */
  private top = 0;
  private el?: HTMLElement;
  private slot?: HTMLSlotElement | null;
  private mo?: MutationObserver;
  private ro?: ResizeObserver;

  constructor(private host: Host, private scroller: () => HTMLElement | null | undefined, private active: () => boolean = () => true) {
    host.addController(this);
  }

  hostConnected() {
    this.host.addEventListener('sett-send', this.onSend);
    if (typeof MutationObserver === 'function') {
      this.mo = new MutationObserver(this.onMutate);
      this.mo.observe(this.host, { childList: true, subtree: true, characterData: true });
    }
  }
  hostDisconnected() {
    this.host.removeEventListener('sett-send', this.onSend);
    this.mo?.disconnect();
    this.detach();
  }
  hostUpdated() {
    const el = (this.active() && this.scroller()) || undefined;
    if (el === this.el) return;
    this.detach();
    if (el) this.attach(el);
  }

  /** go to the end now; the `latest` verb and your own send call this */
  jump = () => {
    if (!this.el) return;
    this.el.scrollTop = this.el.scrollHeight;
    this.top = this.el.scrollTop;
    this.atEnd = true;
    this.clear();
  };

  private attach(el: HTMLElement) {
    this.el = el;
    el.addEventListener('scroll', this.onScroll, { passive: true });
    this.slot = el.querySelector('slot');
    this.slot?.addEventListener('slotchange', this.watchContent);
    if (typeof ResizeObserver === 'function') this.ro = new ResizeObserver(this.keep);
    this.watchContent();
    this.jump();
  }
  private detach() {
    this.el?.removeEventListener('scroll', this.onScroll);
    this.slot?.removeEventListener('slotchange', this.watchContent);
    this.ro?.disconnect();
    this.el = this.slot = this.ro = undefined;
  }
  /** the box and every entry in it: an entry that draws itself later, or a pane that shrinks, keeps the end */
  private watchContent = () => {
    if (!this.ro || !this.el) return;
    this.ro.disconnect();
    this.ro.observe(this.el);
    for (const c of this.slot?.assignedElements() ?? []) this.ro.observe(c);
  };
  private keep = () => { if (this.atEnd) this.jump(); };
  private clear() {
    if (!this.unseen) return;
    this.unseen = 0;
    this.host.requestUpdate();
  }
  /**
   * Only the reader moving up stops following: content that grows under a pane at
   * its end also fires `scroll` (the browser's anchoring), and must not read as a
   * scroll up.
   */
  private onScroll = () => {
    const el = this.el!;
    const near = el.scrollHeight - el.scrollTop - el.clientHeight <= FOLLOW;
    const up = el.scrollTop < this.top;
    this.top = el.scrollTop;
    if (near) { this.atEnd = true; this.clear(); }
    else if (up) this.atEnd = false;
    else if (this.atEnd) this.jump();
  };
  private onMutate = (records: MutationRecord[]) => {
    if (!this.el) return;
    if (this.atEnd) { this.jump(); return; }
    const arrived = records.filter((r) => r.target === this.host)
      .reduce((n, r) => n + Array.from(r.addedNodes).filter((a) => a instanceof Element && !a.slot).length, 0);
    if (!arrived) return;
    this.unseen += arrived;
    this.host.requestUpdate();
  };
  private onSend = (e: Event) => {
    if (String((e as CustomEvent).detail?.text ?? '').trim()) this.jump();
  };
}
