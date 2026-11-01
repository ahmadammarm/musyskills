# Contributing to Musyskills

Thanks for helping improve Musyskills. This guide covers how to add or change a skill.

## Skill format

Each skill lives in its own folder: `skills/<skill-name>/SKILL.md`. Start from [`templates/SKILL.md`](templates/SKILL.md).

- **Frontmatter**: `name`, `description`, and `argument-hint` are required. `name` must equal the folder name, because tools use the folder name as the slash command.
- **Sections**: every skill needs these `##` sections: Purpose, Trigger, Pre-flight Checks, Workflow, Rules, Output Format. Extra sections (for example Edge Cases) are fine.
- **Slash commands**: only reference `/<skill-name>` for skills that exist in `skills/`. Do not invent aliases.
- **Self-contained**: a skill must not depend on agents, scripts, or tools that this repository does not ship.
- **Style**: clear, unambiguous language, no emojis.

## When you add or rename a skill

1. Add a row to the "Available skills" table in `README.md`, in alphabetical order, linking to `https://ahmadammarm.github.io/musyskills/skills/<skill-name>/`.
2. Add an entry under `## [Unreleased]` in `CHANGELOG.md`.

The website builds a page for every folder in `skills/` automatically, so there is no separate documentation file to update.

## Before opening a pull request

Run the validator (Node 24 or later, no install needed):

```
node scripts/validate.mjs
```

If you change the CLI in `packages/cli/`, also run its tests:

```
npm test -w packages/cli
```

The validator checks the frontmatter, required sections, slash commands, agent references, and that `README.md` lists every skill in `skills/`. CI runs the same check on every pull request.

## Pull request checklist

- [ ] `node scripts/validate.mjs` passes
- [ ] `README.md` is updated
- [ ] `CHANGELOG.md` has an entry under `[Unreleased]`
