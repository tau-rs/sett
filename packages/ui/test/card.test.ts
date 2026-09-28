import { beforeAll, describe, expect, it } from 'vitest';
import '../src/index.js';

const cssOf = (tag: string) => ([] as any[]).concat((customElements.get(tag) as any).styles).map((s: any) => s.cssText).join('\n');
const mount = async (m: string) => { document.body.innerHTML = m; const el = document.body.firstElementChild as any; await el.updateComplete; return el; };
beforeAll(() => Promise.all(['sett-card', 'sett-card-row', 'sett-pipe'].map((t) => customElements.whenDefined(t))));

describe('cards', () => {
  it('use tokens only and never animate', () => {
    for (const t of ['sett-card', 'sett-card-row', 'sett-pipe']) {
      const c = cssOf(t);
      expect(c, t).not.toMatch(/#[0-9a-fA-F]{3,8}\b/);
      expect(c, t).not.toMatch(/\d+px/);
      expect(c, t).not.toMatch(/animation/);
    }
  });
  it('variants set the border', () => {
    const c = cssOf('sett-card');
    expect(c).toMatch(/\[variant='fix'\]\) \{ border-style: dashed; border-color: var\(--sett-color-sel\)/);
    expect(c).toMatch(/\[variant='delta'\]\) \{ border-color: var\(--sett-color-sug\)/);
    expect(c).toMatch(/\[variant='result'\]\) \{ border-color: var\(--sett-color-ok\); background: var\(--sett-color-ok-bg\)/);
  });
  it('a row with a place draws a mono tag and a chevron, and is a link', async () => {
    const el = await mount('<sett-card-row mark="▸" place="service.rs:61">api::pay</sett-card-row>');
    const tag = el.shadowRoot.querySelector('sett-tag');
    expect(tag.hasAttribute('mono')).toBe(true); expect(tag.textContent).toBe('service.rs:61');
    expect(el.shadowRoot.querySelector('.chev').textContent).toBe('›');
    expect(el.getAttribute('role')).toBe('link');
    let d: any; el.addEventListener('sett-go', (e: any) => (d = e.detail)); el.click();
    expect(d).toEqual({ place: 'service.rs:61' });
  });
  it('a row with a nav draws a grey word; a plain row is not a link', async () => {
    const el = await mount('<sett-card-row mark="✕" kind="bad" nav="pipeline">tests · 3 failed</sett-card-row>');
    expect(el.shadowRoot.querySelector('.nav').textContent).toBe('pipeline');
    let d: any; el.addEventListener('sett-go', (e: any) => (d = e.detail)); el.click();
    expect(d).toEqual({ nav: 'pipeline' });
    const plain = await mount('<sett-card-row mark="·">fact</sett-card-row>');
    expect(plain.getAttribute('role')).toBeNull();
    expect(plain.shadowRoot.querySelector('.chev')).toBeNull();
  });
  it('pipe renders one segment per step', async () => {
    const el = await mount('<sett-pipe steps="ok,ok,run,pending"></sett-pipe>');
    const segs = Array.from(el.shadowRoot.querySelectorAll('span')).map((s: any) => s.dataset.s);
    expect(segs).toEqual(['ok', 'ok', 'run', 'pending']);
  });
});
