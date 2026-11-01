# Agent Skills Documentation

This document is the authoritative reference for every skill in the Musyskills repository. It describes the purpose, trigger conditions, pre-flight checks, step-by-step workflow, enforcement rules, edge case handling, and output format for each skill directory. AI agents that load this file should treat its contents as binding instructions for how each skill must behave.

For installation instructions and a general overview of the project, see the `README.md` file in the repository root.

---

## Directory Reference

### 1. apply-review-feedback

**Directory**: `skills/apply-review-feedback/`
**Instruction file**: `skills/apply-review-feedback/SKILL.md`

**Purpose**

Take a set of review comments or requested changes and implement them accurately and traceably in the codebase. The agent must not introduce unrelated modifications, stylistic drift, or regressions when addressing review feedback.

**Trigger Conditions**

This skill activates when the user:
- Pastes one or more reviewer comments from GitHub, GitLab, Bitbucket, or plain text and asks to address them.
- Says "fix the review feedback," "implement requested changes," "address this comment," or any equivalent phrase.
- References a pull request review thread and wants the code changes applied locally.

**Pre-flight Checks**

Before touching any file, the agent must:
1. Run `git status` to confirm the current branch and working-tree state. If unrelated uncommitted changes exist, note them and ask whether to stash them.
2. Run `git log --oneline -5` to understand the recent commit context.
3. Search for project-specific rules files: `.claude/rules`, `.agents/rules`, `.cursor/rules`, `CONTRIBUTING.md`, or `.github/CONTRIBUTING.md`. Read whichever is found. These rules take full priority over the generic guidance in the skill file.

**Workflow**

1. Parse all provided review comments into a numbered, discrete checklist of actionable items. Flag any ambiguous or conflicting comments and ask the user for clarification before proceeding.
2. For each checklist item, identify the target file and the specific line or function referenced. If the referenced code no longer exists or has moved, flag it and ask how to proceed.
3. Implement each change individually, in sequence. Apply only the minimal, targeted change that satisfies the comment. Preserve existing code style, indentation, naming conventions, and patterns.
4. Do not introduce new dependencies or perform structural refactors beyond the explicit scope of the review comment. If a change requires significant scope expansion, pause and ask the user for approval.
5. After all changes are applied, run `git diff` to confirm only expected lines were modified. Run any test runner or linter found in the project configuration to verify no tests or lint rules are broken.
6. Produce a traceable summary mapping each original comment to the file path, line range, and a one-sentence description of the change made.

**Rules**

- Address each comment individually. Do not bundle unrelated fixes.
- Project-specific rules files take full priority over this skill's defaults wherever they conflict.
- If any comment is ambiguous or conflicts with existing code patterns, stop and ask rather than guess.
- Do not modify files unrelated to the review comments.
- Do not resolve or mark comments as resolved on any review platform; only apply the local code change.
- Do not force-push or amend commits as part of this skill.

**Output Format**

A checklist containing for each comment: the original reviewer text, the file changed, the lines affected, the action taken, the rules source applied, and a list of any comments left unresolved with the reason why.

---

### 2. code-changes-review

**Directory**: `skills/code-changes-review/`
**Instruction file**: `skills/code-changes-review/SKILL.md`

**Purpose**

Provide a thorough, objective, and actionable review of code changes in the current repository. The goal is to catch bugs, design issues, security risks, duplication, and readability or performance problems before code is committed or merged.

**Trigger Conditions**

This skill activates when the user:
- Asks to "review my code," "review this diff," "check my changes," or similar.
- Is preparing to commit, push, or open a pull request and wants structured feedback first.
- Wants a quality gate check before sharing code with teammates or deploying.

**Pre-flight Checks**

Before reviewing any code, the agent must:
1. Run `git status` to identify all modified, added, deleted, and renamed files. If no changes are found, state this clearly and stop. Do not generate a review file.
2. Run `git diff` and `git diff --staged` to capture both unstaged and staged changes.
3. Search for project-specific rules or coding conventions in `.claude/rules`, `.agents/rules`, `.cursor/rules`, `CONTRIBUTING.md`, or linter configuration files. Read whichever is found. These take full priority over this skill's generic guidance wherever they conflict.

