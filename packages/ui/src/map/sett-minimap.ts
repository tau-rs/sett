import { LitElement, css, html, svg } from 'lit';
import { customElement, property } from 'lit/decorators.js';

export type MinimapMode = 'board' | 'sheet';
/** a box in world coordinates, the map's own */
export interface MinimapBox { x: number; y: number; w: number; h: number }
/** one thing of the world: a unit on the board, a column or an area in a sheet */
export interface MinimapRect extends MinimapBox {
  key?: string;
  /** a column's tint; without it the rect is paper with a hairline */
  tone?: 'driving' | 'domain' | 'driven';
  /** your selection: a `sel` border */
  selected?: boolean;
}

const union = (boxes: MinimapBox[]): MinimapBox => {
  if (!boxes.length) return { x: 0, y: 0, w: 1, h: 1 };
  const x = Math.min(...boxes.map((b) => b.x)), y = Math.min(...boxes.map((b) => b.y));
  return { x, y, w: Math.max(1, Math.max(...boxes.map((b) => b.x + b.w)) - x), h: Math.max(1, Math.max(...boxes.map((b) => b.y + b.h)) - y) };
};

/**
 * The world point under a pointer: `frame` is the drawing's box on screen,
 * `world` what it shows, fitted whole and centred (the minimap never crops).
 */
export function minimapPoint(frame: MinimapBox, world: MinimapBox, clientX: number, clientY: number): { x: number; y: number } {
  const scale = Math.min(frame.w / world.w, frame.h / world.h) || 1;
  const left = frame.x + (frame.w - world.w * scale) / 2, top = frame.y + (frame.h - world.h * scale) / 2;
  return { x: world.x + (clientX - left) / scale, y: world.y + (clientY - top) / scale };
}

/**
 * The whole map at a glance: the world's rects and, over them, the viewport
 * rect. `mode` says which world it draws: `board` (the units of the repo) or
 * `sheet` (the columns and areas inside the open unit). A click or a drag
 * pans: the minimap only says where, the camera is the host's. It draws what
 * it is given and nothing animates: the viewport rect is where the camera is.
 *
 * The map design shows a minimap only when the map exceeds the viewport
 * (MAP-13). That is the host's condition: the element is present or absent.
 *
 * @slot - the name of what is drawn, after the mode: `zed`, `gpui`
 * @fires sett-pan - `{ x, y }`: the world point the viewport should centre on (click, drag, arrow keys)
 * @csspart world - the drawing
 */
@customElement('sett-minimap')
export class SettMinimap extends LitElement {
  @property({ reflect: true }) mode: MinimapMode = 'board';
  /** the rects of the world, in paint order */
  @property({ type: Array }) rects: MinimapRect[] = [];
  /** what the camera shows, in world coordinates */
  @property({ type: Object }) view?: MinimapBox;
  /** the world's bounds; by default the union of the rects and the view */
  @property({ type: Object }) world?: MinimapBox;

  static styles = css`
    :host { display: block; box-sizing: border-box; padding: var(--sett-space-2) var(--sett-space-3) var(--sett-space-3); border-top: var(--sett-stroke-hair) solid var(--sett-color-line2); color: var(--sett-color-ink2); font-family: var(--sett-font-sans); font-size: var(--sett-font-size-sm); }
    .hd { display: flex; align-items: baseline; gap: var(--sett-space-2); margin-bottom: var(--sett-space-1); white-space: nowrap; }
    .m { color: var(--sett-color-mute); }
    .nm { min-width: 0; overflow: hidden; text-overflow: ellipsis; font-family: var(--sett-font-mono); color: var(--sett-color-ink); }
    svg { display: block; box-sizing: border-box; width: 100%; max-width: var(--sett-map-size-minimap-w); height: var(--sett-map-size-minimap-h); border: var(--sett-stroke-hair) solid var(--sett-color-line); border-radius: var(--sett-radius-card); background: var(--sett-color-bg); cursor: pointer; touch-action: none; }
    svg:focus-visible { outline: var(--sett-stroke-lit) solid var(--sett-color-sel); outline-offset: var(--sett-stroke-hair); }
    rect { vector-effect: non-scaling-stroke; fill: var(--sett-color-paper); stroke: var(--sett-color-line); stroke-width: var(--sett-stroke-hair); }
    rect[data-tone='driving'] { fill: var(--sett-map-surface-driving); }
    rect[data-tone='domain'] { fill: var(--sett-map-surface-domain); }
    rect[data-tone='driven'] { fill: var(--sett-map-surface-driven); }
    rect[data-selected] { stroke: var(--sett-color-sel); stroke-width: var(--sett-stroke-lit); }
    rect.view { fill: none; stroke: var(--sett-color-sel); stroke-width: var(--sett-stroke-lit); }
  `;

  private dragging = false;
  private get bounds(): MinimapBox { return this.world ?? union([...this.rects, ...(this.view ? [this.view] : [])]); }
  private pan(x: number, y: number) { this.dispatchEvent(new CustomEvent('sett-pan', { detail: { x, y }, bubbles: true, composed: true })); }
  private panTo(e: PointerEvent) {
    const r = (e.currentTarget as Element).getBoundingClientRect();
    const p = minimapPoint({ x: r.left, y: r.top, w: r.width, h: r.height }, this.bounds, e.clientX, e.clientY);
    this.pan(p.x, p.y);
  }
  private down = (e: PointerEvent) => {
    this.dragging = true;
    (e.currentTarget as Element).setPointerCapture?.(e.pointerId);
    this.panTo(e);
  };
  private move = (e: PointerEvent) => { if (this.dragging) this.panTo(e); };
  private up = () => { this.dragging = false; };
  private key = (e: KeyboardEvent) => {
    const v = this.view;
    const step: Record<string, [number, number]> = { ArrowLeft: [-1, 0], ArrowRight: [1, 0], ArrowUp: [0, -1], ArrowDown: [0, 1] };
    if (!v || !step[e.key]) return;
    e.preventDefault();
    const [dx, dy] = step[e.key];
    this.pan(v.x + v.w / 2 + (dx * v.w) / 4, v.y + v.h / 2 + (dy * v.h) / 4);
  };

  render() {
    const b = this.bounds, v = this.view;
    return html`
      <div class="hd"><span class="m">${this.mode}</span><span class="nm"><slot></slot></span></div>
      <svg part="world" viewBox="${b.x} ${b.y} ${b.w} ${b.h}" preserveAspectRatio="xMidYMid meet" tabindex="0" role="application" aria-label="minimap · ${this.mode} · click or arrows pan"
        @pointerdown=${this.down} @pointermove=${this.move} @pointerup=${this.up} @pointercancel=${this.up} @keydown=${this.key}>
        ${this.rects.map((r) => svg`<rect x=${r.x} y=${r.y} width=${r.w} height=${r.h} data-key=${r.key ?? ''} data-tone=${r.tone ?? ''} ?data-selected=${r.selected}></rect>`)}
        ${v ? svg`<rect class="view" x=${v.x} y=${v.y} width=${v.w} height=${v.h}></rect>` : ''}
      </svg>`;
  }
}

declare global {
  interface HTMLElementTagNameMap { 'sett-minimap': SettMinimap }
}
