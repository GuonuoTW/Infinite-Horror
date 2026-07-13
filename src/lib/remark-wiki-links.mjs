// Wiki-style links for Markdown content: {{Page Title}} becomes a hyperlink
// to the page whose frontmatter `title` matches (case-insensitive), in either
// the rules or resources section. {{Page Title|shown text}} customizes the
// link text. Unknown titles render as a red "missing page" span, like
// Wikipedia's red links.
//
// Titles are resolved within the language of the file being transformed
// (content lives under src/content/<section>/<lang>/...), so {{术语表}} in
// a Chinese page links to the Chinese glossary.

import fs from 'node:fs';
import path from 'node:path';

const SECTIONS = ['rules', 'resources'];
const WIKI_RE = /\{\{([^{}]+)\}\}/g;

function* walkMarkdownFiles(dir) {
  for (const dirent of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, dirent.name);
    if (dirent.isDirectory()) yield* walkMarkdownFiles(full);
    else if (dirent.name.endsWith('.md')) yield full;
  }
}

// lang -> (title (lowercased) -> site path like "/zh/rules/battle/casting/")
function scanTitles() {
  const perLang = new Map();
  for (const section of SECTIONS) {
    const sectionDir = path.resolve('src/content', section);
    if (!fs.existsSync(sectionDir)) continue;
    for (const langDirent of fs.readdirSync(sectionDir, { withFileTypes: true })) {
      if (!langDirent.isDirectory()) continue;
      const lang = langDirent.name;
      if (!perLang.has(lang)) perLang.set(lang, new Map());
      const map = perLang.get(lang);

      const baseDir = path.join(sectionDir, lang);
      for (const file of walkMarkdownFiles(baseDir)) {
        const rel = path
          .relative(baseDir, file)
          .replace(/\\/g, '/')
          .replace(/\.md$/, '');
        const urlPath =
          rel === 'index'
            ? `/${lang}/${section}/`
            : `/${lang}/${section}/${rel.replace(/\/index$/, '')}/`;

        const source = fs.readFileSync(file, 'utf8');
        const frontmatter = source.match(/^---\r?\n([\s\S]*?)\r?\n---/);
        const titleLine = frontmatter?.[1].match(/^title:\s*(.+)$/m);
        if (!titleLine) continue;

        const title = titleLine[1].trim().replace(/^(["'])(.*)\1$/, '$2');
        const key = title.toLowerCase();
        if (!map.has(key)) map.set(key, urlPath);
      }
    }
  }
  return perLang;
}

// Rescan at most once a second, so new pages are picked up while the dev
// server runs without re-reading every file for every transformed page.
let cachedTitles = null;
let cachedAt = 0;
function getTitles() {
  if (!cachedTitles || Date.now() - cachedAt > 1000) {
    cachedTitles = scanTitles();
    cachedAt = Date.now();
  }
  return cachedTitles;
}

function escapeHtml(text) {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/**
 * @param {{ base?: string }} options - set `base` to the same value as
 *   `base` in astro.config.mjs when deploying under a subpath.
 */
export default function remarkWikiLinks(options = {}) {
  const base = (options.base ?? '/').replace(/\/$/, '');

  return (tree, file) => {
    // Which language's titles to resolve against, from the file's location.
    const langMatch = (file?.path ?? '').replace(/\\/g, '/').match(
      /\/content\/(?:rules|resources)\/([^/]+)\//,
    );
    const titles = getTitles().get(langMatch?.[1]) ?? new Map();

    function transform(node) {
      if (!node.children) return;
      // Don't rewrite text inside existing links.
      if (node.type === 'link' || node.type === 'linkReference') return;

      const nextChildren = [];
      for (const child of node.children) {
        if (child.type !== 'text' || !WIKI_RE.test(child.value)) {
          transform(child);
          nextChildren.push(child);
          continue;
        }

        WIKI_RE.lastIndex = 0;
        let lastIndex = 0;
        let match;
        while ((match = WIKI_RE.exec(child.value)) !== null) {
          if (match.index > lastIndex) {
            nextChildren.push({
              type: 'text',
              value: child.value.slice(lastIndex, match.index),
            });
          }

          const [target, display] = match[1].split('|').map((s) => s.trim());
          const text = display || target;
          const url = titles.get(target.toLowerCase());

          if (url) {
            nextChildren.push({
              type: 'link',
              url: base + url,
              children: [{ type: 'text', value: text }],
            });
          } else {
            nextChildren.push({
              type: 'html',
              value: `<span class="wiki-link-missing" title="No page titled &quot;${escapeHtml(target)}&quot;">${escapeHtml(text)}</span>`,
            });
          }
          lastIndex = WIKI_RE.lastIndex;
        }
        if (lastIndex < child.value.length) {
          nextChildren.push({ type: 'text', value: child.value.slice(lastIndex) });
        }
      }
      node.children = nextChildren;
    }

    transform(tree);
  };
}
