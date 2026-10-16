// Full walkthrough export for 報導者「捲動式影片」:
// home hero → entry transition → opening questions (recorded in real time),
// then the whole scroll story captured frame by frame through the final page.
// Usage: node scripts/export-full-video.mjs [desktop|mobile|all] [url]
import fs from 'node:fs/promises';
import path from 'node:path';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { chromium } from 'playwright';

const execFileAsync = promisify(execFile);
const which = process.argv[2] || 'all';
const url = process.argv[3] || 'http://127.0.0.1:5173/';
const fps = 24;
const secondsPerScreen = Number(process.env.SECONDS_PER_SCREEN) || 1.5;
const presets = {
  desktop: { viewport: { width: 1920, height: 1080 }, scale: 1, output: 'exports/nanao-full-walkthrough-16x9.mp4' },
  mobile: { viewport: { width: 480, height: 720 }, scale: 2.25, output: 'exports/nanao-full-walkthrough-2x3.mp4' },
};

const wait = ms => new Promise(resolve => setTimeout(resolve, ms));

async function recordRealtime(page, cdp, dir, action) {
  // Screencast frames arrive with timestamps; we keep each frame's duration
  // so the intro plays back at its true speed.
  const frames = [];
  cdp.on('Page.screencastFrame', async ({ data, metadata, sessionId }) => {
    const file = path.join(dir, `intro-${String(frames.length).padStart(5, '0')}.jpg`);
    frames.push({ file, time: metadata.timestamp });
    await fs.writeFile(file, Buffer.from(data, 'base64'));
    await cdp.send('Page.screencastFrameAck', { sessionId }).catch(() => {});
  });
  const { width, height } = page.viewportSize();
  await cdp.send('Page.startScreencast', { format: 'jpeg', quality: 92, maxWidth: width * 4, maxHeight: height * 4, everyNthFrame: 1 });
  const start = Date.now() / 1000;
  await action();
  const end = Date.now() / 1000;
  await cdp.send('Page.stopScreencast');
  await wait(300);
  const list = frames.map((frame, i) => {
    const next = frames[i + 1]?.time ?? end;
    const from = i === 0 ? start : frame.time;
    return `file '${frame.file}'\nduration ${Math.max(0.001, next - from).toFixed(4)}`;
  });
  list.push(`file '${frames.at(-1).file}'`);
  const listFile = path.join(dir, 'intro.txt');
  await fs.writeFile(listFile, list.join('\n'));
  return listFile;
}

async function exportPreset(name) {
  const preset = presets[name];
  const output = path.resolve(preset.output);
  const dir = path.resolve(`.video-frames-${name}`);
  const outW = Math.round(preset.viewport.width * preset.scale);
  const outH = Math.round(preset.viewport.height * preset.scale);
  await fs.rm(dir, { recursive: true, force: true });
  await fs.mkdir(dir, { recursive: true });

  const browser = await chromium.launch({
    headless: true,
    executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  });
  const page = await browser.newPage({ viewport: preset.viewport, deviceScaleFactor: preset.scale });
  const cdp = await page.context().newCDPSession(page);

  // Warm-up pass: run the whole story once so map tiles and images are cached.
  console.log(`[${name}] warming up map tiles…`);
  await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 });
  await page.waitForSelector('.home-hero-cta');
  await page.click('.home-hero-cta');
  await page.waitForSelector('.opening-question-choice-list button', { timeout: 15000 });
  await page.evaluate(() => document.querySelector('.opening-question-choice-list button').click());
  await page.waitForSelector('.maplibregl-canvas', { timeout: 30000 });
  await wait(2500);
  let maxScroll = await page.evaluate(() => document.documentElement.scrollHeight - window.innerHeight);
  for (let top = 0; top <= maxScroll; top += preset.viewport.height / 2) {
    await page.evaluate(y => window.scrollTo(0, y), top);
    await wait(120);
  }

  // Real take.
  console.log(`[${name}] recording intro…`);
  await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 });
  await page.waitForSelector('.home-hero-cta');
  await page.evaluate(() => document.fonts.ready);
  await wait(1500);
  const introList = await recordRealtime(page, cdp, dir, async () => {
    await wait(3500);
    await page.click('.home-hero-cta');
    await page.waitForSelector('.opening-question-choice-list button', { timeout: 15000 });
    await wait(7000);
  });
  await page.evaluate(() => document.querySelector('.opening-question-choice-list button').click());
  await page.waitForSelector('.maplibregl-canvas', { timeout: 30000 });
  await wait(4000);

  maxScroll = await page.evaluate(() => document.documentElement.scrollHeight - window.innerHeight);
  const screens = maxScroll / preset.viewport.height;
  const frames = Math.round(screens * secondsPerScreen * fps);
  console.log(`[${name}] recording scroll story: ${frames} frames (${(frames / fps).toFixed(1)}s)…`);
  for (let frame = 0; frame < frames; frame += 1) {
    const progress = frame / (frames - 1);
    await page.evaluate(top => window.scrollTo(0, top), maxScroll * progress);
    await page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));
    await page.screenshot({ path: path.join(dir, `frame-${String(frame).padStart(5, '0')}.png`) });
    if (frame % 120 === 0) console.log(`  ${frame}/${frames}`);
  }
  await browser.close();

  const scale = `scale=${outW}:${outH}:flags=lanczos,setsar=1,fps=${fps},format=yuv420p`;
  const introClip = path.join(dir, 'intro.mp4');
  const storyClip = path.join(dir, 'story.mp4');
  const encode = ['-c:v', 'libx264', '-preset', 'medium', '-crf', '20', '-g', '12', '-pix_fmt', 'yuv420p'];
  await execFileAsync('ffmpeg', ['-y', '-f', 'concat', '-safe', '0', '-i', introList, '-vf', scale, ...encode, introClip]);
  await execFileAsync('ffmpeg', ['-y', '-framerate', String(fps), '-i', path.join(dir, 'frame-%05d.png'),
    '-vf', `${scale},tpad=stop_mode=clone:stop_duration=1`, ...encode, storyClip]);
  const joinList = path.join(dir, 'join.txt');
  await fs.writeFile(joinList, `file '${introClip}'\nfile '${storyClip}'\n`);
  await execFileAsync('ffmpeg', ['-y', '-f', 'concat', '-safe', '0', '-i', joinList, '-c', 'copy', '-movflags', '+faststart', output]);
  await fs.rm(dir, { recursive: true, force: true });
  console.log(`[${name}] exported ${output}`);
}

for (const name of which === 'all' ? Object.keys(presets) : [which]) await exportPreset(name);
