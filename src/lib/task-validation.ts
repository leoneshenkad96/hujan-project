export const TASK_STATES=['todo','in_progress','done','blocked'] as const;
export type TaskState=typeof TASK_STATES[number];
export const uuidPattern=/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
export function taskInput(input:unknown) {
 if(!input||typeof input!=='object'||Array.isArray(input))return null;
 const obj=input as Record<string,unknown>;
 const title=typeof obj.title==='string'?obj.title.trim().replace(/\s+/g,' '):'';
 const eventId=obj.eventId,ownerId=obj.ownerId===undefined||obj.ownerId===''?null:obj.ownerId;
 const dueDate=obj.dueDate===undefined||obj.dueDate===''?null:obj.dueDate;
 const validDate=dueDate===null||(typeof dueDate==='string'&&/^\d{4}-\d{2}-\d{2}$/.test(dueDate)&&!Number.isNaN(Date.parse(dueDate))&&new Date(dueDate+'T00:00:00Z').toISOString().slice(0,10)===dueDate);
 if(!title||title.length>240||typeof eventId!=='string'||!uuidPattern.test(eventId)||(ownerId!==null&&(typeof ownerId!=='string'||!uuidPattern.test(ownerId)))||!validDate)return null;
 return {title,eventId,ownerId:ownerId as string|null,dueDate:dueDate as string|null};
}
export function taskPatch(input:unknown){
 if(!input||typeof input!=='object'||Array.isArray(input))return null;
 const obj=input as Record<string,unknown>;
 if(!Object.keys(obj).length||Object.keys(obj).some(k=>!['status','ownerId','dueDate','title'].includes(k)))return null;
 const patch:{status?:TaskState;ownerId?:string|null;dueDate?:string|null;title?:string}={};
 if(obj.status!==undefined){if(typeof obj.status!=='string'||!TASK_STATES.includes(obj.status as TaskState))return null;patch.status=obj.status as TaskState}
 if(obj.title!==undefined){if(typeof obj.title!=='string'||!obj.title.trim()||obj.title.trim().length>240)return null;patch.title=obj.title.trim()}
 if(obj.ownerId!==undefined){if(obj.ownerId!==null&&(typeof obj.ownerId!=='string'||!uuidPattern.test(obj.ownerId)))return null;patch.ownerId=obj.ownerId as string|null}
 if(obj.dueDate!==undefined){const v=obj.dueDate;if(v!==null&&(typeof v!=='string'||!/^\d{4}-\d{2}-\d{2}$/.test(v)||Number.isNaN(Date.parse(v))||new Date(v+'T00:00:00Z').toISOString().slice(0,10)!==v))return null;patch.dueDate=v as string|null}
 return patch;
}
