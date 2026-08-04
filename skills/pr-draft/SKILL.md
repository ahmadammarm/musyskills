---
name: pr-draft
description: Prepare or update a pull request title and description for the current branch's changes, reusing existing PR content whenever available, across any language, framework, or Git hosting platform. Use whenever the user asks to create a PR, open a pull request, write a PR description, or update an existing PR.
argument-hint: <pr-title-or-context>
---

# pr-draft

## Purpose

Produce or update a well-structured pull request title and description that accurately reflects the current code changes. When an existing PR description is available, make targeted, incremental edits rather than rewriting it wholesale. The output should be immediately usable by the author with minimal edits.

## Trigger

Activate this skill when the user:
- Asks to "create a PR," "open a pull request," "write a PR description," or "draft a PR."
- Asks to update or refresh an existing PR title or description.
- Wants to prepare a PR message before pushing or using the platform UI.

## Pre-flight Checks

Before writing any PR content, perform the following in order:

1. Run `git status` to confirm there is a working branch and understand the current state of the working tree.
2. Run `git log --oneline origin/main..HEAD` (or `origin/master..HEAD` if `main` does not exist) to see all commits that are unique to this branch. If there are no commits ahead of the base branch, state this clearly and stop.
3. Run `git diff origin/main...HEAD` (three-dot diff) to capture the full content diff between this branch and the base.
4. Check for a PR template in the repository. Common locations include `.github/PULL_REQUEST_TEMPLATE.md`, `.github/PULL_REQUEST_TEMPLATE/`, `docs/PULL_REQUEST_TEMPLATE.md`, or `PULL_REQUEST_TEMPLATE.md` in the root. If found, read it and use its structure as the required format for the description.
5. Check if the user has provided an existing PR title and description (pasted text or a file path). If so, treat it as the base to update rather than starting fresh.

## Workflow

### Step 1: Analyze the Changes
- Read the commit log from Step 2 to understand the scope and intent of the branch.
- Read the full diff from Step 3 to understand the specific modifications made to the codebase.
- Identify the primary type of change: new feature, bug fix, refactor, performance improvement, documentation update, dependency upgrade, or configuration change. A PR may span multiple types.

### Step 2: Draft or Update the Title
- The title must be concise (ideally under 72 characters), written in the imperative mood, and accurately describe the primary change.
- Good examples: "Add email validation to the registration flow" or "Fix race condition in the session refresh handler."
- Avoid vague titles like "Updates" or "Fix bug." Be specific enough that a reviewer understands the scope without reading the full description.
- If an existing title is provided and still accurately reflects the change, keep it. Only update if the new commits have changed the scope or intent.

### Step 3: Draft or Update the Description
- If a PR template was found in Step 4, fill in every section of that template. Do not omit sections unless the template itself marks them as optional.
- If no template exists, use the default structure defined in the Output Format section below.
- If an existing PR description was provided, update only the sections affected by new commits. Preserve all other sections exactly as they are. Do not rewrite unaffected content.
- Do not fabricate testing steps, context, or motivation that is not directly evidenced by the code or explicitly provided by the user.
- If the diff includes a migration, schema change, or breaking API change, ensure this is prominently noted in the description under a dedicated section.

### Step 4: Review CI/CD Context
- Check for a CI/CD configuration file (`.github/workflows/`, `Jenkinsfile`, `.gitlab-ci.yml`, `.circleci/config.yml`). If one exists, note whether the PR changes affect the build or deployment pipeline and include a brief note in the PR description if so.

### Step 5: Present the Output
- Present the drafted title and description clearly, separated from each other.
- If this is an update to an existing PR, explicitly state which sections were changed and which were preserved.
- Mark the output as "New PR Draft" or "Updated PR Description (changes from existing)" so the author knows at a glance what to expect.
- Ask the user if they would like any sections adjusted before they submit.

## Rules

- Never discard an existing PR title or description wholesale. Always make targeted, incremental edits when a base exists.
- Match the repository's PR template structure exactly if one exists. The template's headings and section order are required, not optional.
- Do not fabricate testing steps, screenshots, issue references, or context that is not evidenced by the code changes or user-provided input.
- Keep the title concise and the description scannable. Use short sections, bullet points, and clear headings. Avoid writing paragraphs of dense prose where structured lists would be clearer.
- If the branch has no commits ahead of the base branch, state this clearly and do not generate a PR description.
- Do not push, create, or update PRs on any platform automatically. The output of this skill is a draft text only.

## Output Format

When no PR template is found, use the following default structure:

**Title**: A concise, imperative summary of the change.

**Description**:
1. **Summary** — A 2-4 sentence explanation of what this PR does and why.
2. **Changes Made** — A bullet list of the specific modifications, organized by file or area.
3. **Type of Change** — Checkboxes or a list indicating: Bug Fix / New Feature / Refactor / Performance / Documentation / Dependency Update / Breaking Change.
4. **Testing Notes** — How the change was tested, or a note if testing is not applicable. Do not invent steps; only include what is evident.
5. **Breaking Changes** — If applicable, describe what breaks and what consumers of this code need to do. Omit if no breaking changes.
6. **Related Issues** — Links to relevant issues or tickets if provided by the user. Omit if none.