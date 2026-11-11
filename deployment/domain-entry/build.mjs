import {mkdir,writeFile,copyFile} from 'node:fs/promises';
await mkdir('.vercel/output/static',{recursive:true});
await writeFile('.vercel/output/config.json',JSON.stringify({version:3,routes:[{src:'/(.*)',status:307,headers:{Location:'https://hushwood.akkaz.chatgpt.site/$1','Cache-Control':'no-store'}}]}));
await copyFile('index.html','.vercel/output/static/index.html');
