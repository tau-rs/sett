// Browser smoke test over the static build: one story per family, mounted in headless
// Chromium from storybook-static exactly as a reader would load it. Asserts the root has
// children and nothing threw. This is the test that would have caught #31 (every element
// defined twice, nothing rendered) on day one. Needs `pnpm build` first.
import { afterAll, beforeAll, describe, expect, test } from 'vitest';
import { chromium, type Browser } from 'playwright';
import { createServer, type Server } from 'node:http';
import { createReadStream, existsSync, readFileSync, statSync } from 'node:fs';
import { extname, join, normalize } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(fileURLToPath(new URL('.', import.meta.url)), '..', 'storybook-static');
const mime: Record<string, string> = { '.html': 'text/html', '.js': 'text/javascript', '.mjs': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.svg': 'image/svg+xml', '.woff2': 'font/woff2' };

type Entry = { id: string; type: string; title: string; importPath: string };

function firstStoryPerFamily(): Entry[] {
  const index = JSON.parse(readFileSync(join(root, 'index.json'), 'utf8')) as { entries: Record<string, Entry> };
  const byFile = new Map<string, Entry>();
  for (const e of Object.values(index.entries)) if (e.type === 'story' && !byFile.has(e.importPath)) byFile.set(e.importPath, e);
  return [...byFile.values()];
}

function serve(): Promise<{ server: Server; url: string }> {
  const server = createServer((req, res) => {
    const path = normalize(decodeURIComponent((req.url ?? '/').split('?')[0]));
    const file = join(root, path === '/' ? 'index.html' : path);
    if (!file.startsWith(root) || !existsSync(file) || !statSync(file).isFile()) { res.writeHead(404); res.end(); return; }
    res.writeHead(200, { 'content-type': mime[extname(file)] ?? 'application/octet-stream' });
    createReadStream(file).pipe(res);
  });
  return new Promise((resolve) => server.listen(0, '127.0.0.1', () => {
    const { port } = server.address() as { port: number };
    resolve({ server, url: `http://127.0.0.1:${port}` });
  }));
}

describe('storybook-static smoke', () => {
  let browser: Browser; let server: Server; let base: string;
  beforeAll(async () => {
    expect(existsSync(join(root, 'index.json')), 'storybook-static/index.json: run pnpm build first').toBe(true);
    ({ server, url: base } = await serve());
    browser = await chromium.launch();
  });
  afterAll(async () => { await browser?.close(); server?.close(); });

  const families = existsSync(join(root, 'index.json')) ? firstStoryPerFamily() : [];
  test('one story per family is listed', () => { expect(families.length).toBeGreaterThanOrEqual(12); });

  for (const theme of ['light', 'dark'] as const) {
    describe(theme, () => {
      for (const story of families) {
        test(`${story.title} · ${story.id}`, async () => {
          const page = await browser.newPage();
          const errors: string[] = [];
          page.on('pageerror', (e) => errors.push(`pageerror: ${e.message}`));
          page.on('console', (m) => { if (m.type() === 'error') errors.push(`console.error: ${m.text()}`); });
          await page.goto(`${base}/iframe.html?id=${story.id}&viewMode=story&globals=theme:${theme}`);
          // Storybook flips the body class when the story rendered, or when it failed
          await page.waitForSelector('body.sb-show-main, body.sb-show-errordisplay', { timeout: 15000 });
          // addon-themes writes data-theme on <html> in an effect after the first render
          await page.waitForSelector('html[data-theme], body.sb-show-errordisplay', { timeout: 5000 });
          const state = await page.evaluate(() => ({
            error: document.body.classList.contains('sb-show-errordisplay'),
            children: document.querySelector('#storybook-root')?.children.length ?? 0,
            theme: document.documentElement.dataset.theme,
          }));
          await page.close();
          expect(errors, story.id).toEqual([]);
          expect(state.error, `${story.id} showed the error display`).toBe(false);
          expect(state.children, `${story.id}: #storybook-root is empty`).toBeGreaterThan(0);
          expect(state.theme).toBe(theme);
        }, 30000);
      }
    });
  }
});
