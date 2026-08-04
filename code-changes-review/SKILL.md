---
name: code-changes-review
description: Review modified or staged code for correctness, security, readability, DRY-ness, performance, and overall best practices, regardless of language or framework. Use whenever the user asks to review code, review a diff, review changes, or check code before committing/merging.
argument-hint: <branch-or-file-to-review>
---

# code-changes-review

## Purpose

Provide a thorough, objective, and actionable review of code changes in the current repository. The goal is to catch bugs, design issues, security risks, duplication, and readability or performance problems before code is committed or merged, ensuring only well-reasoned changes reach the main branch.

## Trigger

Activate this skill when the user:
- Asks to "review my code," "review this diff," "check my changes," "look at what I wrote," or similar.
- Is preparing to commit, push, or open a pull request and wants structured feedback first.
- Wants a quality gate check before sharing code with teammates or deploying.

## Pre-flight Checks

Before reviewing any code, perform the following in order:

1. Run `git status` to identify all modified, added, deleted, and renamed files.
2. If `git status` shows no changes, state this clearly and ask the user what they would like reviewed instead. Do not proceed to generate a review file.
3. Run `git diff` to see unstaged changes and `git diff --staged` to see staged changes. Capture both.
4. Look for project-specific rules or coding conventions in files such as `.claude/rules`, `.agents/rules`, `.cursor/rules`, `CONTRIBUTING.md`, `.github/CONTRIBUTING.md`, style guide documents, or `eslint`/`pylint`/`rubocop` configuration files. Read whichever is found. These take full priority over this skill's generic guidance wherever they conflict.

## Workflow

### Step 1: Understand Context
- Read each changed file in its full context, not just the diff hunk. Understanding surrounding logic is essential for catching issues that span multiple lines or functions.
- Identify the apparent purpose of the change (bug fix, new feature, refactor, configuration update, etc.) to calibrate the review accordingly.

### Step 2: Evaluate Each Change

Assess every changed file against the following dimensions:

**Correctness and Logic**
- Are there logic errors, off-by-one errors, or incorrect conditionals?
- Are all edge cases handled (null/undefined values, empty collections, boundary inputs)?
- Is error handling present and appropriate? Are exceptions caught at the right level?

**Security**
- Is any user input passed to a database query, shell command, file path, or external service without validation or sanitization?
- Are secrets, API keys, or credentials present in the diff?
- Are authentication and authorization checks applied correctly?
- Are dependencies introduced by this change up-to-date and free of known vulnerabilities?

**Readability**
- Are variable, function, and class names clear and descriptive?
- Are functions small and focused on a single responsibility?
- Is the nesting depth and cyclomatic complexity reasonable?
- Is self-explanatory logic preferred over clever or cryptic constructs?

**DRY (Don't Repeat Yourself)**
- Is any logic, string, or value duplicated across the diff when it could be extracted or reused?
- Are there copy-pasted blocks or magic values that should be constants or utilities?

**Performance**
- Are there unnecessary loops, redundant computations, or N+1 query patterns?
- Are expensive operations performed inside loops when they could be hoisted or memoized?
- Are there obvious algorithmic inefficiencies given the scale at which this code is expected to run?

**Best Practices**
- Does the code use the language and framework idiomatically?
- Are resources (file handles, database connections, HTTP sessions) properly opened and closed?
- Is the change consistent with the existing patterns and conventions in the repository?
- Do project-specific rules from Step Pre-flight Check 4 apply, and are they satisfied?

### Step 3: Classify Findings

Group every finding into one of three categories:

- **Critical**: Bugs, security risks, incorrect logic, or correctness problems that should block merging. Each finding must include a concrete, implementable fix suggestion.
- **Suggestion**: Readability, DRY, performance, and best-practice improvements. These are recommended but do not block merging. Each must include a specific, actionable fix.
- **Info**: Observations, neutral context, or minor notes that require no action from the author.

### Step 4: Write the Review File

- Format the review as a markdown file following the output structure below.
- Name the file `code-review-<YYYY-MM-DD>.md` or `code-review-<branch-name>.md`.
- Write it to the project root or a `reviews/` directory if one exists.
- Present the file path to the user after writing.

## Rules

- Never assume a specific language, framework, or project structure. Infer everything from the repository itself.
- Project rules files discovered in Pre-flight Checks take full priority over this skill's generic guidance wherever they conflict.
- Do not rewrite or refactor code unless explicitly asked. Describe the issue and provide a concrete suggested fix.
- Every Critical and Suggestion finding must cite the file name and line number and include a specific, implementable fix, not a vague "consider improving this."
- Categorize missing or inadequate tests and DRY violations as Suggestion, not Critical, unless they directly cause a correctness or security risk.
- If `git status` shows no changes, state that clearly and do not generate a file.

## Output Format

A markdown file structured as follows:

1. **Summary** — Files reviewed, total findings per category (Critical / Suggestion / Info), and a one-line overall verdict (e.g., "Ready to merge" or "Needs fixes before merging").
2. **Critical Findings** — For each finding: file path, line(s), description of the issue, and a concrete fix suggestion.
3. **Suggestions** — For each finding: file path, line(s), category tag (Readability / DRY / Performance / Best Practice), description of the improvement opportunity, and a concrete fix suggestion.
4. **Info** — For each finding: file path, line(s), and a short contextual note. No fix required.