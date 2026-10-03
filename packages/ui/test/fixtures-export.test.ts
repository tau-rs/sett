import { describe, expect, it } from 'vitest';
import { PORT_KINDS, insideOf, unitPorts } from '../src/index.js';
import * as main from '../src/index.js';
import { ripgrep, zero2prod, zed } from '../src/fixtures.js';

const all = { ripgrep, zero2prod, zed };

describe('the sample datasets, as @tau-rs/sett/fixtures exports them', () => {
  it('exports the three repositories by name', () => {
    expect(Object.values(all).map((f) => f.name)).toEqual(['ripgrep', 'zero2prod', 'zed-industries']);
  });
  it('every unit of every repository reads through unitPorts', () => {
    for (const f of Object.values(all))
      for (const r of Object.values(f.repos))
        for (const u of r.units) {
          const { exposes, needs } = unitPorts(f, u.id);
          for (const p of [...exposes, ...needs]) expect(PORT_KINDS, `${f.name} ${u.id} ${p.name}`).toContain(p.kind);
        }
    expect(unitPorts(zed, 'llm'), 'a unit only drawn as a neighbour has no ports').toEqual({ exposes: [], needs: [] });
  });
  it('every unit with an inside reads through insideOf, columns with areas', () => {
    for (const f of Object.values(all))
      for (const id of Object.keys(f.units)) {
        const cols = insideOf(f, id);
        expect(cols.length, `${f.name} ${id}`).toBeGreaterThan(0);
        expect(cols.flatMap((c) => c.areas).length, `${f.name} ${id}`).toBeGreaterThan(0);
      }
  });
  it('stays out of the element entry, so dist/sett.js does not carry the data', () => {
    for (const name of Object.keys(all)) expect(main).not.toHaveProperty(name);
  });
});
