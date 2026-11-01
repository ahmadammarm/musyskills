# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

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