**Workflow**

1. Read each changed file in its full context, not just the diff hunk. Understanding surrounding logic is required for catching issues that span multiple lines or functions.
2. Evaluate every changed file across five dimensions: correctness and logic (edge cases, error handling, incorrect conditionals), security (unsanitized input, hardcoded secrets, auth bypass), readability (naming clarity, function size, nesting depth), DRY violations (duplicated logic, magic values, copy-pasted blocks), and performance (unnecessary loops, N+1 patterns, redundant computation).
3. Classify every finding into one of three tiers: Critical (bugs, security risks, correctness problems that should block merging), Suggestion (readability, DRY, performance, and best-practice improvements), or Info (neutral observations requiring no action).
4. Every Critical and Suggestion finding must include a specific, implementable fix with a file name, line number, and either a corrected code snippet or a precise instruction. Vague recommendations are not acceptable.
5. Write the review to a markdown file named `code-review-<YYYY-MM-DD>.md` or `code-review-<branch-name>.md` in the project root or a `reviews/` directory if one exists.

**Rules**

- Never assume a specific language, framework, or project structure. Infer all conventions from the repository itself.
- Project-specific rules files discovered in pre-flight checks take full priority over this skill's generic guidance.
- Do not rewrite or refactor code unless explicitly asked. Describe the issue and provide a concrete suggested fix.
- Every Critical and Suggestion finding must cite a file name and line number.
- Missing tests and DRY violations are Suggestion, not Critical, unless they directly cause a correctness or security risk.
- If `git status` shows no changes, do not generate a file.

**Output Format**

A markdown file with four sections: Summary (files reviewed, total findings per category, one-line overall verdict), Critical Findings (file, line, issue, concrete fix), Suggestions (file, line, category tag, improvement description, concrete fix), and Info (file, line, short contextual note).

---

### 3. explain-changes

**Directory**: `skills/explain-changes/`
**Instruction file**: `skills/explain-changes/SKILL.md`

**Purpose**

Give a clear, accurate, and human-readable explanation of what changed in the codebase and why it likely matters. The goal is to help a developer understand the full scope of their modifications without re-reading the raw diff, particularly useful before writing a commit message or PR description.

**Trigger Conditions**

This skill activates when the user:
- Asks to "explain my changes," "summarize what I did," "what did I change," or "recap this diff."
- Wants context or a summary before writing a commit message, PR description, or changelog entry.
- Wants to verify the scope of their modifications before staging or pushing.

**Pre-flight Checks**

Before producing any explanation, the agent must:
1. Run `git status` to identify all modified, added, deleted, and renamed files. If no changes are found, state this clearly and stop. Do not generate a file.
2. Run `git diff` and `git diff --staged` to capture the full content of all changes.
3. Run `git log --oneline -10` to understand recent commit history and the current branch for inferring intent.

**Workflow**

1. Group related changes logically rather than listing files in raw `git status` order. Common groupings include: core feature changes, API or route changes, database or schema changes, configuration or environment changes, test updates, and documentation changes.
2. For each logical group, explain what changed, why it likely changed (inferred from code intent, not fabricated), and whether the change is additive, a bug fix, a breaking change, a performance improvement, or a refactor.
3. Flag any files in the diff that appear unrelated to the main body of change so the user can verify they were intentional before committing.
4. Identify and call out notable side effects: new packages or dependencies, environment variable additions, database migrations, breaking changes to public APIs or exported interfaces, or changes to CI/CD scripts.
5. Ask the user which directory they want the output file saved to before writing it. Do not silently default to a location.
6. Write the explanation to a markdown file named `changes-explanation-<YYYY-MM-DD>.md` in the confirmed directory. Do not modify any source files.

**Rules**

- Do not speculate about intent beyond what the code reasonably supports. State uncertainty explicitly.
- Keep the summary in plain language. Do not restate the diff line by line.
- Do not modify any source file. This skill is read-only with respect to the project's code.
- Always confirm the target directory with the user before writing the output file.
- Do not include secrets, credentials, or personally identifiable data in the explanation file.

**Output Format**

A markdown file with five sections: Summary (one-paragraph overall description), Changes by Area (grouped by logical area with what changed, why, and impact), Notable Side Effects (omit if none), Files to Double-Check (omit if all files appear intentional), and Full File List (complete `git status` output).

