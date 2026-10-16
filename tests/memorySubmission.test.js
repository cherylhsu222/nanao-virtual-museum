import test from 'node:test';
import assert from 'node:assert/strict';
import { supabaseConfig, submitToSupabase, buildMemorySubmission } from '../src/lib/memorySubmission.js';

test('museum contributions default to their separate table even with legacy memories settings', () => {
  const config = supabaseConfig({VITE_SUPABASE_URL:'https://example.supabase.co/', VITE_SUPABASE_PUBLISHABLE_KEY:'sb_publishable_test', VITE_SUPABASE_MEMORIES_TABLE:'memories'});
  assert.equal(config.table, 'museum_memory_submissions');
});
test('pending submissions require only insert permission and never request public records back', async () => {
  let captured;
  const result = await submitToSupabase(buildMemorySubmission({story:'我的故事',place:'南澳'}), null,
    {url:'https://example.supabase.co',key:'sb_publishable_test',table:'museum_memory_submissions',bucket:'memory-images'},
    async (url, options) => { captured={url,options}; return {ok:true}; });
  assert.equal(captured.url,'https://example.supabase.co/rest/v1/museum_memory_submissions');
  assert.equal(captured.options.headers.Prefer,'return=minimal');
  assert.equal(JSON.parse(captured.options.body).status,'pending');
  assert.deepEqual(result,{queued:true,mode:'supabase'});
});
