import { beforeAll, describe, expect, it } from 'vitest';
import { render } from 'lit';
import '../src/index.js';
import * as chipStories from '../src/chip/sett-chip.stories.js';
import * as recipeStories from '../src/recipes/recipes.stories.js';

const mount = async (markup: string) => {
  document.body.innerHTML = markup;
  const el = document.body.firstElementChild as HTMLElement & { updateComplete: Promise<boolean> };
  await el.updateComplete;
  return el;
};
const slotOrder = (el: HTMLElement) => Array.from(el.shadowRoot!.querySelectorAll('.verbs slot')).map((s) => s.getAttribute('name'));

beforeAll(() => customElements.whenDefined('sett-chip'));

describe('sett-chip', () => {
  it('uses tokens only and never animates', () => {
    const cssText = (customElements.get('sett-chip') as any).styles.map((s: any) => s.cssText).join('\n');
    expect(cssText).not.toMatch(/#[0-9a-fA-F]{3,8}\b/);
    expect(cssText).not.toMatch(/\d+px/);
    expect(cssText).not.toMatch(/animation/);
  });
  it('agent door first by default, manual first with me-first', async () => {
    const a = await mount('<sett-chip kind="git">behind main<a slot="agent">with Yokohama</a><a slot="manual">update myself</a></sett-chip>');
    expect(slotOrder(a)).toEqual(['agent', 'manual', 'verb']);
    expect(a.shadowRoot!.querySelector('.primary slot')!.getAttribute('name')).toBe('agent');
    const b = await mount('<sett-chip kind="git" me-first>behind main<a slot="agent">with Yokohama</a><a slot="manual">update myself</a></sett-chip>');
    expect(slotOrder(b)).toEqual(['manual', 'agent', 'verb']);
    expect(b.shadowRoot!.querySelector('.primary slot')!.getAttribute('name')).toBe('manual');
  });
  it('maps kind and state to the label', async () => {
    const tag = async (m: string) => (await mount(m)).shadowRoot!.querySelector('sett-tag')!;
    expect((await tag('<sett-chip kind="finding">x</sett-chip>')).getAttribute('kind')).toBe('bad');
    expect((await tag('<sett-chip kind="pipeline">x</sett-chip>')).getAttribute('kind')).toBe('ok');
    expect((await tag('<sett-chip kind="tree" state="blocking">x</sett-chip>')).getAttribute('kind')).toBe('bad');
    const done = await tag('<sett-chip kind="git" state="done">x</sett-chip>');
    expect(done.getAttribute('kind')).toBe('ok');
    expect(done.textContent).toContain('✓');
  });
  it('done adds a dismiss verb that fires sett-dismiss', async () => {
    const el = await mount('<sett-chip kind="git" state="done">updated</sett-chip>');
    let fired = false;
    el.addEventListener('sett-dismiss', () => (fired = true));
    const a = Array.from(el.shadowRoot!.querySelectorAll('a')).find((x) => x.textContent === 'dismiss')!;
    a.click();
    expect(fired).toBe(true);
    const normal = await mount('<sett-chip kind="git">x</sett-chip>');
    expect(Array.from(normal.shadowRoot!.querySelectorAll('a')).length).toBe(0);
  });
  it('gate takes the colour of the session that runs it; with no session its label stays neutral', async () => {
    const tag = async (m: string) => (await mount(m)).shadowRoot!.querySelector('sett-tag')!;
    const running = await tag('<sett-chip kind="gate" session="tl">group 1 → group 2 · judge running<a slot="verb">open</a></sett-chip>');
    expect(running.getAttribute('kind')).toBe('session');
    expect(running.getAttribute('session')).toBe('tl');
    expect(running.textContent).toBe('gate');
    expect((await tag('<sett-chip kind="gate">group 1 → group 2<a slot="verb">open</a></sett-chip>')).getAttribute('kind')).toBe('default');
    expect((await tag('<sett-chip kind="gate" state="blocking" session="tl">failed 1/2<a slot="verb">open</a></sett-chip>')).getAttribute('kind')).toBe('bad');
    expect((await tag('<sett-chip kind="gate" state="done" session="tl">passed</sett-chip>')).getAttribute('kind')).toBe('ok');
  });
  it('detected is yours: a sel label, no session colour', async () => {
    const tag = async (m: string) => (await mount(m)).shadowRoot!.querySelector('sett-tag')!;
    const t = await tag('<sett-chip kind="detected">changes detected<span slot="count">· 3 files</span><a slot="agent">delegate the rest</a><a slot="manual">commit</a></sett-chip>');
    expect(t.getAttribute('kind')).toBe('sel');
    expect(t.textContent).toBe('detected');
    expect((await tag('<sett-chip kind="detected" state="blocking">changes collide with w1<a slot="agent">delegate the rest</a><a slot="manual">commit</a></sett-chip>')).getAttribute('kind')).toBe('bad');
    expect((await tag('<sett-chip kind="detected" state="done">committed</sett-chip>')).getAttribute('kind')).toBe('ok');
  });
  it('a separator stands only before a verb that is there', async () => {
    const seps = (el: HTMLElement) => el.shadowRoot!.querySelectorAll('.sep').length;
    const one = await mount('<sett-chip kind="gate" session="yk">group 1 → group 2 · judge running<a slot="verb">open</a></sett-chip>');
    expect(seps(one)).toBe(1);
    expect(seps(await mount('<sett-chip kind="git">behind main<a slot="agent">with Yokohama</a><a slot="manual">update myself</a></sett-chip>'))).toBe(2);
    expect(seps(await mount('<sett-chip kind="finding">rule<a slot="agent">with Yokohama</a><a slot="manual">fix myself</a><a slot="verb">allow</a></sett-chip>'))).toBe(3);
    // done with no verb of its own: one separator, before the built-in dismiss
    expect(seps(await mount('<sett-chip kind="git" state="done">updated</sett-chip>'))).toBe(1);
    // the wrapper of the bold door takes no room of its own, so a missing door leaves no gap
    const cssText = (customElements.get('sett-chip') as any).styles.map((s: any) => s.cssText).join('\n');
    expect(cssText).toContain('.primary { display: contents; }');
  });
});

// DESIGN.md "The shell" rule 1: a chip sits in the bar only if it carries a verb
describe('every chip carries a verb', () => {
  type StoryModule = Record<string, any>;
  const chipsOf = (mod: StoryModule) => {
    const { default: meta, ...stories } = mod;
    const found: { where: string; chip: Element }[] = [];
    for (const [name, story] of Object.entries(stories)) {
      const draw = story.render ?? meta.render;
      const host = document.createElement('div');
      render(draw({ ...meta.args, ...story.args }), host);
      for (const chip of host.querySelectorAll('sett-chip')) found.push({ where: `${meta.title} › ${name}`, chip });
    }
    return found;
  };
  const verbs = (chip: Element) => Array.from(chip.children).filter((c) => ['agent', 'manual', 'verb'].includes(c.getAttribute('slot') ?? ''));

  it('in the chip stories and in the recipes: an agent, a manual or a verb slot child, or the dismiss of a done chip', () => {
    const chips = [...chipsOf(chipStories), ...chipsOf(recipeStories)];
    expect(chips.length).toBeGreaterThan(40);
    expect(chipsOf(recipeStories).length).toBeGreaterThanOrEqual(5);
    const bare = chips.filter(({ chip }) => verbs(chip).length === 0 && chip.getAttribute('state') !== 'done');
    expect(bare.map(({ where, chip }) => `${where}: ${chip.textContent!.trim()}`)).toEqual([]);
  });
  it('the walk catches a chip with no verb', () => {
    const host = document.createElement('div');
    host.innerHTML = '<sett-chip kind="git">behind main</sett-chip><sett-chip kind="git" state="done">updated</sett-chip>';
    const bare = Array.from(host.querySelectorAll('sett-chip')).filter((chip) => verbs(chip).length === 0 && chip.getAttribute('state') !== 'done');
    expect(bare.length).toBe(1);
  });
  it("a detected chip's doors are delegate the rest, then commit (spec §4 work by hand)", () => {
    const detected = chipsOf(chipStories).filter(({ chip }) => chip.getAttribute('kind') === 'detected' && chip.getAttribute('state') !== 'done');
    expect(detected.length).toBeGreaterThanOrEqual(3);
    for (const { where, chip } of detected) expect(verbs(chip).map((v) => `${v.getAttribute('slot')}:${v.textContent}`), where).toEqual(['agent:delegate the rest', 'manual:commit']);
  });
  it("a gate chip's verb is open, never step in", () => {
    const gates = chipsOf(chipStories).filter(({ chip }) => chip.getAttribute('kind') === 'gate');
    expect(gates.length).toBeGreaterThanOrEqual(2);
    for (const { where, chip } of gates) expect(verbs(chip).map((v) => v.textContent), where).toEqual(['open']);
  });
});
