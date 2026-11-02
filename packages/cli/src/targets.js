import { readdirSync } from 'node:fs';
import { join } from 'node:path';

// Where each tool loads skills from. Sources:
//   claude      https://code.claude.com/docs/en/skills
//   codex       https://developers.openai.com/codex/skills  (REPO and USER scopes)
//   cursor      https://cursor.com/docs/skills
//   antigravity https://codelabs.developers.google.com/getting-started-with-antigravity-skills
// `markers` are paths that suggest the tool is in use, checked in the project
// directory (or the home directory with --global).
export const TOOLS = {
  claude: {
    project: '.claude/skills',
    global: '.claude/skills',
    markers: ['.claude', 'CLAUDE.md'],
  },
  codex: {
    project: '.agents/skills',
    global: '.agents/skills',
    markers: ['.codex', 'AGENTS.md'],
  },
  cursor: {
    project: '.cursor/skills',
    global: '.cursor/skills',
    markers: ['.cursor', '.cursorrules'],
  },
  antigravity: {
    project: '.agents/skills',
    global: '.gemini/config/skills',
    markers: ['.gemini', 'GEMINI.md'],
  },
};

export const TOOL_NAMES = Object.keys(TOOLS);

export function targetDir(tool, { global, cwd, home }) {
  const t = TOOLS[tool];
  return global ? join(home, t.global) : join(cwd, t.project);
}

// Claude Code profiles. Claude Code reads one config folder at a time:
// ~/.claude by default, or another one set with CLAUDE_CONFIG_DIR, which is how
// people keep separate setups such as ~/.claude-work and ~/.claude-personal.
// A profile is named after its folder without the dot: "claude", "claude-work".
const PROFILE = /^claude(-[A-Za-z0-9._-]+)?$/;

/** Turns "work", "claude-work", ".claude-work", or "default" into "claude-work" / "claude". */
export function normalizeProfile(input) {
  let name = String(input).trim().replace(/^\.+/, '');
  if (name === '' || name === 'default') name = 'claude';
  if (name !== 'claude' && !name.startsWith('claude-')) name = `claude-${name}`;
  if (!PROFILE.test(name)) {
    throw new Error(`"${input}" is not a valid profile name. Use letters, numbers, dots, dashes, or underscores, for example "work".`);
  }
  return name;
}

export function profileSkillsDir(home, profile) {
  return join(home, `.${profile}`, 'skills');
}

/** Claude profile folders in the home directory, "claude" first. */
export function findProfiles(home) {
  let entries = [];
  try {
    entries = readdirSync(home, { withFileTypes: true });
  } catch {
    return [];
  }
  return entries
    .filter((e) => e.isDirectory() && PROFILE.test(e.name.slice(1)) && e.name.startsWith('.'))
    .map((e) => e.name.slice(1))
    .sort((a, b) => (a === 'claude' ? -1 : b === 'claude' ? 1 : a.localeCompare(b)));
}
