import { build } from 'esbuild';
import { readdir, readFile, mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
const types={'.mp4':'video/mp4','.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.svg':'image/svg+xml','.png':'image/png','.woff2':'font/woff2','.ttf':'font/ttf','.json':'application/json','.ico':'image/x-icon','.txt':'text/plain'};
const assets={};
async function walk(dir){ for(const e of await readdir(dir,{withFileTypes:true})){const p=path.join(dir,e.name);if(e.isDirectory()) await walk(p);else {const key='/'+path.relative('dist/client',p).split(path.sep).join('/');assets[key]=[(await readFile(p)).toString('base64'),types[path.extname(p)]||'application/octet-stream'];}} }
await walk('dist/client');
await mkdir('dist/server',{recursive:true});
const source=`import app from './worker/index.ts';
const assets=${JSON.stringify(assets)};
const staticAssets={async fetch(request){const url=new URL(request.url); const key=assets[url.pathname]?url.pathname:(!url.pathname.split('/').pop().includes('.')?'/index.html':null);if(!key)return new Response('Not found',{status:404}); const [body,type]=assets[key];return new Response(request.method==='HEAD'?null:Uint8Array.from(atob(body),c=>c.charCodeAt(0)),{headers:{'Content-Type':type,'Cache-Control':key.startsWith('/assets/')?'public, max-age=31536000, immutable':'no-cache','X-Content-Type-Options':'nosniff','Referrer-Policy':'strict-origin-when-cross-origin','Permissions-Policy':'microphone=(self), camera=(), geolocation=()'}})}};
export default {fetch(request,env,ctx){return app.fetch(request,{...env,ASSETS:staticAssets},ctx)}};`;
await build({stdin:{contents:source,resolveDir:process.cwd(),sourcefile:'entry.ts',loader:'ts'},bundle:true,format:'esm',platform:'browser',target:'es2022',outfile:'dist/server/index.js',minify:true});
await mkdir('dist/.openai',{recursive:true});
await writeFile('dist/.openai/hosting.json',await readFile('.openai/hosting.json'));
console.log('Built Sites Worker with '+Object.keys(assets).length+' self-contained assets.');
