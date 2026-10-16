import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { buildMemorySubmission } from '../src/lib/memorySubmission.js';

const archiveNodes = JSON.parse(fs.readFileSync(new URL('../src/data/memory-archive.json', import.meta.url)));
const overviewNodes = JSON.parse(fs.readFileSync(new URL('../src/data/memory-overview.json', import.meta.url)));

test('memory archive keeps all approved records and overview uses a readable source-backed subset', () => {
  assert.equal(archiveNodes.length, 57);
  assert.equal(overviewNodes.length, 30);
  assert.equal(new Set(overviewNodes.map(memory => memory.image)).size, 30);
  assert.equal(new Set(overviewNodes.map(memory => memory.location || memory.title)).size, 30);
  overviewNodes.forEach(memory => {
    assert.equal(memory.coordinates.length, 2);
    assert.ok(memory.coordinates.every(Number.isFinite));
    assert.ok(memory.image.startsWith('/images/memory/'));
  });
});

test('featured memory selection stays tied to the five approved archive titles', () => {
  const titles = [
    '溫媽媽的織布工作室',
    '一起募款蓋新會堂',
    '和家人們一起去教會',
    '製作陷阱',
    '金洋國小100週年入山尋根',
  ];
  titles.forEach(title => assert.ok(archiveNodes.some(memory => memory.title === title), title));
});

test('contribution form maps its three fields to a pending memory record', () => {
  assert.deepEqual(buildMemorySubmission({ story: '  一段故事  ', place: ' 金洋村 ' }), {
    title: '來自訪客的一段南澳記憶',
    content: '一段故事',
    place_name: '金洋村',
    category: '生活',
    status: 'pending',
    sharer_name: '匿名',
    period_text: '年代未提供',
    image_url: null,
  });
});
