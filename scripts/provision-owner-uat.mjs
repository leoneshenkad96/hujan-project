// One-time administrator-only UAT Owner provisioning. Run locally; never expose this via an HTTP route.
import { randomBytes, scryptSync } from 'node:crypto';
import { createInterface } from 'node:readline';
import { neon } from '@neondatabase/serverless';

const url = process.env.DATABASE_URL;
const expectedHost = process.env.VINCA_UAT_DB_HOST;
if (!url || !expectedHost || process.env.VINCA_UAT_ACK !== 'ISOLATED_UAT_ONLY') {
  console.error('Set DATABASE_URL, VINCA_UAT_DB_HOST and VINCA_UAT_ACK=ISOLATED_UAT_ONLY.');
  process.exit(1);
}
let parsed;
try { parsed = new URL(url); } catch { console.error('Invalid DATABASE_URL'); process.exit(1); }
if (parsed.protocol !== 'postgresql:' && parsed.protocol !== 'postgres:') {
  console.error('PostgreSQL is required'); process.exit(1);
}
if (parsed.hostname !== expectedHost || !parsed.hostname.endsWith('.neon.tech') || parsed.searchParams.get('sslmode') !== 'require') {
  console.error('UAT hostname/TLS verification failed'); process.exit(1);
}
if (!process.stdin.isTTY || !process.stdout.isTTY) {
  console.error('Interactive terminal required to avoid accidentally logging the password'); process.exit(1);
}
const rl = createInterface({ input: process.stdin, output: process.stdout, terminal: true });
const password = await new Promise(resolve => {
  process.stdout.write('Choose new Owner password (12-256 characters): ');
  rl.stdoutMuted = true;
  const orig = rl._writeToOutput.bind(rl);
  rl._writeToOutput = function (text) { if (!this.stdoutMuted) orig(text); };
  rl.question('', answer => { rl.stdoutMuted = false; process.stdout.write('\n'); rl.close(); resolve(answer); });
});
if (password.length < 12 || password.length > 256) {
  console.error('Password length must be 12-256 characters'); process.exit(1);
}
const salt = randomBytes(16);
const hash = 'scrypt$' + salt.toString('hex') + '$' + scryptSync(password,salt,64,{N:16384,r:8,p:1,maxmem:32*1024*1024}).toString('hex');
const sql = neon(url);
const rows = await sql`SELECT u.id, u.role, u.active, u.password_hash IS NOT NULL AS has_password,
 o.slug AS organization FROM users u JOIN organizations o ON u.organization_id=o.id
 WHERE lower(trim(u.username))='leoneshenkad' LIMIT 2`;
if (rows.length !== 1 || rows[0].organization !== 'vinca-uat' || rows[0].role !== 'owner' || rows[0].active || rows[0].has_password) {
  console.error('Owner record does not match expected inactive, unprovisioned Vinca UAT account'); process.exit(1);
}
const result = await sql`UPDATE users SET password_hash=${hash}, active=true WHERE id=${rows[0].id}
 AND active=false AND password_hash IS NULL RETURNING username,role,active`;
if (result.length !== 1) { console.error('Concurrent change; no account provisioned'); process.exit(1); }
console.log('Owner UAT provisioned: username=' + result[0].username + ', role=' + result[0].role + ', active=' + result[0].active);
