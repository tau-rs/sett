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
    for (const v of ['--sett-color-sel', '--sett-color-sel-bg', '--sett-session-yk-sub', '--sett-map-kind-rpc-color', '--sett-radius-chip', '--sett-map-threshold-fold-floor', '--sett-glyph-stepped-in'])
      expect(css).toContain(`${v}:`);
    expect(css).not.toMatch(/--sett-[a-z0-9-]*[A-Z]/);
  });
});

describe('tokens.json', () => {
  const j = JSON.parse(dist('tokens.json'));
  it('counts every token per source file', () => {
    expect({ base: j.base.length, light: j.light.length, dark: j.dark.length }).toEqual({ base: 107, light: 93, dark: 93 });
  });
  it('light and dark define the same paths in the same order', () => {
    expect(j.light.map((t: { name: string }) => t.name)).toEqual(j.dark.map((t: { name: string }) => t.name));
  });
  it('map kinds and methods alias the palette, never a new hex', () => {
    const light = Object.fromEntries(j.light.map((t: { name: string; css: string }) => [t.name, t.css]));
    expect(light['--sett-map-kind-rpc-color']).toBe(light['--sett-color-sel']);
    expect(light['--sett-map-kind-pub-color']).toBe(light['--sett-session-yk-main']);
    expect(light['--sett-map-method-delete']).toBe(light['--sett-color-bad']);
    expect(light['--sett-map-status-port-bg']).toBe(light['--sett-map-surface-domain']);
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
    expect(rs).toContain('pub const MAP_SURFACE_DRIVING: [f32; 3]');
    expect(rs).toContain('pub const MAP_KIND_TOPIC_STROKE: &[f32] = &[7.0, 4.0];');
    expect(rs).toContain('pub const MAP_KIND_RPC_STROKE: &[f32] = &[];');
    expect(rs).toContain('pub const MAP_SHADOW_FOCUS: &[Shadow]');
    expect(rs).toMatch(/pub mod light \{[\s\S]*pub mod dark \{/);
  });
  it('the converter expressed everything', () => {
    expect(JSON.parse(dist('report.json')).unsupported).toEqual([]);
  });
});

describe('sett-theme.{light,dark}.json (Theia colour theme)', () => {
  const themes = { light: JSON.parse(dist('sett-theme.light.json')), dark: JSON.parse(dist('sett-theme.dark.json')) };
  const tokens = JSON.parse(dist('tokens.json'));
  const hexes = /#[0-9A-F]{6}(?:[0-9A-F]{2})?\b/g;
  const pathsOf = (set: 'light' | 'dark', group: string) => tokens[set].filter((t: { path: string[] }) => t.path[0] === group).map((t: { path: string[] }) => t.path.join('.'));

  it('match the snapshots', async () => {
    await expect(dist('sett-theme.light.json')).toMatchFileSnapshot('__snapshots__/sett-theme.light.json.snap');
    await expect(dist('sett-theme.dark.json')).toMatchFileSnapshot('__snapshots__/sett-theme.dark.json.snap');
  });
  it('are VS Code colour themes of the right type with semantic highlighting on', () => {
    for (const [type, theme] of Object.entries(themes)) {
      expect(theme.$schema).toBe('vscode://schemas/color-theme');
      expect(theme.name).toBe(`sett ${type}`);
      expect(theme.type).toBe(type);
      expect(theme.semanticHighlighting).toBe(true);
      expect(Object.keys(theme.colors).length).toBeGreaterThan(40);
    }
  });
  it('every colour in a theme is a colour token of that set, nothing invented', async () => {
    for (const set of ['light', 'dark'] as const) {
      const known = new Set(tokens[set].filter((t: { type: string }) => t.type === 'color').map((t: { css: string }) => t.css));
      const used = dist(`sett-theme.${set}.json`).match(hexes) ?? [];
      expect(used.length).toBeGreaterThan(0);
      for (const h of used) expect(known.has(h), `${set}: ${h}`).toBe(true);
      expect(dist(`sett-theme.${set}.json`)).not.toContain('var(--');
    }
  });
  it('every syntax class colours a semantic token and a TextMate scope', async () => {
    const { SEMANTIC, TEXTMATE } = await import('../theme.mjs');
    for (const set of ['light', 'dark'] as const) {
      const theme = themes[set];
      const byPath = new Map(tokens[set].map((t: { path: string[]; css: string }) => [t.path.join('.'), t.css]));
      const classes = pathsOf(set, 'syntax').map((p: string) => p.split('.')[1]);
      expect(classes).toEqual(['keyword', 'string', 'constant', 'type', 'function', 'macro', 'attribute', 'comment']);
      for (const cls of classes) {
        const hex = byPath.get(`syntax.${cls}`);
        expect(Object.keys(SEMANTIC), cls).toContain(cls);
        expect(Object.keys(TEXTMATE), cls).toContain(cls);
        for (const sel of SEMANTIC[cls as keyof typeof SEMANTIC]) expect(theme.semanticTokenColors[sel], `${set} ${sel}`).toBe(hex);
        const rule = theme.tokenColors.find((r: { name: string }) => r.name === `sett ${cls}`);
        expect(rule?.scope, `${set} ${cls}`).toEqual(TEXTMATE[cls as keyof typeof TEXTMATE]);
        expect(rule?.settings.foreground).toBe(hex);
      }
      expect(theme.semanticTokenColors.keyword).toBe(theme.semanticTokenColors['*.declaration']);
    }
  });
  it('every editor.* token reaches a Theia colour id, or is listed as decoration-only', async () => {
    const { COLORS, DECORATION_ONLY } = await import('../theme.mjs');
    const mapped = new Set(Object.values(COLORS));
    for (const set of ['light', 'dark'] as const) {
      for (const p of pathsOf(set, 'editor')) expect(mapped.has(p) || DECORATION_ONLY.includes(p), `${set} ${p}`).toBe(true);
      for (const p of DECORATION_ONLY) expect(pathsOf(set, 'editor'), p).toContain(p);
      for (const p of mapped) expect(tokens[set].some((t: { path: string[] }) => t.path.join('.') === p), `${set} ${p}`).toBe(true);
    }
  });
  it('light and dark map the same ids, scopes and selectors', () => {
    expect(Object.keys(themes.light.colors)).toEqual(Object.keys(themes.dark.colors));
    expect(Object.keys(themes.light.semanticTokenColors)).toEqual(Object.keys(themes.dark.semanticTokenColors));
    expect(themes.light.tokenColors.map((r: { scope: string[] }) => r.scope)).toEqual(themes.dark.tokenColors.map((r: { scope: string[] }) => r.scope));
    expect(themes.light.colors['editor.background']).not.toBe(themes.dark.colors['editor.background']);
  });
});
