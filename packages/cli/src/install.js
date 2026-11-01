import { cpSync, existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { hashDir } from './skills.js';

export const MANIFEST = '.musyskills.json';

export function readManifest(dir) {
  const file = join(dir, MANIFEST);
  if (!existsSync(file)) return { skills: {} };
  try {
    const data = JSON.parse(readFileSync(file, 'utf8'));
    return { skills: {}, ...data };
  } catch {
    throw new Error(`${file} is not valid JSON. Fix or delete it, then retry.`);
  }
}

function writeManifest(dir, manifest) {
  const names = Object.keys(manifest.skills);
  const file = join(dir, MANIFEST);
  if (names.length === 0) {
    rmSync(file, { force: true });
    return;
  }
  writeFileSync(file, JSON.stringify(manifest, null, 2) + '\n');
}

// State of one skill in a target folder:
//   missing    not on disk
//   foreign    on disk but not installed by musyskills
//   modified   installed by musyskills, edited since
//   outdated   installed by musyskills, unchanged, newer version available
//   current    installed by musyskills, same as the bundled copy
export function skillState(dir, skill, manifest) {
  const dest = join(dir, skill.name);
  if (!existsSync(dest)) return 'missing';
  const entry = manifest.skills[skill.name];
  if (!entry) return 'foreign';
  const onDisk = hashDir(dest);
  if (onDisk !== entry.hash) return 'modified';
  return onDisk === hashDir(skill.path) ? 'current' : 'outdated';
}

// Installs or updates skills in one target folder. Returns one result per skill.
export function installSkills(dir, skills, { version, force = false } = {}) {
  mkdirSync(dir, { recursive: true });
  const manifest = readManifest(dir);
  const results = [];
  for (const skill of skills) {
    const state = skillState(dir, skill, manifest);
    if ((state === 'foreign' || state === 'modified') && !force) {
      results.push({ name: skill.name, action: 'skipped', reason: state });
      continue;
    }
    if (state === 'current') {
      results.push({ name: skill.name, action: 'unchanged' });
      continue;
    }
    const dest = join(dir, skill.name);
    rmSync(dest, { recursive: true, force: true });
    cpSync(skill.path, dest, { recursive: true });
    manifest.skills[skill.name] = { version, hash: hashDir(dest) };
    results.push({ name: skill.name, action: state === 'missing' ? 'installed' : 'updated' });
  }
  manifest.version = version;
  writeManifest(dir, manifest);
  return results;
}

export function removeSkills(dir, names, { force = false } = {}) {
  const manifest = readManifest(dir);
  const results = [];
  for (const name of names) {
    const entry = manifest.skills[name];
    const dest = join(dir, name);
    if (!entry) {
      const reason = existsSync(dest) ? 'foreign' : 'missing';
      results.push({ name, action: 'skipped', reason });
      continue;
    }
    if (existsSync(dest) && hashDir(dest) !== entry.hash && !force) {
      results.push({ name, action: 'skipped', reason: 'modified' });
      continue;
    }
    rmSync(dest, { recursive: true, force: true });
    delete manifest.skills[name];
    results.push({ name, action: 'removed' });
  }
  writeManifest(dir, manifest);
  return results;
}
