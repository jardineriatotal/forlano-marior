import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
const root=path.resolve('dist');
const mime={'.html':'text/html; charset=utf-8','.js':'application/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.json':'application/json; charset=utf-8','.webp':'image/webp','.mp4':'video/mp4','.pdf':'application/pdf','.xml':'application/xml','.txt':'text/plain'};
http.createServer((req,res)=>{
  let name;
  try{name=decodeURIComponent(new URL(req.url,'http://localhost').pathname);}catch{res.writeHead(400);res.end();return;}
  let file=path.resolve(root,'.'+name);
  if(!file.startsWith(root+path.sep)&&file!==root){res.writeHead(403);res.end();return;}
  if(fs.existsSync(file)&&fs.statSync(file).isDirectory())file=path.join(file,'index.html');
  if(!fs.existsSync(file)||!fs.statSync(file).isFile()){res.writeHead(404);res.end('No encontrado');return;}
  const size=fs.statSync(file).size;
  const headers={'Content-Type':mime[path.extname(file)]||'application/octet-stream','Accept-Ranges':'bytes'};
  let start=0,end=size-1,status=200;
  if(req.headers.range){
    const range=/^bytes=(\d*)-(\d*)$/.exec(req.headers.range);
    if(range&&(range[1]||range[2])){
      if(range[1]){start=Number(range[1]);end=range[2]?Math.min(Number(range[2]),end):end;}
      else{start=Math.max(0,size-Number(range[2]));}
      status=206;
    }
    if(status!==206||start> end||start>=size||!Number.isSafeInteger(start)||!Number.isSafeInteger(end)){
      res.writeHead(416,{'Content-Range':`bytes */${size}`});res.end();return;
    }
    headers['Content-Range']=`bytes ${start}-${end}/${size}`;
  }
  headers['Content-Length']=Math.max(0,end-start+1);
  res.writeHead(status,headers);
  if(req.method==='HEAD'||size===0){res.end();return;}
  const stream=fs.createReadStream(file,{start,end});
  res.on('close',()=>stream.destroy());
  stream.on('error',()=>res.destroy());
  stream.pipe(res);
}).listen(4173,'127.0.0.1',()=>console.log('Local: http://127.0.0.1:4173'));
