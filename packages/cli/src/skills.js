import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { dirname, join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));

// Published package: skills are bundled next to src/. Inside the repo (tests,
// local runs) they are read straight from the top-level skills/ folder.
export function bundledSkillsDir() {
  const bundled = join(here, '..', 'skills');
  if (existsSync(bundled)) return bundled;
  return join(here, '..', '..', '..', 'skills');
}

export function parseFrontmatter(text) {
  const match = text.replace(/\r\n/g, '\n').match(/^---\n([\s\S]*?)\n---\n/);
  if (!match) return null;
  const fields = {};
  for (const line of match[1].split('\n')) {
    const kv = line.match(/^([\w-]+):\s*(.*)$/);
    if (kv) fields[kv[1]] = kv[2].trim();
  }
  return fields;
}

export function listSkills(dir = bundledSkillsDir()) {
  return readdirSync(dir)
    .filter((name) => existsSync(join(dir, name, 'SKILL.md')))
    .sort()
    .map((name) => {
      const fm = parseFrontmatter(readFileSync(join(dir, name, 'SKILL.md'), 'utf8')) ?? {};
      return { name, description: fm.description ?? '', path: join(dir, name) };
    });
}

function walk(dir) {
  const out = [];
  for (const entry of readdirSync(dir).sort()) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) out.push(...walk(full));
    else out.push(full);
  }
  return out;
}

// Hash of every file in a skill folder. Line endings are normalized so a
// checkout with CRLF does not look "modified".
export function hashDir(dir) {
  const h = createHash('sha256');
  for (const file of walk(dir)) {
    h.update(relative(dir, file).split('\\').join('/'));
    h.update('\0');
    h.update(readFileSync(file, 'utf8').replace(/\r\n/g, '\n'));
    h.update('\0');
  }
  return h.digest('hex');
}
