# Musyskills

Musyskills is an open-source collection of AI agent skills designed to automate and standardize common software development workflows. Each skill is a self-contained directory containing a `SKILL.md` file written in Markdown with structured instructions that any modern AI coding assistant can read and execute.

The skills are not tied to a specific tool or platform. They are designed to work across different AI agents including Antigravity, Claude Code, Cursor, GitHub Copilot, and others that support custom instructions or rules files.

## Why This Exists

Most AI coding assistants are capable of performing complex multi-step tasks, but without structured guidance they often produce inconsistent results, skip important safety checks, or handle edge cases poorly. Musyskills solves this by providing well-defined, battle-tested workflows for the most common development tasks, so the agent behaves predictably and safely every time.

## Repository Structure

Each directory in this repository is a self-contained skill. The directory name is the skill identifier and matches the slug used to invoke the skill in supported agents.

```
musyskills/
  apply-review-feedback/    - Implement code review comments from a PR or diff
  code-changes-review/      - Review uncommitted or staged code before merging
  explain-changes/          - Summarize and explain the current diff in plain language
  pr-draft/                 - Draft or update a pull request title and description
  project-explanation/      - Explore and explain a codebase interactively
  push-to-origin/           - Commit and push changes with mandatory safety checks
```

Each directory contains a `SKILL.md` file with YAML frontmatter (name, description, argument hint) and detailed Markdown instructions covering the skill's purpose, triggers, pre-flight checks, step-by-step workflow, rules, edge cases, and output format.

## Available Skills

### apply-review-feedback

Reads code review comments provided by the user and implements the necessary fixes across the relevant files. The skill parses each comment into a discrete actionable item, maps it to the target file and line, applies only the minimal change required, runs existing tests or linters to confirm nothing broke, and produces a traceable summary mapping each comment to the specific change made.

Triggers when the user pastes review comments or says something like "fix the review feedback," "address this comment," or "implement the requested changes."

### code-changes-review

Reviews all uncommitted or staged code changes for correctness, security, readability, DRY-ness, and performance before the code is committed or merged. The skill reads the full context of each changed file, not just the diff hunk, and evaluates every change across five dimensions: correctness and logic, security, readability, DRY violations, and performance. Findings are classified into three tiers: Critical (blocks merge), Suggestion (recommended improvement), and Info (observation only). The review is written to a dated Markdown file.

Triggers when the user says "review my code," "check my changes," or "look at what I wrote before I push."

### explain-changes

Produces a human-readable explanation of all uncommitted or unpushed changes in the current repository. The skill groups related changes logically rather than listing files in raw order, explains what changed and why it likely changed, surfaces any notable side effects such as new dependencies or breaking API changes, and flags any files that appear unrelated to the main change so the developer can verify them before committing.

Triggers when the user asks "what did I change," "explain my diff," "summarize what I did," or wants a recap before writing a commit message or PR description.

### pr-draft

Drafts or updates a pull request title and description for the current branch. The skill analyzes the full branch diff and commit history, discovers and respects any existing PR template in the repository, and either creates a new description or makes targeted incremental edits to an existing one without discarding unaffected content. It also detects whether the changes affect the CI/CD pipeline and notes this in the description.

Triggers when the user asks to "create a PR," "write a PR description," "draft a pull request," or "update the existing PR description."

### project-explanation

Provides a comprehensive, interactive onboarding experience for any codebase. The skill reads the repository structure, README, configuration files, and key source files to identify the tech stack, architectural pattern, and full feature set. It then presents a structured summary and interactively asks the user which feature they want to explore further. After a deep-dive explanation of the selected feature, it asks whether the user wants to proceed with development and, if so, provides a concrete implementation plan.

Triggers when the user runs `/project-explanation`, asks for a codebase overview, or says "help me understand this project."

### push-to-origin

Orchestrates the full commit-and-push workflow with mandatory safety checks at every step. The skill checks for an existing `origin` remote, filters out files that must never be committed (internal config files, secrets, ignored files), drafts or validates the commit message against any required CI/CD format, and stages only the approved files. Before pushing, it displays the target branch, whether a new upstream will be created, and a prominent warning if the branch is `main` or `master`, then waits for explicit user confirmation. It never force-pushes and never auto-resolves rejected pushes.

