import assert from 'node:assert/strict';
import test from 'node:test';
import { access } from 'node:fs/promises';
import { createPortraitCache, portraitFilename } from '../src/portrait-cache.mjs';
import { portrait } from '../src/content.mjs';

test('preloaded portraits reuse decoded image elements and retry failed requests', async () => {
  const created = [];
  const cache = createPortraitCache(file => `/assets/${portraitFilename(file)}`, () => {
    const image = { decode() { return new Promise((resolve, reject) => { this.resolve = resolve; this.reject = reject; }); } };
    created.push(image);
    return image;
  });
  const first = cache.get('洛克.png');
  assert.equal(cache.get('洛克.png'), first);
  assert.equal(first.loaded, false);
  created[0].resolve();
  await first.ready;
  assert.equal(first.loaded, true);
  const warm = cache.preload(['洛克.png', '洛克.png']);
  await warm;
  assert.equal(created.length, 1);
  assert.equal(cache.get('洛克.png').image, first.image);
  const failed = cache.get('tony.png');
  created[1].reject(new Error('network interruption'));
  assert.equal(await failed.ready, false);
  assert.notEqual(cache.get('tony.png'), failed);
  assert.equal(created.length, 3);
  created[2].resolve();
});

test('every character and both Danzai outfits have optimized portraits', async () => {
  for (const filename of [...Object.values(portrait), '蛋仔.png']) {
    await access(new URL('../assets/' + portraitFilename(filename), import.meta.url));
  }
});
