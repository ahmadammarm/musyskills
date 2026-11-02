import { existsSync, readFileSync } from 'node:fs';
import { homedir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { createInterface } from 'node:readline/promises';
import { fileURLToPath } from 'node:url';
import { parseArgs } from 'node:util';
import { TOOLS, TOOL_NAMES, targetDir, normalizeProfile, profileSkillsDir, findProfiles } from './targets.js';
import { listSkills } from './skills.js';
import { installSkills, readManifest, removeSkills, skillState } from './install.js';

const pkg = JSON.parse(readFileSync(join(dirname(fileURLToPath(import.meta.url)), '..', 'package.json'), 'utf8'));

const HELP = `musyskills ${pkg.version} - install AI agent skills

Usage:
  musyskills list                      List available skills
  musyskills add <skill...> [--all]    Install skills
  musyskills remove <skill...>         Remove skills installed by musyskills
  musyskills update                    Update installed skills to this version
  musyskills doctor                    Show where skills are installed and their state

Options:
  -t, --tool <name>     claude, codex, cursor, antigravity (repeatable).
                        Default: detected from the project, otherwise claude.
  -g, --global          Install for your user instead of the current project
  -p, --profile <name>  With --global: the Claude Code profile to use, such as
                        work for ~/.claude-work (repeatable). Without it, an
                        interactive terminal asks; otherwise ~/.claude is used.
  -a, --all             With add: install every skill
  -f, --force           Overwrite or remove skills you edited or did not install
                        with musyskills
  -h, --help            Show this help
  -v, --version         Show the version

Examples:
  npx musyskills add pr-draft push-to-origin
  npx musyskills add --all --tool cursor
  npx musyskills add --all --global --profile work,personal
  npx musyskills update --global`;

const REASONS = {
  foreign: 'exists but was not installed by musyskills (use --force to overwrite)',
  modified: 'was edited after install (use --force to overwrite)',
  missing: 'is not installed',
};

export async function main(
  argv,
  {
    cwd = process.cwd(),
    home = process.env.MUSYSKILLS_HOME || homedir(),
    env = process.env,
    log = console.log,
    stdin = process.stdin,
    ask = makeAsk(stdin),
  } = {},
) {
  let parsed;
  try {
    parsed = parseArgs({
      args: argv,
      allowPositionals: true,
      options: {
        tool: { type: 'string', short: 't', multiple: true },
        global: { type: 'boolean', short: 'g' },
        profile: { type: 'string', short: 'p', multiple: true },
        all: { type: 'boolean', short: 'a' },
        force: { type: 'boolean', short: 'f' },
        help: { type: 'boolean', short: 'h' },
        version: { type: 'boolean', short: 'v' },
      },
    });
  } catch (e) {
    throw new UsageError(e.message);
  }
  const { values: opts, positionals } = parsed;
  const [command, ...args] = positionals;

  if (opts.version) return log(pkg.version);
  if (opts.help || !command) return log(HELP);

  const skills = listSkills();
  const ctx = { cwd, home, global: Boolean(opts.global) };
  const profiles = parseProfiles(opts, ctx);
  const io = { log, ask, env };

  switch (command) {
    case 'list': {
      const width = Math.max(...skills.map((s) => s.name.length));
      for (const s of skills) log(`${s.name.padEnd(width)}  ${firstSentence(s.description)}`);
      return;
    }
    case 'add': {
      const chosen = opts.all ? skills : pickSkills(skills, args);
      if (chosen.length === 0) throw new UsageError('Name at least one skill, or use --all. Run "musyskills list" to see them.');
      const tools = await resolveTools(opts.tool, profiles, ctx, io);
      for (const dir of await resolveDirs(tools, ctx, { ...io, profiles, mode: 'ask' })) {
        report(log, dir, installSkills(dir.path, chosen, { version: pkg.version, force: opts.force }));
      }
      return;
    }
    case 'remove': {
      if (args.length === 0) throw new UsageError('Name at least one skill to remove.');
      const tools = await resolveTools(opts.tool, profiles, ctx, io);
      for (const dir of await resolveDirs(tools, ctx, { ...io, profiles, mode: 'ask' })) {
        report(log, dir, removeSkills(dir.path, args, { force: opts.force }));
      }
      return;
    }
    case 'update': {
      const tools = opts.tool ? validateTools(opts.tool) : profiles ? ['claude'] : TOOL_NAMES;
      let any = false;
      for (const dir of await resolveDirs(tools, ctx, { ...io, profiles, mode: 'all' })) {
        const installed = Object.keys(readManifest(dir.path).skills);
        if (installed.length === 0) continue;
        any = true;
        const chosen = skills.filter((s) => installed.includes(s.name));
        report(log, dir, installSkills(dir.path, chosen, { version: pkg.version, force: opts.force }));
      }
      if (!any) log('No skills installed by musyskills were found. Use "musyskills add" first.');
      return;
    }
    case 'doctor': {
      log(`musyskills ${pkg.version} (${ctx.global ? 'global' : 'project'}: ${ctx.global ? home : cwd})`);
      const detected = detectTools(ctx);
      log(`Detected tools: ${detected.length ? detected.join(', ') : 'none'}`);
      if (ctx.global) {
        const found = findProfiles(home);
        if (found.length) log(`Claude profiles: ${found.join(', ')}`);
      }
      for (const dir of await resolveDirs(TOOL_NAMES, ctx, { ...io, profiles, mode: 'all' })) {
        if (!existsSync(dir.path)) continue;
        const manifest = readManifest(dir.path);
        const rows = skills
          .map((s) => [s.name, skillState(dir.path, s, manifest)])
          .filter(([, state]) => state !== 'missing');
        if (rows.length === 0) continue;
        log(`\n${dir.path} (${dir.labels.join(', ')})`);
        for (const [name, state] of rows) log(`  ${name}: ${state}`);
      }
      return;
    }
    default:
      throw new UsageError(`Unknown command "${command}". Run "musyskills --help".`);
  }
}

export class UsageError extends Error {}

/** A question-asker over the terminal, or null when there is no terminal. */
function makeAsk(stdin) {
  if (!stdin.isTTY) return null;
  return async (question) => {
    const rl = createInterface({ input: stdin, output: process.stdout });
    try {
      return await rl.question(question);
    } finally {
      rl.close();
    }
  };
}

function firstSentence(text) {
  const s = text.split(/(?<=\.)\s/)[0];
  return s.length > 90 ? s.slice(0, 87) + '...' : s;
}

function pickSkills(skills, names) {
  const byName = new Map(skills.map((s) => [s.name, s]));
  const unknown = names.filter((n) => !byName.has(n));
  if (unknown.length) throw new UsageError(`Unknown skill: ${unknown.join(', ')}. Run "musyskills list" to see them.`);
  return [...new Set(names)].map((n) => byName.get(n));
}

function validateTools(tools) {
  const list = tools.flatMap((t) => t.split(',')).map((t) => t.trim().toLowerCase()).filter(Boolean);
  const unknown = list.filter((t) => !TOOLS[t]);
  if (unknown.length) throw new UsageError(`Unknown tool: ${unknown.join(', ')}. Use one of: ${TOOL_NAMES.join(', ')}.`);
  return [...new Set(list)];
}

/** --profile values as profile names, or null when the flag is not used. */
function parseProfiles(opts, ctx) {
  if (!opts.profile) return null;
  if (!ctx.global) {
    throw new UsageError('--profile only works with --global. Project installs always go to .claude/skills in the project.');
  }
  if (opts.tool && !validateTools(opts.tool).includes('claude')) {
    throw new UsageError('--profile is for Claude Code. Add --tool claude, or drop --profile.');
  }
  const names = opts.profile.flatMap((p) => p.split(',')).map((p) => p.trim()).filter(Boolean);
  if (names.length === 0) throw new UsageError('--profile needs a name, for example --profile work.');
  try {
    return [...new Set(names.map(normalizeProfile))];
  } catch (e) {
    throw new UsageError(e.message);
  }
}

export function detectTools({ cwd, home, global }) {
  const base = global ? home : cwd;
  const found = TOOL_NAMES.filter((t) => TOOLS[t].markers.some((m) => existsSync(join(base, m))));
  // Someone who only uses profiles such as ~/.claude-work still uses Claude Code.
  if (global && !found.includes('claude') && findProfiles(home).length) found.unshift('claude');
  return found;
}

async function resolveTools(flag, profiles, ctx, { log, ask }) {
  if (flag) return validateTools(flag);
  if (profiles) return ['claude'];
  const detected = detectTools(ctx);
  if (detected.length) {
    log(`Detected: ${detected.join(', ')}`);
    return detected;
  }
  if (ask) {
    const answer = await ask(`No agent tool detected. Install for which tool? (${TOOL_NAMES.join('/')}) [claude] `);
    return validateTools([answer.trim() || 'claude']);
  }
  log('No agent tool detected; installing for claude. Use --tool to choose another.');
  return ['claude'];
}

/**
 * The skills folders to work on, one entry per folder with the tools (or Claude
 * profiles) that read it. Several tools can share a folder (codex and
 * antigravity both use .agents/skills in a project), so each folder appears once.
 * For a global Claude install, `mode` decides the profiles: "ask" (add, remove)
 * asks in a terminal, "all" (update, doctor) covers every profile found.
 */
async function resolveDirs(tools, ctx, io) {
  const dirs = new Map();
  const add = (path, label) => {
    if (!dirs.has(path)) dirs.set(path, { path, labels: [] });
    dirs.get(path).labels.push(label);
  };
  for (const tool of tools) {
    if (tool !== 'claude' || !ctx.global) {
      add(targetDir(tool, ctx), tool);
      continue;
    }
    for (const target of await claudeTargets(ctx, io)) add(target.path, target.label);
  }
  return [...dirs.values()];
}

async function claudeTargets({ home }, { profiles, mode, env, ask, log }) {
  const toTargets = (names) => names.map((p) => ({ path: profileSkillsDir(home, p), label: p }));
  if (profiles) {
    if (mode === 'ask') warnMissingProfiles(home, profiles, log);
    return toTargets(profiles);
  }
  // CLAUDE_CONFIG_DIR is set when running inside a Claude Code profile, or by
  // someone who keeps their profile somewhere else.
  const fromEnv = env.CLAUDE_CONFIG_DIR
    ? [{ path: join(resolve(env.CLAUDE_CONFIG_DIR), 'skills'), label: 'claude (CLAUDE_CONFIG_DIR)' }]
    : [];
  if (mode === 'all') {
    const found = findProfiles(home);
    return [...toTargets(found.includes('claude') ? found : ['claude', ...found]), ...fromEnv];
  }
  if (fromEnv.length) return fromEnv;
  if (!ask) return toTargets(['claude']);
  const chosen = await askClaudeProfiles(home, ask, log);
  warnMissingProfiles(home, chosen, log);
  return toTargets(chosen);
}

async function askClaudeProfiles(home, ask, log) {
  const answer = (await ask('Do you use more than the default Claude (~/.claude)? (y/N) ')).trim().toLowerCase();
  if (answer !== 'y' && answer !== 'yes') return ['claude'];

  const found = findProfiles(home);
  if (found.length) {
    log('Claude profiles in your home folder:');
    found.forEach((p, i) => log(`  ${i + 1}) ${p.padEnd(Math.max(...found.map((f) => f.length)))}  ~/.${p}`));
    log('Pick numbers, or type the name after "claude-". Separate several with commas.');
  } else {
    log('Type the profile name after "claude-", for example work. Separate several with commas.');
  }
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const picked = pickProfiles(await ask('claude-'), found);
      if (picked.length) return picked;
      log('Pick at least one profile.');
    } catch (e) {
      log(e.message);
    }
  }
  throw new UsageError('No Claude profile chosen. Run again, or pass --profile <name>.');
}

/** "2,work" with found ["claude","claude-personal"] -> ["claude-personal","claude-work"]. */
export function pickProfiles(answer, found) {
  const parts = String(answer).split(',').map((p) => p.trim()).filter(Boolean);
  return [
    ...new Set(
      parts.map((part) => {
        if (/^\d+$/.test(part)) {
          const n = Number(part);
          if (n >= 1 && n <= found.length) return found[n - 1];
          throw new Error(`There is no profile number ${part}.`);
        }
        return normalizeProfile(part);
      }),
    ),
  ];
}

function warnMissingProfiles(home, profiles, log) {
  for (const p of profiles) {
    if (!existsSync(join(home, `.${p}`))) {
      log(`Note: ~/.${p} does not exist yet. Claude Code reads it only when started with CLAUDE_CONFIG_DIR=~/.${p}.`);
    }
  }
}

function report(log, dir, results) {
  log(`\n${dir.path} (${dir.labels.join(', ')})`);
  for (const r of results) {
    log(r.action === 'skipped' ? `  skipped ${r.name}: ${REASONS[r.reason]}` : `  ${r.action} ${r.name}`);
  }
}
