const http = require('http');
const fs = require('fs');
const path = require('path');

const ROOT = process.env.ROOT || __dirname;
const PORT = parseInt(process.env.PORT || '8090', 10);
const HOST = process.env.HOST || '0.0.0.0';

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.woff2': 'font/woff2',
};

http.createServer((req, res) => {
  let reqPath = decodeURIComponent(req.url.split('?')[0]);
  let filePath = path.normalize(path.join(ROOT, reqPath));
  if (!filePath.startsWith(ROOT)) {
    res.writeHead(403); res.end('Forbidden'); return;
  }
  fs.stat(filePath, (err, stat) => {
    if (!err && stat.isFile()) {
      serve(filePath, res);
    } else {
      serve(path.join(ROOT, 'index.html'), res);
    }
  });
}).listen(PORT, HOST, () => console.log(`Server listening on http://${HOST}:${PORT}`));

function serve(filePath, res) {
  const ext = path.extname(filePath);
  const mime = MIME[ext] || 'application/octet-stream';
  const cache = ext === '.html' ? 'no-cache' : 'public, max-age=604800';
  res.writeHead(200, { 'Content-Type': mime, 'Cache-Control': cache });
  fs.createReadStream(filePath).pipe(res);
}
