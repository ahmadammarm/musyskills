# musyskills

Install [Musyskills](https://github.com/ahmadammarm/musyskills) AI agent skills into Claude Code, Codex, Cursor, and Antigravity with one command. Requires Node.js 24 or later.

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
- `--profile <name>` (`-p`): with `--global`, the Claude Code profile to install into: `work` for `~/.claude-work`, `default` for `~/.claude`. Repeat it, or separate with commas, for several. See [Claude Code profiles](#claude-code-profiles).
- `--force` (`-f`): overwrite or remove a skill that you edited, or that musyskills did not install.

## Where skills go

| Tool | Project | Global (`--global`) |
|---|---|---|
| claude | `.claude/skills/` | `~/.claude/skills/` |
| codex | `.agents/skills/` | `~/.agents/skills/` |
| cursor | `.cursor/skills/` | `~/.cursor/skills/` |
| antigravity | `.agents/skills/` | `~/.gemini/config/skills/` |

## Claude Code profiles

If you keep several Claude Code setups, such as `~/.claude-work` and `~/.claude-personal` started with `CLAUDE_CONFIG_DIR`, a global Claude install asks:

```
Do you use more than the default Claude (~/.claude)? (y/N) y
Claude profiles in your home folder:
  1) claude           ~/.claude
  2) claude-personal  ~/.claude-personal
  3) claude-work      ~/.claude-work
Pick numbers, or type the name after "claude-". Separate several with commas.
claude-work,personal
```

Answer `n` to use `~/.claude`. In scripts, pass `--profile work,personal` instead. Without a terminal and without `--profile`, skills go into `~/.claude`. When `CLAUDE_CONFIG_DIR` is set, that folder is used without asking. `update --global` and `doctor --global` cover every profile. Project installs are not affected.

musyskills records what it installed in a `.musyskills.json` file in each skills folder. It uses that record to update or remove only its own skills, and it never overwrites a skill you changed unless you pass `--force`.

## License

MIT
