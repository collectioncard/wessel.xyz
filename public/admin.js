import { enhanceCarousels } from '/carousels.js';
import '/admin-enhancements.js';
const root=document.querySelector('#app');
const esc=s=>String(s??'').replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;').replaceAll("'",'&#39;');
async function api(path, options={}) { const r=await fetch('/api/'+path,options); const data=await r.json(); if(!r.ok) throw Error(data.error||'Request failed'); return data; }
const post=(path,data)=>api(path,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(data)});
function message(error) { alert(error.message); }
function login() { root.innerHTML=`<div class="login"><h1>Welcome back.</h1><p>Sign in to manage your projects.</p><a class="authentik-login" href="/auth/login">Sign in with Authentik →</a><div class="local-login"><p>Local development</p><form><label>Password<input name="password" type="password" autocomplete="current-password" required></label><button>Sign in →</button><p class="error" role="alert"></p></form></div></div>`; root.querySelector('form').onsubmit=async e=>{e.preventDefault();try{await post('login',{password:e.target.password.value});list();}catch(err){root.querySelector('.error').textContent=err.message;}}; }
async function list(mode='projects'){ let projects; try{projects=await api(mode==='trash'?'trash':'projects');}catch{login();return;} const trash=mode==='trash'; root.innerHTML=`<div class="admin-heading"><div><h1>${trash?'Trash':'Projects'}<span>.</span></h1></div><div><button id="logout" class="secondary">Sign out</button>${trash?'<button id="back-projects" class="secondary">Projects</button>':'<button id="trash" class="secondary">Trash</button> <button id="new">+ New project</button>'}</div></div><div class="project-list">${projects.map(p=>trash?`<div class="project-row-wrap"><div class="project-row"><span><strong>${esc(p.title)}</strong><small>Deleted ${esc(p.deleted_at)}</small></span><span><button class="restore-project secondary" data-restore="${p.id}">Restore</button> <button class="delete-project secondary" data-delete="${p.id}">Delete forever</button></span></div></div>`:`<div class="project-row-wrap"><button class="project-row" data-id="${p.id}"><span><strong>${esc(p.title)}</strong><small> /projects/${esc(p.slug)}</small></span><span class="status">${p.published?'Published':'Draft'} &nbsp; →</span></button><button class="delete-project secondary" data-delete="${p.id}">Delete</button></div>`).join('')||`<p class="empty">${trash?'Trash is empty.':'No projects yet. Start with something you’re proud of.'}</p>`}</div>`; root.querySelector('#new')?.addEventListener('click',()=>edit({title:'',slug:'',summary:'',cover:'',body:'[]',published:0})); root.querySelector('#trash')?.addEventListener('click',()=>list('trash')); root.querySelector('#back-projects')?.addEventListener('click',()=>list()); root.querySelector('#logout').onclick=async()=>{await post('logout',{});login();}; root.querySelectorAll('[data-id]').forEach(b=>b.onclick=()=>edit(projects.find(p=>p.id===Number(b.dataset.id)))); root.querySelectorAll('[data-restore]').forEach(b=>b.onclick=async()=>{try{await post(`projects/${b.dataset.restore}/restore`,{});list('trash')}catch(err){alert(err.message)}}); root.querySelectorAll('[data-delete]').forEach(b=>b.onclick=async()=>{const project=projects.find(p=>p.id===Number(b.dataset.delete));const forever=trash;if(!project||!confirm(`${forever?'Permanently delete':'Move'} “${project.title}”?`))return;try{await api(`projects/${project.id}${forever?'?permanent=true':''}`,{method:'DELETE'});list(mode)}catch(err){alert(err.message)}}); }
let activeEditor;
function edit(project) {
 activeEditor?.destroy();
 let blocks; try { blocks=JSON.parse(project.body); } catch { blocks=[]; }
 const legacy=blocks.map(b=>b.type==='html'?b.html:b.type==='image'?`<img src="${esc(b.src)}">`:`<${b.type==='heading'?'h2':b.type==='quote'?'blockquote':b.type==='code'?'pre':'p'}>${esc(b.text)}</${b.type==='heading'?'h2':b.type==='quote'?'blockquote':b.type==='code'?'pre':'p'}>`).join('');
 let cover=project.cover; let dirty=false; let tags=[]; try { tags=JSON.parse(project.tags||'[]'); } catch {} let resources=[]; try { resources=Array.isArray(project.resources)?structuredClone(project.resources):JSON.parse(project.resources||'[]'); } catch {} if(!Array.isArray(resources)) resources=[]; let headerGallery=[]; try { headerGallery=Array.isArray(project.gallery)?structuredClone(project.gallery):JSON.parse(project.gallery||'[]'); } catch {} if(!Array.isArray(headerGallery)) headerGallery=[]; let publishedAt=project.published_at||'';
 root.innerHTML=`<div class="editor-top"><button class="text-button" id="back">← Projects</button><span id="save-status" role="status">${project.published?'Published':'Draft'}</span><div><button class="secondary" id="settings">Story settings</button> <button class="secondary" id="preview">Preview</button> <button class="secondary" id="draft">Save draft</button> <button id="publish">Publish</button></div></div><section class="medium-story"><input id="title" aria-label="Title" placeholder="Title" value="${esc(project.title)}"><textarea id="summary" aria-label="Subtitle" placeholder="Tell your story…">${esc(project.summary)}</textarea><div class="story-writing"><button id="image" aria-label="Insert image" title="Insert image">+</button><div id="insert-menu" hidden><button data-insert="image">Image</button><button data-insert="carousel">Image carousel</button><button data-insert="code">Code block</button><button data-insert="divider">Divider</button></div><div id="story">${legacy||'<p><br></p>'}</div></div></section><input id="image-file" type="file" accept="image/png,image/jpeg,image/gif,image/webp" hidden><dialog id="settings-dialog"><h2>Story settings</h2><label>URL slug<input id="slug" value="${esc(project.slug)}"></label><label>Tags (comma separated)<input id="tags" value="${esc(tags.join(', '))}" placeholder="Java, Game development, AI"></label><label>Cover image<input id="cover" type="file" accept="image/png,image/jpeg,image/gif,image/webp"></label><p id="cover-status">${cover?'Cover image selected':''}</p><button id="settings-close">Done</button></dialog><dialog id="gallery-dialog"><h2>Image carousel</h2><p>Add images, captions, and descriptions. Use the arrows to change their order.</p><input id="gallery-files" type="file" accept="image/png,image/jpeg,image/gif,image/webp" multiple><div id="gallery-items"></div><p id="gallery-error" role="alert"></p><button id="gallery-cancel" class="secondary">Cancel</button> <button id="gallery-done">Insert carousel</button></dialog><dialog id="code-dialog"><h2>Code block</h2><label>Language<select id="code-language"><option value="plaintext">Plain text</option></select></label><label>Code<textarea id="code-source" spellcheck="false" placeholder="Paste or write your code here"></textarea></label><div id="code-highlight-preview"></div><p id="code-error" role="alert"></p><button id="code-cancel" class="secondary">Cancel</button> <button id="code-done">Insert code</button></dialog><dialog id="preview-dialog"><button id="close-preview" class="text-button">Close ✕</button><article id="preview-content"></article></dialog>`;
 const $=s=>root.querySelector(s);
 let authors=[];
 try { authors=Array.isArray(project.authors)?structuredClone(project.authors):JSON.parse(project.authors||'[]'); } catch {}
 if(!Array.isArray(authors)) authors=[];
 if(!project.id && !authors.length) authors=[{name:'Thomas Wessel',role:'',url:'https://github.com/collectioncard'}];
 const authorSettings=document.createElement('fieldset');
 authorSettings.className='authors-editor';
 authorSettings.innerHTML='<legend>Authors & collaborators</legend><p>Credit everyone who worked on this project, including yourself. Roles and profile links are optional.</p><div id="author-rows"></div><button id="add-author" class="secondary" type="button">+ Add author</button>';
 $('#settings-dialog').insertBefore(authorSettings,$('#settings-close'));
 const authorsChanged=()=>{dirty=true;$('#save-status').textContent='Unsaved changes';};
 const drawAuthors=()=>{
  $('#author-rows').innerHTML=authors.map((author,index)=>`<div class="author-row"><label>Name<input data-author-name="${index}" value="${esc(author.name)}" maxlength="120" placeholder="Full name"></label><label>Role (optional)<input data-author-role="${index}" value="${esc(author.role||'')}" maxlength="120" placeholder="e.g. Game design"></label><label>Profile link (optional)<input type="url" data-author-url="${index}" value="${esc(author.url||author.github||'')}" maxlength="2048" placeholder="https://github.com/…"></label><button class="text-button" type="button" data-remove-author="${index}" aria-label="Remove author ${esc(author.name||String(index+1))}">Remove author</button></div>`).join('');
  for(const field of ['name','role','url']) $('#author-rows').querySelectorAll(`[data-author-${field}]`).forEach(input=>input.oninput=()=>{authors[Number(input.getAttribute(`data-author-${field}`))][field]=input.value;authorsChanged();});
  $('#author-rows').querySelectorAll('[data-remove-author]').forEach(button=>button.onclick=()=>{authors.splice(Number(button.dataset.removeAuthor),1);authorsChanged();drawAuthors();});
 };
 $('#add-author').onclick=()=>{authors.push({name:'',role:'',url:''});authorsChanged();drawAuthors();$('#author-rows').querySelector('.author-row:last-child input')?.focus();};
 drawAuthors();
 const resourceSettings=document.createElement('fieldset');
 resourceSettings.className='resources-editor';
 resourceSettings.innerHTML='<legend>Project links</legend><p>Add buttons such as a GitHub repository, live demo, or itch.io page.</p><div id="resource-rows"></div><button id="add-resource" class="secondary" type="button">+ Add link</button>';
 $('#settings-dialog').insertBefore(resourceSettings,$('#settings-close'));
 const resourcesChanged=()=>{dirty=true;$('#save-status').textContent='Unsaved changes';};
 const drawResources=()=>{
  $('#resource-rows').innerHTML=resources.map((resource,index)=>`<div class="resource-row"><label>Link label<input data-resource-title="${index}" value="${esc(resource.resource_title||'')}" maxlength="120" placeholder="GitHub repository"></label><label>URL<input type="url" data-resource-url="${index}" value="${esc(resource.resource_url||'')}" maxlength="2048" placeholder="https://github.com/…"></label><button class="text-button" type="button" data-remove-resource="${index}" aria-label="Remove ${esc(resource.resource_title||String(index+1))}">Remove</button></div>`).join('');
  for(const field of ['title','url']) $('#resource-rows').querySelectorAll(`[data-resource-${field}]`).forEach(input=>input.oninput=()=>{resources[Number(input.getAttribute(`data-resource-${field}`))][field==='title'?'resource_title':'resource_url']=input.value;resourcesChanged();});
  $('#resource-rows').querySelectorAll('[data-remove-resource]').forEach(button=>button.onclick=()=>{resources.splice(Number(button.dataset.removeResource),1);resourcesChanged();drawResources();});
 };
 $('#add-resource').onclick=()=>{resources.push({resource_title:'',resource_url:''});resourcesChanged();drawResources();$('#resource-rows').querySelector('.resource-row:last-child input')?.focus();};
 drawResources();
 const gallerySettings=document.createElement('fieldset');
 gallerySettings.className='resources-editor gallery-editor';
 gallerySettings.innerHTML='<legend>Project header gallery</legend><p>The first image is used on the homepage card. Add more images to turn the project header into a carousel.</p><input id="header-gallery-files" type="file" accept="image/png,image/jpeg,image/gif,image/webp" multiple><div id="header-gallery-rows"></div>';
 $('#settings-dialog').insertBefore(gallerySettings,$('#settings-close'));
 const galleryChanged=()=>{dirty=true;$('#save-status').textContent='Unsaved changes';};
 const drawHeaderGallery=()=>{
  $('#header-gallery-rows').innerHTML=headerGallery.map((src,index)=>`<div class="header-gallery-row"><img src="${esc(src)}" alt=""><span>${index===0?'Homepage image':'Carousel image '+(index+1)}</span><button class="text-button" type="button" data-remove-header-gallery="${index}">Remove</button></div>`).join('');
  $('#header-gallery-rows').querySelectorAll('[data-remove-header-gallery]').forEach(button=>button.onclick=()=>{headerGallery.splice(Number(button.dataset.removeHeaderGallery),1);galleryChanged();drawHeaderGallery();});
 };
 drawHeaderGallery();
 const publishedDateLabel=document.createElement('label');
 publishedDateLabel.textContent='Published date';
 const publishedDateInput=document.createElement('input');
 publishedDateInput.type='date'; publishedDateInput.id='published-date'; publishedDateInput.value=publishedAt;
 publishedDateLabel.append(publishedDateInput); $('#settings-dialog').insertBefore(publishedDateLabel,$('#cover').parentElement);
 let insertionRange=null;
 const saveInsertionPoint=()=>{
  const selection=window.getSelection();
  if(selection?.rangeCount && $('#story').contains(selection.anchorNode)) insertionRange=selection.getRangeAt(0).cloneRange();
 };
 const restoreInsertionPoint=()=>{
  const selection=window.getSelection();
  selection.removeAllRanges();
  if(insertionRange) selection.addRange(insertionRange);
  else {
   const fallback=document.createRange();
   fallback.setStart($('#story'),0);
   fallback.collapse(true);
   selection.addRange(fallback);
  }
 };
 activeEditor=new MediumEditor('#story',{placeholder:{text:'Tell your story…',hideOnClick:false},toolbar:{buttons:['bold','italic','anchor','h2','h3','quote','unorderedlist','orderedlist'],diffTop:-10},anchor:{linkValidation:true},paste:{forcePlainText:false,cleanPastedHTML:true}});
 activeEditor.subscribe('editableInput',()=>{dirty=true;$('#save-status').textContent='Unsaved changes';});
 $('#story').addEventListener('keyup',saveInsertionPoint);
 $('#story').addEventListener('mouseup',saveInsertionPoint);
 $('#title').oninput=()=>{dirty=true;if(!project.id)$('#slug').value=$('#title').value.toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'');};$('#summary').oninput=()=>dirty=true;
 $('#settings').onclick=()=>$('#settings-dialog').showModal();$('#settings-close').onclick=()=>$('#settings-dialog').close();
 async function upload(file){const r=await fetch('/api/upload',{method:'POST',body:file});const result=await r.json();if(!r.ok)throw Error(result.error);dirty=true;return result.url;}
 $('#cover').onchange=async e=>{if(!e.target.files[0])return;try{cover=await upload(e.target.files[0]);$('#cover-status').textContent='Cover image selected';}catch(e){message(e)}};
 $('#header-gallery-files').onchange=async e=>{const files=[...e.target.files];e.target.disabled=true;try{for(const file of files)headerGallery.push(await upload(file));galleryChanged();drawHeaderGallery();}catch(err){message(err)}finally{e.target.disabled=false;e.target.value=''}};
 $('#image').addEventListener('mousedown',event=>{event.preventDefault();saveInsertionPoint();});
 $('#image').onclick=()=>{$('#insert-menu').hidden=!$('#insert-menu').hidden;};
 let galleryTarget=null, galleryImages=[];
 const markGalleries=()=>$('#story').querySelectorAll('figure[data-carousel]').forEach(el=>{el.contentEditable='false';el.title='Click to edit carousel';el.onclick=()=>openGallery(el);});
 const drawGallery=()=>{ $('#gallery-items').innerHTML=galleryImages.map((i,n)=>`<div class="gallery-item"><img src="${esc(i.src)}" alt=""><label>Image description<input data-alt="${n}" value="${esc(i.alt)}"></label><label>Caption<input data-caption="${n}" value="${esc(i.caption)}"></label><div><button data-move="${n}" data-direction="-1" class="secondary">↑</button> <button data-move="${n}" data-direction="1" class="secondary">↓</button> <button data-remove="${n}" class="secondary">Remove</button></div></div>`).join(''); $('#gallery-items').querySelectorAll('[data-alt]').forEach(el=>el.oninput=()=>galleryImages[+el.dataset.alt].alt=el.value);$('#gallery-items').querySelectorAll('[data-caption]').forEach(el=>el.oninput=()=>galleryImages[+el.dataset.caption].caption=el.value);$('#gallery-items').querySelectorAll('[data-remove]').forEach(el=>el.onclick=()=>{galleryImages.splice(+el.dataset.remove,1);drawGallery()});$('#gallery-items').querySelectorAll('[data-move]').forEach(el=>el.onclick=()=>{const n=+el.dataset.move,to=n+(+el.dataset.direction);if(to>=0&&to<galleryImages.length){[galleryImages[n],galleryImages[to]]=[galleryImages[to],galleryImages[n]];drawGallery()}}); };
 function openGallery(target=null){galleryTarget=target;galleryImages=target?[...target.querySelectorAll('div[data-slide]')].map(slide=>({src:slide.querySelector('img').getAttribute('src'),alt:slide.querySelector('img').alt,caption:slide.querySelector('figcaption')?.textContent||''})):[];drawGallery();$('#gallery-error').textContent='';$('#gallery-dialog').showModal();}
 $('#gallery-files').onchange=async e=>{const files=[...e.target.files];$('#gallery-done').disabled=true;try{for(const file of files)galleryImages.push({src:await upload(file),alt:'',caption:''});drawGallery()}catch(err){$('#gallery-error').textContent=err.message}finally{$('#gallery-done').disabled=false;e.target.value=''}};
 $('#gallery-cancel').onclick=()=>$('#gallery-dialog').close();
 $('#gallery-done').onclick=()=>{if(galleryImages.length<2){$('#gallery-error').textContent='Add at least two images.';return;}const html=`<figure data-carousel="true">${galleryImages.map(i=>`<div data-slide="true"><img src="${esc(i.src)}" alt="${esc(i.alt)}">${i.caption?`<figcaption>${esc(i.caption)}</figcaption>`:''}</div>`).join('')}</figure>`;if(galleryTarget){galleryTarget.outerHTML=html;}else{restoreInsertionPoint();activeEditor.pasteHTML(html+'<p><br></p>');}dirty=true;markGalleries();$('#gallery-dialog').close();};
 $('#insert-menu').querySelectorAll('[data-insert]').forEach(button=>{
  button.addEventListener('mousedown',event=>{event.preventDefault();saveInsertionPoint();});
  button.onclick=()=>{ $('#insert-menu').hidden=true;const type=button.dataset.insert;if(type==='image')$('#image-file').click();else if(type==='carousel')openGallery();else if(type==='code')openCode();else{restoreInsertionPoint();activeEditor.pasteHTML(type==='divider'?'<hr><p><br></p>':'<pre>Write your code here</pre><p><br></p>');}};
 });

 let codeTarget=null, highlightRequest=0;
 const markCode=()=>$('#story').querySelectorAll('pre').forEach(el=>{el.contentEditable='false';el.title='Click to edit code and language';el.onclick=()=>openCode(el);});
 async function updateHighlight(){const request=++highlightRequest;try{const html=`<pre data-language="${esc($('#code-language').value)}"><code>${esc($('#code-source').value)}</code></pre>`;const result=await post('preview',{html});if(request===highlightRequest)$('#code-highlight-preview').innerHTML=result.html;}catch(e){$('#code-error').textContent=e.message;}}
 async function openCode(target=null){codeTarget=target;$('#code-error').textContent='';$('#code-source').value=target?.textContent||'';$('#code-dialog').showModal();try{const languages=await api('languages');$('#code-language').innerHTML=languages.map(l=>`<option value="${esc(l.id)}">${esc(l.name)}</option>`).join('');const language=target?.dataset.language||target?.querySelector('code')?.className.match(/language-([a-z0-9]+)/)?.[1]||'plaintext';$('#code-language').value=languages.some(l=>l.id===language)?language:'plaintext';updateHighlight();}catch(e){$('#code-error').textContent=e.message;}}
 let highlightTimer;$('#code-source').oninput=()=>{clearTimeout(highlightTimer);highlightTimer=setTimeout(updateHighlight,150)};$('#code-language').onchange=updateHighlight;
 $('#code-source').onkeydown=e=>{if(e.key==='Tab'){e.preventDefault();const el=e.target;el.setRangeText('  ',el.selectionStart,el.selectionEnd,'end');el.dispatchEvent(new Event('input'));}};
 $('#code-cancel').onclick=()=>$('#code-dialog').close();$('#code-done').onclick=()=>{const html=`<pre data-language="${esc($('#code-language').value)}"><code>${esc($('#code-source').value)}</code></pre>`;if(codeTarget)codeTarget.outerHTML=html;else{restoreInsertionPoint();activeEditor.pasteHTML(html+'<p><br></p>');}dirty=true;markCode();$('#code-dialog').close();};
 markCode();
 markGalleries();$('#image-file').onchange=async e=>{if(!e.target.files[0])return;try{const src=await upload(e.target.files[0]);restoreInsertionPoint();activeEditor.pasteHTML(`<img src="${esc(src)}" alt=""><p><br></p>`);}catch(e){message(e)}};
 const collect=()=>({id:project.id,title:$('#title').value,summary:$('#summary').value,slug:$('#slug').value,cover, gallery:headerGallery, published_at:$('#published-date').value,tags:$('#tags').value.split(',').map(t=>t.trim()).filter(Boolean),authors:authors.filter(author=>author.name?.trim()).map(author=>({name:author.name.trim(),role:(author.role||'').trim(),url:(author.url||author.github||'').trim()})),resources:resources.filter(resource=>resource.resource_title?.trim()&&resource.resource_url?.trim()).map(resource=>({resource_title:resource.resource_title.trim(),resource_url:resource.resource_url.trim()})),body:[{type:'html',html:$('#story').innerHTML}]});
 async function save(published){if([...$('#author-rows').querySelectorAll('input[type=url]')].some(input=>!input.reportValidity()))return;try{await post('projects',{...collect(),published});dirty=false;activeEditor.destroy();list()}catch(e){$('#save-status').textContent=e.message}};
 $('#draft').onclick=()=>save(false);$('#publish').onclick=()=>save(true);
 $('#back').onclick=()=>{if(!dirty||confirm('Leave without saving your changes?')){activeEditor.destroy();list()}};
 $('#preview').onclick=async()=>{const p=collect();$('#preview-content').innerHTML=`<h1>${esc(p.title)}</h1><p>${esc(p.summary)}</p>${p.authors.length?`<div class="preview-credits"><p><strong>Created by</strong></p><ul>${p.authors.map(author=>`<li>${esc(author.name)}${author.role?` — ${esc(author.role)}`:''}</li>`).join('')}</ul></div>`:''}<div class="tags">${p.tags.map(t=>`<span>${esc(t)}</span>`).join('')}</div>${p.resources.length?`<nav class="project-links" aria-label="Project links">${p.resources.map(resource=>`<a href="${esc(resource.resource_url)}">${esc(resource.resource_title)} ↗</a>`).join('')}</nav>`:''}${$('#story').innerHTML}`;$('#preview-content').querySelectorAll('[contenteditable]').forEach(el=>el.removeAttribute('contenteditable'));try{const result=await post('preview',{html:$('#preview-content').innerHTML});$('#preview-content').innerHTML=result.html;}catch(e){message(e);return;}enhanceCarousels($('#preview-content'));$('#preview-dialog').showModal()};$('#close-preview').onclick=()=>$('#preview-dialog').close();
}
list();
