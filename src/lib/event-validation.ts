export const EVENT_STATUSES=['planning','confirmed','pre_production','live','completed','cancelled'] as const;
export type EventStatus=typeof EVENT_STATUSES[number];
export function parseEvent(input:unknown){
 if(!input||typeof input!=='object'||Array.isArray(input))return null;
 const x=input as Record<string,unknown>;
 const str=(key:string,max:number)=>typeof x[key]==='string'?(x[key] as string).trim().slice(0,max+1):'';
 const title=str('title',200),type=str('type',80),venue=str('venue',220),date=str('eventDate',10),clientId=str('clientId',40);
 const manager=x.projectManagerId==null||x.projectManagerId===''?null:str('projectManagerId',40);
 const uuid=/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
 const money=(v:unknown)=>typeof v==='string'?v:typeof v==='number'&&Number.isSafeInteger(v)?String(v):'';
 const contractValue=money(x.contractValue),approvedBudget=money(x.approvedBudget);
 const validDate=/^\d{4}-\d{2}-\d{2}$/.test(date)&&!Number.isNaN(Date.parse(date))&&new Date(date+'T00:00:00Z').toISOString().slice(0,10)===date;
 if(!title||title.length>200||!type||type.length>80||venue.length>220||!validDate||!uuid.test(clientId)||(manager!==null&&!uuid.test(manager))||![contractValue,approvedBudget].every(v=>/^\d{1,16}(?:\.\d{1,2})?$/.test(v)))return null;
 return {title,type,venue:venue||null,eventDate:date,clientId,projectManagerId:manager,contractValue,approvedBudget};
}
export function parseEventStatus(v:unknown):EventStatus|null{
 return typeof v==='string'&&EVENT_STATUSES.includes(v as EventStatus)?v as EventStatus:null;
}
export function parseProgress(v:unknown):number|null{
 return typeof v==='number'&&Number.isInteger(v)&&v>=0&&v<=100?v:null;
}
