import type { SettRow } from './row.js';

/** the rows a tree of the left pane moves between */
export const ROW_TAGS = 'sett-session-row, sett-group-row, sett-agent-row, sett-element-row, sett-file-row, sett-changes-row, sett-tree-row, sett-commit-row, sett-rule-row, sett-finding-row';

/** the elements that hold a tree of their own: a row belongs to the nearest one */
export const TREE_TAGS = 'sett-sessions-view, sett-files-view, sett-changes-list, sett-agent-strip, sett-findings-view';

const isRow = (n: unknown): n is SettRow => n instanceof HTMLElement && n.matches(ROW_TAGS);

/** the row that holds this one, or null at the top of the tree */
export const parentRow = (row: Element, host: Element): SettRow | null => {
  for (let p = row.parentElement; p && p !== host; p = p.parentElement) if (isRow(p)) return p;
  return null;
};

/** a row is shown when every row above it is open: a folded row renders no children */
const shown = (row: SettRow, host: Element) => {
  for (let p = parentRow(row, host); p; p = parentRow(p, host)) if (!p.open) return false;
  return true;
};

/** the rows that belong to this tree and not to one nested in it (the agent strip inside the Files view) */
const ownRows = (host: Element): SettRow[] =>
  (Array.from(host.querySelectorAll(ROW_TAGS)) as SettRow[]).filter((r) => r.parentElement?.closest(TREE_TAGS) === host);

/** the rows of a tree, in document order, folded ones left out */
export const visibleRows = (host: Element): SettRow[] => ownRows(host).filter((r) => shown(r, host));

/**
 * The keyboard of a tree of rows, shared by the Sessions view, the Files view,
 * the Changes list and the Findings view: one tab stop (the selected row, else the first shown),
 * Up and Down move between the shown rows, Right unfolds or steps into a row,
 * Left folds or steps out, Home and End. Enter and Space are the row's own
 * (row.ts). Folding is asked for with `sett-fold`; the app sets `open`.
 */
export class TreeKeys {
  private observer?: MutationObserver;

  constructor(private host: HTMLElement) {}

  /** one tab stop among the shown rows */
  sync = () => {
    const rows = ownRows(this.host);
    const seen = visibleRows(this.host);
    const stop = seen.find((r) => r.selected) ?? seen[0];
    for (const r of rows) r.tabIndex = r === stop ? 0 : -1;
  };

  private move(from: SettRow, to?: SettRow) {
    if (!to || to === from) return;
    from.tabIndex = -1;
    to.tabIndex = 0;
    to.focus();
  }

  private onKey = (e: KeyboardEvent) => {
    const row = e.composedPath().find(isRow);
    if (!row || e.target !== row) return;
    const rows = visibleRows(this.host);
    const at = rows.indexOf(row);
    if (at < 0) return;
    switch (e.key) {
      case 'ArrowDown': e.preventDefault(); this.move(row, rows[at + 1]); break;
      case 'ArrowUp': e.preventDefault(); this.move(row, rows[at - 1]); break;
      case 'Home': e.preventDefault(); this.move(row, rows[0]); break;
      case 'End': e.preventDefault(); this.move(row, rows[rows.length - 1]); break;
      case 'ArrowRight':
        e.preventDefault();
        if (!row.foldable) break;
        if (!row.open) row.fold();
        else if (rows[at + 1] && parentRow(rows[at + 1], this.host) === row) this.move(row, rows[at + 1]);
        break;
      case 'ArrowLeft':
        e.preventDefault();
        if (row.foldable && row.open) row.fold();
        else this.move(row, parentRow(row, this.host) ?? undefined);
        break;
    }
  };

  attach() {
    this.host.addEventListener('keydown', this.onKey);
    if (typeof MutationObserver === 'function') {
      this.observer = new MutationObserver(this.sync);
      this.observer.observe(this.host, { childList: true, subtree: true, attributes: true, attributeFilter: ['open', 'selected'] });
    }
    this.sync();
  }
  detach() {
    this.host.removeEventListener('keydown', this.onKey);
    this.observer?.disconnect();
  }
}
