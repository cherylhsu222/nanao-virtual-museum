import test from 'node:test';
import assert from 'node:assert/strict';
import { sampleScene, settlementAlpha } from '../src/lib/scene.js';
import { scenes } from '../src/config/scenes.js';
import { buildRuiyanToRyohenRoute, indexRoute, sliceRoute } from '../src/lib/migrationRoute.js';
import fs from 'node:fs';
test('scroll endpoint remains on the first and last cameras', () => {
  assert.deepEqual(sampleScene(0).center, scenes[0].center);
  assert.deepEqual(sampleScene(1).center, scenes.at(-1).center);
});
test('scrub is deterministic and reversible even after jumping to the end', () => {
  const middle = sampleScene(.48);
  sampleScene(1);
  assert.deepEqual(sampleScene(.48), middle);
  assert.equal(sampleScene(0).outsideMaskOpacity, 0);
  assert.equal(sampleScene(0).settlementOpacity, 0);
});
test('settlements reveal one at a time and disappear when reversed', () => {
  assert.ok(settlementAlpha(.4, 0) > settlementAlpha(.4, 4));
  for(let i=0;i<6;i++) {
    assert.equal(settlementAlpha(0, i), 0);
    assert.equal(settlementAlpha(1, i), 1);
  }
});
test('migration route joins the real GPX segments and reveals by distance', () => {
  const ancient = fs.readFileSync(new URL('../src/data/g_ancient.gpx', import.meta.url), 'utf8');
  const siyuanRyohen = fs.readFileSync(new URL('../src/data/g_siyuan_ryohen.gpx', import.meta.url), 'utf8');
  const route = buildRuiyanToRyohenRoute(ancient, siyuanRyohen);
  const index = indexRoute(route);
  assert.ok(index.total > 50000);
  assert.deepEqual(route.geometry.coordinates[0], [121.134529, 24.023974]);
  assert.deepEqual(route.geometry.coordinates.at(-1), [121.632111, 24.446149]);
  assert.ok(sliceRoute(index, index.total * 0.2).geometry.coordinates.length < route.geometry.coordinates.length);
});
