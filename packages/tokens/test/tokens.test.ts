import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const dist = (f: string) => readFileSync(join(__dirname, '..', 'dist', f), 'utf8');

describe('sett.css', () => {
  it('matches the snapshot', async () => {
    await expect(dist('sett.css')).toMatchFileSnapshot('__snapshots__/sett.css.snap');
  });
  it('has :root light, media dark and both data-theme selectors', () => {
    const css = dist('sett.css');
    expect(css.startsWith('/*')).toBe(true);
    expect(css).toMatch(/^:root \{/m);
    expect(css).toMatch(/@media \(prefers-color-scheme: dark\) \{\n {2}:root \{/);
    expect(css).toMatch(/^\[data-theme="dark"\] \{/m);
    expect(css).toMatch(/^\[data-theme="light"\] \{/m);
  });
  it('names follow --sett-<dtcg-path> in kebab case', () => {
    const css = dist('sett.css');
    for (const v of ['--sett-color-sel', '--sett-color-sel-bg', '--sett-session-yk-sub', '--sett-map-item-stroke', '--sett-radius-chip', '--sett-map-faded-opacity', '--sett-glyph-stepped-in'])
      expect(css).toContain(`${v}:`);
    expect(css).not.toMatch(/--sett-[a-z0-9-]*[A-Z]/);
  });
});

describe('tokens.json', () => {
  const j = JSON.parse(dist('tokens.json'));
  it('counts every token per source file', () => {
    expect({ base: j.base.length, light: j.light.length, dark: j.dark.length }).toEqual({ base: 49, light: 50, dark: 50 });
  });
  it('light and dark define the same paths in the same order', () => {
    expect(j.light.map((t: { name: string }) => t.name)).toEqual(j.dark.map((t: { name: string }) => t.name));
  });
  it('every colour is one css hex or rgba', () => {
    for (const t of [...j.light, ...j.dark].filter((t: { type: string }) => t.type === 'color'))
      expect(t.css).toMatch(/^(#[0-9A-F]{6}|rgba\(.+\))$/);
  });
});

describe('tokens.ts and tokens.rs', () => {
  it('ts exports the three sets and session order', () => {
    const ts = dist('tokens.ts');
    for (const s of ['export const base', 'export const light', 'export const dark', 'export const sessionOrder', 'export const cssVar']) expect(ts).toContain(s);
    expect(ts).toContain('"sel": "#1F5FA8"');
  });
  it('rs has a const per token with the spec types', () => {
    const rs = dist('tokens.rs');
    expect(rs).toContain('pub const COLOR_SEL: [f32; 3] = [0.1216, 0.3725, 0.6588];');
    expect(rs).toContain('pub const RADIUS_CHIP: f32 = 4.0;');
    expect(rs).toContain('pub const MAP_ITEM_STROKE: [f32; 3]');
    expect(rs).toMatch(/pub mod light \{[\s\S]*pub mod dark \{/);
  });
  it('the converter expressed everything', () => {
    expect(JSON.parse(dist('report.json')).unsupported).toEqual([]);
  });
});
