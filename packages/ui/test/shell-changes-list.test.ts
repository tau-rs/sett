import { beforeAll, describe, expect, it } from 'vitest';
import '../src/index.js';

const TAGS = ['sett-changes-list', 'sett-changes-header', 'sett-stage', 'sett-commit-row'];
const cssOf = (tag: string) => ([] as any[]).concat((customElements.get(tag) as any).styles).flat().map((s: any) => s.cssText).join('\n');
const settle = async (el: any) => {
  await el.updateComplete;
  await Promise.all(Array.from(el.querySelectorAll('*')).map((c: any) => c.updateComplete));
  await el.updateComplete;
};
const mount = async (m: string) => { document.body.innerHTML = m; const el = document.body.firstElementChild as any; await settle(el); return el; };
const key = (el: Element, k: string) => el.dispatchEvent(new KeyboardEvent('keydown', { key: k, bubbles: true, composed: true, cancelable: true }));
const heard = (el: Element, type: string) => { const got: any[] = []; el.addEventListener(type, (e: any) => got.push(e.detail ?? null)); return got; };

// one session's files, each at exactly one stage; both modes are built from this
const FILES: Record<string, { stage: string; letter: string; writer: string }> = {
  'api/service.rs': { stage: 'not staged', letter: 'M', writer: 'a3' },
  'store/pg.rs': { stage: 'next commit · E3', letter: 'M', writer: 'a2' },
  'tests/lifecycle.rs': { stage: 'next commit · E3', letter: 'A', writer: 'a2' },
  'domain/ports.rs': { stage: 'commits ahead', letter: 'M', writer: 'a1' },
};
const STAGES = ['not staged', 'next commit · E3', 'commits ahead'];
const HEADER = `<sett-changes-header slot="header" branch="w1/refund-flow" worktree="w1" ahead="2" behind="0" rebased="rebased 2 h ago" mr="MR !42 · checks ✓ · merge gated" plan="plan · 5 elements · group 2 of 2"><sett-button slot="verbs" variant="primary">open MR</sett-button><sett-button slot="verbs">rebase</sett-button></sett-changes-header>`;
const changed = () => `<sett-changes-list mode="changed">${HEADER}${STAGES.map((label) => {
  const files = Object.entries(FILES).filter(([, f]) => f.stage === label);
  if (label === 'commits ahead') return `<sett-stage label="${label}" count="${files.length}"><sett-commit-row sha="a1b2c3d" name="OrderRepo: add refund()" element="E1" writer="a1" gate="gate ✓" open>${files.map(([p, f]) => `<sett-file-row letter="${f.letter}" name="${p}" writer="${f.writer}" depth="1"></sett-file-row>`).join('')}</sett-commit-row></sett-stage>`;
  return `<sett-stage label="${label}" count="${files.length}">${files.map(([p, f]) => `<sett-file-row letter="${f.letter}" name="${p}" writer="${f.writer}"></sett-file-row>`).join('')}</sett-stage>`;
}).join('')}</sett-changes-list>`;
const all = () => `<sett-changes-list mode="all">${HEADER}${Object.entries(FILES).map(([p, f]) => `<sett-tree-row kind="file" name="${p}" letter="${f.letter}" writer="${f.writer}" stage="${f.stage}"></sett-tree-row>`).join('')}<sett-tree-row kind="file" name="Cargo.toml" dim></sett-tree-row></sett-changes-list>`;

beforeAll(() => Promise.all(TAGS.map((t) => customElements.whenDefined(t))));

