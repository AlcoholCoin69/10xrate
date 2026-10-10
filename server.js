const http = require('http');
const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

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

// Types eligible for gzip compression (HTML, CSS, JS, JSON, SVG)
const COMPRESSIBLE = new Set([
  'text/html; charset=utf-8',
  'application/javascript; charset=utf-8',
  'text/css; charset=utf-8',
  'application/json; charset=utf-8',
  'image/svg+xml'
]);

http.createServer((req, res) => {
  let reqPath = decodeURIComponent(req.url.split('?')[0]);
  let filePath = path.normalize(path.join(ROOT, reqPath));
  if (!filePath.startsWith(ROOT)) {
    res.writeHead(403);
    res.end('Forbidden');
    return;
  }

  fs.stat(filePath, (err, stat) => {
    if (!err && stat.isFile()) {
      serve(filePath, req, res);
    } else {
      serve(path.join(ROOT, 'index.html'), req, res);
    }
  });
}).listen(PORT, HOST, () => console.log(`Server listening on http://${HOST}:${PORT}`));

function serve(filePath, req, res) {
  const ext = path.extname(filePath);
  const mime = MIME[ext] || 'application/octet-stream';
  const cache = ext === '.html' ? 'no-cache' : 'public, max-age=604800';

  const headers = {
    'Content-Type': mime,
    'Cache-Control': cache,
    'Vary': 'Accept-Encoding'
  };

  const acceptEncoding = req.headers['accept-encoding'] || '';
  const canGzip = COMPRESSIBLE.has(mime) && acceptEncoding.includes('gzip');
  const canDeflate = !canGzip && COMPRESSIBLE.has(mime) && acceptEncoding.includes('deflate');

  const rawStream = fs.createReadStream(filePath);

  rawStream.on('error', () => {
    if (!res.headersSent) {
      res.writeHead(500);
      res.end('Internal Server Error');
    }
  });

  if (canGzip) {
    headers['Content-Encoding'] = 'gzip';
    res.writeHead(200, headers);
    rawStream.pipe(zlib.createGzip({ level: 6 })).pipe(res);
  } else if (canDeflate) {
    headers['Content-Encoding'] = 'deflate';
    res.writeHead(200, headers);
    rawStream.pipe(zlib.createDeflate()).pipe(res);
  } else {
    res.writeHead(200, headers);
    rawStream.pipe(res);
  }
}
