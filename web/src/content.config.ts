import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';

// Skills are read straight from the repository's skills/ folder, so the site
// never drifts from what the CLI and the plugin install.
const skills = defineCollection({
  loader: glob({
    base: '../skills',
    pattern: '*/SKILL.md',
    generateId: ({ entry }) => entry.split('/')[0],
  }),
  schema: z.object({
    name: z.string(),
    description: z.string(),
    'argument-hint': z.string().optional(),
  }),
});

const changelog = defineCollection({
  loader: glob({ base: '..', pattern: 'CHANGELOG.md' }),
});

export const collections = { skills, changelog };
