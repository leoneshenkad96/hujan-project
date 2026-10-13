export const RUNDOWN_STATES=['planned','standby','on_air','done','skipped'] as const;
export type RundownState=typeof RUNDOWN_STATES[number];
export const validUuid=(v:unknown):v is string=>typeof v==='string'&&/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(v);
export const validTime=(v:unknown):v is string=>typeof v==='string'&&/^(?:[01]\d|2[0-3]):[0-5]\d$/.test(v);
export function parseRundown(v:unknown){
 if(!v||typeof v!=='object'||Array.isArray(v))return null;
 const x=v as Record<string,unknown>;
 const title=typeof x.title==='string'?x.title.trim():'';
 const cue=x.cue==null||x.cue===''?null:typeof x.cue==='string'?x.cue.trim():null;
 const picId=x.picId==null||x.picId===''?null:x.picId;
 if(!validUuid(x.eventId)||!title||title.length>200||!Number.isInteger(x.position)||Number(x.position)<1||Number(x.position)>10000||!validTime(x.startTime)||!validTime(x.endTime)||x.startTime>=x.endTime||(cue!==null&&cue.length>240)||(picId!==null&&!validUuid(picId)))return null;
 return {eventId:x.eventId,position:Number(x.position),title,startTime:x.startTime,endTime:x.endTime,cue,picId:picId as string|null};
}
export function parseRundownPatch(v:unknown){
 if(!v||typeof v!=='object'||Array.isArray(v))return null;
 const x=v as Record<string,unknown>,keys=Object.keys(x);
 if(keys.length!==1||keys[0]!=='status'||typeof x.status!=='string'||!RUNDOWN_STATES.includes(x.status as RundownState))return null;
 return {status:x.status as RundownState};
}

export const RUNDOWN_TRANSITIONS:Record<RundownState,readonly RundownState[]>={
 planned:['standby','skipped'],
 standby:['on_air','skipped'],
 on_air:['done','skipped'],
 done:[],
 skipped:[]
};
export function canTransitionRundown(from:RundownState,to:RundownState):boolean {
 return RUNDOWN_TRANSITIONS[from].includes(to);
}
