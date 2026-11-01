# Musyskills website

The site at https://ahmadammarm.github.io/musyskills, built with Astro and Tailwind CSS v4.

It reads its content from the rest of the repository at build time:

- `../skills/*/SKILL.md`: one page per skill (content collection in `src/content.config.ts`)
- `../CHANGELOG.md`: the changelog page
- `../packages/cli/src/targets.js` and `package.json`: tool folders and the current version

## Develop

Requires Node.js 24 or later and pnpm.

```
pnpm install
pnpm dev        # http://localhost:4321/musyskills
pnpm build      # outputs dist/
```

Pushes to `main` that touch the site or its content deploy through `.github/workflows/pages.yml`.
