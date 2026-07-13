// Converts the CHM 规则部分 (rules) subtree into the site's content tree:
//  - src/content/rules/zh/...  real Chinese content (converted to Markdown)
//  - src/content/rules/en/...  stub pages with translated titles, to be
//    filled in page by page
// Also writes TRANSLATION-STATUS.md at the repo root.
import fs from 'node:fs';
import path from 'node:path';
import TurndownService from 'turndown';

// Directory containing the decompiled CHM (hh.exe -decompile <dir> <chm>)
// plus the toc.json produced by parse-toc.mjs. Override via argv[2].
const SCRATCH =
  process.argv[2] ??
  'C:/Users/nuo/AppData/Local/Temp/claude/C--Users-nuo-Documents-GitHub-Infinite-Horror/17617b67-8c3d-4f67-88c4-f22668221e01/scratchpad';
const EXTRACT_DIR = path.join(SCRATCH, 'chm-extract');
const SITE = path.join(import.meta.dirname, '..');
const ZH_DIR = path.join(SITE, 'src/content/rules/zh');
const EN_DIR = path.join(SITE, 'src/content/rules/en');

const decoder = new TextDecoder('gb18030');
const readGbk = (f) => decoder.decode(fs.readFileSync(f));

// page file -> { slug, en } (English title; slug shared by both languages)
const MAP = {
  'page_1.html': { slug: '', en: 'Rules' },
  'page_2.html': { slug: 'about', en: 'About This Book' },
  'page_3.html': { slug: 'introduction', en: 'Introduction' },
  'page_4.html': { slug: 'hall-of-honor', en: 'Hall of Honor' },
  'page_5.html': { slug: 'editors-note', en: "Editor's Note" },
  'page_6.html': { slug: 'preface', en: 'Preface' },
  'page_7.html': { slug: 'core-rules', en: 'The Core Rules' },
  'page_8.html': { slug: 'core-setting', en: 'Core Setting' },
  'page_9.html': { slug: 'gameplay', en: 'Gameplay' },
  'page_10.html': { slug: 'lord-god-space', en: 'The Lord God Space' },
  'page_11.html': { slug: 'character-creation', en: 'Character Creation' },
  'page_12.html': { slug: 'card-building', en: 'Card Building' },
  'page_13.html': { slug: 'attributes', en: 'Stats Overview' },
  'page_14.html': { slug: 'skills', en: 'Skills' },
  'page_15.html': { slug: 'overview', en: 'Skills Overview' },
  'page_16.html': { slug: 'physical-skills', en: 'Physical Skills' },
  'page_17.html': { slug: 'mental-skills', en: 'Mental Skills' },
  'page_18.html': { slug: 'social-skills', en: 'Social Skills' },
  'page_19.html': { slug: 'feats', en: 'Feats' },
  'page_20.html': { slug: 'overview', en: 'Feats Overview' },
  'page_21.html': { slug: 'card-building-feats', en: 'Card-Building Feats' },
  'page_22.html': { slug: 'physical-feats', en: 'Physical Feats' },
  'page_23.html': { slug: 'mental-feats', en: 'Mental Feats' },
  'page_24.html': { slug: 'social-feats', en: 'Social Feats' },
  'page_25.html': { slug: 'combat-feats', en: 'Combat Feats' },
  'page_26.html': { slug: 'blade-feats', en: 'Blade Feats' },
  'page_27.html': { slug: 'unarmed-feats', en: 'Unarmed Feats' },
  'page_28.html': { slug: 'ranged-feats', en: 'Ranged Feats' },
  'page_29.html': { slug: 'other-weapon-feats', en: 'Other Weapon Feats' },
  'page_30.html': { slug: 'technique-feats', en: 'Technique Feats' },
  'page_31.html': { slug: 'defects-talents-quirks', en: 'Defects, Talents, and Quirks' },
  'page_32.html': { slug: 'defects', en: 'Defects' },
  'page_33.html': { slug: 'talents', en: 'Talents' },
  'page_34.html': { slug: 'quirks', en: 'Quirks' },
  'page_35.html': { slug: 'combat', en: 'Combat' },
  'page_36.html': { slug: 'hp-willpower-energy', en: 'HP, Willpower, and Energy Pools' },
  'page_37.html': { slug: 'scenes-and-actions', en: 'Scenes and Actions' },
  'page_38.html': { slug: 'battle-rules', en: 'Battle Rules' },
  'page_39.html': { slug: 'spellcasting', en: 'Spellcasting' },
  'page_40.html': { slug: 'vehicles', en: 'Vehicle Rules' },
  'page_41.html': { slug: 'damage-and-defense-types', en: 'Damage Types and Defense Types' },
  'page_42.html': { slug: 'detection', en: 'Detection and Locating' },
  'page_43.html': { slug: 'tiers-and-contests', en: 'Tiers and Resisting' },
  'page_44.html': { slug: 'negative-statuses', en: 'Negative Statuses' },
  'page_45.html': { slug: 'other', en: 'Other Rules' },
  'page_46.html': { slug: 'gene-lock', en: 'Gene Locks' },
  'page_62.html': { slug: 'environment', en: 'Environment Rules' },
  'page_47.html': { slug: 'experience', en: 'Experience System' },
  'page_48.html': { slug: 'essence-and-bonuses', en: 'Categories and Bonuses' },
  'page_49.html': { slug: 'items-and-equipment-slots', en: 'Items and Equipment Slots' },
  'page_50.html': { slug: 'creature-classification', en: 'Creature Classification' },
  'page_51.html': { slug: 'faith-orientation', en: 'Faith Orientation' },
  'page_52.html': { slug: 'misc-rules', en: 'Miscellaneous Rules' },
  'page_67.html': { slug: 'creator-qa', en: 'Creator Q&A' },
  'page_53.html': { slug: 'special', en: 'Special Rules' },
  'page_54.html': { slug: 'morality', en: 'Morality' },
  'page_1305.html': { slug: 'mental-disorders', en: 'Mental Disorders' },
  'page_55.html': { slug: 'special-exchanges', en: 'Special Exchanges' },
  'page_56.html': { slug: 'transcendence-and-divinity', en: 'Transcendence and Divinity' },
  'page_58.html': { slug: 'self-taught-abilities', en: 'Self-Taught Abilities' },
  'page_59.html': { slug: 'creating-lifeforms', en: 'Creating Lifeforms' },
  'page_60.html': { slug: 'crafting', en: 'Crafting Rules' },
  'page_61.html': { slug: 'authoring', en: 'Authoring Rules' },
  'page_63.html': { slug: 'keywords', en: 'Keyword Reference' },
  'page_64.html': { slug: 'common-slang', en: 'Common Slang' },
  'page_65.html': { slug: 'item-keywords', en: 'Item Keywords' },
  'page_66.html': { slug: 'specialized-terms', en: 'Specialized Terms' },
  'page_68.html': { slug: 'gm-tips', en: 'GM Experience Sharing' },
  'page_69.html': { slug: 'starting-campaigns', en: 'Campaign-Starting Experience' },
  'page_70.html': { slug: 'xie-baotou-experience', en: "Xie Baotou's GM Experience" },
  'page_71.html': { slug: 'zhao-li-card-guide', en: "Zhao Li's Advanced Card-Building Guide" },
};

