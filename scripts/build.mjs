import {readFile, writeFile} from 'node:fs/promises';
const root = new URL('../', import.meta.url);
const engine = await readFile(new URL('src/epub.js', root), 'utf8');
if (/<\/script/i.test(engine)) throw new Error('The embedded EPUB source must not contain a closing script tag.');
const path = new URL('public/index.html', root);
const html = await readFile(path, 'utf8');
const pattern = /(<script id="epub-engine">)[\s\S]*?(<\/script>)/;
if (!pattern.test(html)) throw new Error('Missing inline EPUB engine slot in public/index.html.');
await writeFile(path, html.replace(pattern, (_, open, close) => open + '\n' + engine + '\n' + close));
console.log('Built public/index.html — standalone reader with inline EPUB export.');

const catalogPath = new URL('src/catalog.js', root);
const catalog = await readFile(catalogPath, 'utf8');
if (/<\/script/i.test(catalog)) throw new Error('Invalid embedded catalog source.');
const built = await readFile(path, 'utf8');
const slot = /(<script id="catalog-engine">)[\s\S]*?(<\/script>)/;
if (!slot.test(built)) throw new Error('Missing catalog engine slot.');
await writeFile(path, built.replace(slot, (_, open, close) => open + '\n' + catalog + '\n' + close));
