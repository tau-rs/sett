import type { Meta, StoryObj } from '@storybook/web-components-vite';
import { html, nothing } from 'lit';
import './sett-hunk.js';
import '../tabs/sett-tabs.js';

const W = 'calc(var(--sett-space-6) * 22)';
const box = (inner: unknown, w = W) => html`<div style="width:${w};background:var(--sett-color-paper);border:var(--sett-stroke-hair) solid var(--sett-color-line2);border-radius:var(--sett-radius-card)">${inner}</div>`;

const remark = (kind?: 'change' | 'comment') => html`<sett-remark slot="remark" author="you" place="service.rs:23" time="just now" kind=${kind ?? nothing} element=${kind === 'change' ? 'E7' : nothing}>pay() charges before the limiter result is checked for the burst case; the check must gate the charge, not just the call.</sett-remark>`;

const ports = (viewed = true) => html`<sett-hunk file="ports.rs:18" item="RateLimit · port" agent="a1" session="yk" ?viewed=${viewed}>
  <sett-hunk-line kind="add">pub trait RateLimit: Send + Sync {</sett-hunk-line>
  <sett-hunk-line kind="add">${'  fn check(&self, key: &str) -> Result<Allow, Limited>;'}</sett-hunk-line>
  <sett-hunk-line kind="add">}</sett-hunk-line>
</sett-hunk>`;
const service = (o: { viewed?: boolean; flag?: boolean; remark?: unknown } = {}) => html`<sett-hunk file="service.rs:22" item="pay()" agent="a3" session="yk" ?viewed=${o.viewed}>
  <sett-hunk-line kind="ctx">${'pub async fn pay(&self, caller: Caller, order: &mut Order, amount: Money) -> Result<Receipt> {'}</sett-hunk-line>
  <sett-hunk-line kind="add">  self.limiter.check(&caller)?;</sett-hunk-line>
  <sett-hunk-line kind=${o.flag ? 'flag' : 'add'}>  let receipt = order.pay(amount)?;</sett-hunk-line>
  <sett-hunk-line kind="del">  let receipt = order.pay(amount).await?;</sett-hunk-line>
  <sett-hunk-line kind="ctx">  Ok(receipt)</sett-hunk-line>
  ${o.remark ?? nothing}
</sett-hunk>`;
const limiter = html`<sett-hunk file="limiter.rs:9" item="TokenBucket" agent="a2" session="yk">
  <sett-hunk-line kind="add">impl RateLimit for TokenBucket {</sett-hunk-line>
  <sett-hunk-line kind="add">${'  fn check(&self, key: &str) -> Result<Allow, Limited> { … }'}</sett-hunk-line>
</sett-hunk>`;

const meta: Meta = { title: 'shell/hunk', component: 'sett-hunk' };
export default meta;
type Story = StoryObj;

export const Unviewed: Story = { name: 'hunk · unviewed: v · viewed, r · remark, show on map', render: () => box(service()) };
export const Viewed: Story = { name: 'hunk · viewed: the ok word', render: () => box(ports(true)) };
export const Remark: Story = { name: 'hunk · a remark under the flagged line, before the choice', render: () => box(service({ viewed: true, flag: true, remark: remark() })) };
export const RemarkAsks: Story = { name: 'hunk · the remark asks for a change: pill and E7 · realized in the session', render: () => box(service({ viewed: true, flag: true, remark: remark('change') })) };
export const RemarkComment: Story = { name: 'hunk · the remark is a comment · no change needed', render: () => box(service({ viewed: true, flag: true, remark: remark('comment') })) };
export const Proposed: Story = { name: 'hunk · proposed (the fix card\'s): verified, no review verbs', render: () => box(html`<sett-hunk file="pg.rs:41" proposed verified="check green">
  <sett-hunk-line kind="del">  self.store.pg.save_notified(&order).await?;</sett-hunk-line>
  <sett-hunk-line kind="add">  self.repo.save(&order).await?;</sett-hunk-line>
</sett-hunk>`) };
export const Lines: Story = { name: 'line kinds · add, del, ctx, flag', render: () => box(html`<sett-hunk file="service.rs:22" item="pay()">
  <sett-hunk-line kind="ctx">  // ctx · unchanged, no tint</sett-hunk-line>
  <sett-hunk-line kind="add">  // add · ok tint</sett-hunk-line>
  <sett-hunk-line kind="del">  // del · bad tint</sett-hunk-line>
  <sett-hunk-line kind="flag">  // flag · sug tint, the line a remark points at</sett-hunk-line>
</sett-hunk>`) };
export const ReviewTab: Story = { name: 'review · hunks in one scroll', render: () => html`<div style="width:calc(var(--sett-space-6) * 30);height:calc(var(--sett-space-6) * 19);display:flex;flex-direction:column;background:var(--sett-color-paper);border:var(--sett-stroke-hair) solid var(--sett-color-line);border-radius:var(--sett-radius-card);overflow:hidden">
  <sett-tabbar><sett-tab pinned>map</sett-tab><sett-tab active scope="session" session="yk">review · !44</sett-tab><span slot="right">6 files · 11 hunks · j k · v · r</span></sett-tabbar>
  <div style="flex:1;min-height:0;overflow:auto" tabindex="0">${ports(true)}${service({ viewed: true, flag: true, remark: remark() })}${limiter}</div>
</div>` };
