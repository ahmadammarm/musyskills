import { existsSync, readFileSync } from 'node:fs';
import { homedir } from 'node:os';
import { dirname, join } from 'node:path';
import { createInterface } from 'node:readline/promises';
import { fileURLToPath } from 'node:url';
import { parseArgs } from 'node:util';
import { TOOLS, TOOL_NAMES, targetDir } from './targets.js';
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
  -t, --tool <name>   claude, codex, cursor, antigravity (repeatable).
                      Default: detected from the project, otherwise claude.
  -g, --global        Install for your user instead of the current project
  -a, --all           With add: install every skill
  -f, --force         Overwrite or remove skills you edited or did not install
                      with musyskills
  -h, --help          Show this help
  -v, --version       Show the version

Examples:
  npx musyskills add pr-draft push-to-origin
  npx musyskills add --all --tool cursor
  npx musyskills update --global`;

const REASONS = {
  foreign: 'exists but was not installed by musyskills (use --force to overwrite)',
  modified: 'was edited after install (use --force to overwrite)',
  missing: 'is not installed',
};

export async function main(argv, { cwd = process.cwd(), home = process.env.MUSYSKILLS_HOME || homedir(), log = console.log, stdin = process.stdin } = {}) {
  let parsed;
  try {
    parsed = parseArgs({
      args: argv,
      allowPositionals: true,
      options: {
        tool: { type: 'string', short: 't', multiple: true },
        global: { type: 'boolean', short: 'g' },
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

  switch (command) {
    case 'list': {
      const width = Math.max(...skills.map((s) => s.name.length));
      for (const s of skills) log(`${s.name.padEnd(width)}  ${firstSentence(s.description)}`);
      return;
    }
    case 'add': {
      const chosen = opts.all ? skills : pickSkills(skills, args);
      if (chosen.length === 0) throw new UsageError('Name at least one skill, or use --all. Run "musyskills list" to see them.');
      const tools = await resolveTools(opts.tool, ctx, { log, stdin });
      for (const dir of uniqueDirs(tools, ctx)) {
        report(log, dir, installSkills(dir.path, chosen, { version: pkg.version, force: opts.force }));
      }
      return;
    }
    case 'remove': {
      if (args.length === 0) throw new UsageError('Name at least one skill to remove.');
      const tools = await resolveTools(opts.tool, ctx, { log, stdin });
      for (const dir of uniqueDirs(tools, ctx)) {
        report(log, dir, removeSkills(dir.path, args, { force: opts.force }));
      }
      return;
    }
    case 'update': {
      const tools = opts.tool ? validateTools(opts.tool) : TOOL_NAMES;
      let any = false;
      for (const dir of uniqueDirs(tools, ctx)) {
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
      for (const dir of uniqueDirs(TOOL_NAMES, ctx)) {
        if (!existsSync(dir.path)) continue;
        const manifest = readManifest(dir.path);
        const rows = skills
          .map((s) => [s.name, skillState(dir.path, s, manifest)])
          .filter(([, state]) => state !== 'missing');
        if (rows.length === 0) continue;
        log(`\n${dir.path} (${dir.tools.join(', ')})`);
        for (const [name, state] of rows) log(`  ${name}: ${state}`);
      }
      return;
    }
    default:
      throw new UsageError(`Unknown command "${command}". Run "musyskills --help".`);
  }
}

export class UsageError extends Error {}

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

export function detectTools({ cwd, home, global }) {
  const base = global ? home : cwd;
  return TOOL_NAMES.filter((t) => TOOLS[t].markers.some((m) => existsSync(join(base, m))));
}

async function resolveTools(flag, ctx, { log, stdin }) {
  if (flag) return validateTools(flag);
  const detected = detectTools(ctx);
  if (detected.length) {
    log(`Detected: ${detected.join(', ')}`);
    return detected;
  }
  if (stdin.isTTY) {
    const rl = createInterface({ input: stdin, output: process.stdout });
    const answer = await rl.question(`No agent tool detected. Install for which tool? (${TOOL_NAMES.join('/')}) [claude] `);
    rl.close();
    return validateTools([answer.trim() || 'claude']);
  }
  log('No agent tool detected; installing for claude. Use --tool to choose another.');
  return ['claude'];
}

// Several tools can share one folder (codex and antigravity both use
// .agents/skills in a project), so install there once.
function uniqueDirs(tools, ctx) {
  const dirs = new Map();
  for (const tool of tools) {
    const path = targetDir(tool, ctx);
    if (!dirs.has(path)) dirs.set(path, { path, tools: [] });
    dirs.get(path).tools.push(tool);
  }
  return [...dirs.values()];
}

function report(log, dir, results) {
  log(`\n${dir.path} (${dir.tools.join(', ')})`);
  for (const r of results) {
    log(r.action === 'skipped' ? `  skipped ${r.name}: ${REASONS[r.reason]}` : `  ${r.action} ${r.name}`);
  }
}