const turndown = new TurndownService({ headingStyle: 'atx', bulletListMarker: '-' });

// Strip spurious spaces the whitespace-collapse leaves between CJK chars
// (Word HTML wraps source lines mid-sentence).
const CJK = '[\\u4e00-\\u9fff\\u3000-\\u303f\\uff00-\\uffef]';
const cjkSpaceRe = new RegExp(`(${CJK})[ \\t]+(?=${CJK})`, 'g');
function tidy(text) {
  let out = text;
  let prev;
  do {
    prev = out;
    out = out.replace(cjkSpaceRe, '$1');
  } while (out !== prev);
  return out;
}

function cellText(html) {
  const text = html
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&quot;/gi, '"')
    .replace(/\s+/g, ' ')
    .replace(/\|/g, '\\|')
    .trim();
  return tidy(text);
}

function tableToMarkdown(tableHtml) {
  const rows = [...tableHtml.matchAll(/<TR[\s\S]*?<\/TR>/gi)].map((r) =>
    [...r[0].matchAll(/<T[DH][^>]*>([\s\S]*?)<\/T[DH]>/gi)].map((c) => cellText(c[1])),
  );
  if (rows.length === 0) return '';
  const width = Math.max(...rows.map((r) => r.length));
  const pad = (r) => [...r, ...Array(width - r.length).fill('')];
  const line = (r) => `| ${pad(r).join(' | ')} |`;
  const [head, ...body] = rows;
  return [line(head), `| ${Array(width).fill('---').join(' | ')} |`, ...body.map(line)].join('\n');
}

