import { cleanBatch, validBatch } from './validation.mjs';

const URL = Deno.env.get('SUPABASE_URL')!;
const KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, content-type',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Cache-Control': 'no-store',
};
const reply = (body: unknown, status = 200) => new Response(JSON.stringify(body), {
  status, headers: { ...cors, 'Content-Type': 'application/json' },
});
async function digest(value: string) {
  const bytes = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(value));
  return [...new Uint8Array(bytes)].map(b => b.toString(16).padStart(2, '0')).join('');
}
async function api(path: string, init: RequestInit = {}) {
  return fetch(`${URL}/rest/v1/${path}`, {
    ...init, headers: { apikey: KEY, Authorization: `Bearer ${KEY}`, 'Content-Type': 'application/json' },
    signal: AbortSignal.timeout(15_000),
  });
}
Deno.serve(async request => {
  if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers: cors });
  try {
    const path = new globalThis.URL(request.url);
    if (path.pathname.endsWith('/summary')) {
      if (request.method !== 'GET') return reply({ error: 'Method not allowed' }, 405);
      const token = request.headers.get('Authorization')?.replace(/^Bearer /, '') ?? '';
      if (token.length < 40 || token.length > 200) return reply({ error: 'Unauthorized' }, 401);
      const setting = await api('bandmystery_settings?key=eq.dashboard_token_sha256&select=value');
      if (!setting.ok) return reply({ error: 'Dashboard unavailable' }, 503);
      const rows = await setting.json();
      if (rows[0]?.value !== await digest(token)) return reply({ error: 'Unauthorized' }, 401);
      const days = Number(path.searchParams.get('days') ?? 30);
      const build = path.searchParams.get('version') || null;
      if (![0, 7, 30, 90, 365].includes(days) || build && build.length > 64) return reply({ error: 'Invalid filter' }, 400);
      const result = await api('rpc/bandmystery_summary', { method: 'POST', body: JSON.stringify({ days, build }) });
      if (!result.ok) return reply({ error: 'Unable to load analytics' }, 503);
      return reply(await result.json());
    }
    if (request.method !== 'POST') return reply({ error: 'Method not allowed' }, 405);
    // Bound the actual streamed body, even if Content-Length is omitted.
    const reader = request.body?.getReader();
    if (!reader) return reply({ error: 'Missing body' }, 400);
    const chunks: Uint8Array[] = [];
    let size = 0;
    while (true) {
      const part = await reader.read();
      if (part.done) break;
      size += part.value.byteLength;
      if (size > 24_000) { await reader.cancel(); return reply({ error: 'Batch too large' }, 413); }
      chunks.push(part.value);
    }
    const body = new Uint8Array(size);
    let offset = 0;
    for (const chunk of chunks) { body.set(chunk, offset); offset += chunk.byteLength; }
    let events;
    try { events = JSON.parse(new TextDecoder().decode(body)).events; }
    catch { return reply({ error: 'Invalid JSON' }, 400); }
    if (!validBatch(events)) return reply({ error: 'Invalid events' }, 400);
    // Store a salted hash for short-lived rate limits, never the IP itself.
    const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown';
    const client_hash = await digest(`${KEY}:${ip}`);
    const result = await api('rpc/bandmystery_ingest', {
      method: 'POST', body: JSON.stringify({ batch: cleanBatch(events), client_hash }),
    });
    if (!result.ok) return reply({ error: 'Collection temporarily unavailable' }, 503);
    if (!await result.json()) return reply({ error: 'Please retry later' }, 429);
    return reply({ accepted: true });
  } catch {
    return reply({ error: 'Analytics temporarily unavailable' }, 503);
  }
});
