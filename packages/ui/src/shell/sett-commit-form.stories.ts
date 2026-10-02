import type { Meta, StoryObj } from '@storybook/web-components-vite';
import { html, nothing } from 'lit';
import './sett-commit-form.js';
import './sett-inspector.js';

const W = 'var(--sett-size-shell-inspector)';
const H = 'calc(var(--sett-space-6) * 19)';
const pane = (inner: unknown) => html`<div style="width:${W};height:${H};display:flex;border:var(--sett-stroke-hair) solid var(--sett-color-line);border-radius:var(--sett-radius-card);overflow:hidden">${inner}</div>`;

const form = (o: { then?: 'main' | 'branch'; behind?: string } = {}) => html`<sett-inspector heading="commit" sub="you · fix-pool-size · main" state="2 files" style="flex:1">
  <sett-commit-form value="store: size the pg pool from config" description="Reads pool size from PgConfig; defaults to 8. No behaviour change at defaults." files="store/pg.rs +12 · store/pool.rs +8" checks="ran on save · check 0 · tests 41 ✓" then=${o.then ?? 'main'} behind=${o.behind ?? nothing} style="flex:1">
    <span slot="note">one click from the you chip · the Arch-Element trailer is prefilled when the work is attached to an element</span>
  </sett-commit-form>
</sett-inspector>`;

const meta: Meta = { title: 'shell/commit form', component: 'sett-commit-form' };
export default meta;
type Story = StoryObj;

export const Clean: Story = { name: 'commit · message, description, files · pick hunks, checks, then stay on main', render: () => pane(form()) };
export const BehindMain: Story = { name: 'commit · behind main: a line in amber with both doors, agent door first', render: () => pane(form({ behind: 'main moved 2 commits' })) };
export const PushToBranch: Story = { name: 'commit · push to a branch · open MR chosen', render: () => pane(form({ then: 'branch' })) };
export const Alone: Story = { name: 'form alone · no inspector', render: () => html`<div style="width:${W};background:var(--sett-color-paper);border:var(--sett-stroke-hair) solid var(--sett-color-line2);border-radius:var(--sett-radius-card)"><sett-commit-form value="store: size the pg pool from config" files="store/pg.rs +12 · store/pool.rs +8" checks="ran on save · check 0 · tests 41 ✓"></sett-commit-form></div>` };
