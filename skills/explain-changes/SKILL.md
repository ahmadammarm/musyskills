---
name: explain-changes
description: Summarize and explain the current uncommitted or unpushed code changes in a repository, in plain language, regardless of language or framework. Use whenever the user asks "what did I change," "explain my changes," "summarize this diff," or wants a recap before writing a commit message or PR description.
argument-hint: <branch-or-scope-to-explain>
---

# explain-changes

## Purpose

Give a clear, accurate, and human-readable explanation of what changed in the codebase and why it likely matters. The goal is to help the developer understand the full scope of their own modifications without needing to re-read the raw diff themselves, which is particularly useful before writing a commit message, PR description, or changelog entry.

## Trigger

Activate this skill when the user:
- Asks to "explain my changes," "summarize what I did," "what did I change," or "recap this diff."
- Wants context or a summary before writing a commit message or PR description.
- Wants to verify the scope of their modifications before staging or pushing.
- Asks for a changelog entry or release note based on the current diff.

## Pre-flight Checks

Before producing any explanation, perform the following in order:

1. Run `git status` to identify all modified, added, deleted, and renamed files in both the working tree and the staging area.
2. If `git status` shows no changes, state this clearly and do not generate an explanation file. Ask the user if they want to review a specific commit or branch instead.
3. Run `git diff` to capture unstaged changes and `git diff --staged` to capture staged changes. Use both to form a complete picture.
4. Run `git log --oneline -10` to understand recent commit history and the current branch, which provides context for inferring the intent behind the changes.

## Workflow

### Step 1: Group Changes Logically
- Do not list files in raw alphabetical or `git status` order.
- Group changes by their logical relationship: related feature files together, configuration changes separately, test files adjacent to the code they test, documentation changes as their own group.
- Common groupings include: core feature/logic changes, API or route changes, database or schema changes, configuration or environment changes, test additions or updates, and documentation or comment updates.

### Step 2: Explain Each Group
For each logical group, provide:
- **What changed**: a plain-language description of the modifications (e.g., "Added a new `validateEmail` function to the utilities module").
- **Why it likely changed**: the inferred purpose based on what the code does (e.g., "This appears to centralize email validation that was previously duplicated across three files"). Only state what the code reasonably supports. Do not speculate beyond what is evident.
- **Impact**: whether the change is additive, a bug fix, a breaking change, a performance improvement, or a refactor. Note any changes to public interfaces, API contracts, or database schemas explicitly, as these carry downstream risk.

### Step 3: Flag Unrelated or Suspicious Files
- Identify any files in the diff that appear unrelated to the main body of change.
- Common examples: a configuration file changed alongside a feature, a seemingly unrelated test file modified, or a lock file updated.
- Surface these explicitly so the user can verify they were intentional before committing.

### Step 4: Note Side Effects
- Identify and call out any notable side effects of the changes:
  - New packages or dependencies introduced.
  - Environment variable additions or changes.
  - Database migration files created or modified.
  - Breaking changes to public APIs or exported interfaces.
  - Changes to CI/CD configuration or deployment scripts.

### Step 5: Confirm Output Location
- Before writing the output file, ask the user which directory they would like it saved to.
- Do not assume a default location or silently write to a directory without confirmation.
- Name the file `changes-explanation-<YYYY-MM-DD>.md` or `changes-explanation-<branch-name>.md` based on the context.

### Step 6: Write the Explanation File
- Write the full explanation to a markdown file in the confirmed directory.
- Present the file path to the user after writing.
- Do not modify any source files. This skill is read-only with respect to the project's actual code.

## Rules

- Do not speculate about intent beyond what the code reasonably supports. When the purpose is unclear, state the uncertainty explicitly rather than fabricating a plausible-sounding explanation.
- Keep the summary in plain language. Avoid restating the diff line by line or using excessive technical jargon.
- Do not modify any source file, staged file, or git history. This skill only reads code and writes the explanation document.
- Always confirm the target directory with the user before writing the output file. Never guess or silently default to a location.
- If `git status` shows no changes, state that clearly and stop. Do not generate a file with empty or fabricated content.
- Do not include sensitive information (secrets, credentials, personally identifiable data) in the explanation file, even if it appears in the diff.

## Output Format

A markdown file with the following sections, in order:

1. **Summary** — A single paragraph giving an overall description of what the changes accomplish and their general purpose.
2. **Changes by Area** — Grouped by logical area, each group containing: what changed, why it likely changed, and the impact on the system.
3. **Notable Side Effects** — New dependencies, environment variable changes, schema changes, breaking API changes, or CI/CD modifications. Omit this section if none exist.
4. **Files to Double-Check** — Files that appear unrelated to the main change and warrant a second look before committing. Omit this section if all files appear intentional.
5. **Full File List** — A complete list of modified, added, deleted, and renamed files as reported by `git status`.