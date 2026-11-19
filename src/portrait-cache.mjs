export const portraitFilename = filename => `portraits/${filename.replace(/\.png$/, '.webp')}`;

// Retain decoded image elements, not just HTTP responses: switching back to a
// speaker can then reuse the same element without another decode or blank frame.
export function createPortraitCache(urlFor, makeImage = () => new Image()) {
  const entries = new Map();
  function get(filename) {
    if (entries.has(filename)) return entries.get(filename);
    const image = makeImage();
    image.decoding = 'async';
    image.fetchPriority = 'low';
    image.alt = '';
    const entry = { image, loaded: false, ready: null };
    entries.set(filename, entry);
    image.src = urlFor(filename);
    entry.ready = image.decode().then(() => {
      entry.loaded = true;
      return true;
    }, () => {
      // A temporary network failure must not poison the cache for the session.
      entries.delete(filename);
      return false;
    });
    return entry;
  }
  return { get, preload: filenames => Promise.all([...new Set(filenames)].map(file => get(file).ready)) };
}
