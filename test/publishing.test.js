import test from 'node:test';
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

test('rich projects preserve tags and carousels and keep drafts private',async()=>{
 const data=mkdtempSync(join(tmpdir(),'portfolio-'));
 const child=spawn(process.execPath,['app/server.js'],{env:{...process.env,DATA_DIR:data,PORT:'0',ADMIN_PASSWORD:'integration-test-password'},stdio:['ignore','pipe','pipe']});
 let startupError=''; child.stderr.on('data',chunk=>{startupError+=chunk.toString()});
 try {
 const base=await new Promise((resolve,reject)=>{const timer=setTimeout(()=>reject(Error(`Server did not start: ${startupError}`)),3000);child.stdout.once('data',chunk=>{clearTimeout(timer);const port=/on (\d+)/.exec(chunk.toString())?.[1];port?resolve(`http://localhost:${port}`):reject(Error(`Unexpected startup output: ${chunk}`))});child.once('exit',code=>{clearTimeout(timer);reject(Error(`Server exited ${code}: ${startupError}`))});child.once('error',reject)});
 const login=await fetch(base+'/api/login',{method:'POST',headers:{origin:base},body:JSON.stringify({password:'integration-test-password'})});
 const cookie=login.headers.get('set-cookie').split(';')[0]; const headers={origin:base,cookie};
 assert.equal(login.headers.get('cache-control'),'no-store');
 for(const path of ['/admin','/api/projects','/admin.js','/admin-enhancements.js','/inline-editor.js','/carousels.js','/writeupData.json']) {
  const response=await fetch(base+path,{headers});assert.equal(response.status,200,path);assert.equal(response.headers.get('cache-control'),'no-store',path);
 }
 for(const path of ['/','/project.css','/style.css']) {
  const response=await fetch(base+path);assert.equal(response.headers.get('cache-control'),'no-cache, must-revalidate',path);
 }
 const homepage=await(await fetch(base+'/')).text();
 const bundle=/src="(\/assets\/[^\"]+\.js)"/.exec(homepage)?.[1];
 assert.ok(bundle,'Built homepage references a versioned JavaScript bundle');
 assert.equal((await fetch(base+bundle)).headers.get('cache-control'),'public, max-age=31536000, immutable');
 const png=Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+a/dsAAAAASUVORK5CYII=','base64');
 const uploaded=await(await fetch(base+'/api/upload',{method:'POST',headers,body:png})).json();
 assert.equal((await fetch(base+uploaded.url)).headers.get('cache-control'),'public, max-age=31536000, immutable');
 assert.equal((await fetch(base+'/uploads/000000.png')).headers.get('cache-control'),'no-store');
 const html=`<h2>Story</h2><p>A <strong>rich</strong> paragraph</p><figure data-carousel="true"><div data-slide="true"><img src="${uploaded.url}" alt="First image"><figcaption>First caption</figcaption></div><div data-slide="true"><img src="${uploaded.url}" alt="Second image"></div></figure><pre data-language="python"><code>def hello():\n    return True</code></pre><script>alert(1)</script>`;
 const authors=[{name:'Thomas Wessel',role:'Programming',url:'https://github.com/collectioncard'},{name:'Jarod Spangler',role:'Game design',url:'https://github.com/LifeHckr'}];
 const resources=[{resource_title:'GitHub repository',resource_url:'https://github.com/example/gallery'},{resource_title:'Unsafe',resource_url:'javascript:alert(1)'}];
 const gallery=[uploaded.url,'/uploads/second.png'];
 const p={title:'Gallery project',slug:'gallery-project',summary:'An experiment',cover:uploaded.url,tags:['Art','Code','Art'],authors,resources,gallery,body:[{type:'html',html}],published:false};
 let r=await fetch(base+'/api/projects',{method:'POST',headers,body:JSON.stringify(p)});assert.equal(r.status,200);
 assert.equal((await fetch(base+'/projects/gallery-project')).status,404);
 let saved=(await(await fetch(base+'/api/projects',{headers})).json())[0];assert.deepEqual(JSON.parse(saved.tags),['Art','Code']);assert.deepEqual(JSON.parse(saved.authors),authors);
 r=await fetch(base+'/api/projects',{method:'POST',headers,body:JSON.stringify({...p,id:saved.id,published:true,published_at:'2024-01-02'})});assert.equal(r.status,200);
 const page=await(await fetch(base+'/projects/gallery-project')).text();
 assert.match(page,/data-carousel="true"/);assert.match(page,/First caption/);assert.match(page,/language-python/);assert.match(page,/hljs-keyword/);assert.match(page,/alt="First image"/);assert.match(page,/<strong>rich<\/strong>/);assert.match(page,/>Art<\/span>/);assert.match(page,/January 2, 2024/);assert.doesNotMatch(page,/alert\(1\)/);
 assert.match(page,/Created by/);assert.match(page,/Jarod Spangler/);assert.match(page,/Game design/);assert.match(page,/href="https:\/\/github.com\/LifeHckr"/);assert.match(page,/GitHub repository/);assert.match(page,/href="https:\/\/github.com\/example\/gallery"/);assert.doesNotMatch(page,/Unsafe|javascript:/);
 assert.match(page,/data-carousel="true"/);assert.match(page,/src="\/uploads\/second.png"/);
 const draft={...p,id:saved.id,published:false,authors:[{name:'Pending collaborator',role:'Design',url:'https://example.com/author'}],summary:'Pending revision',body:[{type:'html',html:'<p>Changed draft</p>'}]};
 r=await fetch(base+`/api/projects/${saved.id}/draft`,{method:'POST',headers,body:JSON.stringify(draft)});assert.equal(r.status,200);
 const withDraft=(await(await fetch(base+'/api/projects',{headers})).json())[0];assert.ok(withDraft.draft_payload);assert.match((await(await fetch(base+'/projects/gallery-project')).text()),/First caption/);assert.doesNotMatch((await(await fetch(base+'/projects/gallery-project')).text()),/Changed draft/);
 assert.deepEqual(JSON.parse(withDraft.draft_payload).authors,draft.authors);assert.doesNotMatch((await(await fetch(base+'/projects/gallery-project')).text()),/Pending collaborator/);
 r=await fetch(base+`/api/projects/${saved.id}/clear-draft`,{method:'POST',headers});assert.equal(r.status,200);
 const home=await(await fetch(base+'/writeupData.json')).json();assert.ok(home.writeups.some(p=>p.title==='Gallery project'&&p.tags.includes('Code')));
 assert.deepEqual(home.writeups.find(project=>project.title==='Gallery project').authors,authors);
 r=await fetch(base+'/api/projects',{method:'POST',headers,body:JSON.stringify({...p,id:saved.id,published:true,authors:draft.authors})});assert.equal(r.status,200);
 assert.match((await(await fetch(base+'/projects/gallery-project')).text()),/Pending collaborator/);
 const {authors:omittedAuthors,...oldClient}=p;
 r=await fetch(base+'/api/projects',{method:'POST',headers,body:JSON.stringify({...oldClient,id:saved.id,published:true})});assert.equal(r.status,200);
 assert.deepEqual(JSON.parse((await(await fetch(base+'/api/projects',{headers})).json())[0].authors),draft.authors);
 r=await fetch(base+`/api/projects/${saved.id}`,{method:'DELETE',headers});assert.equal(r.status,200);
 assert.equal((await fetch(base+'/projects/gallery-project')).status,404);
 assert.equal((await (await fetch(base+'/api/projects',{headers})).json()).length,0);
 let trash=await(await fetch(base+'/api/trash',{headers})).json();assert.equal(trash.length,1);assert.equal(trash[0].title,'Gallery project');
 r=await fetch(base+`/api/projects/${saved.id}/restore`,{method:'POST',headers});assert.equal(r.status,200);assert.equal((await(await fetch(base+'/api/projects',{headers})).json()).length,1);
 r=await fetch(base+`/api/projects/${saved.id}`,{method:'DELETE',headers});assert.equal(r.status,200);r=await fetch(base+`/api/projects/${saved.id}?permanent=true`,{method:'DELETE',headers});assert.equal(r.status,200);assert.equal((await(await fetch(base+'/api/trash',{headers})).json()).length,0);
 assert.equal((await fetch(base+'/projects/pwg')).status,404);
 } finally {child.kill();rmSync(data,{recursive:true,force:true});}
});
