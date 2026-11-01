# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Fixed
- Website: no more sideways scrolling on phones. Command blocks and long inline code on the home page, skill pages, docs, and changelog now stay inside the screen.
- Website: long skill names wrap on small screens, and docs tables scroll inside their own box.

### Changed
- Website layout adapts to every screen size: content widens to 1320px from 1920px and 1440px from 2400px, headings scale fluidly, the terminal's tool and skill rows scroll in one line on phones, and short landscape screens get a smaller heading and a header that does not stick.
- The click spark only appears on desktop (a mouse on a screen at least 1024px wide).
- README title is now "Musyskills - Must be Yours Skills", and it opens with "Musyskills (Must be Yours Skills) is an open-source collection of AI agent skills".

## [v2.0.0] - 2026-11-01

### Added
- Website (`web/`, Astro and Tailwind CSS v4) with an interactive install terminal, a page per skill generated from `SKILL.md`, docs, and the changelog. Navigation runs client-side without full reloads. Deployed to GitHub Pages by `.github/workflows/pages.yml`.
- Website motion effects in the style of React Bits, written without React and kept monochrome: a dot field behind the hero that reacts to the pointer, decrypted and blur-in headings, spotlight skill cards, scroll reveal, magnetic buttons, and a click spark. All of it turns off for visitors who prefer reduced motion.
- `.gitattributes` and `.editorconfig` that keep every text file on LF line endings.

### Changed
- `README.md` explains the name, Musyskills = Must be Yours Skills, links each skill to its page on the website, and lists every tool's skills folder in one table.
- The validator checks the README's "Available skills" table instead of `docs/skills.md`.

### Removed
- **Breaking:** `docs/skills.md`. Skill documentation now lives on the website, at `https://ahmadammarm.github.io/musyskills/skills/<skill-name>/`, generated from each `SKILL.md`. Update any links to the old file.

## [v1.4.1] - 2026-11-01

### Security
- The npm publish workflow now uses trusted publishing (OIDC) instead of a stored `NPM_TOKEN`, so no long-lived npm token exists in the repository.
- `.gitignore` now ignores `*.txt` files, so local notes such as recovery codes are not committed by accident.

### Changed
- GitHub Actions updated to `actions/checkout@v7` and `actions/setup-node@v7`, which run on Node 24 instead of the deprecated Node 20.

## [v1.4.0] - 2026-11-01

### Added
- `musyskills` npm CLI (`packages/cli/`): `npx musyskills list | add | remove | update | doctor`. Installs skills into Claude Code, Codex, Cursor, or Antigravity, detects the tool from the project, supports `--global`, and records installs in `.musyskills.json` so it never overwrites skills the user edited unless `--force` is passed. Skills are bundled in the package.
- CI tests the CLI on Linux, Windows, and macOS with Node 24 and 26, including a run from the packed tarball.
- Publish workflow (`.github/workflows/release.yml`) that publishes the CLI to npm with provenance when a `v*` tag is pushed.
- Validator checks that `packages/cli/package.json` uses the same version as the latest release.

## [v1.3.0] - 2026-11-01

### Added
- Claude Code plugin marketplace (`.claude-plugin/marketplace.json` and `plugin.json`). Install all skills with `/plugin marketplace add ahmadammarm/musyskills` and `/plugin install musyskills@musyskills`.
- `skills/release`: a workflow that picks the Semantic Versioning bump from `[Unreleased]`, updates the changelog and version files, commits, tags, pushes after confirmation, and publishes release notes.
- Validator checks the plugin manifests and that the `plugin.json` version matches the latest release in `CHANGELOG.md`.

## [v1.2.1] - 2026-11-01

### Added
- MIT `LICENSE`.
- `scripts/validate.mjs`: checks skill frontmatter, required sections, slash commands, agent references, and that `skills/`, `README.md`, and `docs/skills.md` list the same skills.
- CI workflow (`.github/workflows/ci.yml`) that runs the validator on every push to `main` and every pull request.
- `templates/SKILL.md` and `CONTRIBUTING.md` for contributors.

### Fixed
- `prd-generator`: removed the `/prd` alias; the slash command is `/prd-generator`, matching the folder name.
- `push-to-origin`: the exclusion list now covers machine-local files from other agents (`CLAUDE.local.md`, `.claude/settings.local.json`, `*.local.*` in agent folders) and states that shared files such as `CLAUDE.md` and `AGENTS.md` are committed normally.

## [v1.2.0] - 2026-11-01

### Added
- `project-explanation`: non-interactive mode. When the user asks for no questions, the skill ends the summary with a Recommended Next Step section and stops instead of waiting for input.

### Fixed
- `push-to-origin`: removed the reference to a `git-agent` that this repository does not ship; the skill runs git commands directly.
- `prd-generator`: replaced the ambiguous "create `docs/` or ask the user" instruction with a deterministic rule (use the user's location if given, otherwise create `docs/`).
- `project-explanation`: Output Format said "two phases" but listed three.
- `docs/skills.md`: skills are now listed in alphabetical order (`prd-generator` was out of place at the end).

## [v1.1.0] - 2026-08-21

### Added
- Added `skills/prd-generator`: A workflow to systematically interview the user to draft and save a structured Product Requirements Document (PRD).
- Documented `prd-generator` comprehensively in `docs/skills.md`.
- Added `prd-generator` to the Available Skills list in `README.md`.

## [v1.0.0] - 2026-08-04

### Added
- Initial release of the Musyskills repository.
- Added `skills/apply-review-feedback`: A workflow for addressing code review comments accurately.
- Added `skills/code-changes-review`: A workflow for reviewing uncommitted or staged code against best practices.
- Added `skills/explain-changes`: A workflow for summarizing code diffs in plain language.
- Added `skills/pr-draft`: A workflow for preparing or updating Pull Request titles and descriptions.
- Added `skills/project-explanation`: A workflow for interactively exploring and explaining a codebase.
- Added `skills/push-to-origin`: A workflow for safely orchestrating commits and pushes with mandatory user confirmation.
- Added comprehensive skill reference documentation in `docs/skills.md`.
- Added `README.md` with installation guides specifically tailored for Antigravity CLI and Claude Code.
