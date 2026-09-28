// The agent layer (llms.txt, skills/sett/SKILL.md) is generated from the element manifest,
// the stories index and DESIGN.md by scripts/gen-agent-layer.mjs. These tests render it again
// from the built inputs and fail when the committed files differ: a component API, story or
// rule change that was not followed by `pnpm build` (which regenerates them) is caught here.
// Needs `pnpm -r build` first for the manifest and storybook-static/index.json.
import { describe, expect, test } from 'vitest';
import { readFileSync } from 'node:fs';
import { INPUTS, OUTPUTS, designSections, elements, readInputs, render } from '../../../scripts/gen-agent-layer.mjs';

const inputs = readInputs();
const fresh = render(inputs);
const committed = { llms: readFileSync(OUTPUTS.llms, 'utf8'), skill: readFileSync(OUTPUTS.skill, 'utf8') };
const els = elements(inputs);
const storyIds = new Set(Object.values(inputs.index.entries as Record<string, { id: string; type: string }>).filter((e) => e.type === 'story').map((e) => e.id));
const hex = /#[0-9a-fA-F]{6}\b/;

describe('generated files are current', () => {
  test('llms.txt matches a fresh render (else: run pnpm build)', () => { expect(committed.llms).toBe(fresh.llms); });
  test('skills/sett/SKILL.md matches a fresh render (else: run pnpm build)', () => { expect(committed.skill).toBe(fresh.skill); });
  test('the render is stable across manifest module order', () => {
    const reversed = { ...inputs, manifest: { ...inputs.manifest, modules: [...inputs.manifest.modules].reverse() } };
    expect(render(reversed)).toEqual(fresh);
  });
});

describe('llms.txt', () => {
  const lines = fresh.llms.split('\n');
  test('one line per element with attrs, slots, parts, events and stories', () => {
    expect(els.length).toBeGreaterThanOrEqual(35);
    for (const e of els) {
      const line = lines.filter((l) => l.startsWith(`- ${e.tag}: `));
      expect(line, e.tag).toHaveLength(1);
      for (const col of ['attrs:', 'slots:', 'parts:', 'events:', 'stories:']) expect(line[0], `${e.tag} ${col}`).toContain(` · ${col} `);
      for (const a of e.attributes) expect(line[0], `${e.tag} attr ${a.name}`).toContain(a.name);
      for (const s of e.slots) expect(line[0], `${e.tag} slot ${s.name}`).toContain(s.name);
      for (const p of e.parts) expect(line[0], `${e.tag} part ${p.name}`).toContain(p.name);
    }
  });
  test('every element has at least one story, and every story id listed exists in the index', () => {
    for (const e of els) expect(e.stories.length, `${e.tag} has no story`).toBeGreaterThan(0);
    const listed = fresh.llms.match(/\b[a-z0-9-]+--[a-z0-9-]+\b(?= \()/g) ?? [];
    expect(listed.length).toBeGreaterThan(0);
    for (const id of listed) expect(storyIds.has(id), id).toBe(true);
  });
  test('every story in the index is reachable from llms.txt', () => {
    for (const id of storyIds) expect(fresh.llms, id).toContain(`${id} (`);
  });
  test('no raw hex', () => { expect(fresh.llms).not.toMatch(hex); });
});

describe('skills/sett/SKILL.md', () => {
  test('has skill front matter', () => { expect(fresh.skill.startsWith('---\nname: sett\ndescription: ')).toBe(true); });
  test('carries every numbered rule and the colour rule from DESIGN.md, verbatim', () => {
    const sections = designSections(readFileSync(INPUTS.design, 'utf8'));
    const rules = sections['Rules the components encode'].split('\n').filter((l) => /^\d+\. /.test(l));
    expect(rules.length).toBeGreaterThanOrEqual(12);
    for (const r of rules) expect(fresh.skill).toContain(r);
    for (const l of sections['Colours'].split('\n')) expect(fresh.skill).toContain(l);
    expect(fresh.skill).toContain(sections['Motion']);
    expect(fresh.skill, 'front matter must not leak').not.toContain('tokens: ./packages/tokens/src');
  });
  test('says how to reference tokens and how to find a story', () => {
    expect(fresh.skill).toContain('var(--sett-color-sel)');
    expect(fresh.skill).toContain("from '@tau-rs/sett-tokens'");
    expect(fresh.skill).toContain('https://tau-rs.github.io/sett/?path=/story/<id>');
    expect(fresh.skill).toContain('https://tau-rs.github.io/sett/index.json');
  });
  test('documents every element with its attributes and stories', () => {
    for (const e of els) {
      expect(fresh.skill).toContain(`### \`<${e.tag}>\``);
      for (const a of e.attributes) expect(fresh.skill, `${e.tag} ${a.name}`).toContain(`\`${a.name}`);
      for (const s of e.stories) expect(fresh.skill, `${e.tag} ${s.id}`).toContain(`\`${s.id}\``);
    }
  });
  test('no raw hex', () => { expect(fresh.skill).not.toMatch(hex); });
});