---

### 4. pr-draft

**Directory**: `skills/pr-draft/`
**Instruction file**: `skills/pr-draft/SKILL.md`

**Purpose**

Produce or update a well-structured pull request title and description that accurately reflects the current code changes. When an existing PR description is available, make targeted, incremental edits rather than rewriting it wholesale.

**Trigger Conditions**

This skill activates when the user:
- Asks to "create a PR," "open a pull request," "write a PR description," or "draft a PR."
- Asks to update or refresh an existing PR title or description.
- Wants to prepare a PR message before pushing or using the platform UI.

**Pre-flight Checks**

Before writing any PR content, the agent must:
1. Run `git status` to confirm there is a working branch and understand the current state.
2. Run `git log --oneline origin/main..HEAD` (or `origin/master..HEAD` if `main` does not exist). If there are no commits ahead of the base branch, state this clearly and stop.
3. Run `git diff origin/main...HEAD` (three-dot diff) to capture the full content diff between the branch and the base.
4. Search for a PR template in `.github/PULL_REQUEST_TEMPLATE.md`, `.github/PULL_REQUEST_TEMPLATE/`, or `docs/PULL_REQUEST_TEMPLATE.md`. If found, read it and use its exact structure as the required format.
5. Check whether the user has provided an existing PR title and description. If so, treat it as the base to update, not a draft to replace.

**Workflow**

1. Read the commit log and full diff to determine the primary type of change (new feature, bug fix, refactor, performance improvement, documentation update, dependency upgrade, breaking change, or a combination).
2. Draft a concise, imperative-mood title under 72 characters that accurately describes the primary change. If an existing title still accurately reflects the branch scope, keep it unchanged.
3. Fill in every section of the PR template if one was found. If no template exists, use the default output format below. If updating an existing description, edit only the sections affected by new commits and preserve all other sections exactly.
4. Do not fabricate testing steps, issue references, screenshots, or motivation not evidenced by the code or user input.
5. Check for a CI/CD configuration file and note in the description if the PR changes affect the build or deployment pipeline.
6. Present the output to the user, clearly stating whether it is a new draft or an update, and which sections were changed. Ask if any adjustments are needed before submission.

**Rules**

- Never discard an existing PR title or description wholesale. Always make targeted incremental edits.
- Match the repository's PR template structure exactly if one exists.
- Do not fabricate testing steps or context not evidenced by the code changes or user input.
- Do not push, create, or update PRs on any platform automatically. The output is a draft text only.
- If the branch has no commits ahead of the base, state this clearly and do not generate a description.

**Output Format**

When no PR template is found, use this structure: Title (concise imperative summary), Summary (2-4 sentence explanation of what the PR does and why), Changes Made (bullet list of specific modifications by file or area), Type of Change (Bug Fix, New Feature, Refactor, Performance, Documentation, Dependency Update, or Breaking Change), Testing Notes (how the change was tested, or a note if not applicable), Breaking Changes (if applicable, what breaks and what consumers must do), and Related Issues (if provided by the user).

---

### 5. prd-generator

**Directory**: `skills/prd-generator/`
**Instruction file**: `skills/prd-generator/SKILL.md`

**Purpose**

Systematically interview the user to extract all necessary product requirements for a new feature or product, and structure that information into a comprehensive Markdown Product Requirements Document (PRD). Ensures development does not begin until the scope, user stories, and technical constraints are well-defined.

**Trigger Conditions**

This skill activates when the user:
- Asks to "write a PRD," "create a product requirements document," or "draft a PRD."
- Uses the explicit slash command `/prd-generator`.
- Asks to define, specify, or formalize a new feature's requirements before coding.

**Pre-flight Checks**

Before beginning the interview process, the agent must:
1. Search the workspace for a PRD template (e.g., `docs/PRD_TEMPLATE.md` or `.github/PRD_TEMPLATE.md`).
2. Check if the user has provided an existing partial PRD, notes, or an issue ticket.
3. Check if there is an existing `docs/` folder in the project.

**Workflow**

