// Builds the single-file index.html from src/.
// Usage: node tools/build.js
const fs = require('fs'), path = require('path');
const root = path.resolve(__dirname, '..');
const src = (f) => fs.readFileSync(path.join(root, 'src', f), 'utf8');

const body = src('head.html') + src('markup.html');
const page = body
  .replace('/*CORE*/', () => src('core.js'))
  .replace('/*CONTENT*/', () => src('content.js'))
  .replace('/*APP*/', () => src('app.js'));

const html = '<!doctype html>\n<html lang="tr">\n<head>\n<meta charset="utf-8">\n<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">\n</head>\n<body>\n' + page + '\n</body>\n</html>\n';
fs.writeFileSync(path.join(root, 'index.html'), html);
console.log(`index.html written (${html.length} bytes)`);
