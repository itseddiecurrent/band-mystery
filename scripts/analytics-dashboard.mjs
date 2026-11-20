import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { analyticsConfig } from '../src/analytics-config.mjs';

try { process.loadEnvFile(fileURLToPath(new URL('../.env', import.meta.url))); } catch {}
const token = process.env.ANALYTICS_DASHBOARD_TOKEN;
if (!token || token.length < 40) {
  console.error('Missing ANALYTICS_DASHBOARD_TOKEN in .env. See analytics/README.md.');
  process.exit(1);
}
const port = Number(process.env.ANALYTICS_PORT ?? 8787);
if (!Number.isInteger(port) || port < 1024 || port > 65535) throw new Error('Invalid ANALYTICS_PORT');
const routes = new Map([
  ['/', ['../analytics/index.html', 'text/html']],
  ['/dashboard.mjs', ['../analytics/dashboard.mjs', 'text/javascript']],
  ['/dashboard.css', ['../analytics/dashboard.css', 'text/css']],
  ['/src/content.mjs', ['../src/content.mjs', 'text/javascript']],
]);
const server = createServer(async (request, response) => {
  response.setHeader('Cache-Control', 'no-store');
  response.setHeader('X-Content-Type-Options', 'nosniff');
  response.setHeader('Content-Security-Policy', "default-src 'self'; style-src 'self' 'unsafe-inline'; frame-ancestors 'none'");
  if (![`127.0.0.1:${port}`, `localhost:${port}`].includes(request.headers.host) ||
      request.headers['sec-fetch-site'] === 'cross-site') {
    response.writeHead(403).end('Local access only'); return;
  }
  if (request.method !== 'GET') { response.writeHead(405).end(); return; }
  const url = new URL(request.url, `http://127.0.0.1:${port}`);
  try {
    if (url.pathname === '/api/stats') {
      const endpoint = new URL(`${analyticsConfig.endpoint}/summary`);
      endpoint.searchParams.set('days', url.searchParams.get('days') ?? '30');
      const version = url.searchParams.get('version');
      if (version) endpoint.searchParams.set('version', version);
      const result = await fetch(endpoint, {
        headers: { Authorization: `Bearer ${token}` }, signal: AbortSignal.timeout(20_000),
      });
      response.writeHead(result.status, { 'Content-Type': 'application/json' });
      response.end(await result.text()); return;
    }
    const route = routes.get(url.pathname);
    if (!route) { response.writeHead(404).end('Not found'); return; }
    response.writeHead(200, { 'Content-Type': `${route[1]}; charset=utf-8` });
    response.end(await readFile(new URL(route[0], import.meta.url)));
  } catch {
    response.writeHead(502, { 'Content-Type': 'application/json' });
    response.end(JSON.stringify({ error: 'Could not reach Supabase. Check your connection and try again.' }));
  }
});
server.listen(port, '127.0.0.1', () => console.log(`Private playtest dashboard: http://127.0.0.1:${port}`));
