import type { Meta, StoryObj } from '@storybook/web-components-vite';
import { html, nothing } from 'lit';
import './sett-files-view.js';
import './sett-scope-line.js';
import './sett-sessions-view.js';

// the view fills the left pane: paper, at the pane's narrow width
const pane = (body: unknown) => html`<div style="box-sizing:border-box;width:var(--sett-size-shell-pane-min);height:var(--sett-size-shell-pane-max);display:flex;flex-direction:column;background:var(--sett-color-paper);border:var(--sett-stroke-hair) solid var(--sett-color-line2)">${body}</div>`;
const tools = html`<span slot="tools">filter · ⌘⇧F</span>`;

// the directory of orderly on main: w1 (yk) writes service.rs, ports.rs, pg.rs, lifecycle.rs; w2 (tl) writes webhook.rs
const dirMain = (sel = 'pg.rs') => html`<sett-files-view projection="directory">
  <sett-scope-line slot="scope" sub="as on disk"></sett-scope-line>${tools}
  <sett-tree-row kind="folder" name="api" open>
    <sett-tree-row kind="file" name="service.rs" depth="1" session="yk"></sett-tree-row>
    <sett-tree-row kind="file" name="webhook.rs" depth="1" session="tl"></sett-tree-row>
    <sett-tree-row kind="file" name="router.rs" depth="1"></sett-tree-row>
  </sett-tree-row>
  <sett-tree-row kind="folder" name="domain" open>
    <sett-tree-row kind="file" name="order.rs" depth="1"></sett-tree-row>
    <sett-tree-row kind="file" name="ports.rs" depth="1" session="yk" ?selected=${sel === 'ports.rs'}></sett-tree-row>
  </sett-tree-row>
  <sett-tree-row kind="folder" name="clients"></sett-tree-row>
  <sett-tree-row kind="folder" name="store" open>
    <sett-tree-row kind="file" name="pg.rs" depth="1" session="yk" ?selected=${sel === 'pg.rs'}></sett-tree-row>
  </sett-tree-row>
  <sett-tree-row kind="folder" name="tests" open>
    <sett-tree-row kind="file" name="lifecycle.rs" depth="1" session="yk"></sett-tree-row>
  </sett-tree-row>
  <sett-tree-row kind="folder" name=".arch"></sett-tree-row>
  <sett-tree-row kind="file" name="Cargo.toml"></sett-tree-row>
</sett-files-view>`;

const layersMain = html`<sett-files-view projection="layers">
  <sett-scope-line slot="scope" sub="as on disk"></sett-scope-line>${tools}
  <sett-tree-row kind="area" name="api · driving" meta="4 items" open>
    <sett-tree-row kind="item" name="router" depth="1" meta="api/router.rs"></sett-tree-row>
    <sett-tree-row kind="item" name="pay()" depth="1" session="yk" meta="api/service.rs"></sett-tree-row>
    <sett-tree-row kind="item" name="close()" depth="1" session="yk" meta="api/service.rs"></sett-tree-row>
    <sett-tree-row kind="item" name="handle_webhook()" depth="1" session="tl" meta="api/webhook.rs"></sett-tree-row>
  </sett-tree-row>
  <sett-tree-row kind="area" name="domain" meta="4 items" open>
    <sett-tree-row kind="item" name="Order" depth="1" meta="domain/order.rs"></sett-tree-row>
    <sett-tree-row kind="item" name="OrderRepo · port" depth="1" session="yk" selected meta="domain/ports.rs"></sett-tree-row>
    <sett-tree-row kind="item" name="Payments · port" depth="1" meta="domain/ports.rs"></sett-tree-row>
    <sett-tree-row kind="item" name="Status" depth="1" meta="domain/order.rs"></sett-tree-row>
  </sett-tree-row>
  <sett-tree-row kind="area" name="clients · store · driven" meta="2 items" open>
    <sett-tree-row kind="item" name="PgOrderRepo" depth="1" session="yk" meta="store/pg.rs"></sett-tree-row>
    <sett-tree-row kind="item" name="PaymentsHttp" depth="1" meta="clients/payments_http.rs"></sett-tree-row>
  </sett-tree-row>
  <sett-tree-row kind="area" name="outbound" meta="postgres · payments"></sett-tree-row>
</sett-files-view>`;