Triggers when the user says "commit my changes," "save to git," "check this in," "push to origin," or any similar phrase regardless of whether they use the word "push."

## Installation and Usage

These skills are standard Markdown files and can be integrated into any AI coding assistant that supports custom instructions, rules files, or a dedicated skills directory.

### Antigravity CLI and Antigravity IDE

Antigravity natively supports the skill directory format used by this repository.

1. Clone this repository or download the directories you want to use.
2. Copy the desired skill directories into your Antigravity skills directory:
   - Linux and macOS: `~/.gemini/config/skills/`
   - Windows: `C:\Users\YOUR_USERNAME\.gemini\config\skills\`
3. The agent will automatically trigger the matching skill when the user's request matches the description in the `SKILL.md` frontmatter. Skills can also be invoked explicitly using a slash command, for example `/project-explanation`.

To use all skills, copy all six directories into the skills folder. To use a subset, copy only the directories you need.

### Claude Code

Claude Code reads project-specific instructions from a `CLAUDE.md` file placed in the project root.

1. Clone this repository or download the skill directories you want.
2. Create a `CLAUDE.md` file in your project root if one does not already exist.
3. Copy the full contents of the relevant `SKILL.md` file into `CLAUDE.md`, or add a reference instructing Claude to read the file before performing a task:
   - Example: "Before reviewing code, read the instructions in `musyskills/code-changes-review/SKILL.md` and follow them exactly."
4. Alternatively, keep the `musyskills` directory inside your project and reference the skill files directly in the chat.

For multiple skills, you can concatenate the contents of multiple `SKILL.md` files into a single `CLAUDE.md`, separated by clear headings.

### Cursor

Cursor supports project-level instructions via a `.cursorrules` file in the project root, and user-level instructions via the Cursor Settings panel.

1. To apply a skill project-wide, open or create `.cursorrules` in the project root.
2. Copy the instructions from the relevant `SKILL.md` file into `.cursorrules`.
3. To use multiple skills, append each skill's instructions under a clearly labeled heading.
4. Alternatively, keep the `musyskills` directory in your project and reference a specific skill file in the Cursor chat using the `@` mention, for example: `@musyskills/push-to-origin/SKILL.md please execute this`.

### GitHub Copilot Chat and Copilot Workspace

GitHub Copilot Chat supports custom instructions via a `.github/copilot-instructions.md` file.

1. Create `.github/copilot-instructions.md` in your repository if it does not already exist.
2. Copy the contents of the relevant `SKILL.md` file into this file.
3. To reference a skill without copying its contents, keep the `musyskills` directory in your workspace and instruct Copilot in the chat directly, for example: "Follow the instructions in `musyskills/pr-draft/SKILL.md` to draft a PR description for my current branch."

### Windsurf (Codeium)

Windsurf supports custom AI rules via a `.windsurfrules` file in the project root.

1. Create `.windsurfrules` in your project root if one does not already exist.
2. Copy the instructions from the relevant `SKILL.md` file into this file.
3. Multiple skills can be combined by appending each skill's content under a labeled heading.

### Any Other Agent

Because these skills are plain Markdown, they work with any agent that accepts a custom system prompt, rules file, or instructions document. Simply copy the contents of the `SKILL.md` file you want to use into whatever instruction mechanism your agent provides.

## Contributing

Contributions are welcome. If you want to add a new skill or improve an existing one, follow these steps:

1. Fork the repository.
2. Create a new directory using a descriptive, hyphen-separated name (e.g., `write-unit-tests`).
3. Inside the directory, create a `SKILL.md` file. Use the following structure as a guide:
   - YAML frontmatter with `name`, `description`, and optionally `argument-hint`.
   - A `Purpose` section explaining what the skill does.
   - A `Trigger` section listing the user phrases or conditions that activate the skill.
   - A `Pre-flight Checks` section listing actions to take before the main workflow begins.
   - A `Workflow` section with numbered, sequential steps.
   - A `Rules` section listing hard constraints the agent must not violate.
   - An `Output Format` section describing what the agent should produce at the end.
4. Open a Pull Request with a clear title and description explaining what the new skill does and why it is useful.

Please ensure that new skills are written in clear, unambiguous language, avoid emojis, and follow the formatting conventions of the existing skills in this repository.
