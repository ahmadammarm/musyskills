# Musyskills

Musyskills is an open-source collection of AI agent skills designed to automate and standardize common software development workflows. Each skill is a self-contained directory containing a `SKILL.md` file written in Markdown with structured instructions that any modern AI coding assistant can read and execute.

## Why This Exists

Most AI coding assistants are capable of performing complex multi-step tasks, but without structured guidance they often produce inconsistent results, skip important safety checks, or handle edge cases poorly. Musyskills solves this by providing well-defined, battle-tested workflows for the most common development tasks, so the agent behaves predictably and safely every time.

## Available Skills

- **apply-review-feedback**: Implement code review comments from a PR or diff.
- **code-changes-review**: Review uncommitted or staged code before merging.
- **explain-changes**: Summarize and explain the current diff in plain language.
- **pr-draft**: Draft or update a pull request title and description.
- **project-explanation**: Explore and explain a codebase interactively.
- **push-to-origin**: Commit and push changes with mandatory safety checks.

For a comprehensive explanation of each skill's triggers, workflows, and rules, please see our [Skills Documentation](docs/skills.md).

## Installation and Usage

### Antigravity CLI and Antigravity IDE

Antigravity natively supports the skill directory format used by this repository.

1. Clone this repository or download the directories from the `skills/` folder you want to use.
2. Copy the desired skill directories into your Antigravity skills directory:
   - Linux and macOS: `~/.gemini/config/skills/`
   - Windows: `C:\Users\YOUR_USERNAME\.gemini\config\skills\`
3. The agent will automatically trigger the matching skill when your request matches the description in the `SKILL.md` frontmatter. Skills can also be invoked explicitly using a slash command, for example `/project-explanation`.

### Claude Code

Claude Code natively supports skills placed in a `.claude/skills` directory. The files must also be named `SKILL.md`.

1. Clone this repository or download the directories from the `skills/` folder you want to use.
2. Copy the desired skill directories (each containing their `SKILL.md` file) into your project's `.claude/skills` directory.
   - Example: `.claude/skills/code-changes-review/SKILL.md`
3. Claude will automatically read and apply these skills based on the context of your task.

## Contributing

Contributions are welcome. If you want to add a new skill or improve an existing one, please fork the repository, add it to the `skills/` directory, and ensure that new skills are written in clear, unambiguous language, avoid emojis, and follow the formatting conventions of the existing skills.
