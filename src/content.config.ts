import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

// Every .md file under src/content/rules/ becomes a page.
// - A folder's `index.md` is the page shown when you click the folder name
//   in the sidebar; its frontmatter `title` and `order` name and position
//   the folder itself.
// - Any other .md file is a regular page inside that folder.
const rules = defineCollection({
  loader: glob({
    pattern: '**/*.md',
    base: './src/content/rules',
    generateId: ({ entry }) => entry.replace(/\.md$/, ''),
  }),
  schema: z.object({
    title: z.string(),
    // Lower numbers appear higher in the sidebar. Optional.
    order: z.number().optional(),
  }),
});

// Community resources. Same folder-tree structure as rules, but each
// resource can carry tags (e.g. "Magic related", "STR requirement") used
// by the search on the resources landing page.
const resources = defineCollection({
  loader: glob({
    pattern: '**/*.md',
    base: './src/content/resources',
    generateId: ({ entry }) => entry.replace(/\.md$/, ''),
  }),
  schema: z.object({
    title: z.string(),
    order: z.number().optional(),
    tags: z.array(z.string()).default([]),
    author: z.string().optional(),
  }),
});

export const collections = { rules, resources };
