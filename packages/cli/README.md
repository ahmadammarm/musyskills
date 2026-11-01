# musyskills

Install [Musyskills](https://github.com/ahmadammarm/musyskills) AI agent skills into Claude Code, Codex, Cursor, and Antigravity with one command. Requires Node.js 18.17 or later.

```
npx musyskills list
npx musyskills add pr-draft push-to-origin
npx musyskills add --all
```

## Commands

| Command | What it does |
|---|---|
| `list` | List the available skills |
| `add <skill...>` / `add --all` | Install skills, or update ones already installed by musyskills |
| `remove <skill...>` | Remove skills that musyskills installed |
| `update` | Update every skill musyskills installed to this CLI's version |
| `doctor` | Show which tools were detected, where skills are, and their state |

## Options

- `--tool <name>` (`-t`): `claude`, `codex`, `cursor`, or `antigravity`. Repeat it, or separate with commas, for several tools. Without it, musyskills detects tools from the project (`.claude/`, `AGENTS.md`, `.cursor/`, `.gemini/`, and similar). If nothing is found, it asks in an interactive terminal, and otherwise uses `claude`.
- `--global` (`-g`): install for your user instead of the current project.
- `--force` (`-f`): overwrite or remove a skill that you edited, or that musyskills did not install.

## Where skills go

| Tool | Project | Global (`--global`) |
|---|---|---|
| claude | `.claude/skills/` | `~/.claude/skills/` |
| codex | `.agents/skills/` | `~/.agents/skills/` |
| cursor | `.cursor/skills/` | `~/.cursor/skills/` |
| antigravity | `.agents/skills/` | `~/.gemini/config/skills/` |

musyskills records what it installed in a `.musyskills.json` file in each skills folder. It uses that record to update or remove only its own skills, and it never overwrites a skill you changed unless you pass `--force`.

## License

MIT
