# Musyskills - Must be Yours Skills

**Musyskills (Must be Yours Skills)** is an open-source collection of AI agent skills that every software developer, web developer, and software engineer should have in their toolkit.

Each skill is a single `SKILL.md` file of plain Markdown that teaches your coding agent a workflow you already do every day: reviewing changes, drafting pull requests, committing safely, and cutting releases. The agent follows the same steps and safety checks every time, instead of improvising. Skills work with Claude Code, Codex, Cursor, and Antigravity.

Website: **https://ahmadammarm.github.io/musyskills**

## Why skills

Coding agents can handle multi-step tasks, but without written guidance they skip checks, push without asking, or produce different results every run. A skill writes down the workflow once: what to check first, which steps to follow, and which rules never to break. Your agent then behaves predictably on every project.

## Available skills

| Skill | What it does |
|---|---|
| [apply-review-feedback](https://ahmadammarm.github.io/musyskills/skills/apply-review-feedback/) | Implement code review comments from a PR or diff |
| [code-changes-review](https://ahmadammarm.github.io/musyskills/skills/code-changes-review/) | Review uncommitted or staged code before merging |
| [explain-changes](https://ahmadammarm.github.io/musyskills/skills/explain-changes/) | Summarize and explain the current diff in plain language |
| [pr-draft](https://ahmadammarm.github.io/musyskills/skills/pr-draft/) | Draft or update a pull request title and description |
| [prd-generator](https://ahmadammarm.github.io/musyskills/skills/prd-generator/) | Interview the user and save a structured Product Requirements Document |
| [project-explanation](https://ahmadammarm.github.io/musyskills/skills/project-explanation/) | Explore and explain a codebase |
| [push-to-origin](https://ahmadammarm.github.io/musyskills/skills/push-to-origin/) | Commit and push with mandatory confirmation and safety checks |
| [release](https://ahmadammarm.github.io/musyskills/skills/release/) | Cut a versioned release from the changelog, with tag and release notes |

Each link opens the skill's page on the website, generated from its `SKILL.md`. The source of every skill is in [`skills/`](skills/).

## Install

### npm CLI (any tool)

Requires Node.js 24 or later.

```
npx musyskills list                       # see the available skills
npx musyskills add pr-draft push-to-origin
npx musyskills add --all                  # every skill
npx musyskills update                     # update what you installed
```

The CLI detects which tools the project uses and installs into each of their folders. Use `--tool claude|codex|cursor|antigravity` to choose, and `--global` to install for your user instead of the project. If you keep several Claude Code profiles (such as `~/.claude-work`), a global install asks which ones to use, or you can pass `--profile work`. It never overwrites a skill you edited unless you pass `--force`. See the [docs](https://ahmadammarm.github.io/musyskills/docs/) for every command.

### Claude Code plugin

Run these inside Claude Code to install every skill as one plugin:

```
/plugin marketplace add ahmadammarm/musyskills
/plugin install musyskills@musyskills
```

Plugin skills are namespaced, for example `/musyskills:pr-draft`. The short form `/pr-draft` also works when no other command uses the same name. Get new releases with `/plugin marketplace update musyskills`.

### Manual copy

Copy a folder from [`skills/`](skills/) into your tool's skills folder, keeping the file name `SKILL.md`:

| Tool | Project | Global |
|---|---|---|
| Claude Code | `.claude/skills/` | `~/.claude/skills/` |
| Codex | `.agents/skills/` | `~/.agents/skills/` |
| Cursor | `.cursor/skills/` | `~/.cursor/skills/` |
| Antigravity | `.agents/skills/` | `~/.gemini/config/skills/` |

For example, `skills/pr-draft/` becomes `.claude/skills/pr-draft/SKILL.md`. Restart the agent session so it picks up the new skill.

## Repository layout

```
skills/<name>/SKILL.md   the skills (single source for the CLI, plugin, and website)
packages/cli/            the musyskills npm CLI
web/                     the website (Astro and Tailwind CSS)
.claude-plugin/          Claude Code plugin marketplace
scripts/validate.mjs     checks every skill's format
```

## Contributing

Contributions are welcome. See [CONTRIBUTING.md](CONTRIBUTING.md) for the skill format, the template in [`templates/SKILL.md`](templates/SKILL.md), and how to run the validator before opening a pull request.

## License

Musyskills is released under the [MIT License](LICENSE).
