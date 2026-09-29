import {createServer} from 'node:http';
import {readFile} from 'node:fs/promises';
import handler from './api/market.js';
import macroHandler from './api/macro.js';
createServer(async (req,res)=>{
  if(req.url.startsWith('/api/market') || req.url.startsWith('/api/macro')) {
    res.status=(code)=>{res.statusCode=code;return res};res.json=(obj)=>{res.setHeader('Content-Type','application/json');res.end(JSON.stringify(obj))};
    return req.url.startsWith('/api/macro')?macroHandler(req,res):handler(req,res);
  }
  try {const p=req.url==='/'?'/index.html':req.url; if(!['/index.html','/style.css','/app.js'].includes(p)) throw Error('Not found');
    const data=await readFile(new URL('.'+p,import.meta.url));res.setHeader('Content-Type',p.endsWith('.css')?'text/css':p.endsWith('.js')?'text/javascript':'text/html');res.end(data);
  }catch{res.statusCode=404;res.end('Not found')}
}).listen(3000,()=>console.log('http://localhost:3000'));
