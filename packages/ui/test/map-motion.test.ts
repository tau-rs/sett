import { afterEach, describe, expect, it } from 'vitest';
import { arrive, durationMs, flash, leave, presenceStyles, reducedMotion, wave } from '../src/map/motion.js';

const host = () => {
  const el = document.createElement('div');
  el.attachShadow({ mode: 'open' });
  document.body.appendChild(el);
  return el;
};
// happy-dom has no Web Animations; record what would play and let the test finish each animation by hand
const stubAnimate = () => {
  const calls: { el: Element; frames: Keyframe[]; opts: KeyframeAnimationOptions; done: () => void }[] = [];
  (Element.prototype as any).animate = function (frames: Keyframe[], opts: KeyframeAnimationOptions) {
    let done!: () => void;
    const finished = new Promise<void>((r) => { done = r; });
    calls.push({ el: this, frames, opts, done });
    return { finished };
  };
  return calls;
};
const setReduced = (on: boolean) => { (globalThis as any).matchMedia = () => ({ matches: on }); };

afterEach(() => { delete (Element.prototype as any).animate; delete (globalThis as any).matchMedia; document.body.innerHTML = ''; });

describe('map motion helpers', () => {
  it('reads duration tokens in milliseconds', () => {
    expect(durationMs('460ms')).toBe(460);
    expect(durationMs('2.8s')).toBe(2800);
  });
  it('shared styles use tokens only and never touch text', () => {
    const css = presenceStyles.cssText;
    expect(css).not.toMatch(/#[0-9a-fA-F]{3,8}\b/);
    expect(css).not.toMatch(/\d+px/);
    expect(css).not.toMatch(/font-size|letter-spacing|color:/);
    expect(css).toContain('@media (prefers-reduced-motion: reduce)');
    expect(css).toContain('var(--sett-map-presence-breath-min)');
  });
  it('an arrival blooms the host and rolls two waves outward, the second after the gap', async () => {
    const calls = stubAnimate(); setReduced(false);
    const h = host();
    const p = arrive(h);
    const waves = h.shadowRoot!.querySelectorAll('.sett-wave');
    expect(waves.length).toBe(2);
    const onWaves = calls.filter((c) => c.el !== h), onHost = calls.filter((c) => c.el === h);
    expect(onHost.length).toBe(1);
    expect(onHost[0].opts.duration).toBe(520);
    expect(onWaves.map((c) => c.opts.delay)).toEqual([0, 110]);
    expect(onWaves[0].opts.duration).toBe(460);
    expect(onWaves[0].frames[0].opacity).toBe(1);
    expect(onWaves[0].frames[1].opacity).toBe(0);
    calls.forEach((c) => c.done());
    await p;
    expect(h.shadowRoot!.querySelectorAll('.sett-wave').length).toBe(0);
  });
  it('a departure is one wave closing in', async () => {
    const calls = stubAnimate(); setReduced(false);
    const h = host();
    const p = leave(h);
    expect(calls.length).toBe(1);
    expect(calls[0].opts.duration).toBe(240);
    expect(calls[0].frames[0].opacity).toBe(0);
    expect(calls[0].frames[1].opacity).toBe(1);
    calls[0].done();
    await p;
    expect(h.shadowRoot!.children.length).toBe(0);
  });
  it('a unit takes the larger wave', () => {
    const calls = stubAnimate(); setReduced(false);
    wave(host(), { big: true });
    expect(String(calls[0].frames[1].inset)).toContain('--sett-map-size-wave-node');
  });
  it('a change flashes once for item-pulse', () => {
    const calls = stubAnimate(); setReduced(false);
    const h = host();
    flash(h);
    expect(calls[0].opts.duration).toBe(700);
    expect(h.shadowRoot!.querySelector('[part="flash"]')).not.toBeNull();
  });
  it('does nothing when the reader turned motion off', async () => {
    const calls = stubAnimate(); setReduced(true);
    const h = host();
    expect(reducedMotion()).toBe(true);
    await arrive(h); await leave(h); await flash(h);
    expect(calls.length).toBe(0);
    expect(h.shadowRoot!.children.length).toBe(0);
  });
  it('survives a browser without Web Animations', async () => {
    setReduced(false);
    const h = host();
    await arrive(h);
    expect(h.shadowRoot!.children.length).toBe(0);
  });
});