describe('changes list', () => {
  it('every part uses tokens only and never animates', () => {
    for (const t of TAGS) {
      const c = cssOf(t);
      expect(c, t).not.toMatch(/#[0-9a-fA-F]{3,8}\b/);
      expect(c, t).not.toMatch(/\d+px/);
      expect(c, t).not.toMatch(/animation|transition|opacity/);
    }
  });
  it('a file is in exactly one stage; in all-files mode its pill says that stage\'s words', async () => {
    const byStage = await mount(changed());
    const stages = Array.from(byStage.querySelectorAll('sett-stage')) as any[];
    expect(stages.map((s) => s.label)).toEqual(STAGES);
    expect(stages.every((s) => s.getAttribute('role') === 'group' && s.getAttribute('aria-label') === s.label)).toBe(true);
    const where: Record<string, string[]> = {};
    for (const s of stages) for (const f of Array.from(s.querySelectorAll('sett-file-row')) as any[]) (where[f.name] ??= []).push(s.label);
    for (const [path, f] of Object.entries(FILES)) expect(where[path], path).toEqual([f.stage]);
    const tree = await mount(all());
    for (const row of Array.from(tree.querySelectorAll('sett-tree-row[stage]')) as any[]) {
      expect(row.shadowRoot.querySelector('.stage').textContent.trim(), row.name).toBe(FILES[row.name].stage);
      expect(row.shadowRoot.querySelector('.wr').textContent.trim(), 'writers show in the list').toBe(FILES[row.name].writer);
    }
    expect(tree.querySelector('sett-tree-row[name="Cargo.toml"]').shadowRoot.querySelector('.stage')).toBeNull();
  });
  it('the mode seg reports and never switches itself', async () => {
    const list = await mount(changed());
    const items = Array.from(list.shadowRoot.querySelectorAll('sett-seg-item')) as any[];
    expect(items.map((i) => [i.value, i.textContent.trim(), i.active])).toEqual([['changed', 'changed', true], ['all', 'all files', false]]);
    const modes = heard(list, 'sett-mode'); const selects = heard(list, 'sett-select');
    items[1].click();
    expect(modes).toEqual([{ value: 'all' }]);
    expect(selects).toEqual([]);
    expect(list.mode).toBe('changed');
    list.mode = 'all';
    await settle(list);
    expect(items.map((i) => i.active)).toEqual([false, true]);
  });
  it('a commit row expands to its files in place and opens with its sha', async () => {
    const list = await mount(changed());
    const commit = list.querySelector('sett-commit-row');
    expect(commit.getAttribute('role')).toBe('treeitem');
    expect(commit.getAttribute('aria-expanded')).toBe('true');
    expect(commit.shadowRoot.querySelector('.sha').textContent).toBe('a1b2c3d');
    expect(commit.shadowRoot.querySelector('.el').textContent.trim()).toBe('E1');
    expect(commit.shadowRoot.querySelector('.gate').hasAttribute('data-ok')).toBe(true);
    expect(commit.shadowRoot.querySelector('.kids slot')).not.toBeNull();
    const folds = heard(list, 'sett-fold'); const opens = heard(list, 'sett-open');
    commit.shadowRoot.querySelector('.cv').click();
    expect(folds).toEqual([{ kind: 'commit', name: 'OrderRepo: add refund()', sha: 'a1b2c3d', open: false }]);
    expect(commit.open).toBe(true);
    commit.open = false;
    await settle(commit);
    expect(commit.shadowRoot.querySelector('.kids')).toBeNull();
    key(commit, 'Enter');
    expect(opens).toEqual([{ kind: 'commit', name: 'OrderRepo: add refund()', sha: 'a1b2c3d' }]);
    const plain = await mount('<sett-commit-row sha="9f8e7d6" name="pay(): call refund()" gate="gate running"></sett-commit-row>');
    expect(plain.shadowRoot.querySelector('.gate').hasAttribute('data-ok')).toBe(false);
  });
  it('the header: branch in mono, the git line, the MR and plan rows as links that open what they name', async () => {
    const list = await mount(changed());
    const header = list.querySelector('sett-changes-header');
    expect(header.shadowRoot.querySelector('.branch').textContent).toBe('w1/refund-flow');
    expect(cssOf('sett-changes-header')).toMatch(/\.branch \{[^}]*font-family: var\(--sett-font-mono\)/);
    expect(header.shadowRoot.querySelector('.git').textContent.trim()).toBe('2 ahead · 0 behind · rebased 2 h ago');
    const links = Array.from(header.shadowRoot.querySelectorAll('.link')) as any[];
    expect(links.map((l) => [l.getAttribute('role'), l.tabIndex, l.querySelector('.w').textContent, l.querySelector('.go').textContent])).toEqual([
      ['link', 0, 'MR !42 · checks ✓ · merge gated', '›'],
      ['link', 0, 'plan · 5 elements · group 2 of 2', '›'],
    ]);
    const opens = heard(list, 'sett-open');
    links[0].click();
    key(links[1], 'Enter');
    expect(opens).toEqual([{ what: 'mr' }, { what: 'plan' }]);
    expect(header.shadowRoot.querySelector('slot[name="verbs"]')).not.toBeNull();
  });
  it("the full-paths toggle sits by the seg, outside the tree, asks and never flips; a stage shows its count and review progress", async () => {
    const list = await mount(changed());
    const flat = list.shadowRoot.querySelector('.flat');
    expect(flat.closest('[role="tree"]')).toBeNull();
    expect(list.querySelector('sett-stage').shadowRoot.querySelector('button')).toBeNull();
    const flats = heard(list, 'sett-flat');
    flat.click();
    expect(flats).toEqual([{ flat: true }]);
    expect(list.flat).toBe(false);
    expect(flat.getAttribute('aria-pressed')).toBe('false');
    list.flat = true;
    await settle(list);
    expect(flat.getAttribute('aria-pressed')).toBe('true');
    const tree = await mount(all());
    expect(tree.shadowRoot.querySelector('.flat'), 'all files has no folders to flatten').toBeNull();
    const review = await mount('<sett-stage label="not staged" count="3" progress="1 of 3 viewed"></sett-stage>');
    expect(review.shadowRoot.querySelector('.ok').textContent).toBe('1 of 3 viewed');
  });
  it('the keyboard walks stages and the files inside a commit', async () => {
    const list = await mount(changed());
    const rows = Array.from(list.querySelectorAll('sett-file-row, sett-commit-row')) as any[];
    expect(rows.map((r) => r.tabIndex)).toEqual([0, -1, -1, -1, -1]);
    rows[0].focus();
    key(rows[0], 'ArrowDown'); expect(document.activeElement).toBe(rows[1]);
    key(rows[1], 'End'); expect(document.activeElement).toBe(rows[4]);
    key(rows[4], 'ArrowLeft'); expect(document.activeElement).toBe(rows[3]);
  });
});
