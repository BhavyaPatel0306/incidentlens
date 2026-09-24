import http from 'node:http';
import {readFile} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import {incidents} from './src/fixtures.mjs';
import {investigate} from './src/agent.mjs';
const assets={'/':['index.html','text/html'],'/app.js':['app.js','text/javascript'],'/style.css':['style.css','text/css'],'/favicon.svg':['favicon.svg','image/svg+xml']};
export function createServer(){let busy=false;return http.createServer(async(req,res)=>{
 res.setHeader('X-Content-Type-Options','nosniff');res.setHeader('Cache-Control','no-store');res.setHeader('Content-Security-Policy',"default-src 'self'; style-src 'self'; script-src 'self'; img-src 'self' data:; frame-ancestors 'none'; base-uri 'none'");
 const json=(status,data)=>{res.writeHead(status,{'Content-Type':'application/json'});res.end(JSON.stringify(data));};
 const host=req.headers.host||'';if(!/^(localhost|127\.0\.0\.1)(:\d+)?$/.test(host))return json(403,{error:'Local requests only'});
 const origin=req.headers.origin;if(origin&&origin!==`http://${host}`)return json(403,{error:'Cross-origin requests are not allowed'});
 if(req.method==='GET'&&req.url==='/api/config')return json(200,{incidents,liveAvailable:Boolean(process.env.OPENAI_API_KEY),simulated:true});
 if(req.method==='POST'&&req.url==='/api/investigate'){
  if(busy)return json(429,{error:'An investigation is already running. Please wait.'});
  if(!req.headers['content-type']?.startsWith('application/json'))return json(415,{error:'JSON required'});
  let body='';try{for await(const chunk of req){body+=chunk;if(body.length>2048)return json(413,{error:'Request too large'});}const opts=JSON.parse(body);if(!incidents.some(i=>i.id===opts.incidentId)||!['demo','live'].includes(opts.mode)||typeof opts.sparse!=='boolean')return json(400,{error:'Invalid investigation request'});
   if(opts.mode==='live'&&!process.env.OPENAI_API_KEY)return json(400,{error:'Live AI is unavailable. Configure a server API key or use demo mode.'});
   busy=true;res.writeHead(200,{'Content-Type':'application/x-ndjson'});
   try{await investigate({...opts,emit:event=>res.write(JSON.stringify(event)+'\n')});}catch(error){res.write(JSON.stringify({type:'error',error:error.message})+'\n');}finally{busy=false;res.end();}
  }catch{if(!res.headersSent)json(400,{error:'Invalid JSON request'});}return;
 }
 if(req.method==='GET'&&assets[req.url]){const [file,type]=assets[req.url];try{res.writeHead(200,{'Content-Type':type});res.end(await readFile(new URL(`./public/${file}`,import.meta.url)));}catch{res.end('Asset unavailable');}return;}
 json(404,{error:'Not found'});
});}
if(process.argv[1]===fileURLToPath(import.meta.url)){const port=Number(process.env.PORT)||4317;createServer().listen(port,'127.0.0.1',()=>console.log(`IncidentLens: http://127.0.0.1:${port} (simulated data)`));}
