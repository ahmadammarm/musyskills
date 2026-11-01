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

1. Add it to the "Available Skills" list in `README.md`.
2. Add a section to `docs/skills.md`, keeping skills in alphabetical order and numbered from 1.
3. Add an entry under `## [Unreleased]` in `CHANGELOG.md`.

## Before opening a pull request

Run the validator (Node 18 or later, no install needed):

```
node scripts/validate.mjs
```

If you change the CLI in `packages/cli/`, also run its tests:

```
npm test -w packages/cli
```

The validator checks the frontmatter, required sections, slash commands, agent references, and that `skills/`, `README.md`, and `docs/skills.md` list the same skills. CI runs the same check on every pull request.

## Pull request checklist

- [ ] `node scripts/validate.mjs` passes
- [ ] `README.md` and `docs/skills.md` are updated
- [ ] `CHANGELOG.md` has an entry under `[Unreleased]`
