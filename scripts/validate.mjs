#!/usr/bin/env node
// Checks that every skill follows the repository format and that the README
// and docs/skills.md list exactly the skills present in skills/.
// Usage: node scripts/validate.mjs   (exit code 1 on any problem)

import { readdirSync, readFileSync, existsSync, statSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const REQUIRED_FIELDS = ['name', 'description', 'argument-hint'];
const REQUIRED_SECTIONS = ['Purpose', 'Trigger', 'Pre-flight Checks', 'Workflow', 'Rules', 'Output Format'];

const errors = [];
const fail = (file, msg) => errors.push(`${file}: ${msg}`);
const read = (rel) => readFileSync(join(root, rel), 'utf8').replace(/\r\n/g, '\n');

function parseFrontmatter(text) {
  const match = text.match(/^---\n([\s\S]*?)\n---\n/);
  if (!match) return null;
  const fields = {};
  for (const line of match[1].split('\n')) {
    const kv = line.match(/^([\w-]+):\s*(.*)$/);
    if (kv) fields[kv[1]] = kv[2].trim();
  }
  return fields;
}

// Slash commands written as `/name` must name a real skill.
function checkSlashCommands(file, text, skills) {
  for (const [, cmd] of text.matchAll(/`\/([a-z][a-z0-9-]*)`/g)) {
    if (!skills.has(cmd)) fail(file, `slash command \`/${cmd}\` does not match any skill folder`);
  }
}

// This repository ships no agents, so a skill must not depend on one.
function checkAgentReferences(file, text) {
  for (const [ref] of text.matchAll(/\b[a-z][a-z0-9]*(?:-[a-z0-9]+)*-agent\b/gi)) {
    fail(file, `references "${ref}", but this repository does not ship any agents`);
  }
}

const skillsDir = join(root, 'skills');
const skillNames = readdirSync(skillsDir)
  .filter((d) => statSync(join(skillsDir, d)).isDirectory())
  .sort();
const skills = new Set(skillNames);

for (const name of skillNames) {
  const rel = `skills/${name}/SKILL.md`;
  if (!existsSync(join(root, rel))) {
    fail(rel, 'missing SKILL.md');
    continue;
  }
  const text = read(rel);
  const fm = parseFrontmatter(text);
  if (!fm) {
    fail(rel, 'missing YAML frontmatter delimited by --- lines');
  } else {
    for (const field of REQUIRED_FIELDS) {
      if (!fm[field]) fail(rel, `frontmatter is missing "${field}"`);
    }
    if (fm.name && fm.name !== name) fail(rel, `frontmatter name "${fm.name}" must equal folder name "${name}"`);
  }
  const headings = new Set([...text.matchAll(/^## (.+)$/gm)].map((m) => m[1].trim()));
  for (const section of REQUIRED_SECTIONS) {
    if (!headings.has(section)) fail(rel, `missing section "## ${section}"`);
  }
  checkSlashCommands(rel, text, skills);
  checkAgentReferences(rel, text);
}

function compareLists(file, listed, what) {
  const set = new Set(listed);
  for (const n of skillNames) if (!set.has(n)) fail(file, `${what} is missing skill "${n}"`);
  for (const n of listed) if (!skills.has(n)) fail(file, `${what} lists "${n}", which has no folder in skills/`);
  const dupes = listed.filter((n, i) => listed.indexOf(n) !== i);
  for (const n of new Set(dupes)) fail(file, `${what} lists "${n}" more than once`);
}

const readme = read('README.md');
const available = readme.match(/^## Available Skills\n([\s\S]*?)(?=^## )/m);
if (!available) {
  fail('README.md', 'missing "## Available Skills" section');
} else {
  const listed = [...available[1].matchAll(/^- \*\*([\w-]+)\*\*/gm)].map((m) => m[1]);
  compareLists('README.md', listed, 'Available Skills');
}

const docs = read('docs/skills.md');
const docHeadings = [...docs.matchAll(/^### (\d+)\. ([\w-]+)\s*$/gm)];
const docNames = docHeadings.map((m) => m[2]);
compareLists('docs/skills.md', docNames, 'Directory Reference');
docHeadings.forEach((m, i) => {
  if (Number(m[1]) !== i + 1) fail('docs/skills.md', `"${m[2]}" is numbered ${m[1]}, expected ${i + 1}`);
});
const sorted = [...docNames].sort();
if (docNames.join() !== sorted.join()) fail('docs/skills.md', 'skills must be listed in alphabetical order');
checkSlashCommands('docs/skills.md', docs, skills);
checkAgentReferences('docs/skills.md', docs);

// Claude Code plugin manifests.
function readJson(rel) {
  if (!existsSync(join(root, rel))) {
    fail(rel, 'file is missing');
    return null;
  }
  try {
    return JSON.parse(read(rel));
  } catch (e) {
    fail(rel, `invalid JSON: ${e.message}`);
    return null;
  }
}

const marketplace = readJson('.claude-plugin/marketplace.json');
const plugin = readJson('.claude-plugin/plugin.json');
if (marketplace) {
  const rel = '.claude-plugin/marketplace.json';
  if (!marketplace.name) fail(rel, 'missing "name"');
  if (!marketplace.owner?.name) fail(rel, 'missing "owner.name"');
  if (!Array.isArray(marketplace.plugins) || marketplace.plugins.length === 0) {
    fail(rel, '"plugins" must be a non-empty array');
  } else {
    for (const [i, p] of marketplace.plugins.entries()) {
      if (!p.name) fail(rel, `plugins[${i}] is missing "name"`);
      if (!p.source) fail(rel, `plugins[${i}] is missing "source"`);
      // plugin.json wins silently when both set a version, so keep it in one place.
      if (p.version) fail(rel, `plugins[${i}] sets "version"; set it only in plugin.json`);
    }
    if (plugin && !marketplace.plugins.some((p) => p.name === plugin.name)) {
      fail(rel, `no plugin entry named "${plugin.name}" (the name in plugin.json)`);
    }
  }
}
if (plugin) {
  const rel = '.claude-plugin/plugin.json';
  if (!plugin.name) fail(rel, 'missing "name"');
  const latest = read('CHANGELOG.md').match(/^## \[v?(\d+\.\d+\.\d+)\]/m)?.[1];
  if (!plugin.version) {
    fail(rel, 'missing "version"');
  } else if (latest && plugin.version !== latest) {
    fail(rel, `version ${plugin.version} does not match the latest release in CHANGELOG.md (${latest})`);
  }
}

if (errors.length) {
  console.error(`Validation failed with ${errors.length} problem(s):\n`);
  for (const e of errors) console.error(`  - ${e}`);
  process.exit(1);
}
console.log(`OK: ${skillNames.length} skills validated.`);
