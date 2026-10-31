import test from 'node:test';
import assert from 'node:assert/strict';
import { highlight, clean, markdown } from '../dist/app/project-page.js';
test('highlights explicitly selected languages and preserves safe code',()=>{
 const js=highlight('<pre data-language="javascript"><code>const answer = 42;</code></pre>');
 assert.match(js,/hljs-keyword/);assert.match(js,/JavaScript/);assert.match(js,/hljs-number/);
 const py=highlight('<pre data-language="python"><code>def hello():\n    return True</code></pre>');assert.match(py,/Python/);assert.match(py,/hljs-keyword/);
 const safe=highlight('<pre data-language="html"><code>&lt;script&gt;alert(1)&lt;/script&gt;</code></pre>');assert.doesNotMatch(safe,/<script>/);assert.match(safe,/&lt;/);
 const fallback=highlight('<pre data-language="unknown"><code>&lt;b&gt;hello&lt;/b&gt;</code></pre>');assert.match(fallback,/language-plaintext/);assert.doesNotMatch(fallback,/<b>/);
 assert.match(clean('<pre data-language="python"><code>x = 1</code></pre>'),/data-language="python"/);
 const old=highlight(markdown('```python\nprint("hello")\n```'));assert.match(old,/language-python/);assert.match(old,/hljs-/);
});
