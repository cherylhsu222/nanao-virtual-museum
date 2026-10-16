export function createStoryResponses({ url, key, request = globalThis.fetch } = {}) {
  function connection() {
    if (!url || !key) throw new Error('公開回應尚未連線，請稍後再來。');
    return `${url.replace(/\/$/, '')}/rest/v1/story_responses`;
  }
  const headers = { apikey: key, ...(!key?.startsWith('sb_publishable_') ? { Authorization: `Bearer ${key}` } : {}), 'Content-Type': 'application/json' };
  return {
    async list(storyId, signal) {
      const base = connection();
      const query = new URLSearchParams({ select: 'id,story_id,display_name,content,created_at', story_id: `eq.${storyId}`, order: 'created_at.desc,id.desc', limit: '100' });
      const response = await request(`${base}?${query}`, { headers, signal });
      if (!response.ok) throw new Error('回應載入未成功，請再試一次。');
      return response.json();
    },
    async submit(storyId, name, text) {
      const content = text.trim();
      const display_name = name.trim() || '訪客';
      if (!content) throw new Error('請先寫下你的回應。');
      if (content.length > 1000) throw new Error('回應請在 1000 字以內。');
      if (display_name.length > 40) throw new Error('暱稱請在 40 字以內。');
      const base = connection();
      const response = await request(base, { method: 'POST', headers: { ...headers, Prefer: 'return=representation' }, body: JSON.stringify({ story_id: storyId, display_name, content }) });
      if (!response.ok) throw new Error('回應未成功送出，內容仍保留，請再試一次。');
      return response.json();
    },
  };
}

export const storyResponses = createStoryResponses({
  url: import.meta.env?.VITE_SUPABASE_URL,
  key: import.meta.env?.VITE_SUPABASE_PUBLISHABLE_KEY || import.meta.env?.VITE_SUPABASE_ANON_KEY,
});