function htmlToMarkdown(html) {
  let body = html.replace(/^[\s\S]*?<BODY[^>]*>/i, '').replace(/<\/BODY>[\s\S]*$/i, '');
  body = body.replace(/<o:p>[\s\S]*?<\/o:p>/gi, '').replace(/<!--[\s\S]*?-->/g, '');

  // Convert tables separately (turndown mangles Word tables), then join.
  const parts = [];
  let cursor = 0;
  const tableRe = /<TABLE[\s\S]*?<\/TABLE>/gi;
  let m;
  while ((m = tableRe.exec(body)) !== null) {
    parts.push({ type: 'html', value: body.slice(cursor, m.index) });
    parts.push({ type: 'table', value: m[0] });
    cursor = tableRe.lastIndex;
  }
  parts.push({ type: 'html', value: body.slice(cursor) });

  const md = parts
    .map((p) => (p.type === 'table' ? tableToMarkdown(p.value) : tidy(turndown.turndown(p.value))))
    .filter((s) => s.trim() !== '')
    .join('\n\n');

  return md.replace(/\n{3,}/g, '\n\n').trim();
}

const yamlTitle = (t) => `"${t.replace(/\\/g, '\\\\').replace(/"/g, '\\"')}"`;

// Walk the TOC subtree and emit files.
const toc = JSON.parse(fs.readFileSync(path.join(SCRATCH, 'toc.json'), 'utf8'));
const rules = toc.children.find((c) => c.title === '规则部分');

const statusRows = [];

function emit(node, dirRel, order) {
  const meta = MAP[node.local];
  if (!meta) throw new Error(`No mapping for ${node.title} (${node.local})`);

  const isFolder = node.children.length > 0;
  const fileRel = meta.slug === ''
    ? 'index.md'
    : isFolder
      ? path.posix.join(dirRel, meta.slug, 'index.md')
      : path.posix.join(dirRel, `${meta.slug}.md`);

  const orderLine = meta.slug === '' ? '' : `\norder: ${order}`;

  const zhMd = htmlToMarkdown(readGbk(path.join(EXTRACT_DIR, node.local)));
  const zhOut = `---\ntitle: ${yamlTitle(node.title)}${orderLine}\n---\n\n# ${node.title}\n\n${zhMd}\n`;
  const zhPath = path.join(ZH_DIR, fileRel);
  fs.mkdirSync(path.dirname(zhPath), { recursive: true });
  fs.writeFileSync(zhPath, zhOut, 'utf8');

  const enOut = `---\ntitle: ${yamlTitle(meta.en)}${orderLine}\n---\n\n# ${meta.en}\n\n> 🚧 This page has not been translated yet — use the **中文** button to read the original.\n`;
  const enPath = path.join(EN_DIR, fileRel);
  fs.mkdirSync(path.dirname(enPath), { recursive: true });
  fs.writeFileSync(enPath, enOut, 'utf8');

  statusRows.push(`- [ ] \`rules/en/${fileRel}\` — ${node.title} → ${meta.en} (${zhMd.length} chars)`);

  const childDir = meta.slug === '' ? '' : path.posix.join(dirRel, meta.slug);
  node.children.forEach((child, i) => emit(child, childDir, i + 1));
}

emit(rules, '', 0);

fs.writeFileSync(
  path.join(SITE, 'TRANSLATION-STATUS.md'),
  `# Rules translation status\n\nGenerated from 无限TRPG核心规则2.52. Check a page off once its\n\`rules/en/...\` stub has been replaced with a real translation.\n\n${statusRows.join('\n')}\n`,
  'utf8',
);

console.log(`Wrote ${statusRows.length} pages (zh + en stubs).`);
