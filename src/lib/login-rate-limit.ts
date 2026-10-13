import 'server-only';
import { createHash } from 'node:crypto';
import { sql } from 'drizzle-orm';
import { getDatabase } from '@/db/client';

// One atomic UPSERT prevents a multi-instance race between failed logins.
// Hash two independent keys so attacks are bounded both by source and account.
const MAX_ATTEMPTS = 8;
const WINDOW_SECONDS = 15 * 60;
export function loginKeys(ip: string, organization: string, email: string) {
 const hash=(value:string)=>createHash('sha256').update(value).digest('hex');
 return [
  hash('ip:'+ip),
  hash('account:'+organization.trim().toLowerCase()+':'+email.trim().toLowerCase())
 ];
}
export async function enforceLoginRateLimit(ip:string,organization:string,email:string):Promise<boolean>{
 const db=getDatabase();
 for(const key of loginKeys(ip,organization,email)){
  const r=await db.execute(sql`
   INSERT INTO auth_login_limits ("key","window_started_at","attempts","updated_at")
   VALUES (${key},NOW(),1,NOW())
   ON CONFLICT ("key") DO UPDATE SET
    "attempts"=CASE WHEN auth_login_limits.window_started_at < NOW()-INTERVAL '15 minutes' THEN 1 ELSE auth_login_limits.attempts+1 END,
    "window_started_at"=CASE WHEN auth_login_limits.window_started_at < NOW()-INTERVAL '15 minutes' THEN NOW() ELSE auth_login_limits.window_started_at END,
    "updated_at"=NOW()
   RETURNING attempts
  `);
  const count=Number((r.rows[0] as {attempts:number}|undefined)?.attempts??MAX_ATTEMPTS+1);
  if(count>MAX_ATTEMPTS)return false;
 }
 return true;
}
