// `cem analyze` emits modules in glob order, which follows the file system and differs per
// machine. scripts/sort-manifest.mjs runs as the last step of the ui build and sorts them by
// path, so the committed custom-elements.json is the same bytes wherever it is built.
import { describe, expect, it } from 'vitest';
import { serialise, sortManifest } from '../../../scripts/sort-manifest.mjs';

const mod = (path: string, ...names: string[]) => ({ kind: 'javascript-module', path, declarations: names.map((name) => ({ kind: 'class', name })), exports: [] });
const manifest = (...modules: ReturnType<typeof mod>[]) => ({ schemaVersion: '1.0.0', readme: '', modules });
const paths = (m: { modules: { path: string }[] }) => m.modules.map((x) => x.path);

describe('sort-manifest', () => {
  it('sorts modules by path, whatever order the analyzer emitted them in', () => {
    const linux = manifest(mod('src/index.ts'), mod('src/editor/sett-hint.ts'), mod('src/chip/sett-chip.ts'), mod('src/map/tier.ts'), mod('src/menu/sett-menu.ts'));
    const mac = manifest(mod('src/index.ts'), mod('src/chip/sett-chip.ts'), mod('src/editor/sett-hint.ts'), mod('src/menu/sett-menu.ts'), mod('src/map/tier.ts'));
    expect(paths(sortManifest(linux))).toEqual(['src/chip/sett-chip.ts', 'src/editor/sett-hint.ts', 'src/index.ts', 'src/map/tier.ts', 'src/menu/sett-menu.ts']);
    expect(serialise(sortManifest(mac))).toBe(serialise(sortManifest(linux)));
  });
  it('compares by code unit, not by locale: the order cannot depend on the machine language', () => {
    const sorted = sortManifest(manifest(mod('src/session.ts'), mod('src/a.ts'), mod('src/session-card/sett-session-card.ts'), mod('src/Z.ts')));
    expect(paths(sorted)).toEqual(['src/Z.ts', 'src/a.ts', 'src/session-card/sett-session-card.ts', 'src/session.ts']);
  });
  it('leaves declarations in source order and every other key as it was', () => {
    const input = manifest(mod('src/b.ts', 'Zed', 'Alpha'), mod('src/a.ts', 'Only'));
    const sorted = sortManifest(input);
    expect(sorted.modules[1].declarations.map((d: { name: string }) => d.name)).toEqual(['Zed', 'Alpha']);
    expect(Object.keys(sorted)).toEqual(['schemaVersion', 'readme', 'modules']);
    expect(paths(input), 'the input is not mutated').toEqual(['src/b.ts', 'src/a.ts']);
  });
  it('serialises the way the analyzer writes: two-space indent and a final newline', () => {
    const m = manifest(mod('src/a.ts'));
    expect(serialise(m)).toBe(`${JSON.stringify(m, null, 2)}\n`);
  });
});
