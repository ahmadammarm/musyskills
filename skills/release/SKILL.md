---
name: release
description: Cut a new release from the changes recorded under [Unreleased] in CHANGELOG.md. Picks the Semantic Versioning bump, moves the changelog entries into a dated version section, syncs version files, creates the release commit and an annotated tag, pushes after confirmation, and publishes release notes. Use whenever the user asks to "make a release," "cut a release," "bump the version," "tag a new version," or "publish vX.Y.Z."
argument-hint: <version-or-bump-type>
---

# release

## Purpose

Turn the work already recorded in the changelog into a published, tagged release in a predictable way. The skill decides the version from what actually changed, keeps the changelog and version files consistent, and never pushes or publishes without explicit confirmation.

## Trigger

Activate this skill when the user:
- Runs the slash command `/release`.
- Says "make a release," "cut a release," "release this," "bump the version," "tag a new version," or "publish v1.4.0."
- Passes a version (`v1.4.0`) or a bump type (`patch`, `minor`, `major`) as an argument.

## Pre-flight Checks

Before changing anything, perform the following in order:

1. Run `git status`. If there are uncommitted changes, stop and ask the user to commit or stash them first. A release must contain only committed work.
2. Confirm the current branch is the release branch (`main` or `master`, or the branch named in a release guide such as `RELEASING.md` or `CONTRIBUTING.md`). If it is not, stop and tell the user.
3. Run `git fetch origin` and compare with the upstream. If the local branch is behind, stop and ask the user to pull first.
4. Read `CHANGELOG.md`. If it does not exist, or the `[Unreleased]` section is empty, stop and tell the user there is nothing to release.
5. Find the latest version from `git tag --list --sort=-v:refname` and from the newest dated section in the changelog. If they disagree, report both and ask which one is correct.
6. Look for a validation or test command (for example `scripts/validate.mjs`, `npm test`, `make test`) and run it. If it fails, stop and report the failure.
7. List the files that carry a version number (for example `package.json`, `.claude-plugin/plugin.json`, `pyproject.toml`, `Cargo.toml`). These must be updated to the new version.

## Workflow

### Step 1: Choose the Version
- If the user gave an explicit version, use it, but warn if it does not match the rules below.
- Otherwise, derive the bump from the `[Unreleased]` entries using Semantic Versioning:
  - **MAJOR**: any change that breaks existing usage, such as a removed or renamed skill, command, or API, a required format change, or anything listed under "Removed" or marked as breaking.
  - **MINOR**: new capabilities with existing usage still working, such as anything under "Added".
  - **PATCH**: only fixes, under "Fixed" or "Security", with no new capability.
  - Internal-only changes (CI, tooling, docs) do not raise the bump above PATCH on their own.
- The largest change in the release decides the bump.
- Present the proposed version and the reason in one or two sentences, then ask the user to confirm.

### Step 2: Update the Changelog and Version Files
- Insert a new `## [vX.Y.Z] - YYYY-MM-DD` heading directly under `## [Unreleased]`, so the existing entries move into the new version and `[Unreleased]` is left empty. Use today's date and match the heading style already used in the file (with or without the `v` prefix).
- Update every version file found in Pre-flight Check 7 to the new version.
- Run the validation or test command again.

### Step 3: Commit and Tag
- Stage only the changelog and version files.
- Commit using the repository's existing release commit style, found with `git log --oneline --grep=release`. If there is none, use `release: vX.Y.Z` with a short bullet list of the main changes in the body.
- Create an annotated tag: `git tag -a vX.Y.Z -m "vX.Y.Z"`, using the same prefix style as existing tags.

### Step 4: Mandatory Push Confirmation
Show the user:
- The commit and tag that will be pushed, and the target remote and branch.
- The release notes draft from Step 5.

Do not push until the user explicitly says yes. If the user declines, leave the commit and tag local, say so, and stop.

### Step 5: Push and Publish
- Push the branch, then the tag: `git push origin <branch>` and `git push origin vX.Y.Z`.
- Draft release notes from the new changelog section. Match the format of previous releases (check with `gh release view <previous-tag>` if the GitHub CLI is available). End with a full changelog link comparing the previous tag to the new one.
- If the GitHub CLI is available and authenticated, publish with `gh release create vX.Y.Z --title vX.Y.Z --notes-file <file>`. Otherwise, give the user the notes to paste into their hosting platform.
- If the repository publishes packages on tag (for example an npm publish workflow), check the run with `gh run list` and report its result.

## Rules

- Never release uncommitted work, and never release from a branch that is behind its upstream.
- Never push a commit or tag, or publish release notes, without explicit user confirmation.
- Never use `--force` on pushes or tags, and never move or delete an existing tag. If a tag already exists for the chosen version, stop and ask the user.
- Never invent changelog entries. Release notes must come only from the `[Unreleased]` section and the commits since the previous tag.
- Never skip a failing validation or test command.

## Output Format

At the end of the workflow, report:

1. **Version** — the new version and why that bump was chosen.
2. **Files Updated** — the changelog and every version file changed.
3. **Commit and Tag** — the short commit hash, message, and tag name.
4. **Push Result** — success with remote and branch, or the exact error.
5. **Release** — the release URL, or the notes to publish manually.
6. **Follow-up** — the status of any publish workflow triggered by the tag.
