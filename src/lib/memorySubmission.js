const DEFAULT_TITLE = '來自訪客的一段南澳記憶';

/**
 * Keep the small exhibition form aligned with the existing memory-map schema.
 * The hosted memory-map can provide a bridge or endpoint without this scene
 * owning a second database.
 */
export function buildMemorySubmission({ story, place, sharerName = '' }) {
  return {
    title: DEFAULT_TITLE,
    content: story.trim(),
    place_name: place.trim(),
    category: '生活',
    status: 'pending',
    sharer_name: sharerName.trim() || '匿名',
    period_text: '年代未提供',
    image_url: null,
  };
}

export function supabaseConfig(env = import.meta.env || {}) {
  const url = env.VITE_SUPABASE_URL?.replace(/\/$/, '');
  const key = env.VITE_SUPABASE_PUBLISHABLE_KEY || env.VITE_SUPABASE_ANON_KEY;
  if (!url || !key) return null;
  return {
    url,
    key,
    bucket: env.VITE_SUPABASE_STORAGE_BUCKET || 'memory-images',
    table: env.VITE_MEMORY_SUBMISSIONS_TABLE || 'museum_memory_submissions',
  };
}

export async function submitToSupabase(payload, photo, config, request = globalThis.fetch) {
  let imageUrl = payload.image_url;
  if (photo) {
    const safeName = photo.name.replace(/[^a-zA-Z0-9._-]/g, '-');
    const objectPath = `submissions/${Date.now()}-${safeName}`;
    const upload = await request(`${config.url}/storage/v1/object/${config.bucket}/${objectPath}`, {
      method: 'POST',
      headers: {
        apikey: config.key,
        ...(!config.key.startsWith('sb_publishable_') ? { Authorization: `Bearer ${config.key}` } : {}),
        'Content-Type': photo.type || 'application/octet-stream',
        'x-upsert': 'false',
      },
      body: photo,
    });
    if (!upload.ok) throw new Error(`memory photo upload failed: ${upload.status}`);
    imageUrl = `${config.url}/storage/v1/object/public/${config.bucket}/${objectPath}`;
  }

  const response = await request(`${config.url}/rest/v1/${config.table}`, {
    method: 'POST',
    headers: {
      apikey: config.key,
      ...(!config.key.startsWith('sb_publishable_') ? { Authorization: `Bearer ${config.key}` } : {}),
      'Content-Type': 'application/json',
      Prefer: 'return=minimal',
    },
    body: JSON.stringify({ ...payload, image_url: imageUrl }),
  });
  if (!response.ok) throw new Error(`memory record insert failed: ${response.status}`);
  return { queued: true, mode: 'supabase' };
}

export async function submitMemorySubmission(payload, photo) {
  const bridge = globalThis.__NANAO_MEMORY_SUBMIT__;
  if (typeof bridge === 'function') return bridge(payload, photo);

  const config = supabaseConfig();
  if (config) return submitToSupabase(payload, photo, config);

  const endpoint = import.meta.env.VITE_MEMORY_SUBMISSION_ENDPOINT;
  if (endpoint) {
    const body = new FormData();
    body.append('payload', JSON.stringify(payload));
    if (photo) body.append('photo', photo, photo.name);
    const response = await fetch(endpoint, { method: 'POST', body });
    if (!response.ok) throw new Error(`memory submission failed: ${response.status}`);
    return response.json().catch(() => ({ queued: true }));
  }

  throw new Error('投稿尚未連接記憶庫，內容仍保留，請稍後再試。');
}
