import http from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { checkAssets } from './check-assets.mjs';
const root = fileURLToPath(new URL('../public', import.meta.url));
const host = '127.0.0.1';
const port = 4173;
try { await checkAssets(); } catch (e) {
  console.error(`Meme Mirror cannot start: ${e.message}\nFirst-time setup: npm ci && npm run setup`);
  process.exit(1);
}
const mime = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.mjs': 'text/javascript', '.css': 'text/css', '.svg': 'image/svg+xml', '.png': 'image/png', '.jpg': 'image/jpeg', '.json': 'application/json', '.wasm': 'application/wasm', '.task': 'application/octet-stream' };
const server = http.createServer(async (req, res) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('Cache-Control', 'no-store');
  res.setHeader('Permissions-Policy', 'camera=(self), microphone=()');
  res.setHeader('Content-Security-Policy', "default-src 'self'; script-src 'self' 'wasm-unsafe-eval'; worker-src 'self'; connect-src 'self'; img-src 'self' blob: data:; media-src 'self' blob:; style-src 'self' 'unsafe-inline'; font-src 'self'; object-src 'none'; base-uri 'none'; frame-ancestors 'none'");
  if (!['GET', 'HEAD'].includes(req.method)) { res.writeHead(405); res.end(); return; }
  try {
    const url = new URL(req.url, `http://${host}:${port}`);
    if (url.pathname === '/health') { res.setHeader('Content-Type', 'application/json'); res.end(JSON.stringify({ app: 'meme-mirror', version: 1, root })); return; }
    const name = decodeURIComponent(url.pathname === '/' ? '/index.html' : url.pathname);
    const file = path.resolve(root, `.${name}`);
    if (!file.startsWith(root + path.sep) || !(await stat(file)).isFile()) throw new Error('Not found');
    res.setHeader('Content-Type', mime[path.extname(file)] || 'application/octet-stream');
    res.end(req.method === 'HEAD' ? undefined : await readFile(file));
  } catch { res.writeHead(404); res.end('Not found'); }
});
server.on('error', error => {
  console.error(error.code === 'EADDRINUSE' ? 'Port 4173 is already in use. Close the other server or use Start Meme Mirror.bat to reuse this app.' : error);
  process.exit(1);
});
server.listen(port, host, () => console.log(`Meme Mirror ready: http://${host}:${port}\nKeep this window open. Press Ctrl+C to stop.`));
