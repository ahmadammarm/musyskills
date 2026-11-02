import { test, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync, appendFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { main, UsageError } from '../src/cli.js';
import { listSkills } from '../src/skills.js';

let root, cwd, home, out;
const opts = (extra = {}) => ({ cwd, home, env: {}, log: (s = '') => out.push(String(s)), stdin: { isTTY: false }, ...extra });
const run = (...argv) => main(argv, opts());
/** Runs with a terminal that answers the questions in order. */
const runAsking = (answers, ...argv) => {
  const asked = [];
  const ask = async (q) => (asked.push(q), answers.shift() ?? '');
  return main(argv, opts({ ask })).then(() => asked);
};
const skillFile = (dir, name) => join(dir, name, 'SKILL.md');
const manifest = (dir) => JSON.parse(readFileSync(join(dir, '.musyskills.json'), 'utf8'));

beforeEach(() => {
  root = mkdtempSync(join(tmpdir(), 'musyskills-'));
  cwd = join(root, 'project');
  home = join(root, 'home');
  mkdirSync(cwd);
  mkdirSync(home);
  out = [];
});
afterEach(() => rmSync(root, { recursive: true, force: true }));

test('list shows every bundled skill', async () => {
  await run('list');
  const names = listSkills().map((s) => s.name);
  assert.ok(names.length >= 8);
  for (const n of names) assert.ok(out.some((l) => l.startsWith(n)), `missing ${n}`);
});

test('add defaults to claude in the project when nothing is detected', async () => {
  await run('add', 'pr-draft');
  const dir = join(cwd, '.claude', 'skills');
  assert.ok(existsSync(skillFile(dir, 'pr-draft')));
  assert.deepEqual(Object.keys(manifest(dir).skills), ['pr-draft']);
});

test('add detects tools from project markers', async () => {
  mkdirSync(join(cwd, '.cursor'));
  writeFileSync(join(cwd, 'AGENTS.md'), '');
  await run('add', 'release');
  assert.ok(existsSync(skillFile(join(cwd, '.cursor', 'skills'), 'release')));
  assert.ok(existsSync(skillFile(join(cwd, '.agents', 'skills'), 'release')));
  assert.ok(!existsSync(join(cwd, '.claude')));
});

test('codex and antigravity share one project folder', async () => {
  await run('add', 'pr-draft', '--tool', 'codex,antigravity');
  assert.equal(out.filter((l) => l.includes('installed pr-draft')).length, 1);
});

test('--global installs under the home directory', async () => {
  await run('add', '--all', '--global', '--tool', 'antigravity');
  const dir = join(home, '.gemini', 'config', 'skills');
  assert.equal(Object.keys(manifest(dir).skills).length, listSkills().length);
  assert.ok(!existsSync(join(cwd, '.agents')));
});

test('add skips a skill the user edited unless --force', async () => {
  await run('add', 'pr-draft');
  const file = skillFile(join(cwd, '.claude', 'skills'), 'pr-draft');
  appendFileSync(file, '\nmy local note\n');
  out = [];
  await run('add', 'pr-draft');
  assert.ok(out.some((l) => l.includes('skipped pr-draft') && l.includes('edited')));
  assert.match(readFileSync(file, 'utf8'), /my local note/);
  await run('add', 'pr-draft', '--force');
  assert.doesNotMatch(readFileSync(file, 'utf8'), /my local note/);
});

test('add never overwrites a skill musyskills did not install', async () => {
  const dir = join(cwd, '.claude', 'skills', 'pr-draft');
  mkdirSync(dir, { recursive: true });
  writeFileSync(join(dir, 'SKILL.md'), 'mine');
  await run('add', 'pr-draft');
  assert.equal(readFileSync(join(dir, 'SKILL.md'), 'utf8'), 'mine');
  assert.ok(out.some((l) => l.includes('not installed by musyskills')));
});

test('update refreshes outdated skills and leaves others alone', async () => {
  await run('add', 'pr-draft', 'release');
  const dir = join(cwd, '.claude', 'skills');
  // Simulate an older install: content and recorded hash both differ from the bundle.
  writeFileSync(skillFile(dir, 'pr-draft'), 'old version');
  const m = manifest(dir);
  const { hashDir } = await import('../src/skills.js');
  m.skills['pr-draft'].hash = hashDir(join(dir, 'pr-draft'));
  writeFileSync(join(dir, '.musyskills.json'), JSON.stringify(m));
  out = [];
  await run('update');
  assert.ok(out.some((l) => l.includes('updated pr-draft')));
  assert.ok(out.some((l) => l.includes('unchanged release')));
  assert.notEqual(readFileSync(skillFile(dir, 'pr-draft'), 'utf8'), 'old version');
});

test('remove deletes only skills musyskills installed', async () => {
  await run('add', 'pr-draft');
  const dir = join(cwd, '.claude', 'skills');
  mkdirSync(join(dir, 'mine'));
  writeFileSync(join(dir, 'mine', 'SKILL.md'), 'x');
  await run('remove', 'pr-draft', 'mine');
  assert.ok(!existsSync(join(dir, 'pr-draft')));
  assert.ok(existsSync(join(dir, 'mine')));
  assert.ok(!existsSync(join(dir, '.musyskills.json')), 'empty manifest is removed');
});

test('doctor reports installed skills and their state', async () => {
  await run('add', 'pr-draft');
  appendFileSync(skillFile(join(cwd, '.claude', 'skills'), 'pr-draft'), 'edit');
  out = [];
  await run('doctor');
  assert.ok(out.some((l) => l.includes('pr-draft: modified')));
});

test('unknown skill, tool, and command are usage errors', async () => {
  await assert.rejects(run('add', 'nope'), UsageError);
  await assert.rejects(run('add', 'pr-draft', '--tool', 'vim'), UsageError);
  await assert.rejects(run('frobnicate'), UsageError);
  await assert.rejects(run('add'), UsageError);
});

test('global claude install asks about profiles and defaults to ~/.claude on "no"', async () => {
  const asked = await runAsking(['n'], 'add', 'pr-draft', '--global', '--tool', 'claude');
  assert.match(asked[0], /more than the default Claude/);
  assert.ok(existsSync(skillFile(join(home, '.claude', 'skills'), 'pr-draft')));
});

test('answering yes picks profiles by number or by name after claude-', async () => {
  mkdirSync(join(home, '.claude'));
  mkdirSync(join(home, '.claude-personal'));
  mkdirSync(join(home, '.claude-work'));
  writeFileSync(join(home, '.claude.json'), '{}'); // a file, not a profile
  const asked = await runAsking(['y', '3, personal'], 'add', 'pr-draft', '--global', '--tool', 'claude');
  assert.equal(asked[1], 'claude-');
  assert.ok(out.some((l) => l.includes('1) claude ')));
  assert.ok(!out.some((l) => l.includes('claude.json')));
  assert.ok(existsSync(skillFile(join(home, '.claude-work', 'skills'), 'pr-draft')));
  assert.ok(existsSync(skillFile(join(home, '.claude-personal', 'skills'), 'pr-draft')));
  assert.ok(!existsSync(join(home, '.claude', 'skills')));
});

test('a bad answer is asked again', async () => {
  const asked = await runAsking(['yes', 'bad name!', 'work'], 'add', 'pr-draft', '--global', '--tool', 'claude');
  assert.equal(asked.filter((q) => q === 'claude-').length, 2);
  assert.ok(existsSync(skillFile(join(home, '.claude-work', 'skills'), 'pr-draft')));
  assert.ok(out.some((l) => l.includes('does not exist yet')));
});

test('project installs never ask about profiles', async () => {
  const asked = await runAsking([], 'add', 'pr-draft', '--tool', 'claude');
  assert.deepEqual(asked, []);
});

test('--profile installs into several profiles without asking', async () => {
  const asked = await runAsking([], 'add', 'release', '--global', '--profile', 'work,claude-personal', '-p', 'default');
  assert.deepEqual(asked, []);
  for (const p of ['.claude-work', '.claude-personal', '.claude']) {
    assert.ok(existsSync(skillFile(join(home, p, 'skills'), 'release')), p);
  }
});

test('--profile needs --global and claude', async () => {
  await assert.rejects(run('add', 'pr-draft', '--profile', 'work'), /only works with --global/);
  await assert.rejects(run('add', 'pr-draft', '-g', '--tool', 'cursor', '--profile', 'work'), /for Claude Code/);
  await assert.rejects(run('add', 'pr-draft', '-g', '--profile', '../x'), UsageError);
});

test('CLAUDE_CONFIG_DIR is used without asking', async () => {
  const dir = join(root, 'custom-claude');
  const asked = [];
  await main(['add', 'pr-draft', '--global', '--tool', 'claude'], opts({ env: { CLAUDE_CONFIG_DIR: dir }, ask: async (q) => (asked.push(q), '') }));
  assert.deepEqual(asked, []);
  assert.ok(existsSync(skillFile(join(dir, 'skills'), 'pr-draft')));
});

test('update and doctor cover every Claude profile', async () => {
  await run('add', 'pr-draft', '--global', '--profile', 'work');
  await run('add', 'release', '--global', '--profile', 'default');
  out = [];
  await run('update', '--global');
  assert.ok(out.some((l) => l.includes('(claude-work)')));
  assert.ok(out.some((l) => l.includes('(claude)')));
  out = [];
  await run('doctor', '--global');
  assert.ok(out.some((l) => l.startsWith('Claude profiles: claude, claude-work')));
  assert.ok(out.some((l) => l.includes('pr-draft: current')));
});

test('a home with only ~/.claude-work counts as Claude Code', async () => {
  mkdirSync(join(home, '.claude-work'));
  await runAsking(['y', '1'], 'add', 'pr-draft', '--global');
  assert.ok(existsSync(skillFile(join(home, '.claude-work', 'skills'), 'pr-draft')));
});

test('bin prints help and exits 2 on usage errors', () => {
  const bin = fileURLToPath(new URL('../bin/musyskills.js', import.meta.url));
  const help = spawnSync(process.execPath, [bin, '--help'], { encoding: 'utf8' });
  assert.equal(help.status, 0);
  assert.match(help.stdout, /Usage:/);
  const bad = spawnSync(process.execPath, [bin, 'add', 'nope'], { encoding: 'utf8', cwd });
  assert.equal(bad.status, 2);
  assert.match(bad.stderr, /Unknown skill/);
});
