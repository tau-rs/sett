import { beforeAll, describe, expect, it } from 'vitest';
import '../src/index.js';
import { sessionOrder } from '../src/index.js';

const mount = async (markup: string) => {
  document.body.innerHTML = markup;
  const el = document.body.firstElementChild as HTMLElement & { updateComplete: Promise<boolean> };
  await el.updateComplete;
  return el;
};

beforeAll(async () => {
  await customElements.whenDefined('sett-pill');
  await customElements.whenDefined('sett-tag');
});

describe('sett-pill', () => {
  it('defines the element and reflects kind', async () => {
    const el = await mount('<sett-pill kind="bad">1 finding</sett-pill>');
    expect(el.shadowRoot?.querySelector('slot')).not.toBeNull();
    expect(el.getAttribute('kind')).toBe('bad');
  });
  it('accepts every session id and nothing else in its styles', () => {
    const cssText = (customElements.get('sett-pill') as any).styles.map((s: any) => s.cssText).join('\n');
    for (const id of sessionOrder) expect(cssText).toContain(`:host([session="${id}"])`);
    expect(cssText).not.toMatch(/#[0-9a-fA-F]{3,8}\b/);
    expect(cssText).not.toMatch(/\d+px/);
    expect(cssText).not.toMatch(/animation/);
  });
});

describe('sett-tag', () => {
  it('reflects mono and kind', async () => {
    const el = await mount('<sett-tag mono kind="sel">service.rs:61</sett-tag>');
    expect(el.hasAttribute('mono')).toBe(true);
    expect(el.getAttribute('kind')).toBe('sel');
  });
  it('uses tokens only', () => {
    const cssText = (customElements.get('sett-tag') as any).styles.map((s: any) => s.cssText).join('\n');
    expect(cssText).not.toMatch(/#[0-9a-fA-F]{3,8}\b/);
    expect(cssText).not.toMatch(/\d+px/);
    expect(cssText).not.toMatch(/animation/);
  });
});
