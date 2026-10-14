#!/usr/bin/env node
// Creates a gitignored local test env only after read-only identity verification of the disposable UAT branch.
import { randomBytes } from 'node:crypto';
import { emitKeypressEvents } from 'node:readline';
import { stdin, stdout, stderr } from 'node:process';
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { neon } from '@neondatabase/serverless';

const root = resolve(import.meta.dirname, '..');
const envPath = resolve(root, '.env.uat.local');
const expected = { projectId: 'fancy-cell-64250119', branchId: 'br-green-pine-b39zmics', database: 'eventorganizer' };

if (!stdin.isTTY || !stdin.setRawMode) {
  stderr.write('Open a private interactive terminal to enter the Neon URL without echo.\n');
  process.exit(2);
}
if (existsSync(envPath)) {
  stderr.write('Refusing to overwrite .env.uat.local. Remove or rename it yourself only after checking its contents.\n');
  process.exit(2);
}
if (!readFileSync(resolve(root, '.gitignore'), 'utf8').split(/\r?\n/).includes('.env.*')) {
  stderr.write('Refusing to create a secret file because .env.* is not ignored by Git.\n');
  process.exit(2);
}

async function readHidden(prompt) {
  emitKeypressEvents(stdin);
  stdin.setRawMode(true);
  stdout.write(prompt);
  try {
    return await new Promise((resolveValue, reject) => {
      let value = '';
      function onKey(str, key) {
        if (key?.name === 'return' || key?.name === 'enter') {
          stdin.off('keypress', onKey);
          stdout.write('\n');
          resolveValue(value);
          return;
        }
        if (key?.ctrl && key.name === 'c') {
          stdin.off('keypress', onKey);
          reject(new Error('cancelled'));
          return;
        }
        if (key?.name === 'backspace') {
          value = value.slice(0, -1);
          return;
        }
        if (str && !key?.ctrl && !key?.meta && str >= ' ' && value.length < 2048) value += str;
      }
      stdin.on('keypress', onKey);
    });
  } finally {
    stdin.setRawMode(false);
  }
}

try {
  const connectionString = await readHidden('Paste the disposable Neon branch connection string (hidden): ');
  if (/[\r\n\s#]/.test(connectionString)) throw new Error('invalid connection string format');
  const url = new URL(connectionString);
  if (!['postgres:', 'postgresql:'].includes(url.protocol) || !url.hostname.endsWith('.neon.tech') || !['require', 'verify-full'].includes(url.searchParams.get('sslmode'))) {
    throw new Error('expected a TLS-enabled Neon PostgreSQL URL');
  }

  const sql = neon(connectionString);
  const rows = await sql`SELECT
    current_setting('neon.project_id', true) AS project_id,
    current_setting('neon.branch_id', true) AS branch_id,
    current_database() AS database_name`;
  if (rows.length !== 1 || rows[0].project_id !== expected.projectId || rows[0].branch_id !== expected.branchId || rows[0].database_name !== expected.database) {
    throw new Error('database identity does not match the disposable UAT branch');
  }

  const targetToken = randomBytes(32).toString('hex');
  const contents = [
    `DATABASE_URL=${connectionString}`,
    `UAT_LOCAL_TARGET_TOKEN=${targetToken}`,
    'UAT_FINANCE_WRITE_ACK=DISPOSABLE_UAT_ONLY',
    'UAT_BASE_URL=http://127.0.0.1:3001',
    'UAT_EXACT_ALLOWED_ORIGIN=http://127.0.0.1:3001',
    '',
  ].join('\n');
  writeFileSync(envPath, contents, { encoding: 'utf8', flag: 'wx', mode: 0o600 });
  stdout.write('Created ignored .env.uat.local after confirming the disposable Neon target. Secret values were not displayed.\n');
} catch {
  stderr.write('No UAT env file was created. Verify the private connection string and exact disposable branch, then try again.\n');
  process.exitCode = 1;
} finally {
  stdin.pause();
}
