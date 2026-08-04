---
name: apply-review-feedback
description: Implement fixes for existing code review comments or requested changes on a pull request or diff, across any language or framework. Use whenever the user pastes review comments, says "address this feedback," "fix review comments," or references reviewer requests that need to be implemented.
argument-hint: <review-comment-or-thread>
---

# apply-review-feedback

## Purpose

Take a set of review comments or requested changes and implement them accurately and traceably in the codebase, without introducing unrelated modifications, regressions, or stylistic drift.

## Trigger

Activate this skill when the user:
- Pastes one or more reviewer comments (from GitHub, GitLab, Bitbucket, or plain text) and asks to address them.
- Says "fix the review feedback," "implement requested changes," "address this comment," or similar.
- References a specific pull request review thread and wants the code changes applied locally.

## Pre-flight Checks

Before touching any file, perform the following checks in order:

1. Run `git status` to confirm the current branch and working-tree state. If there are uncommitted changes unrelated to the review, note them and ask whether to stash or leave them before continuing.
2. Run `git log --oneline -5` to understand recent commit context and branch name.
3. Look for project-specific rules files (`.claude/rules`, `.agents/rules`, `.cursor/rules`, `CONTRIBUTING.md`, `.github/CONTRIBUTING.md`, or any similarly named convention file). Read whichever file is found. These rules take full priority over the generic guidance in this skill.
4. If no project rules file exists, proceed with this skill's defaults below.

## Workflow

Follow these steps sequentially for every batch of review comments provided:

### Step 1: Parse and Catalogue Comments
- Read all review comments provided by the user.
- Convert each comment into a discrete, actionable checklist item.
- Number them in the order they will be addressed.
- If a comment is ambiguous, contradicts existing logic, or conflicts with another comment, flag it immediately and ask the user for clarification before proceeding. Do not guess at intent.

### Step 2: Map Comments to Files
- For each checklist item, identify the target file and, if specified, the line or function referenced in the comment.
- If the comment references code that no longer exists or has moved, flag it and ask the user how to proceed.

### Step 3: Implement Changes
- Address each comment individually in sequence.
- Apply the minimal, targeted change that satisfies the comment. Do not refactor, rename, or restructure code beyond what the comment explicitly requests.
- Preserve the existing code style, indentation, naming conventions, and patterns already present in the file.
- If a comment requests a fix that would require adding a new dependency or a significant refactor, pause, note the scope impact, and ask the user for approval before continuing.
- Do not resolve or mark comments as resolved on any review platform; only apply the local code change.

### Step 4: Validate Changes
- After all changes are applied, run `git diff` to confirm only the expected lines were modified.
- If the project includes a test runner or linter in its configuration (`package.json`, `Makefile`, `pyproject.toml`, etc.), run the relevant command to verify no tests or lint rules are broken.
- If tests break, diagnose the root cause and fix only what the review comment necessitated. Do not silently suppress or skip tests.

### Step 5: Summarize
- Produce a clear, traceable summary mapping each original comment to the specific change made.
- Include the file name, the lines changed, and a one-sentence description of what was done.
- List any comments that were left unresolved and the reason (ambiguity, scope concern, awaiting user input).

## Rules

- Address each comment individually and traceably. Do not bundle unrelated fixes into a single change.
- Project rules files found during Pre-flight Checks take full priority over this skill's defaults. Apply them wherever they conflict.
- If any comment is ambiguous or conflicts with existing code patterns, stop and ask rather than making an assumption.
- Do not introduce new dependencies, abstract new utilities, or perform structural refactors beyond the explicit scope of the review comment.
- Do not modify files unrelated to the review comments, even if improvements are noticed.
- Preserve all existing comments, docstrings, and documentation in modified files unless the review comment specifically targets them.
- Do not force-push or amend commits. Only apply file changes locally.

## Edge Cases

- If the user provides review comments for a file that does not exist in the current branch, state this clearly and ask whether the file was deleted or if the wrong branch is checked out.
- If the same line is targeted by two conflicting comments, present both to the user and wait for a decision before applying either.
- If the project has a CI/CD configuration (`.github/workflows`, `Jenkinsfile`, `.gitlab-ci.yml`), do not modify it unless the review comment explicitly targets it.

## Output Format

Deliver the result as a checklist summary containing:

1. **Review Comment** — the original reviewer text (or a short quote).
2. **File Changed** — the file path relative to the repo root.
3. **Lines Affected** — the line range that was modified.
4. **Action Taken** — a one-sentence description of the change made.
5. **Rules Source** — whether project-specific rules or this skill's defaults governed the change.
6. **Unresolved Comments** — any items not addressed and the explicit reason why.