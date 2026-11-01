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
