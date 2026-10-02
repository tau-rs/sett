import { beforeAll, describe, expect, it } from 'vitest';
import '../src/index.js';

type El = HTMLElement & { updateComplete: Promise<boolean>; [k: string]: any };
const cssOf = (tag: string) => { const s = (customElements.get(tag) as any).styles; return (Array.isArray(s) ? s : [s]).map((x: any) => x.cssText).join('\n'); };

beforeAll(() => customElements.whenDefined('sett-column'));

describe('sett-column', () => {
  const col = async (markup: string) => { document.body.innerHTML = markup; const el = document.body.firstElementChild as El; await el.updateComplete; return el; };
  it('uses tokens only and never animates', () => {
    const css = cssOf('sett-column');
    expect(css).not.toMatch(/#[0-9a-fA-F]{3,8}\b/);
    expect(css).not.toMatch(/\d+px/);
    expect(css).not.toMatch(/animation|transition/);
    for (const k of ['driving', 'domain', 'driven']) expect(css).toContain(`:host([kind='${k}']) { background: var(--sett-map-surface-${k}); }`);
  });
  it('says its kind only when the label does not', async () => {
    expect((await col('<sett-column kind="driving" label="routes · driving"></sett-column>')).shadowRoot!.querySelector('em')).toBeNull();
    expect((await col('<sett-column kind="driven" label="sinks"></sett-column>')).shadowRoot!.querySelector('em')!.textContent).toBe('driven');
    expect((await col('<sett-column kind="layer" label="L1 · platform"></sett-column>')).shadowRoot!.querySelector('em')).toBeNull();
  });
});