// scoped to w1: the strip under the scope line, letters and writers, the files w1 does not touch in mute
const strip = (open: boolean, agent = 'a2') => html`<sett-agent-strip slot="agents" name="refund flow" group=${agent === 'a3' ? 'group 2' : 'group 1'} agent=${agent} ?open=${open}>
  <sett-group-row name="group 1" state="done"></sett-group-row>
  <sett-agent-row session="yk" name="a1 · OrderRepo: add refund()" state="done" depth="1" ?selected=${agent === 'a1'}></sett-agent-row>
  <sett-agent-row session="yk" name="a2 · PgOrderRepo: implement refund()" state="writing" depth="1" ?selected=${agent === 'a2'}></sett-agent-row>
  <sett-group-row name="group 2" state="running"></sett-group-row>
  <sett-agent-row session="yk" name="a3 · pay(), close()" state="writing" depth="1" ?selected=${agent === 'a3'}></sett-agent-row>
</sett-agent-strip>`;
const dirScoped = (open: boolean, agent = 'a2') => html`<sett-files-view projection="directory" scoped>
  <sett-scope-line slot="scope" scope="session" session="yk" scope-id="w1" name="refund flow" sub="4 changed"></sett-scope-line>
  ${strip(open, agent)}${tools}
  <sett-tree-row kind="folder" name="api" open>
    <sett-tree-row kind="file" name="service.rs" depth="1" session="yk" letter="M" writer="a3" ?dim=${agent !== 'a3'}></sett-tree-row>
    <sett-tree-row kind="file" name="webhook.rs" depth="1" dim></sett-tree-row>
    <sett-tree-row kind="file" name="router.rs" depth="1" dim></sett-tree-row>
  </sett-tree-row>
  <sett-tree-row kind="folder" name="domain" open>
    <sett-tree-row kind="file" name="order.rs" depth="1" dim></sett-tree-row>
    <sett-tree-row kind="file" name="ports.rs" depth="1" session="yk" letter="M" writer="a1 ✓" ?dim=${agent !== 'a1'}></sett-tree-row>
  </sett-tree-row>
  <sett-tree-row kind="folder" name="clients" dim></sett-tree-row>
  <sett-tree-row kind="folder" name="store" open>
    <sett-tree-row kind="file" name="pg.rs" depth="1" session="yk" letter="M" writer="a2" selected ?dim=${agent !== 'a2'}></sett-tree-row>
  </sett-tree-row>
  <sett-tree-row kind="folder" name="tests" open>
    <sett-tree-row kind="file" name="lifecycle.rs" depth="1" session="yk" letter="A" writer="a2" ?dim=${agent !== 'a2'}></sett-tree-row>
  </sett-tree-row>
  <sett-tree-row kind="folder" name=".arch" dim></sett-tree-row>
  <sett-tree-row kind="file" name="Cargo.toml" dim></sett-tree-row>
</sett-files-view>`;

const youTree = html`<sett-files-view projection="directory" scoped>
  <sett-scope-line slot="scope" scope="you" name="fix-pool-size" sub="manual" locked></sett-scope-line>${tools}
  <sett-tree-row kind="folder" name="store" open>
    <sett-tree-row kind="file" name="pg.rs" depth="1" scope="you" letter="M" writer="you"></sett-tree-row>
    <sett-tree-row kind="file" name="pool.rs" depth="1" scope="you" letter="A" writer="you"></sett-tree-row>
  </sett-tree-row>
  <sett-tree-row kind="folder" name="api" dim></sett-tree-row>
  <sett-tree-row kind="folder" name="domain" dim></sett-tree-row>
  <sett-tree-row kind="folder" name="clients" dim></sett-tree-row>
  <sett-tree-row kind="folder" name="tests" dim></sett-tree-row>
  <sett-tree-row kind="folder" name=".arch" dim></sett-tree-row>
  <sett-tree-row kind="file" name="Cargo.toml" dim></sett-tree-row>
</sett-files-view>`;

const meta: Meta = {
  title: 'shell/files view',
  component: 'sett-files-view',
  render: () => pane(dirMain()),
};
export default meta;
type Story = StoryObj;

export const Default: Story = {};
export const DirectoryMain: Story = { name: "directory on main · a bar in the session's colour on files agents write, pg.rs selected", render: () => pane(dirMain()) };
export const LayersMain: Story = { name: 'layers on main · areas with counts, items with their file, OrderRepo selected', render: () => pane(layersMain) };
export const DirectoryScoped: Story = { name: 'directory scoped to w1 · tinted scope line, letters and writers, untouched files dim, the strip folded', render: () => pane(dirScoped(false)) };
export const StripOpen: Story = { name: 'the agent strip open · groups and sub-agents, a2 selected inks its files', render: () => pane(dirScoped(true)) };
export const StripOtherAgent: Story = { name: 'the strip on a3 · the ink moves to its files, the scope stays (LEFT-8)', render: () => pane(dirScoped(true, 'a3')) };
export const YouSession: Story = { name: 'a you session · sel bars, you as the writer, the rest dim', render: () => pane(youTree) };
export const Empty: Story = {
  name: 'empty · a worktree with nothing in it still has its seg',
  render: () => pane(html`<sett-files-view projection="directory"><sett-scope-line slot="scope" sub="as on disk"></sett-scope-line>${tools}${nothing}</sett-files-view>`),
};
