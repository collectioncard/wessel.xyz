import { clean, projectPage, highlight, languages, normalizeAuthors, normalizeResources, normalizeGallery } from './project-page.js';
import http from 'node:http';
import { DatabaseSync } from 'node:sqlite';
import { mkdirSync, readFileSync, writeFileSync, existsSync, statSync } from 'node:fs';
import { resolve, join } from 'node:path';
import { randomBytes, timingSafeEqual, createHash } from 'node:crypto';

const data = resolve(process.env.DATA_DIR || './data');
mkdirSync(join(data, 'uploads'), { recursive: true });
const db = new DatabaseSync(join(data, 'portfolio.sqlite'));
db.exec(`PRAGMA journal_mode=WAL; CREATE TABLE IF NOT EXISTS projects (id INTEGER PRIMARY KEY, title TEXT NOT NULL, slug TEXT NOT NULL UNIQUE, summary TEXT NOT NULL DEFAULT '', cover TEXT NOT NULL DEFAULT '', body TEXT NOT NULL DEFAULT '[]', published INTEGER NOT NULL DEFAULT 0, updated TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP, deleted_at TEXT);`);
if (!db.prepare('PRAGMA table_info(projects)').all().some(c => c.name === 'tags')) db.exec("ALTER TABLE projects ADD COLUMN tags TEXT NOT NULL DEFAULT '[]'");
if (!db.prepare('PRAGMA table_info(projects)').all().some(c => c.name === 'authors')) db.exec("ALTER TABLE projects ADD COLUMN authors TEXT NOT NULL DEFAULT '[]'");
if (!db.prepare('PRAGMA table_info(projects)').all().some(c => c.name === 'deleted_at')) db.exec("ALTER TABLE projects ADD COLUMN deleted_at TEXT");
if (!db.prepare('PRAGMA table_info(projects)').all().some(c => c.name === 'published_at')) db.exec("ALTER TABLE projects ADD COLUMN published_at TEXT");
if (!db.prepare('PRAGMA table_info(projects)').all().some(c => c.name === 'resources')) db.exec("ALTER TABLE projects ADD COLUMN resources TEXT NOT NULL DEFAULT '[]'");
if (!db.prepare('PRAGMA table_info(projects)').all().some(c => c.name === 'gallery')) db.exec("ALTER TABLE projects ADD COLUMN gallery TEXT NOT NULL DEFAULT '[]'");
db.exec("CREATE TABLE IF NOT EXISTS project_drafts (project_id INTEGER PRIMARY KEY, payload TEXT NOT NULL, updated TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP, FOREIGN KEY(project_id) REFERENCES projects(id) ON DELETE CASCADE)");
const password = process.env.ADMIN_PASSWORD;
const oidc = process.env.AUTHENTIK_ISSUER && process.env.OIDC_CLIENT_ID && process.env.OIDC_CLIENT_SECRET && process.env.OIDC_REDIRECT_URI ? {
 issuer: process.env.AUTHENTIK_ISSUER.replace(/\/$/, ''), clientId: process.env.OIDC_CLIENT_ID, clientSecret: process.env.OIDC_CLIENT_SECRET,
 redirectUri: process.env.OIDC_REDIRECT_URI, scopes: process.env.OIDC_SCOPES || 'openid profile email', allowedGroup: process.env.OIDC_ALLOWED_GROUP || ''
} : null;
if ((!password || password.length < 12) && !oidc) { console.error('Set OIDC variables or ADMIN_PASSWORD to at least 12 characters.'); process.exit(1); }
const sessions = new Map();
const loginAttempts = new Map();
const oidcStates = new Map();
const escape = s => String(s ?? '').replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;').replaceAll("'",'&#39;');
const page = (title, content) => `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${escape(title)} · Thomas Wessel</title><link rel="stylesheet" href="/style.css"></head><body>${content}</body></html>`;
const layout = content => `<main class="shell"><nav><a class="brand" href="/">Thomas Wessel<span>.</span></a><a href="/">Projects</a></nav>${content}<footer>Made with curiosity. <a href="/admin">Admin</a></footer></main>`;
const image = (src, cls = '') => src && /^\/uploads\/[a-f0-9]+\.(png|jpg|webp|gif)$/.test(src) ? `<img class="${cls}" src="${escape(src)}" alt="" loading="lazy">` : '';
function renderBody(raw) { let blocks; try { blocks = JSON.parse(raw); } catch { return ''; } if (!Array.isArray(blocks)) return ''; return blocks.map(b => { if (b.type === 'html') return clean(b.html || ''); const text = escape(b.text || ''); if (b.type === 'image') return image(b.src, 'article-image'); if (b.type === 'heading') return `<h2>${text}</h2>`; if (b.type === 'quote') return `<blockquote>${text}</blockquote>`; if (b.type === 'code') return `<pre><code>${text}</code></pre>`; return `<p>${text.replaceAll('\n','<br>')}</p>`; }).join(''); }
const send = (res, status, body, type='text/html; charset=utf-8', headers={}) => { res.writeHead(status, {'Content-Type':type,'X-Content-Type-Options':'nosniff','Referrer-Policy':'same-origin',...headers}); res.end(body); };
const json = (res, status, data) => send(res,status,JSON.stringify(data),'application/json');
async function read(req, limit=2_000_000) { let chunks=[], size=0; for await (const chunk of req) { size += chunk.length; if(size > limit) throw Error('Request too large'); chunks.push(chunk); } return Buffer.concat(chunks); }
function authorized(req) { const token = (req.headers.cookie || '').split('; ').find(x => x.startsWith('session='))?.slice(8); const session = sessions.get(token); if (!session || session.expires < Date.now()) { sessions.delete(token); return false; } return true; }
function sameOrigin(req) { const origin=req.headers.origin; if (!origin) return false; try { return new URL(origin).host === req.headers.host; } catch { return false; } }
const staticFiles = {'/highlight.css':['node_modules/highlight.js/styles/github-dark.css','text/css'], '/project.css':['public/project.css','text/css'], '/carousels.js':['public/carousels.js','text/javascript'], '/medium-editor.js':['node_modules/medium-editor/dist/js/medium-editor.js','text/javascript'], '/medium-editor.css':['node_modules/medium-editor/dist/css/medium-editor.css','text/css'], '/medium-theme.css':['node_modules/medium-editor/dist/css/themes/default.css','text/css'], '/style.css':['public/style.css','text/css'], '/admin.js':['public/admin.js','text/javascript'], '/admin-enhancements.js':['public/admin-enhancements.js','text/javascript']};
const server = http.createServer(async (req,res) => { try {
 const url=new URL(req.url, 'http://localhost'); const path=url.pathname;
 if (path === '/writeupData.json') { const original=JSON.parse(readFileSync('frontend/public/writeupData.json','utf8')); const added=db.prepare('SELECT * FROM projects WHERE published=1 AND deleted_at IS NULL ORDER BY updated DESC').all().map(p=>{const gallery=normalizeGallery(p.gallery);return {title:p.title,subtitle:p.summary,description_short:p.summary,assetFolder:'cms-'+p.slug,images:gallery.length?gallery:(p.cover?[p.cover]:[]),authors:normalizeAuthors(p.authors),tags:JSON.parse(p.tags),resources:normalizeResources(p.resources)}}); original.writeups.push(...added); return json(res,200,original); }
 if (path.startsWith('/content/')) { const p=db.prepare('SELECT * FROM projects WHERE slug=? AND published=1 AND deleted_at IS NULL').get(path.slice(9)); return p ? json(res,200,{html:renderBody(p.body)}) : json(res,404,{error:'Not found'}); }
 if (req.method==='GET' && (path==='/' || path.startsWith('/assets/') || path.startsWith('/projects/') || path==='/favicon.png')) { const file=path==='/'?'frontend/dist/index.html':join('frontend/dist',path); if(existsSync(file) && statSync(file).isFile() && !path.includes('..')) { const ext=file.split('.').pop(); return send(res,200,readFileSync(file),{html:'text/html',js:'text/javascript',css:'text/css',png:'image/png',md:'text/plain'}[ext]||'application/octet-stream'); } }

 if (staticFiles[path]) return send(res,200,readFileSync(staticFiles[path][0]),staticFiles[path][1]);
 if (/^\/uploads\/[a-f0-9]+\.(png|jpg|webp|gif)$/.test(path)) { const file=join(data,path); if (!existsSync(file)) return send(res,404,'Not found'); const ext=path.split('.').pop(); return send(res,200,readFileSync(file),{'png':'image/png','jpg':'image/jpeg','webp':'image/webp','gif':'image/gif'}[ext],{'Cache-Control':'public, max-age=31536000, immutable'}); }
 if (req.method === 'GET' && path === '/') { const projects=db.prepare('SELECT * FROM projects WHERE published=1 AND deleted_at IS NULL ORDER BY updated DESC').all(); return send(res,200,page('Projects',layout(`<header class="hero"><p class="eyebrow">HELLO, I'M THOMAS</p><h1>I make seemingly unrelated stuff <em>that usually ends up being pretty neat.</em></h1><p class="intro">A collection of projects, experiments, and things I learned along the way.</p><a class="resume" href="https://docs.google.com/document/d/158I-peZDIZNFvw30WkYq4zKa8BadVcCwm4fJmsCpsjw/export?format=pdf">Download my résumé ↗</a></header><section><div class="section-heading"><div><p class="eyebrow">SELECTED WORK</p><h2>Things I've made<span>.</span></h2></div><span>${String(projects.length).padStart(2,'0')} PROJECTS</span></div><div class="grid">${projects.map(p=>`<a class="card" href="/projects/${escape(p.slug)}"><div class="card-image">${image(p.cover)}<span>↗</span></div><div class="card-copy"><h3>${escape(p.title)}</h3><p>${escape(p.summary)}</p></div></a>`).join('') || '<p class="empty">Projects are coming soon.</p>'}</div></section>`)));
 }
 if(req.method==='GET' && path.startsWith('/projects/')) {
 const slug=decodeURIComponent(path.slice(10));
 const p=db.prepare('SELECT * FROM projects WHERE slug=? AND published=1 AND deleted_at IS NULL').get(slug);
 if(p) return send(res,200,projectPage(p,renderBody(p.body),JSON.parse(p.tags)));
 return send(res,404,'Project not found');
 }
 if(req.method==='GET' && path==='/admin') return send(res,200,page('Admin',`<main class="admin-shell"><a href="/" class="brand">Thomas Wessel<span>.</span></a><div id="app"></div></main><link rel="stylesheet" href="/highlight.css"><link rel="stylesheet" href="/medium-editor.css"><link rel="stylesheet" href="/medium-theme.css"><script src="/medium-editor.js"></script><script type="module" src="/admin.js"></script>`));
 if(path==='/auth/login' && req.method==='GET') {
  if(!oidc) return send(res,404,'Authentik is not configured');
  const discovery=await (await fetch(`${oidc.issuer}/.well-known/openid-configuration`)).json();
  const state=randomBytes(32).toString('hex'); const verifier=randomBytes(32).toString('base64url');
  const challenge=createHash('sha256').update(verifier).digest('base64url'); oidcStates.set(state,{verifier,expires:Date.now()+10*60_000});
  const auth=new URL(discovery.authorization_endpoint); auth.search=new URLSearchParams({response_type:'code',client_id:oidc.clientId,redirect_uri:oidc.redirectUri,scope:oidc.scopes,state,code_challenge:challenge,code_challenge_method:'S256'}).toString(); return send(res,302,'','text/plain',{Location:auth.toString()});
 }
 if(path==='/auth/callback' && req.method==='GET') {
  if(!oidc) return send(res,404,'Authentik is not configured'); const state=url.searchParams.get('state'); const code=url.searchParams.get('code'); const saved=oidcStates.get(state); oidcStates.delete(state); if(!saved||saved.expires<Date.now()||!code) return send(res,400,'Invalid sign-in response');
  const discovery=await (await fetch(`${oidc.issuer}/.well-known/openid-configuration`)).json(); const tokenResponse=await fetch(discovery.token_endpoint,{method:'POST',headers:{'Content-Type':'application/x-www-form-urlencoded'},body:new URLSearchParams({grant_type:'authorization_code',code,client_id:oidc.clientId,client_secret:oidc.clientSecret,redirect_uri:oidc.redirectUri,code_verifier:saved.verifier})}); if(!tokenResponse.ok) return send(res,502,'Authentik token exchange failed'); const tokens=await tokenResponse.json();
  const profileResponse=await fetch(discovery.userinfo_endpoint,{headers:{Authorization:`Bearer ${tokens.access_token}`}}); if(!profileResponse.ok) return send(res,502,'Authentik profile lookup failed'); const profile=await profileResponse.json(); const groups=Array.isArray(profile.groups)?profile.groups:[]; if(oidc.allowedGroup && !groups.includes(oidc.allowedGroup)) return send(res,403,'Your Authentik account is not allowed to use this editor.');
  const sessionToken=randomBytes(32).toString('hex'); sessions.set(sessionToken,{expires:Date.now()+12*3600000,user:profile.preferred_username||profile.email||profile.sub}); return send(res,302,'','text/plain',{Location:'/admin','Set-Cookie':`session=${sessionToken}; HttpOnly; SameSite=Lax; Path=/; Max-Age=43200${process.env.NODE_ENV==='production'?'; Secure':''}`});
 }
 if(path==='/auth/logout' && req.method==='GET') { const token=(req.headers.cookie||'').split('; ').find(x=>x.startsWith('session='))?.slice(8); sessions.delete(token); return send(res,302,'','text/plain',{Location:'/', 'Set-Cookie':'session=; HttpOnly; SameSite=Lax; Path=/; Max-Age=0'}); }
 if(path==='/api/login' && req.method==='POST') { if(!password) return json(res,404,{error:'Password login is disabled'}); if(!sameOrigin(req)) return json(res,403,{error:'Invalid origin'}); const client=req.socket.remoteAddress; const attempt=loginAttempts.get(client); if(attempt && attempt.until>Date.now() && attempt.count>=10) return json(res,429,{error:'Too many attempts. Try again later.'}); if(!attempt || attempt.until<=Date.now()) loginAttempts.set(client,{count:0,until:Date.now()+15*60_000}); const body=JSON.parse((await read(req,4096)).toString()); const a=createHash('sha256').update(String(body.password || '')).digest(), b=createHash('sha256').update(password).digest(); if (!timingSafeEqual(a,b)) { loginAttempts.get(client).count++; return json(res,401,{error:'Incorrect password'}); } loginAttempts.delete(client); const token=randomBytes(32).toString('hex'); sessions.set(token,{expires:Date.now()+12*3600000,user:'local'}); return send(res,200,'{}','application/json',{'Set-Cookie':`session=${token}; HttpOnly; SameSite=Strict; Path=/; Max-Age=43200${process.env.NODE_ENV==='production'?'; Secure':''}`}); }
 if(path.startsWith('/api/')) { if(!authorized(req)) return json(res,401,{error:'Please sign in'}); if(req.method!=='GET' && !sameOrigin(req)) return json(res,403,{error:'Invalid origin'});
 if(path==='/api/languages' && req.method==='GET') return json(res,200,languages);
 if(path==='/api/preview' && req.method==='POST') {const p=JSON.parse((await read(req)).toString()); return json(res,200,{html:highlight(String(p.html||''))});}
 if(path==='/api/logout' && req.method==='POST') { const token=(req.headers.cookie||'').split('; ').find(x=>x.startsWith('session='))?.slice(8); sessions.delete(token); return send(res,200,'{}','application/json',{'Set-Cookie':'session=; HttpOnly; SameSite=Strict; Path=/; Max-Age=0'}); }
 if(path==='/api/projects' && req.method==='GET') return json(res,200,db.prepare("SELECT projects.*, project_drafts.payload AS draft_payload FROM projects LEFT JOIN project_drafts ON project_drafts.project_id=projects.id WHERE projects.deleted_at IS NULL ORDER BY projects.updated DESC").all());
 if(path==='/api/trash' && req.method==='GET') return json(res,200,db.prepare('SELECT * FROM projects WHERE deleted_at IS NOT NULL ORDER BY deleted_at DESC').all());
 if(path.startsWith('/api/projects/') && req.method==='DELETE') { const id=Number(path.slice('/api/projects/'.length)); if(!Number.isInteger(id)||id<1) return json(res,400,{error:'Invalid project'}); const permanent=new URL(req.url,'http://localhost').searchParams.get('permanent')==='true'; const result=permanent?db.prepare('DELETE FROM projects WHERE id=? AND deleted_at IS NOT NULL').run(id):db.prepare("UPDATE projects SET published=0, deleted_at=CURRENT_TIMESTAMP WHERE id=? AND deleted_at IS NULL").run(id); return result.changes ? json(res,200,{ok:true}) : json(res,404,{error:'Project not found'}); }
 if(path.startsWith('/api/projects/') && path.endsWith('/restore') && req.method==='POST') { const id=Number(path.slice('/api/projects/'.length,-'/restore'.length)); if(!Number.isInteger(id)||id<1) return json(res,400,{error:'Invalid project'}); const result=db.prepare('UPDATE projects SET deleted_at=NULL, updated=CURRENT_TIMESTAMP WHERE id=? AND deleted_at IS NOT NULL').run(id); return result.changes ? json(res,200,{ok:true}) : json(res,404,{error:'Project not found'}); }
 if(path.startsWith('/api/projects/') && path.endsWith('/clear-draft') && req.method==='POST') { const id=Number(path.slice('/api/projects/'.length,-'/clear-draft'.length)); db.prepare('DELETE FROM project_drafts WHERE project_id=?').run(id); return json(res,200,{ok:true}); }
 if(path.startsWith('/api/projects/') && path.endsWith('/draft') && req.method==='POST') { const id=Number(path.slice('/api/projects/'.length,-'/draft'.length)); const payload=JSON.parse((await read(req)).toString()); const current=db.prepare('SELECT published FROM projects WHERE id=?').get(id); if(!current?.published) return json(res,400,{error:'Only published projects can have pending drafts.'}); db.prepare('INSERT INTO project_drafts (project_id,payload,updated) VALUES (?,?,CURRENT_TIMESTAMP) ON CONFLICT(project_id) DO UPDATE SET payload=excluded.payload,updated=CURRENT_TIMESTAMP').run(id,JSON.stringify(payload)); return json(res,200,{ok:true,draft:true}); }
 if(path==='/api/projects' && req.method==='POST') {
  const p=JSON.parse((await read(req)).toString());
  const title=String(p.title||'').trim().slice(0,150), slug=String(p.slug||'').trim();
  if(!title || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug) || slug.length>150) return json(res,400,{error:'A title and a lowercase, hyphenated slug are required.'});
  if(!Array.isArray(p.body) || p.body.length>500) return json(res,400,{error:'Invalid content'});
  if(p.authors!==undefined && !Array.isArray(p.authors)) return json(res,400,{error:'Authors must be a list.'});
 if(p.resources!==undefined && !Array.isArray(p.resources)) return json(res,400,{error:'Project links must be a list.'});
 if(p.gallery!==undefined && !Array.isArray(p.gallery)) return json(res,400,{error:'Project gallery must be a list.'});
  const body=JSON.stringify(p.body.map(b=>({type:['html','paragraph','heading','quote','code','image'].includes(b.type)?b.type:'paragraph',text:String(b.text||'').slice(0,30000),src:String(b.src||''),html:b.type==='html'?clean(String(b.html||'')):''})));
  const tags=JSON.stringify([...new Set((Array.isArray(p.tags)?p.tags:[]).map(t=>String(t).trim().slice(0,50)).filter(Boolean))].slice(0,30));
  const cover=String(p.cover||'');
  if(cover && !/^\/uploads\/[a-f0-9]+\.(png|jpg|webp|gif)$/.test(cover)) return json(res,400,{error:'Invalid cover image'});
  const current=p.id?db.prepare('SELECT published_at, authors, resources, gallery FROM projects WHERE id=?').get(Number(p.id)):null;
  const authors=JSON.stringify(normalizeAuthors(p.authors===undefined?current?.authors:p.authors));
  const resources=JSON.stringify(normalizeResources(p.resources===undefined?current?.resources:p.resources));
  const gallery=JSON.stringify(normalizeGallery(p.gallery===undefined?current?.gallery:p.gallery));
  const effectiveCover=gallery ? JSON.parse(gallery)[0] || cover : cover;
  const requestedDate=String(p.published_at||'');
  const publishedAt=p.published?(requestedDate||current?.published_at||new Date().toISOString().slice(0,10)):current?.published_at||null;
  if(publishedAt && !/^\d{4}-\d{2}-\d{2}$/.test(publishedAt)) return json(res,400,{error:'Published date must be YYYY-MM-DD.'});
  try {
   if(p.id) db.prepare('UPDATE projects SET title=?, slug=?, summary=?, cover=?, body=?, published=?, tags=?, authors=?, resources=?, gallery=?, published_at=?, updated=CURRENT_TIMESTAMP WHERE id=?').run(title,slug,String(p.summary||'').slice(0,500),effectiveCover,body,p.published?1:0,tags,authors,resources,gallery,publishedAt,Number(p.id));
   else db.prepare('INSERT INTO projects (title,slug,summary,cover,body,published,tags,authors,resources,gallery,published_at) VALUES (?,?,?,?,?,?,?,?,?,?,?)').run(title,slug,String(p.summary||'').slice(0,500),effectiveCover,body,p.published?1:0,tags,authors,resources,gallery,publishedAt);
  } catch(e) { if(String(e).includes('UNIQUE')) return json(res,400,{error:'That URL is already in use.'}); throw e; }
  return json(res,200,{ok:true});
 }
 if(path==='/api/upload' && req.method==='POST') { const buf=await read(req,10_000_000); let ext; if(buf.subarray(0,8).equals(Buffer.from('89504e470d0a1a0a','hex'))) ext='png'; else if(buf[0]===0xff && buf[1]===0xd8 && buf[2]===0xff) ext='jpg'; else if(buf.subarray(0,6).toString()==='GIF87a' || buf.subarray(0,6).toString()==='GIF89a') ext='gif'; else if(buf.subarray(0,4).toString()==='RIFF' && buf.subarray(8,12).toString()==='WEBP') ext='webp'; else return json(res,400,{error:'Use a PNG, JPEG, GIF, or WebP image.'}); const name=randomBytes(16).toString('hex')+'.'+ext; writeFileSync(join(data,'uploads',name),buf); return json(res,200,{url:'/uploads/'+name}); }
 return json(res,404,{error:'Not found'}); }
 return send(res,404,'Not found');
 } catch(e) { console.error(e); return json(res,500,{error:'Something went wrong.'}); } });
server.listen(Number(process.env.PORT || 3000), '0.0.0.0',()=>console.log(`Portfolio is running on ${server.address().port}`));
