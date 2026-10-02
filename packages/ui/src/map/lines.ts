/**
 * The line watcher: one loop for every sheet on the page. Folding, pulses,
 * re-renders and the camera all move the things a link ends on; rather than
 * asking the application to say when, each frame the ends are read and only
 * the paths whose ends moved are rewritten. It sleeps when nothing is
 * watching. Boxes are read in the host's own coordinates with the camera's
 * scale divided out, so zooming never causes a rewrite.
 */
import type { Box } from './routes.js';

export interface Watched { measure(): void }

const watched = new Set<Watched>();
let frame = 0;
const tick = () => {
  frame = requestAnimationFrame(() => {
    for (const w of watched) w.measure();
    if (watched.size) tick(); else frame = 0;
  });
};
/** start following `w`; the loop wakes if it was asleep */
export function watch(w: Watched): void {
  watched.add(w);
  if (!frame && typeof requestAnimationFrame === 'function') tick();
}
export function unwatch(w: Watched): void {
  watched.delete(w);
  if (!watched.size && frame) { cancelAnimationFrame(frame); frame = 0; }
}
/** how many things the loop follows; 0 means it sleeps */
export const watching = (): number => watched.size;

/** the scale a camera applied to `host`, read from its box against its layout size */
export const scaleOf = (host: HTMLElement): number => {
  const w = host.offsetWidth;
  return w ? host.getBoundingClientRect().width / w || 1 : 1;
};
/** `el`'s box in `host`'s own coordinates */
export function boxIn(el: Element, host: HTMLElement, origin = host.getBoundingClientRect(), scale = scaleOf(host)): Box {
  const r = el.getBoundingClientRect();
  return { x: (r.left - origin.left) / scale, y: (r.top - origin.top) / scale, w: r.width / scale, h: r.height / scale };
}
/** a cheap signature of a list of boxes, to tell whether anything moved */
export const signature = (boxes: Box[]): string => boxes.map((b) => `${b.x.toFixed(1)},${b.y.toFixed(1)},${b.w.toFixed(1)},${b.h.toFixed(1)}`).join(';');

/** the selector that finds what a key names: `key`, then `data-id` */
export const selectorFor = (key: string): string => {
  const k = typeof CSS !== 'undefined' && typeof CSS.escape === 'function' ? CSS.escape(key) : key.replace(/["\\]/g, '\\$&');
  return `[key="${k}"], [data-id="${k}"]`;
};
