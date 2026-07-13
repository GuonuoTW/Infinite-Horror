import { getCollection } from 'astro:content';

export type Section = 'rules' | 'resources';
export type Lang = 'en' | 'zh';

export const LANGS: Lang[] = ['en', 'zh'];
export const DEFAULT_LANG: Lang = 'en';

export interface TreeNode {
  title: string;
  /** Site path (without base prefix), e.g. "en/rules/battle" */
  path: string;
  order: number;
  isFolder: boolean;
  children: TreeNode[];
}

const DEFAULT_ORDER = 999;

const ROOT_TITLES: Record<Section, Record<Lang, string>> = {
  rules: { en: 'Rules', zh: '规则' },
  resources: { en: 'Resources', zh: '资源' },
};

/**
 * Builds the sidebar tree for a section + language from the section's
 * content collection. Content lives under a per-language top folder
 * (e.g. src/content/rules/zh/...), and folder structure on disk = tree
 * structure in the sidebar. Returns the root node.
 */
export async function buildSectionTree(section: Section, lang: Lang): Promise<TreeNode> {
  const entries = (await getCollection(section)).filter((entry) =>
    entry.id.startsWith(`${lang}/`),
  );

  const root: TreeNode = {
    title: ROOT_TITLES[section][lang],
    path: `${lang}/${section}`,
    order: 0,
    isFolder: true,
    children: [],
  };

  // Folder path ("" for root) -> node, so files can find their parent.
  const folders = new Map<string, TreeNode>([['', root]]);

  // Ensure a folder node exists for every directory segment.
  function ensureFolder(dirPath: string): TreeNode {
    const existing = folders.get(dirPath);
    if (existing) return existing;
    const segments = dirPath.split('/');
    const parent = ensureFolder(segments.slice(0, -1).join('/'));
    const node: TreeNode = {
      title: segments[segments.length - 1],
      path: `${lang}/${section}/${dirPath}`,
      order: DEFAULT_ORDER,
      isFolder: true,
      children: [],
    };
    folders.set(dirPath, node);
    parent.children.push(node);
    return node;
  }

  for (const entry of entries) {
    // Strip the language folder from the id: "zh/battle/hp" -> "battle/hp".
    const id = entry.id.slice(lang.length + 1);
    const segments = id.split('/');
    const isIndex = segments[segments.length - 1] === 'index';

    if (isIndex) {
      const dirPath = segments.slice(0, -1).join('/');
      const node = ensureFolder(dirPath);
      node.title = entry.data.title;
      node.order = entry.data.order ?? (dirPath === '' ? 0 : DEFAULT_ORDER);
    } else {
      const parent = ensureFolder(segments.slice(0, -1).join('/'));
      parent.children.push({
        title: entry.data.title,
        path: `${lang}/${section}/${id}`,
        order: entry.data.order ?? DEFAULT_ORDER,
        isFolder: false,
        children: [],
      });
    }
  }

  // Sort: by `order`, then folders before files, then alphabetically.
  function sortNode(node: TreeNode) {
    node.children.sort(
      (a, b) =>
        a.order - b.order ||
        Number(b.isFolder) - Number(a.isFolder) ||
        a.title.localeCompare(b.title),
    );
    node.children.forEach(sortNode);
  }
  sortNode(root);

  return root;
}

/** URL for a tree path, respecting the configured base. */
export function pathToHref(path: string): string {
  return `${import.meta.env.BASE_URL.replace(/\/$/, '')}/${path}/`;
}

/** Splits a collection entry id into its language and language-local id. */
export function splitId(entryId: string): { lang: Lang; id: string } {
  const [lang, ...rest] = entryId.split('/');
  return { lang: lang as Lang, id: rest.join('/') };
}

/** Language-local id -> URL slug for getStaticPaths (undefined = section root). */
export function idToSlug(id: string): string | undefined {
  if (id === 'index') return undefined;
  return id.replace(/\/index$/, '');
}
