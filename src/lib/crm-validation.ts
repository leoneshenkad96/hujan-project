export const LEAD_STATES=['new','qualified','proposal','negotiation','won','lost'] as const;
export type LeadState=typeof LEAD_STATES[number];
export function cleanString(v:unknown,max=180):string|null {
 if(typeof v!=='string')return null;
 const s=v.trim().replace(/\s+/g,' ');
 return s.length>0&&s.length<=max?s:null;
}
export function parseClient(v:unknown) {
 if(!v||typeof v!=='object'||Array.isArray(v))return null;
 const x=v as Record<string,unknown>;
 const name=cleanString(x.name);
 const email=x.email==null||x.email===''?null:cleanString(x.email,254)?.toLowerCase()??null;
 const phone=x.phone==null||x.phone===''?null:cleanString(x.phone,40);
 if(!name||((x.email!=null&&x.email!=='')&&(!email||!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)))||((x.phone!=null&&x.phone!=='')&&!phone))return null;
 return {name,email,phone};
}
export function parseLead(v:unknown) {
 if(!v||typeof v!=='object'||Array.isArray(v))return null;
 const x=v as Record<string,unknown>;
 const title=cleanString(x.title);
 const status=x.status===undefined?'new':x.status;
 const clientId=x.clientId===undefined||x.clientId===null||x.clientId===''?null:x.clientId;
 const estimatedValue=x.estimatedValue===undefined?'0':String(x.estimatedValue);
 if(!title||!LEAD_STATES.includes(status as LeadState)||typeof clientId!=='string'&&clientId!==null||(clientId!==null&&!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(clientId))||!/^\d{1,16}(?:\.\d{1,2})?$/.test(estimatedValue))return null;
 return {title,status:status as LeadState,clientId,estimatedValue};
}
export function parseLimit(raw:string|null){const n=Number(raw??20);return Number.isInteger(n)?Math.max(1,Math.min(n,100)):20}
