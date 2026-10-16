import test from 'node:test';
import assert from 'node:assert/strict';
import { createStoryResponses } from '../src/lib/storyResponses.js';

test('public responses fail honestly without a configured database', async () => {
  const api = createStoryResponses({});
  await assert.rejects(api.list('story-1'), /尚未連線/);
  await assert.rejects(api.submit('story-1', '訪客', '我也有這段記憶'), /尚未連線/);
});
test('responses are scoped to their story and only accept nonempty bounded text', async () => {
  const calls = [];
  const api = createStoryResponses({url:'https://example.supabase.co', key:'public-key', request:async (url, options) => {
    calls.push({url, options});
    return {ok:true, json:async()=>[]};
  }});
  await api.list('story-1');
  assert.ok(calls[0].url.includes('story_id=eq.story-1'));
  await api.submit('story-2', '  小林 ', '  想起小時候  ');
  assert.deepEqual(JSON.parse(calls[1].options.body), {story_id:'story-2', display_name:'小林', content:'想起小時候'});
  await assert.rejects(api.submit('story-2', '', '   '), /回應/);
  await assert.rejects(api.submit('story-2', '', '字'.repeat(1001)), /1000/);
  assert.equal(calls.length, 2);
});
test('failed requests never become successful public responses', async () => {
  const api = createStoryResponses({url:'https://example.supabase.co', key:'public-key', request:async()=>({ok:false})});
  await assert.rejects(api.submit('story-1', '', '記憶'), /未成功/);
});
