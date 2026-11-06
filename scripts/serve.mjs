import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
const root = path.resolve(process.argv[2] || '.');
const port = Number(process.env.PORT || 5173);
const types = {'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.json':'application/json; charset=utf-8','.css':'text/css; charset=utf-8','.png':'image/png','.jpg':'image/jpeg','.woff2':'font/woff2','.svg':'image/svg+xml','.ogg':'audio/ogg','.mp3':'audio/mpeg','.wav':'audio/wav','.md':'text/plain; charset=utf-8'};
// 개발 전용 서버. 127.0.0.1 에만 묶고, Host 헤더를 확인해 DNS rebinding 으로 저장소 파일(로컬 캡처 등)을 읽지 못하게 한다.
const allowedHosts = new Set([`127.0.0.1:${port}`, `localhost:${port}`]);
const server = http.createServer((req,res) => {
  if (!allowedHosts.has(req.headers.host)) {res.writeHead(403).end();return;}
  let requested;
  try { requested = decodeURIComponent(new URL(req.url,'http://localhost').pathname); } catch { res.writeHead(400).end();return; }
  if (requested.includes('\0')) {res.writeHead(400).end();return;}
  const parts = requested.split('/');
  if (parts.some(p=>p.startsWith('.') || p==='node_modules')) {res.writeHead(403).end();return;}
  const file = path.resolve(root, '.'+(requested==='/'?'/index.html':requested));
  if (!file.startsWith(root+path.sep)) {res.writeHead(403).end();return;}
  try {
    fs.stat(file,(err,stat)=>{
      if(err||!stat.isFile()){res.writeHead(404).end('Not found');return;}
      res.writeHead(200,{'Content-Type':types[path.extname(file)]||'application/octet-stream','Cache-Control':'no-cache','X-Content-Type-Options':'nosniff'});
      fs.createReadStream(file).on('error',()=>res.destroy()).pipe(res);
    });
  } catch { res.writeHead(400).end(); }
});
server.listen(port,'127.0.0.1',()=>console.log(`Rakoko journal: http://127.0.0.1:${port}`));
