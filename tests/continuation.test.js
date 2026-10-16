import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { continuationAt, relations, relatedTo } from '../src/lib/continuation.js';
import { parseGpxLatLon, indexRoute, distanceMeters } from '../src/lib/migrationRoute.js';
const places = JSON.parse(fs.readFileSync('src/data/migration-places.json'));
test('three appended scenes preserve exploration and reverse deterministically', () => {
  assert.equal(continuationAt(18.9).active, false);
  assert.equal(continuationAt(19.2).phase, 'settlement-migration');
  const partial = continuationAt(20);
  assert.ok(partial.routeProgress[0] > partial.routeProgress[4]);
  assert.equal(continuationAt(20).b, 1);
  assert.equal(continuationAt(21).c, 1);
  assert.ok(continuationAt(34).currentOpacity.every(v => v === 1));
  assert.deepEqual(continuationAt(20), partial);
  assert.ok(continuationAt(19).routeProgress.every(v => v === 0));
});
test('source-backed relations work in both directions without inventing Dongyue links', () => {
  assert.equal(relatedTo('金岳村')[0].old, 'Ryohen（流興）');
  assert.equal(relatedTo('Ryohen（流興）')[0].current, '金岳村');
  assert.equal(relatedTo('東岳村').length, 0);
  relations.forEach(r => {
    assert.equal(places.find(p => p.id === r.old).t, 'old');
    assert.equal(places.find(p => p.id === r.current).t, 'cur');
  });
});
test('each GPX is real multi-point geometry reaching its named destination', () => {
  relations.filter(r => r.route).forEach(r => {
    const coordinates = parseGpxLatLon(fs.readFileSync(`src/data/${r.route}.gpx`, 'utf8'));
    assert.ok(coordinates.length > 50);
    const p = places.find(p => p.id === r.current), destination = [p.lon, p.lat];
    assert.ok(Math.min(distanceMeters(coordinates[0], destination), distanceMeters(coordinates.at(-1), destination)) < 1000, r.route);
    assert.ok(indexRoute({ geometry: { coordinates } }).total > 1000);
  });
});
