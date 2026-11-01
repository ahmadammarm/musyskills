---
name: push-to-origin
description: Reviews uncommitted changes, excludes files that shouldn't be committed, creates a well-formed commit, and pushes to origin (in its branch, no other branch). Runs git commands directly; no helper agent is required. ALWAYS confirms with the user before pushing — never pushes silently. Triggers on any request to commit, save, check in, or push changes — e.g. "commit my changes", "check this in", "save to git", "push to origin" — even without the word "push" or a commit message.
argument-hint: <commit-message>
---

# push-to-origin

## Purpose

Safely and reliably bundle local code changes into a well-formed commit and push to the appropriate remote branch. This skill enforces a mandatory confirmation step before any push occurs, prevents common dangerous operations, and ensures internal or ignored files are never accidentally committed.

## Trigger

Activate this skill when the user:
- Says "commit my changes," "save to git," "check this in," "push to origin," "push my work," or any similar phrase.
- Requests a commit even without providing a commit message; draft one from the diff if needed.
- Asks to "save" or "check in" their current work, even without explicitly mentioning git.

## Pre-flight Checks

Before staging or committing anything, perform the following in order:

1. Run `git status` to identify the current branch, all modified files, and any untracked files.
2. Run `git remote -v` to confirm an `origin` remote exists. If no `origin` remote is configured, stop and tell the user. Do not proceed.
3. Run `git diff --stat` to get a summary of the scope of changes.
4. Check for a CI/CD configuration file (`.github/workflows/`, `Jenkinsfile`, `.gitlab-ci.yml`, `.circleci/config.yml`) to determine whether a required commit message format exists (e.g., Conventional Commits). If one is found, read it and apply the format.

## Exclusion List

The following files and patterns must never be staged or committed, regardless of whether they appear in `git status`. If they were accidentally staged, unstage them before proceeding:

- `.geminiignore`
- `.antigravityignore`
- `GEMINI.md`
- `pr-description.md`
- Any file matching patterns defined in `.gitignore`, `.geminiignore`, or `.antigravityignore`.
- Any file path under `.agents/` or `.gemini/` that contains internal skill or configuration files.
- Any file containing secrets, credentials, or API keys (check for patterns like `*_SECRET`, `*_KEY`, `*_TOKEN` in file names or content, and flag them).

If a file on the exclusion list is staged, unstage it immediately and notify the user before continuing.

## Workflow

### Step 1: Gather and Filter
- Run `git status` to get the full list of modified and untracked files.
- Cross-reference every file against the Exclusion List above. Unstage any excluded files that are already staged.
- Present the final, filtered list of files that will be staged to the user, so they can verify the scope before committing.

### Step 2: Draft the Commit Message
- If the user provided a commit message, check whether it complies with the format required by the CI/CD configuration (if found in Pre-flight Check 4). If it does not comply, propose a corrected version and ask the user to approve it. Do not silently rewrite it.
- If no commit message was provided, run `git diff HEAD` to read the changes and draft a message that accurately describes the intent.
  - Follow Conventional Commits format if required by the project: `<type>(<scope>): <description>` (e.g., `feat(auth): add email verification step`).
  - Otherwise, write a clear imperative-mood summary (e.g., "Refactor session handling to use Redis").
- Present the drafted commit message to the user and ask for explicit approval before proceeding. Do not commit without approval.

### Step 3: Commit
- Once the commit message is approved, stage the filtered files from Step 1.
- Run `git commit -m "<approved-message>"`.
- Confirm the commit was created successfully by running `git log --oneline -1`.

### Step 4: Mandatory Push Confirmation
Before pushing, display the following information to the user and ask for explicit confirmation:

- The target remote and branch: `origin/<branch-name>`.
- Whether this push will create a new upstream branch (if no upstream is set for the current branch).
- A brief summary of the commit being pushed (message and files affected).
- A prominent warning if the current branch is `main` or `master`.

Do not push under any circumstance until the user explicitly says yes. If the user declines, leave the commit local, inform the user their changes are committed but not pushed, and stop.

### Step 5: Push
- If the branch has no upstream set, run `git push -u origin <branch-name>`.
- If an upstream already exists, run `git push`.
- If the push is rejected (e.g., due to a diverged history or protected branch rules), capture the exact error message, report it to the user, and ask how they would like to proceed (e.g., rebase, merge, or leave as-is). Do not attempt to auto-resolve the conflict.

### Step 6: Report Result
- If the push succeeds, confirm the result with the remote URL and branch name.
- If the push fails, report the exact error message and stop. Do not retry automatically.

## Rules

- Confirmation before pushing is mandatory, every single time, without exception. Never push silently.
- Never use `--force` or `--force-with-lease`. Force-pushing is prohibited.
- Never amend commits (`--amend`) or rebase history as part of this skill.
- Never push directly to `main` or `master` without the Step 4 warning being displayed and the user explicitly acknowledging it.
- Never commit or push any file from the Exclusion List.
- If a commit message format is required by the project's CI/CD configuration, propose a fix rather than silently rewriting the user's message.
- If `git remote -v` shows no `origin` remote, stop immediately and tell the user.

## Output Format

At the end of the workflow, report:

1. **Staged Files** — the list of files included in the commit.
2. **Commit** — the commit hash (short) and the approved message.
3. **Push Result** — success confirmation with remote URL and branch, or the exact error message if the push failed.
4. **Excluded Files** — any files that were unstaged due to the Exclusion List, with a note explaining why each was excluded.