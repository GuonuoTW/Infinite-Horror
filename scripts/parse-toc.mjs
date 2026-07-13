// Parses the CHM's HHC table of contents into a JSON tree and reports
// size statistics for the 规则部分 (rules) subtree.
import fs from 'node:fs';
import path from 'node:path';

const EXTRACT_DIR = path.join(import.meta.dirname, 'chm-extract');
const decoder = new TextDecoder('gb18030');

function readGbk(file) {
  return decoder.decode(fs.readFileSync(file));
}

const hhc = readGbk(path.join(EXTRACT_DIR, 'TOC-Created-By-Easy-CHM.HHC'));

// Tokenize: <UL>, </UL>, and sitemap objects with Name/Local params.
const tokenRe = /(<UL>)|(<\/UL>)|<OBJECT type="text\/sitemap">([\s\S]*?)<\/OBJECT>/gi;
const root = { title: 'ROOT', local: null, children: [] };
const stack = [root];
let last = root;

let m;
while ((m = tokenRe.exec(hhc)) !== null) {
  if (m[1]) {
    stack.push(last);
  } else if (m[2]) {
    stack.pop();
  } else {
    const body = m[3];
    const name = body.match(/name="Name" value="([^"]*)"/i)?.[1];
    const local = body.match(/name="Local" value="([^"]*)"/i)?.[1] ?? null;
    if (name === undefined) continue;
    const node = { title: name, local, children: [] };
    stack[stack.length - 1].children.push(node);
    last = node;
  }
}

fs.writeFileSync(path.join(import.meta.dirname, 'toc.json'), JSON.stringify(root, null, 1));

// Stats per top-level section
function collect(node, acc) {
  if (node.local) acc.push(node);
  node.children.forEach((c) => collect(c, acc));
  return acc;
}

function textLength(local) {
  try {
    const html = readGbk(path.join(EXTRACT_DIR, local));
    const body = html.replace(/^[\s\S]*?<BODY[^>]*>/i, '').replace(/<\/BODY>[\s\S]*$/i, '');
    const text = body
      .replace(/<style[\s\S]*?<\/style>/gi, '')
      .replace(/<[^>]+>/g, '')
      .replace(/&nbsp;/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
    return text.length;
  } catch {
    return 0;
  }
}

for (const top of root.children) {
  const pages = collect(top, []);
  const chars = pages.reduce((sum, p) => sum + textLength(p.local), 0);
  console.log(`${top.title}: ${pages.length} pages, ${chars.toLocaleString()} chars of text`);
}

// Depth of rules subtree + its chapter breakdown
const rules = root.children.find((c) => c.title === '规则部分');
if (rules) {
  console.log('\n规则部分 chapters:');
  for (const ch of rules.children) {
    const pages = collect(ch, []);
    const chars = pages.reduce((s, p) => s + textLength(p.local), 0);
    console.log(`  ${ch.title}: ${pages.length} pages, ${chars.toLocaleString()} chars`);
  }
}
