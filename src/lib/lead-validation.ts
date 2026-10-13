export const LEAD_STATUSES=['new','qualified','proposal','negotiation','won','lost'] as const;
export type LeadState=typeof LEAD_STATUSES[number];
export const LEAD_TRANSITIONS:Record<LeadState,readonly LeadState[]>={
 new:['qualified','lost'],
 qualified:['proposal','lost'],
 proposal:['negotiation','won','lost'],
 negotiation:['proposal','won','lost'],
 won:[],
 lost:[]
};
export const validLeadId=(v:unknown):v is string=>typeof v==='string'&&/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(v);
export const canTransitionLead=(from:LeadState,to:LeadState)=>LEAD_TRANSITIONS[from].includes(to);
export function parseLead(v:unknown){
 if(!v||typeof v!=='object'||Array.isArray(v))return null;
 const x=v as Record<string,unknown>;
 const title=typeof x.title==='string'?x.title.trim():'';
 const clientId=x.clientId==null||x.clientId===''?null:x.clientId;
 const estimatedValue=typeof x.estimatedValue==='string'?x.estimatedValue:typeof x.estimatedValue==='number'&&Number.isSafeInteger(x.estimatedValue)?String(x.estimatedValue):'';
 if(Object.keys(x).some(k=>!['title','clientId','estimatedValue'].includes(k))||!title||title.length>180||(clientId!==null&&!validLeadId(clientId))||!/^\\d{1,16}(?:\\.\\d{1,2})?$/.test(estimatedValue))return null;
 return {title,clientId:clientId as string|null,estimatedValue};
}
