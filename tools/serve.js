// Server locale per provare l'app:  npm run serve
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const TYPES = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.png': 'image/png', '.webmanifest': 'application/manifest+json', '.json': 'application/json' };
let port = Number(process.env.PORT) || 8765;
const server = http.createServer((req, res) => {
  let p = decodeURIComponent(req.url.split('?')[0]); if (p.endsWith('/')) p += 'index.html';
  const file = path.join(root, path.normalize(p));
  if (!file.startsWith(root)) { res.writeHead(403); return res.end(); }
  fs.readFile(file, (err, data) => {
    if (err) { res.writeHead(404); return res.end('404'); }
    res.writeHead(200, { 'Content-Type': TYPES[path.extname(file)] || 'application/octet-stream', 'Cache-Control': 'no-cache' });
    res.end(data);
  });
});
// Se la porta è occupata (per esempio da un'altra copia già aperta) prova la successiva.
server.on('error', err => {
  if (err.code === 'EADDRINUSE' && port < 8775) { console.log(`Porta ${port} occupata, provo la ${port + 1}…`); server.listen(++port); }
  else { console.error('Non riesco ad avviare il server:', err.message); process.exit(1); }
});
server.on('listening', () => console.log(`Repetita: http://localhost:${port}  (Ctrl+C per chiudere)`));
server.listen(port);
