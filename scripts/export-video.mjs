import fs from 'node:fs/promises';
import path from 'node:path';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { chromium } from 'playwright';

const execFileAsync = promisify(execFile);
const url = process.argv[2] || 'http://127.0.0.1:5173/';
const output = process.argv[3] || path.resolve('exports/nanao-scrolly-opening-1080p.mp4');
const fps = 24;
const seconds = 12;
const frames = fps * seconds;
const frameDir = path.resolve('.video-frames');

await fs.rm(frameDir, { recursive: true, force: true });
await fs.mkdir(frameDir, { recursive: true });
await fs.mkdir(path.dirname(output), { recursive: true });

const browser = await chromium.launch({
  headless: true,
  executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
});
const page = await browser.newPage({ viewport: { width: 1920, height: 1080 }, deviceScaleFactor: 1 });
await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 });
await page.waitForSelector('.maplibregl-canvas', { timeout: 30000 });
await page.waitForTimeout(4500);

const maxScroll = await page.evaluate(() => document.documentElement.scrollHeight - window.innerHeight);
for (let frame = 0; frame < frames; frame += 1) {
  const progress = frame / (frames - 1);
  await page.evaluate((top) => window.scrollTo(0, top), maxScroll * progress);
  await page.evaluate(() => new Promise(requestAnimationFrame));
  await page.screenshot({ path: path.join(frameDir, `frame-${String(frame).padStart(5, '0')}.png`) });
}
await browser.close();

await execFileAsync('ffmpeg', [
  '-y', '-framerate', String(fps), '-i', path.join(frameDir, 'frame-%05d.png'),
  '-c:v', 'libx264', '-preset', 'medium', '-crf', '20', '-pix_fmt', 'yuv420p',
  '-movflags', '+faststart', output,
]);

await fs.rm(frameDir, { recursive: true, force: true });
console.log(`Exported ${output}`);
