// Knosp Sellar Atlası: küçük yerel sunucu. index.html'i http://127.0.0.1:<port>/ adresinde yayınlar ve tarayıcıyı açar.
const http = require('http'), fs = require('fs'), path = require('path'), { exec } = require('child_process');
const root = path.resolve(__dirname);
let port = 8080;
const types = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css', '.png': 'image/png' };
const srv = http.createServer((req, res) => {
  let p = decodeURIComponent(req.url.split('?')[0]);
  if (p === '/') p = '/index.html';
  const f = path.join(root, path.normalize(p).replace(/^[\\/]+/, ''));
  if (!f.startsWith(root)) { res.writeHead(403); return res.end(); }
  fs.readFile(f, (e, b) => {
    if (e) { res.writeHead(404); return res.end('404'); }
    res.writeHead(200, { 'Content-Type': types[path.extname(f)] || 'application/octet-stream', 'Cache-Control': 'no-store' });
    res.end(b);
  });
});
srv.on('error', (e) => {
  if (e.code === 'EADDRINUSE' && port < 8100) { port++; srv.listen(port, '127.0.0.1'); }
  else { console.error(e.message); process.exit(1); }
});
srv.on('listening', () => {
  const url = `http://127.0.0.1:${port}/`;
  console.log(`Knosp Sellar Atlasi calisiyor: ${url}`);
  console.log('Kapatmak icin bu pencereyi kapatin.');
  exec(`start "" "${url}"`);
});
srv.listen(port, '127.0.0.1');