1. Run an Initial Discovery phase to understand the core problem, target audience, and business/technical constraints. Use focused, interactive questions rather than an overwhelming questionnaire.
2. Based on discovery, propose a list of "In Scope" and "Out of Scope" (Non-Goals) items, and draft 3-5 core User Stories with basic Acceptance Criteria.
3. Ask the user to confirm the scope and user stories before proceeding. Do not write the full document yet.
4. Once confirmed, generate the full PRD according to the required output format.
5. Save the final PRD to the location the user named, or otherwise to `docs/PRD-[feature-name].md` (creating `docs/` if it does not exist), and present the path to the user.

**Rules**

- Do not hallucinate requirements or skip the interview phase.
- Group questions logically; do not dump all questions at once.
- The final PRD MUST be saved as a `.md` file. Do not print the entire PRD in the chat response.
- If a section is not applicable, include the heading and write "N/A".

**Output Format**

A Markdown file containing exactly 9 sections (unless overridden by a repository template): Title & Meta Information, Overview & Problem Statement, Target Audience & Personas, Goals & Non-Goals, User Stories & Functional Requirements, User Experience (UX) & Design, Technical Considerations, Dependencies/Risks & Mitigations, and Success Metrics.

---

### 6. project-explanation

**Directory**: `skills/project-explanation/`
**Instruction file**: `skills/project-explanation/SKILL.md`

**Purpose**

Deeply understand a project's structure, architecture, and features, then explain it clearly in plain language. Guide the user interactively to select a feature for deeper exploration and, optionally, proceed to active development planning.

**Trigger Conditions**

This skill activates when the user:
- Runs the slash command `/project-explanation`.
- Asks to "understand this project," "explain this codebase," "give me a project overview," or similar.
- Asks "what does this project do," "what features exist," or "help me get up to speed on this repo."
- Wants an onboarding overview before deciding what to build or improve next.

**Interaction Mode**

- Interactive (default): the agent pauses at the two decision points and waits for the user's answer.
- Non-interactive: used when the user's request or the skill arguments ask for no questions (e.g., "no questions," "make no questions," "don't ask"). The agent asks nothing, ends Phase 1 with a Recommended Next Step section naming one or two features or improvements worth developing first (each with a one-sentence evidence-based reason), and stops. Phases 2 and 3 run only if the user asks in a later message.

**Pre-flight Checks**

Before exploring the project, the agent must:
1. Run `git status` to confirm the current branch.
2. List the root directory structure to understand the top-level layout.
3. Read the `README.md` (or equivalent) if one exists.
4. Read configuration files relevant to the project type: `package.json`, `pyproject.toml`, `go.mod`, `Cargo.toml`, `Gemfile`, `.env.example`, `docker-compose.yml`, or `Dockerfile`.
5. Identify the primary directories and their likely responsibilities.

**Workflow**

This skill uses a three-phase workflow. In interactive mode, the agent must wait for the user's explicit response at each decision point before continuing. In non-interactive mode, only Phase 1 runs.

Phase 1 (Steps 1-4): Identify the tech stack (languages, frameworks, databases, key integrations), determine the architectural pattern (SPA, monolith, monorepo, microservices), map the features by reading key source files and entry points, and present the full structured summary to the user. End Phase 1 by asking: "From the features above, which one would you like to explore further?" Do not proceed until the user responds.

Phase 2 (Step 5): Read all files related to the selected feature and explain how it works end-to-end including the entry point, data flow, business logic, data persistence, and output. List every file that contributes to the feature and describe each file's role. Identify dependencies on other parts of the system and any limitations, missing tests, or improvement opportunities. End Phase 2 by asking: "Would you like to proceed with developing or improving this feature now?" Do not proceed until the user responds.

Phase 3 (Step 6): If the user says yes, provide a concrete implementation plan listing the specific files to create or modify, a step-by-step technical approach, an estimated complexity level (low, medium, or high) with rationale, and any risks or prerequisites. If the user says no, offer to return to the feature list or end the session.

**Rules**

- In interactive mode, always wait for the user's explicit response at the two decision points before continuing to the next phase.
- In non-interactive mode, never ask a question or wait for input; end Phase 1 with the Recommended Next Step section.
- Do not modify any source file during this skill. It is read-only with respect to the codebase.
- Do not fabricate features or behaviors not evidenced by the code or documentation.
- Use plain, accessible language. Assume the user may be new to this codebase.

