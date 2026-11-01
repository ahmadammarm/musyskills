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
const run = (...argv) => main(argv, { cwd, home, log: (s = '') => out.push(String(s)), stdin: { isTTY: false } });
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

test('bin prints help and exits 2 on usage errors', () => {
  const bin = fileURLToPath(new URL('../bin/musyskills.js', import.meta.url));
  const help = spawnSync(process.execPath, [bin, '--help'], { encoding: 'utf8' });
  assert.equal(help.status, 0);
  assert.match(help.stdout, /Usage:/);
  const bad = spawnSync(process.execPath, [bin, 'add', 'nope'], { encoding: 'utf8', cwd });
  assert.equal(bad.status, 2);
  assert.match(bad.stderr, /Unknown skill/);
});
