import test from 'node:test';
import assert from 'node:assert/strict';
import { explorationDestinations } from '../src/data/explorationDestinations.js';

test('final exploration map keeps all three exhibit destinations', () => {
  assert.deepEqual(
    explorationDestinations.map(destination => destination.id),
    ['migration', 'knowledge', 'memory'],
  );
  explorationDestinations.forEach(destination => {
    assert.match(destination.href, /^https:\/\//);
    assert.ok(destination.title);
    assert.ok(destination.description);
  });
});

test('knowledge graph destination preserves the complete filter range', () => {
  const knowledge = explorationDestinations.find(destination => destination.id === 'knowledge');
  assert.ok(knowledge.href.includes('mg='));
  assert.ok(knowledge.href.includes('mr='));
  assert.ok(knowledge.href.includes('years=1868-2026'));
});
