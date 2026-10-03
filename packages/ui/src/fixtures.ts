/**
 * The map's sample datasets, three real repositories read by the PoC: `ripgrep` (layered
 * crates), `zero2prod` (a hexagon) and `zed` (a large layered workspace). Its own entry,
 * `@tau-rs/sett/fixtures`, so the element bundle does not carry the data. Read them with
 * the helpers from the main entry: `unitOf`, `unitPorts`, `insideOf`, `linksOf`, ...
 */
import type { Fixture } from './map/fixtures.js';
import ripgrepJson from './map/fixtures/ripgrep.json' with { type: 'json' };
import zero2prodJson from './map/fixtures/zero2prod.json' with { type: 'json' };
import zedJson from './map/fixtures/zed.json' with { type: 'json' };

export const ripgrep = ripgrepJson as unknown as Fixture;
export const zero2prod = zero2prodJson as unknown as Fixture;
export const zed = zedJson as unknown as Fixture;
