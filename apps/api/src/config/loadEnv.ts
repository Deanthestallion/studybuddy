import { existsSync } from 'node:fs';
import path from 'node:path';
import { config as loadDotenv } from 'dotenv';

/**
 * Load environment variables from the nearest `.env`, walking up from the
 * current working directory to the monorepo root. This makes `npm run dev`
 * (cwd = apps/api) and `node dist/index.js` both pick up the root `.env`,
 * while real deployments (Docker/K8s) that inject real env vars just no-op.
 *
 * Imported for its side effect — keep it first in the import graph.
 */
let dir = process.cwd();
for (let i = 0; i < 5; i++) {
  const candidate = path.join(dir, '.env');
  if (existsSync(candidate)) {
    loadDotenv({ path: candidate });
    break;
  }
  const parent = path.dirname(dir);
  if (parent === dir) break;
  dir = parent;
}
