export function inlineEditor(root, state) {
 const $=s=>root.querySelector(s);
 const sheet=document.createElement('link');sheet.rel='stylesheet';sheet.href='/project.css';document.head.append(sheet);
 document.body.classList.add('editing-project');
 window.addEventListener('editor-dispose',()=>{sheet.remove();document.body.classList.remove('editing-project');},{once:true});
 const story=$('.medium-story');story.classList.add('project-page');
 const nav=document.createElement('div');nav.className='project-nav';nav.innerHTML='<span class="portfolio-name">Thomas Wessel</span><span class="back-link">← All projects</span>';story.prepend(nav);
 const header=document.createElement('header');header.className='project-header has-credits';
 const heading=document.createElement('div');heading.className='project-heading';
 const title=document.createElement('h1');title.append($('#title'));heading.append(title,$('#summary'));
 const date=$('#published-date');date.className='published-date';date.setAttribute('aria-label','Published date');heading.append(date);
 const tagArea=document.createElement('div');tagArea.className='tags inline-tags';
 const tags=$('#tags');tags.type='hidden';tagArea.append(tags);
 const tagAdd=document.createElement('button');tagAdd.type='button';tagAdd.className='inline-add';tagAdd.textContent='+ Tag';tagArea.append(tagAdd);
 const drawTags=()=>{tagArea.querySelectorAll('.editable-tag').forEach(el=>el.remove());tags.value.split(',').map(t=>t.trim()).filter(Boolean).forEach((value,index)=>{const input=document.createElement('input');input.className='editable-tag';input.value=value;input.setAttribute('aria-label','Tag');input.size=Math.max(3,value.length);input.onchange=()=>{const values=tags.value.split(',').map(t=>t.trim()).filter(Boolean);values[index]=input.value.trim();tags.value=values.filter(Boolean).join(', ');state.changed();drawTags();};tagArea.insertBefore(input,tagAdd);});};
 tagAdd.onclick=()=>{const input=document.createElement('input');input.className='editable-tag';input.placeholder='Tag';input.setAttribute('aria-label','New tag');tagArea.insertBefore(input,tagAdd);input.focus();input.onchange=()=>{if(input.value.trim()){tags.value=[tags.value,input.value.trim()].filter(Boolean).join(', ');state.changed();}drawTags();};};drawTags();heading.append(tagArea);
 const links=$('.resources-editor');links.classList.add('inline-links');heading.append(links);
 const credits=$('.authors-editor');credits.classList.add('project-credits');header.append(heading,credits);story.append(header);
 const writing=$('.story-writing');writing.classList.add('project-story');story.append(writing);
 const gallery=$('.gallery-editor');gallery.className='inline-cover';story.insertBefore(gallery,header);
 const upload=$('#header-gallery-files');upload.hidden=true;
 const add=document.createElement('button');add.type='button';add.className='inline-add';add.textContent='+ Photos';add.onclick=()=>upload.click();
 const hide=document.createElement('button');hide.type='button';hide.className='cover-hide';
 hide.onclick=()=>{state.toggle();render();};
 const display=document.createElement('div');display.className='project-media';
 const controls=document.createElement('div');controls.className='cover-edit-controls';controls.append(add,hide);
 gallery.prepend(controls,display);
 let current=0;
 function render(){
  const images=state.cover();current=Math.min(current,Math.max(0,images.length-1));display.replaceChildren();
  gallery.classList.toggle('cover-hidden',state.hidden());hide.textContent=state.hidden()?'Show cover':'Hide cover';hide.setAttribute('aria-pressed',String(state.hidden()));
  if(images.length){const image=document.createElement('img');image.src=images[current];image.alt='Project cover';display.append(image);}else{const empty=document.createElement('button');empty.type='button';empty.className='empty-cover';empty.textContent='+ Add cover photos';empty.onclick=()=>upload.click();display.append(empty);}
  if(images.length>1){const bar=document.createElement('div');bar.className='carousel-controls';for(const [label,step] of [['←',-1],['→',1]]){const button=document.createElement('button');button.type='button';button.textContent=label;button.setAttribute('aria-label',step<0?'Previous cover':'Next cover');button.onclick=()=>{current=(current+step+images.length)%images.length;render();};bar.append(button);}const count=document.createElement('span');count.textContent=`${current+1} / ${images.length}`;bar.insertBefore(count,bar.lastChild);display.append(bar);}
 }
 const observer=new MutationObserver(render);observer.observe($('#header-gallery-rows'),{childList:true});
 window.addEventListener('editor-dispose',()=>observer.disconnect(),{once:true});render();
 $('#cover').parentElement.remove();$('#cover-status').remove();
 $('#settings-dialog').querySelectorAll('label').forEach(label=>{if(!label.contains($('#slug')))label.remove();});
 root.addEventListener('input',state.changed);
 root.addEventListener('change',state.changed);
 window.addEventListener('editor-dispose',()=>{root.removeEventListener('input',state.changed);root.removeEventListener('change',state.changed);},{once:true});
}
