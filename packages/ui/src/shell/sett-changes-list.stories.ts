import type { Meta, StoryObj } from '@storybook/web-components-vite';
import { html } from 'lit';
import './sett-changes-list.js';
import './sett-sessions-view.js';
import './sett-files-view.js';
import '../button/sett-button.js';

// the list fills the left pane (or the review tab's left column): paper, at the pane's narrow width
const pane = (body: unknown) => html`<div style="box-sizing:border-box;width:var(--sett-size-shell-pane-max);height:calc(var(--sett-size-shell-pane-max) * 2);display:flex;flex-direction:column;background:var(--sett-color-paper);border:var(--sett-stroke-hair) solid var(--sett-color-line2)">${body}</div>`;

// the header card of w1: agent door first (open MR), manual second (rebase), then the review
const header = html`<sett-changes-header slot="header" branch="w1/refund-flow" worktree="w1" ahead="2" behind="0" rebased="rebased 2 h ago" mr="MR !42 · checks ✓ · merge gated" plan="plan · 5 elements · group 2 of 2">
  <sett-button slot="verbs" variant="primary" size="sm">open MR</sett-button>
  <sett-button slot="verbs" size="sm">rebase</sett-button>
  <sett-button slot="verbs" size="sm" variant="quiet">review so far</sett-button>
</sett-changes-header>`;

// one session's files, each in exactly one stage
const stages = (review = false) => html`
  <sett-stage label="not staged" count="1" progress=${review ? '0 of 1 viewed' : ''}>
    <sett-tree-row kind="folder" name="api" open>
      <sett-file-row letter="M" name="service.rs" writer="a3" counts="+6" depth="1"></sett-file-row>
    </sett-tree-row>
  </sett-stage>
  <sett-stage label="next commit · E3" count="2" progress=${review ? '1 of 2 viewed' : ''}>
    <sett-tree-row kind="folder" name="store" open>
      <sett-file-row letter="M" name="pg.rs" writer="a2" counts="+18 −2" depth="1" ?viewed=${review} selected></sett-file-row>
    </sett-tree-row>
    <sett-tree-row kind="folder" name="tests" open>
      <sett-file-row letter="A" name="lifecycle.rs" writer="a2" counts="+31" depth="1"></sett-file-row>
    </sett-tree-row>
  </sett-stage>
  <sett-stage label="commits ahead" count="2" progress=${review ? '2 of 2 viewed' : ''}>
    <sett-commit-row sha="a1b2c3d" name="OrderRepo: add refund()" element="E1" writer="a1" gate="gate ✓" open>
      <sett-file-row letter="M" name="domain/ports.rs" writer="a1" counts="+4" depth="1" ?viewed=${review}></sett-file-row>
    </sett-commit-row>
    <sett-commit-row sha="9f8e7d6" name="PgOrderRepo: refund() scaffold" element="E2" writer="a2" gate="gate ✓"></sett-commit-row>
  </sett-stage>`;

const changedMode = (review = false) => html`<sett-changes-list mode="changed">${header}${stages(review)}</sett-changes-list>`;

// all files: the whole worktree, the changed ones with their letter, writer and stage pill, the rest dim, idle folders folded
const allMode = html`<sett-changes-list mode="all">${header}
  <sett-tree-row kind="folder" name="api" meta="1 of 3" open>
    <sett-tree-row kind="file" name="service.rs" depth="1" letter="M" writer="a3" stage="not staged"></sett-tree-row>
    <sett-tree-row kind="file" name="webhook.rs" depth="1" dim></sett-tree-row>
    <sett-tree-row kind="file" name="router.rs" depth="1" dim></sett-tree-row>
  </sett-tree-row>
  <sett-tree-row kind="folder" name="domain" meta="1 of 2" open>
    <sett-tree-row kind="file" name="order.rs" depth="1" dim></sett-tree-row>
    <sett-tree-row kind="file" name="ports.rs" depth="1" letter="M" writer="a1" stage="E1"></sett-tree-row>
  </sett-tree-row>
  <sett-tree-row kind="folder" name="clients" meta="0 of 1" dim></sett-tree-row>
  <sett-tree-row kind="folder" name="store" meta="1 of 1" open>
    <sett-tree-row kind="file" name="pg.rs" depth="1" letter="M" writer="a2" stage="E3" selected></sett-tree-row>
  </sett-tree-row>
  <sett-tree-row kind="folder" name="tests" meta="1 of 1" open>
    <sett-tree-row kind="file" name="lifecycle.rs" depth="1" letter="A" writer="a2" stage="E3"></sett-tree-row>
  </sett-tree-row>
  <sett-tree-row kind="folder" name=".arch" meta="0 of 4" dim></sett-tree-row>
  <sett-tree-row kind="file" name="Cargo.toml" dim></sett-tree-row>
</sett-changes-list>`;

const meta: Meta = { title: 'shell/changes list', component: 'sett-changes-list', render: () => pane(changedMode()) };
export default meta;
type Story = StoryObj;

export const Default: Story = {};
export const Changed: Story = { name: 'changed · the header card, three stages with folders, letters, writers, counts, a commit open with its files', render: () => pane(changedMode()) };
export const AllFiles: Story = { name: 'all files · every file, the changed ones with a stage pill, untouched dim, folders say 1 of 3', render: () => pane(allMode) };
export const Review: Story = { name: 'review · viewed marks on files and progress in the stage headers', render: () => pane(changedMode(true)) };
export const Flat: Story = {
  name: 'flat · full paths instead of folders, the toggle pressed',
  render: () => pane(html`<sett-changes-list mode="changed" flat>${header}
    <sett-stage label="not staged" count="1" flat>
      <sett-file-row letter="M" name="api/service.rs" writer="a3" counts="+6"></sett-file-row>
    </sett-stage>
    <sett-stage label="next commit · E3" count="2" flat>
      <sett-file-row letter="M" name="store/pg.rs" writer="a2" counts="+18 −2"></sett-file-row>
      <sett-file-row letter="A" name="tests/lifecycle.rs" writer="a2" counts="+31"></sett-file-row>
    </sett-stage>
    <sett-stage label="commits ahead" count="0"></sett-stage>
  </sett-changes-list>`),
};
export const YouSession: Story = {
  name: 'a you session · no MR yet, nothing staged by anyone else',
  render: () => pane(html`<sett-changes-list mode="changed">
    <sett-changes-header slot="header" branch="you/fix-pool-size" worktree="you" ahead="0" behind="1" rebased="never rebased" plan="plan · none · delegate the rest">
      <sett-button slot="verbs" variant="primary" size="sm">commit</sett-button>
      <sett-button slot="verbs" size="sm">delegate the rest</sett-button>
    </sett-changes-header>
    <sett-stage label="not staged" count="2">
      <sett-tree-row kind="folder" name="store" open>
        <sett-file-row letter="M" name="pg.rs" writer="you" counts="+12" depth="1"></sett-file-row>
        <sett-file-row letter="A" name="pool.rs" writer="you" counts="+8" depth="1"></sett-file-row>
      </sett-tree-row>
    </sett-stage>
    <sett-stage label="next commit" count="0"></sett-stage>
    <sett-stage label="commits ahead" count="0"></sett-stage>
  </sett-changes-list>`),
};
