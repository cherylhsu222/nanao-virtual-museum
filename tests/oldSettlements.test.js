import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { prepareOldSettlements, sampleExploration } from '../src/lib/oldSettlements.js';
const places = JSON.parse(fs.readFileSync(new URL('../src/data/migration-places.json', import.meta.url)));

test('old settlements preserve every original field and convert lat/lon correctly', () => {
  const features = prepareOldSettlements(places);
  assert.equal(features.length, 15);
  assert.match(features[0].properties.oldName, /^Ryohen/);
  features.forEach(feature => {
    const original = places.find(place => place.id === feature.properties.id);
    assert.equal(original.t, 'old');
    assert.deepEqual(feature.properties, original);
    assert.deepEqual(feature.geometry.coordinates, [original.lon, original.lat]);
  });
});

test('exploration holds, reveals in batches, and reverses without retained state', () => {
  assert.equal(sampleExploration(.10, 15).originLabelOpacity, 1);
  assert.ok(Math.abs(sampleExploration(.175, 15).originLabelOpacity - .5) < 1e-9);
  assert.equal(sampleExploration(.25, 15).originLabelOpacity, 0);
  assert.equal(sampleExploration(1, 15).originLabelOpacity, 0);
  assert.equal(sampleExploration(.10, 15).opacities[0], 1);
  assert.equal(sampleExploration(.1, 15).cameraMix, 0);
  assert.equal(sampleExploration(.3, 15).cameraMix, 1);
  const middle = sampleExploration(.5, 15);
  assert.ok(middle.opacities.some(a => a > 0 && a < 1));
  assert.ok(middle.opacities.some(a => a === 0));
  const end = sampleExploration(1, 15);
  assert.ok(end.opacities.every(a => a === 1));
  assert.equal(end.routeOpacity, .4);
  assert.equal(sampleExploration(.88, 15).interactive, true);
  assert.equal(sampleExploration(.87, 15).interactive, false);
  assert.deepEqual(sampleExploration(.5, 15), middle);
  assert.ok(sampleExploration(0, 15).opacities.every(a => a === 0));
});
