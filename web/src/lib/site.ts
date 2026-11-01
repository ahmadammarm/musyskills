import cliPkg from '../../../packages/cli/package.json';
import { TOOLS, TOOL_NAMES } from '../../../packages/cli/src/targets.js';

export const VERSION: string = cliPkg.version;
export const REPO = 'https://github.com/ahmadammarm/musyskills';
export const NPM = 'https://www.npmjs.com/package/musyskills';

export type ToolName = 'claude' | 'codex' | 'cursor' | 'antigravity';
export const tools = TOOLS as Record<ToolName, { project: string; global: string; markers: string[] }>;
export const toolNames = TOOL_NAMES as ToolName[];

export const toolLabels: Record<ToolName, string> = {
  claude: 'Claude Code',
  codex: 'Codex',
  cursor: 'Cursor',
  antigravity: 'Antigravity',
};

const base = import.meta.env.BASE_URL.replace(/\/$/, '');
export const url = (path = '') => `${base}/${path.replace(/^\//, '')}`;

/** First sentence of a skill description, for cards and meta tags. */
export function summary(description: string) {
  return description.split(/(?<=\.)\s/)[0];
}

// Where each skill sits in a developer's workflow. Skills not listed here
// still appear, under "Other".
export const stages = [
  { name: 'Plan', blurb: 'Before code exists', skills: ['prd-generator'] },
  { name: 'Understand', blurb: 'Reading a codebase or a diff', skills: ['project-explanation', 'explain-changes'] },
  { name: 'Review', blurb: 'Before and after feedback', skills: ['code-changes-review', 'apply-review-feedback'] },
  { name: 'Ship', blurb: 'Getting it merged and released', skills: ['pr-draft', 'push-to-origin', 'release'] },
];
