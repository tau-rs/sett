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
    for (const v of ['--sett-color-sel', '--sett-color-sel-bg', '--sett-session-yk-sub', '--sett-map-kind-rpc-color', '--sett-radius-chip', '--sett-map-threshold-fold-floor', '--sett-glyph-taken-over', '--sett-glyph-stepped-in'])
      expect(css).toContain(`${v}:`);
    expect(css).not.toMatch(/--sett-[a-z0-9-]*[A-Z]/);
  });
});

describe('tokens.json', () => {
  const j = JSON.parse(dist('tokens.json'));
  it('counts every token per source file', () => {
    expect({ base: j.base.length, light: j.light.length, dark: j.dark.length }).toEqual({ base: 160, light: 97, dark: 97 });
  });
  it('the shell sizes of the arch V1 spec §4 are tokens', () => {
    const px = Object.fromEntries(j.base.map((t: { name: string; css: string }) => [t.name, t.css]));
    const shell = { bar: 44, rail: 56, 'pane-min': 260, 'pane-max': 280, inspector: 330, handle: 28, strip: 30, status: 26, 'scope-bar': 2, 'presence-bar': 3, row: 26 };
    for (const [k, v] of Object.entries(shell)) expect(px[`--sett-size-shell-${k}`], k).toBe(`${v}px`);
  });
  it('the chat-end distance is a token (rule 13, #129)', () => {
    const px = Object.fromEntries(j.base.map((t: { name: string; css: string }) => [t.name, t.css]));
    expect(px['--sett-size-thread-follow']).toBe('48px');
  });
  it('every map motion named in DESIGN.md has a duration or easing token', () => {
    const names = j.base.map((t: { name: string }) => t.name);
    for (const m of ['breath', 'hover', 'fold', 'draw', 'wave-in', 'wave-out', 'wave-gap', 'bloom', 'ignite', 'pop', 'kick', 'cool', 'ease-in', 'ease-out', 'ease-fold', 'ease-spring', 'zoom', 'tier-swap', 'flow', 'item-pulse'])
      expect(names, m).toContain(`--sett-motion-${m}`);
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
  it('the unresolved surface is the amber tint in both themes, never a new hex', () => {
    for (const set of [j.light, j.dark]) {
      const css = Object.fromEntries(set.map((t: { name: string; css: string }) => [t.name, t.css]));
      expect(css['--sett-map-surface-unresolved']).toBe(css['--sett-color-sug-bg']);
    }
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
  it('every workbench id takes a color.* token, in the seven chrome groups of arch-design#47', async () => {
    const { COLORS, WORKBENCH } = await import('../theme.mjs');
    const groups = /^(activityBar|activityBarBadge|sideBar|sideBarSectionHeader|editorGroupHeader|tab|statusBar|statusBarItem|panel|panelTitle|panelInput|menu|menubar|titleBar)\./;
    expect(Object.keys(WORKBENCH).length).toBeGreaterThan(40);
    for (const [id, path] of Object.entries(WORKBENCH)) {
      expect(id, id).toMatch(groups);
      expect(path, id).toMatch(/^color\./);
      expect(Object.keys(COLORS), id).not.toContain(id);
      for (const set of ['light', 'dark'] as const) {
        const t = tokens[set].find((t: { path: string[] }) => t.path.join('.') === path);
        expect(t?.type, `${set} ${id} → ${path}`).toBe('color');
        expect(themes[set].colors[id], `${set} ${id}`).toBe(t.css);
      }
    }
  });
  it('every workbench text id reads at 4.5:1 or better on its background, both themes', async () => {
    const { WORKBENCH } = await import('../theme.mjs');
    // text id → the id of the surface it sits on
    const pairs: Record<string, string> = {
      'activityBar.foreground': 'activityBar.activeBackground',
      'activityBar.inactiveForeground': 'activityBar.background',
      'activityBarBadge.foreground': 'activityBarBadge.background',
      'sideBar.foreground': 'sideBar.background',
      'sideBarSectionHeader.foreground': 'sideBarSectionHeader.background',
      'tab.activeForeground': 'tab.activeBackground',
      'tab.inactiveForeground': 'tab.inactiveBackground',
      'tab.unfocusedActiveForeground': 'tab.unfocusedActiveBackground',
      'tab.unfocusedInactiveForeground': 'tab.inactiveBackground',
      'statusBar.foreground': 'statusBar.background',
      'statusBar.noFolderForeground': 'statusBar.noFolderBackground',
      'statusBarItem.hoverForeground': 'statusBarItem.hoverBackground',
      'statusBarItem.errorForeground': 'statusBarItem.errorBackground',
      'statusBarItem.warningForeground': 'statusBarItem.warningBackground',
      'statusBarItem.remoteForeground': 'statusBarItem.remoteBackground',
      'panelTitle.activeForeground': 'panel.background',
      'panelTitle.inactiveForeground': 'panel.background',
      'titleBar.activeForeground': 'titleBar.activeBackground',
      'titleBar.inactiveForeground': 'titleBar.inactiveBackground',
      'menu.foreground': 'menu.background',
      'menu.selectionForeground': 'menu.selectionBackground',
      'menubar.selectionForeground': 'menubar.selectionBackground',
    };
    const text = Object.keys(WORKBENCH).filter((id) => /[Ff]oreground$/.test(id));
    expect(Object.keys(pairs).sort(), 'every text id has a pair, every pair is a text id').toEqual(text.sort());
    const lum = (hex: string) => {
      const [r, g, b] = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255).map((c) => (c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4));
      return 0.2126 * r + 0.7152 * g + 0.0722 * b;
    };
    const ratio = (a: string, b: string) => { const [hi, lo] = [lum(a), lum(b)].sort((x, y) => y - x); return (hi + 0.05) / (lo + 0.05); };
    for (const set of ['light', 'dark'] as const) {
      const c = themes[set].colors;
      for (const [fg, bg] of Object.entries(pairs)) {
        expect(c[fg], `${set} ${fg} is opaque`).toMatch(/^#[0-9A-F]{6}$/);
        expect(c[bg], `${set} ${bg} is opaque`).toMatch(/^#[0-9A-F]{6}$/);
        expect(ratio(c[fg], c[bg]), `${set} ${fg} on ${bg}`).toBeGreaterThanOrEqual(4.5);
      }
    }
  });
  it('light and dark map the same ids, scopes and selectors', () => {
    expect(Object.keys(themes.light.colors)).toEqual(Object.keys(themes.dark.colors));
    expect(Object.keys(themes.light.semanticTokenColors)).toEqual(Object.keys(themes.dark.semanticTokenColors));
    expect(themes.light.tokenColors.map((r: { scope: string[] }) => r.scope)).toEqual(themes.dark.tokenColors.map((r: { scope: string[] }) => r.scope));
    expect(themes.light.colors['editor.background']).not.toBe(themes.dark.colors['editor.background']);
  });
});
