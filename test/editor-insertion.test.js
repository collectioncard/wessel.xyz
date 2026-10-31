import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const source = readFileSync(new URL('../public/admin.js', import.meta.url), 'utf8');

test('editor preserves the insertion point before opening insertion controls', () => {
  assert.match(source, /const saveInsertionPoint/);
  assert.match(source, /#story.*addEventListener\('mouseup',saveInsertionPoint\)/s);
  assert.match(source, /#image.*addEventListener\('mousedown',event=>\{event\.preventDefault\(\);saveInsertionPoint\(\);\}\)/s);
  assert.match(source, /button\.addEventListener\('mousedown',event=>\{event\.preventDefault\(\);saveInsertionPoint\(\);\}\)/);
  assert.match(source, /const restoreInsertionPoint/);
  assert.match(source, /fallback\.setStart\(\$\('#story'\),0\)/);
});

test('all insertable content uses the shared insertion point', () => {
  const insertionCalls = source.match(/restoreInsertionPoint\(\);activeEditor\.pasteHTML/g) || [];
  assert.equal(insertionCalls.length, 4, 'image, carousel, code, and divider should all restore the saved point');
  assert.doesNotMatch(source, /activeEditor\.restoreSelection\(\);activeEditor\.pasteHTML/);
});
