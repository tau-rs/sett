#!/usr/bin/env node
// Sorts the modules of packages/ui/custom-elements.json by path and rewrites the file.
// `cem analyze` emits modules in glob order, which follows the file system and differs per
// machine; run as the last step of the ui build, this makes the committed manifest the same
// bytes wherever it is built, so CI can diff it against the checkout (.github/workflows/ci.yml).
//
// Declarations are left in source order: that order comes from the file, not the machine.
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

export const MANIFEST = join(dirname(fileURLToPath(import.meta.url)), '..', 'packages', 'ui', 'custom-elements.json');

/** Code-unit comparison: `localeCompare` would make the order depend on the machine's locale. */
const byPath = (a, b) => (a.path < b.path ? -1 : a.path > b.path ? 1 : 0);

/** A copy of the manifest with its modules sorted by path. */
export function sortManifest(manifest) {
  return { ...manifest, modules: [...manifest.modules].sort(byPath) };
}

/** The analyzer's own file format: two-space indent and a final newline. */
export function serialise(manifest) {
  return `${JSON.stringify(manifest, null, 2)}\n`;
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  const sorted = sortManifest(JSON.parse(readFileSync(MANIFEST, 'utf8')));
  writeFileSync(MANIFEST, serialise(sorted));
  console.log(`sort-manifest: ${sorted.modules.length} modules sorted by path → packages/ui/custom-elements.json`);
}