**Output Format**

Phase 1: A structured inline summary followed by the feature-selection question (or, in non-interactive mode, the Recommended Next Step section). Phase 2: A detailed inline feature breakdown followed by the development confirmation question. Phase 3 (if yes): An inline implementation plan with specific files, steps, complexity estimate, and identified risks.

---

### 7. push-to-origin

**Directory**: `skills/push-to-origin/`
**Instruction file**: `skills/push-to-origin/SKILL.md`

**Purpose**

Safely and reliably bundle local code changes into a well-formed commit and push to the appropriate remote branch. This skill enforces a mandatory confirmation step before any push, prevents dangerous operations, and ensures internal or ignored files are never accidentally committed.

**Trigger Conditions**

This skill activates when the user:
- Says "commit my changes," "save to git," "check this in," "push to origin," "push my work," or any similar phrase.
- Requests a commit even without providing a commit message.
- Asks to "save" or "check in" their current work, even without explicitly mentioning git.

**Pre-flight Checks**

Before staging or committing anything, the agent must:
1. Run `git status` to identify the current branch and all modified files.
2. Run `git remote -v` to confirm an `origin` remote exists. If no `origin` remote is configured, stop and tell the user. Do not proceed.
3. Run `git diff --stat` to summarize the scope of changes.
4. Check for a CI/CD configuration file (`.github/workflows/`, `Jenkinsfile`, `.gitlab-ci.yml`) to determine whether a required commit message format exists. If one is found, read it and apply the format.

**Exclusion List**

The following must never be staged or committed, regardless of `git status`. Unstage them immediately if they are already staged:
- `.geminiignore`, `.antigravityignore`, `GEMINI.md`, `pr-description.md`.
- Any file matching patterns defined in `.gitignore`, `.geminiignore`, or `.antigravityignore`.
- Any file under `.agents/` or `.gemini/` containing internal skill or configuration data.
- Personal, machine-local agent files: `CLAUDE.local.md`, `.claude/settings.local.json`, and any other `*.local.*` file inside `.claude/`, `.cursor/`, `.gemini/`, or `.agents/`.
- Any file containing secrets or credentials (check for patterns like `*_SECRET`, `*_KEY`, `*_TOKEN` in file names or content).

Shared agent files (`CLAUDE.md`, `AGENTS.md`, `.claude/skills/`, `.claude/settings.json`, `.cursor/rules/`) are not excluded and are committed normally when they are part of the change.

**Workflow**

1. Run `git status`, apply the Exclusion List, and present the final filtered list of files that will be staged to the user for verification.
2. If a commit message was provided, check whether it complies with the project's required format. If it does not comply, propose a corrected version and ask for approval. Do not silently rewrite. If no message was provided, draft one from `git diff HEAD` and ask for approval before committing.
3. Once the commit message is approved, stage the filtered files and run `git commit`.
4. Before pushing, display to the user: the target branch (`origin/<branch-name>`), whether a new upstream will be created, a summary of the commit, and a prominent warning if the branch is `main` or `master`. Wait for explicit user confirmation. If the user declines, leave the commit local and stop.
5. If confirmed, run `git push -u origin <branch>` if no upstream exists, or plain `git push` otherwise. If the push is rejected, report the exact error and ask how to proceed. Do not auto-resolve.
6. Report the result: the commit hash and message on success, or the exact error message on failure.

**Rules**

- Confirmation before pushing is mandatory every time. Never push silently.
- Never use `--force` or `--force-with-lease`. Force-pushing is prohibited.
- Never amend commits or rebase history as part of this skill.
- Never push to `main` or `master` without displaying the Step 4 warning and receiving explicit user acknowledgment.
- Never commit or push any file from the Exclusion List.
- If `git remote -v` shows no `origin` remote, stop immediately.

**Output Format**

At the end of the workflow, report: Staged Files (the list of files included in the commit), Commit (the short hash and approved message), Push Result (success confirmation with remote URL and branch, or the exact error if failed), and Excluded Files (any files unstaged due to the Exclusion List with the reason for each exclusion).
