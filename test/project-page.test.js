import test from 'node:test';
import assert from 'node:assert/strict';
import { normalizeAuthors, normalizeResources, normalizeGallery, projectPage } from '../dist/app/project-page.js';

test('credits accept saved and legacy authors and keep profile links safe', () => {
 const authors = normalizeAuthors(JSON.stringify([
  {name:' Thomas Wessel ',role:' Programming ',url:'https://github.com/collectioncard'},
  {name:'Jack Wilhelm',github:'https://github.com/JackWilhelm'},
  {name:'<script>Example</script>',url:'javascript:alert(1)'},
  {name:' ',url:'https://example.com'},
  null
 ]));
 assert.equal(authors.length,3);
 assert.equal(authors[0].name,'Thomas Wessel');
 assert.equal(authors[0].role,'Programming');
 assert.equal(authors[1].url,'https://github.com/JackWilhelm');
 assert.equal(authors[2].url,'');
 const html=projectPage({title:'Project',authors},'<p>Story</p>');
 assert.match(html,/Created by/);
 assert.match(html,/href="https:\/\/github.com\/JackWilhelm"/);
 assert.match(html,/<small>Programming<\/small>/);
 assert.match(html,/&lt;script&gt;Example&lt;\/script&gt;/);
 assert.doesNotMatch(html,/javascript:|<script>Example/);
 assert.deepEqual(normalizeAuthors('invalid json'),[]);
});

test('long credit lists stay compact until expanded', () => {
 const authors = Array.from({length:6}, (_, index) => ({name:`Contributor ${index + 1}`}));
 const html = projectPage({title:'Many hands',authors},'<p>Story</p>');
 assert.equal((html.match(/<li>/g)||[]).length,6);
 assert.match(html,/Show 2 more/);
 assert.ok(html.indexOf('Contributor 4') < html.indexOf('Show 2 more'));
});

test('a screenshot gallery replaces the separate cover and unsafe resources are omitted', () => {
 const html=projectPage({title:'Gallery',cover:'/projects/example/first.png',gallery:['/projects/example/first.png','/projects/example/second.png'],resources:[{resource_title:'Source',resource_url:'https://github.com/example/project'},{resource_title:'Unsafe link',resource_url:'javascript:alert(1)'}]},'<p>Story</p>');
 assert.equal((html.match(/src="\/projects\/example\/first.png"/g)||[]).length,1);
 assert.equal((html.match(/data-carousel="true"/g)||[]).length,1);
 assert.match(html,/href="https:\/\/github.com\/example\/project"/);
 assert.doesNotMatch(html,/Unsafe link|javascript:|class="cover"/);
 const solo=projectPage({title:'Solo'},'<p>Story</p>');
 assert.doesNotMatch(solo,/class="project-credits"|id="credits-title"|class="project-media"/);
});

test('project links normalize safely and render as resource buttons', () => {
 const resources = normalizeResources(JSON.stringify([
  {resource_title:' GitHub repository ',resource_url:'https://github.com/example/project'},
  {resource_title:'Unsafe',resource_url:'javascript:alert(1)'},
  {resource_title:'',resource_url:'https://example.com'}
 ]));
 assert.deepEqual(resources,[{resource_title:'GitHub repository',resource_url:'https://github.com/example/project'}]);
 const html=projectPage({title:'Links',resources},'<p>Story</p>');
 assert.match(html,/class="project-links"/);
 assert.match(html,/GitHub repository/);
 assert.match(html,/href="https:\/\/github.com\/example\/project"/);
 assert.doesNotMatch(html,/javascript:|Unsafe/);
});

test('header gallery renders as a carousel and normalizes local images', () => {
 const gallery=normalizeGallery(JSON.stringify(['/uploads/first.png','/uploads/second.png','javascript:alert(1)']));
 assert.deepEqual(gallery,['/uploads/first.png','/uploads/second.png']);
 const html=projectPage({title:'Gallery',gallery},'<p>Story</p>');
 assert.match(html,/data-carousel="true"/);
 assert.match(html,/src="\/uploads\/first.png"/);
 assert.match(html,/src="\/uploads\/second.png"/);
 assert.ok(html.indexOf('<header class="project-header')<html.indexOf('aria-label="Project screenshots"'));
 const hidden=projectPage({title:'Gallery',gallery,hide_cover:1},'<p>Story</p>');
 assert.doesNotMatch(hidden,/aria-label="Project screenshots"|src="\/uploads\/first.png"/);
});
