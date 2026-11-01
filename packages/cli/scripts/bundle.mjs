// Copies the repository's skills/ and LICENSE into the package before npm pack
// or publish, so the published CLI works offline. `--clean` removes the copies.
import { cpSync, rmSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const pkgDir = join(dirname(fileURLToPath(import.meta.url)), '..');
const repoDir = join(pkgDir, '..', '..');

rmSync(join(pkgDir, 'skills'), { recursive: true, force: true });
rmSync(join(pkgDir, 'LICENSE'), { force: true });

if (!process.argv.includes('--clean')) {
  cpSync(join(repoDir, 'skills'), join(pkgDir, 'skills'), { recursive: true });
  cpSync(join(repoDir, 'LICENSE'), join(pkgDir, 'LICENSE'));
}
