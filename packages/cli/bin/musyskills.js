#!/usr/bin/env node
import { main, UsageError } from '../src/cli.js';

main(process.argv.slice(2)).catch((err) => {
  console.error(`musyskills: ${err.message}`);
  process.exit(err instanceof UsageError ? 2 : 1);
});
