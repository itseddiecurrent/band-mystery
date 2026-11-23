import { createServer } from 'node:http';
import { readFile, writeFile, rename, unlink } from 'node:fs/promises';
import { createHash, randomUUID } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { resolve } from 'node:path';
import { validateTree, validateProtectedNodes } from '../authoring/story-editor/model.mjs';

const root = new URL('../', import.meta.url);
const staticFiles = new Map([
  ['/', ['authoring/story-editor/index.html', 'text/html']],
  ['/app.mjs', ['authoring/story-editor/app.mjs', 'text/javascript']],
  ['/model.mjs', ['authoring/story-editor/model.mjs', 'text/javascript']],
  ['/style.css', ['authoring/story-editor/style.css', 'text/css']],
]);
const hash = content => createHash('sha256').update(content).digest('hex');
const MAX_BYTES = 2 * 1024 * 1024;

export function createStoryEditorServer({ dataFile = fileURLToPath(new URL('docs/story-tree.json', root)) } = {}) {
  // Serialize writes and reject stale revisions so two tabs cannot silently overwrite one another.
  let writes = Promise.resolve();
  async function readTree() {
    const content = await readFile(dataFile, 'utf8');
    return { tree: validateTree(JSON.parse(content)), revision: hash(content) };
  }
  const server = createServer(async (request, response) => {
    response.setHeader('Cache-Control', 'no-store');
    response.setHeader('X-Content-Type-Options', 'nosniff');
    response.setHeader('Content-Security-Policy', "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob:; frame-ancestors 'none'; base-uri 'none'; form-action 'none'");
    const port = server.address()?.port;
    const allowedHosts = [`127.0.0.1:${port}`, `localhost:${port}`];
    const allowedOrigins = allowedHosts.map(host => `http://${host}`);
    const json = (status, value) => {
      response.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8' });
      response.end(JSON.stringify(value));
    };
    if (!allowedHosts.includes(request.headers.host) || request.headers['sec-fetch-site'] === 'cross-site' ||
        (request.headers.origin && !allowedOrigins.includes(request.headers.origin))) {
      json(403, { error: '仅允许从本机编辑器访问。' }); return;
    }
    const url = new URL(request.url, `http://127.0.0.1:${port}`);
    try {
      if (url.pathname === '/api/tree') {
        if (request.method === 'GET') { json(200, await readTree()); return; }
        if (request.method !== 'PUT') { json(405, { error: '不支持此请求。' }); return; }
        if (!request.headers.origin || !request.headers['content-type']?.startsWith('application/json')) {
          json(403, { error: '请通过剧情编辑器保存。' }); return;
        }
        let content = '', bytes = 0;
        for await (const chunk of request) {
          bytes += chunk.length;
          if (bytes > MAX_BYTES) { json(413, { error: '文件太大，请控制在 2 MB 以内。' }); return; }
          content += chunk;
        }
        let body;
        try { body = JSON.parse(content); validateTree(body.tree); }
        catch (error) { json(400, { error: error.message || 'JSON 格式不正确。' }); return; }
        const output = JSON.stringify(body.tree, null, 2) + '\n';
        if (Buffer.byteLength(output) > MAX_BYTES) { json(413, { error: '文件太大，请控制在 2 MB 以内。' }); return; }
        const write = writes.then(async () => {
          const current = await readTree();
          if (body.revision !== current.revision) { json(409, { error: '文件已被其他窗口修改，请先导出当前草稿，再重新载入。' }); return; }
          try { validateProtectedNodes(current.tree, body.tree); }
          catch (error) { json(400, { error: error.message }); return; }
          const temporary = `${dataFile}.${randomUUID()}.tmp`;
          try {
            await writeFile(temporary, output, { encoding: 'utf8', flag: 'wx' });
            await rename(temporary, dataFile);
          } finally { await unlink(temporary).catch(() => {}); }
          json(200, { revision: hash(output) });
        });
        writes = write.catch(() => {});
        await write;
        return;
      }
      if (request.method !== 'GET') { json(405, { error: '不支持此请求。' }); return; }
      const file = staticFiles.get(url.pathname);
      if (!file) { response.writeHead(404).end('Not found'); return; }
      const content = await readFile(new URL(file[0], root));
      response.writeHead(200, { 'Content-Type': `${file[1]}; charset=utf-8` });
      response.end(content);
    } catch (error) {
      console.error('Story editor:', error.code ?? error.message);
      if (!response.headersSent) json(500, { error: '无法读写剧情文档。请检查终端和文件权限；当前草稿仍可导出。' });
      else response.end();
    }
  });
  return server;
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const port = Number(process.env.STORY_EDITOR_PORT ?? 8788);
  if (!Number.isInteger(port) || port < 1024 || port > 65535) throw new Error('Invalid STORY_EDITOR_PORT');
  const server = createStoryEditorServer();
  server.on('error', error => { console.error(error.message); process.exitCode = 1; });
  server.listen(port, '127.0.0.1', () => console.log(`Story editor: http://127.0.0.1:${port}`));
  for (const signal of ['SIGINT', 'SIGTERM']) process.on(signal, () => server.close(() => process.exit(0)));
}
