import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
const root = path.resolve(process.argv[2] || '.');
const port = Number(process.env.PORT || 5173);
const types = {'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.json':'application/json; charset=utf-8','.css':'text/css; charset=utf-8','.png':'image/png','.jpg':'image/jpeg','.woff2':'font/woff2','.svg':'image/svg+xml','.md':'text/plain; charset=utf-8'};
const server = http.createServer((req,res) => {
  let requested;
  try { requested = decodeURIComponent(new URL(req.url,'http://localhost').pathname); } catch { res.writeHead(400).end();return; }
  const parts = requested.split('/');
  if (parts.some(p=>p.startsWith('.') || p==='node_modules')) {res.writeHead(403).end();return;}
  const file = path.resolve(root, '.'+(requested==='/'?'/index.html':requested));
  if (!file.startsWith(root+path.sep)) {res.writeHead(403).end();return;}
  fs.stat(file,(err,stat)=>{
    if(err||!stat.isFile()){res.writeHead(404).end('Not found');return;}
    res.writeHead(200,{'Content-Type':types[path.extname(file)]||'application/octet-stream','Cache-Control':'no-cache','X-Content-Type-Options':'nosniff'});
    fs.createReadStream(file).pipe(res);
  });
});
server.listen(port,'127.0.0.1',()=>console.log(`Rakoko journal: http://127.0.0.1:${port}`));
