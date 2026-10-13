export const PO_STATUSES=['draft','issued','partially_received','received','cancelled'] as const;
export type POStatus=typeof PO_STATUSES[number];
export const uuid=/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
export function parseVendor(v:unknown){
 if(!v||typeof v!=='object'||Array.isArray(v))return null;
 const x=v as Record<string,unknown>;
 const name=typeof x.name==='string'?x.name.trim().replace(/\s+/g,' '):'';
 const category=x.category==null?null:typeof x.category==='string'?x.category.trim():null;
 const contact=x.contact==null?null:typeof x.contact==='string'?x.contact.trim():null;
 if(!name||name.length>180||category===null&&x.category!=null||contact===null&&x.contact!=null||(category?.length??0)>80||(contact?.length??0)>160)return null;
 return {name,category:category||null,contact:contact||null};
}
export function parsePO(v:unknown){
 if(!v||typeof v!=='object'||Array.isArray(v))return null;
 const x=v as Record<string,unknown>;
 const description=typeof x.description==='string'?x.description.trim():'';
 const amount=typeof x.amount==='string'?x.amount:typeof x.amount==='number'&&Number.isSafeInteger(x.amount)?String(x.amount):'';
 if(!description||description.length>240||typeof x.eventId!=='string'||!uuid.test(x.eventId)||typeof x.vendorId!=='string'||!uuid.test(x.vendorId)||!/^\d{1,16}(?:\.\d{1,2})?$/.test(amount))return null;
 return {description,amount,eventId:x.eventId,vendorId:x.vendorId};
}
export function parsePOStatus(v:unknown):POStatus|null{return typeof v==='string'&&PO_STATUSES.includes(v as POStatus)?v as POStatus:null}
