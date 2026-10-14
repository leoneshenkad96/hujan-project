export const uuid=/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
export const QUOTE_STATUSES=['draft','sent','accepted','rejected','expired'] as const;
export const CONTRACT_STATUSES=['draft','signed','terminated'] as const;
export function parseQuote(v:unknown){
 if(!v||typeof v!=='object'||Array.isArray(v))return null;
 const x=v as Record<string,unknown>;
 const title=typeof x.title==='string'?x.title.trim():'';
 const amount=typeof x.amount==='string'?x.amount:typeof x.amount==='number'&&Number.isSafeInteger(x.amount)?String(x.amount):'';
 const validUntil=x.validUntil==null||x.validUntil===''?null:x.validUntil;
 const validDate=validUntil===null||(typeof validUntil==='string'&&/^\d{4}-\d{2}-\d{2}$/.test(validUntil)&&!Number.isNaN(Date.parse(validUntil))&&new Date(validUntil+'T00:00:00Z').toISOString().slice(0,10)===validUntil);
 const notes=x.notes==null?null:typeof x.notes==='string'?x.notes.trim():null;
 if(!uuid.test(String(x.eventId))||!title||title.length>200||!/^\d{1,16}(?:\.\d{1,2})?$/.test(amount)||amount.replace(/[.0]/g,'')===''||!validDate||notes===null&&x.notes!=null||((notes?.length??0)>4000))return null;
 return {eventId:x.eventId as string,title,amount,validUntil:validUntil as string|null,notes};
}
export function parseQuoteStatus(v:unknown){return typeof v==='string'&&QUOTE_STATUSES.includes(v as typeof QUOTE_STATUSES[number])?v as typeof QUOTE_STATUSES[number]:null}
export function parseContractStatus(v:unknown){return typeof v==='string'&&CONTRACT_STATUSES.includes(v as typeof CONTRACT_STATUSES[number])?v as typeof CONTRACT_STATUSES[number]:null}
