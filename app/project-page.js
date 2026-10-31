import hljs from 'highlight.js';
import { decodeHTML } from 'entities';
import sanitizeHtml from 'sanitize-html';
import { marked } from 'marked';
export const escape = value => String(value ?? '').replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;').replaceAll("'",'&#39;');
export const clean = html => sanitizeHtml(html, {
 allowedTags:['p','br','strong','b','em','i','u','a','h1','h2','h3','blockquote','ul','ol','li','pre','code','img','hr','figure','figcaption','div'],
 allowedAttributes:{a:['href','target','rel'],img:['src','alt','width','height'],figure:['data-carousel'],div:['data-slide'],pre:['data-language'],code:['class']},
 allowedSchemes:['http','https'],allowProtocolRelative:false
});
export const languages = hljs.listLanguages().map(id=>({id,name:hljs.getLanguage(id).name||id})).sort((a,b)=>a.name.localeCompare(b.name));
export function highlight(html) {
 return clean(html).replace(/<pre([^>]*)>([\s\S]*?)<\/pre>/g, (_,attributes,body)=>{
 const requested = /data-language="([a-zA-Z0-9#+.-]+)"/.exec(attributes)?.[1] || /class="language-([a-zA-Z0-9#+.-]+)"/.exec(body)?.[1] || 'plaintext';
 const language=hljs.getLanguage(requested)?requested:'plaintext';
 const code=decodeHTML(body.replace(/<br\s*\/?>/g,'\n').replace(/<[^>]*>/g,''));
 return `<div class="highlight-block"><div class="code-language">${escape(hljs.getLanguage(language).name||language)}</div><pre data-language="${escape(language)}"><code class="hljs language-${escape(language)}">${hljs.highlight(code,{language,ignoreIllegals:true}).value}</code></pre></div>`;
 });
}
function profileUrl(value) {
 if (typeof value !== 'string') return '';
 try { const url = new URL(value); return ['http:', 'https:'].includes(url.protocol) ? url.href : ''; } catch { return ''; }
}

export function normalizeAuthors(value) {
 let authors = value;
 if (typeof authors === 'string') { try { authors = JSON.parse(authors); } catch { return []; } }
 if (!Array.isArray(authors)) return [];
 return authors.slice(0,30).filter(author => author && typeof author.name === 'string' && author.name.trim()).map(author => ({
  name: author.name.trim().slice(0,120),
  role: typeof author.role === 'string' ? author.role.trim().slice(0,120) : '',
  url: profileUrl(typeof author.url === 'string' ? author.url.slice(0,2048) : author.github)
 }));
}

export function normalizeResources(value) {
 let resources = value;
 if (typeof resources === 'string') { try { resources = JSON.parse(resources); } catch { return []; } }
 if (!Array.isArray(resources)) return [];
 return resources.slice(0,20).filter(resource => resource && typeof resource.resource_title === 'string' && resource.resource_title.trim()).map(resource => ({
  resource_title: resource.resource_title.trim().slice(0,120),
  resource_url: profileUrl(typeof resource.resource_url === 'string' ? resource.resource_url.slice(0,2048) : '')
 })).filter(resource => resource.resource_url);
}

export function projectPage(project, body, tags=[]) {
 const authors = normalizeAuthors(project.authors);
 const resources = normalizeResources(project.resources);
 const date = project.published_at && /^\d{4}-\d{2}-\d{2}$/.test(project.published_at) ? `<time class="published-date" datetime="${escape(project.published_at)}">Published ${escape(new Date(`${project.published_at}T12:00:00Z`).toLocaleDateString('en-US',{year:'numeric',month:'long',day:'numeric',timeZone:'UTC'}))}</time>` : '';
 const credits = authors.length ? `<aside class="project-credits" aria-labelledby="credits-title"><h2 id="credits-title">Created by</h2><ul>${authors.map(author => `<li>${author.url ? `<a href="${escape(author.url)}">${escape(author.name)}</a>` : `<span>${escape(author.name)}</span>`}${author.role ? `<small>${escape(author.role)}</small>` : ''}</li>`).join('')}</ul></aside>` : '';
 const resourceLinks = resources.map(resource => `<a href="${escape(resource.resource_url)}">${escape(resource.resource_title)} <span aria-hidden="true">↗</span></a>`).join('');
 const gallery = (Array.isArray(project.gallery) ? project.gallery : []).filter(src => typeof src === 'string' && (src.startsWith('/') && !src.startsWith('//') || profileUrl(src)));
 const media = gallery.length > 1 ? `<figure class="project-media" data-carousel="true" aria-label="Project screenshots">${gallery.map((src,index) => `<div data-slide="true"><img src="${escape(src)}" alt="${escape(project.title)} — screenshot ${index+1}"></div>`).join('')}</figure>` : project.cover ? `<figure class="project-media"><img class="cover" src="${escape(project.cover)}" alt="${escape(project.title)}"></figure>` : '';
 return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${escape(project.title)} · Thomas Wessel</title><link rel="icon" href="/favicon.png" type="image/png"><link rel="stylesheet" href="/project.css"><link rel="stylesheet" href="/highlight.css"></head><body><main class="project-page"><nav class="project-nav" aria-label="Portfolio"><a class="portfolio-name" href="/">Thomas Wessel</a><a class="back-link" href="/">← All projects</a></nav><header class="project-header${authors.length ? ' has-credits' : ''}"><div class="project-heading"><h1>${escape(project.title)}</h1>${project.summary ? `<p class="project-summary">${escape(project.summary)}</p>` : ''}${date}${tags.length ? `<div class="tags" aria-label="Project topics">${tags.map(tag=>`<span>${escape(tag)}</span>`).join('')}</div>` : ''}${resourceLinks ? `<nav class="project-links" aria-label="Project links">${resourceLinks}</nav>` : ''}</div>${credits}</header>${media}<article class="project-story">${highlight(body)}</article><footer class="project-footer"><a href="/">← Back to all projects</a><span>Thomas Wessel</span></footer></main><script type="module" src="/carousels.js"></script></body></html>`;
}
export const markdown = source => clean(marked.parse(source));
