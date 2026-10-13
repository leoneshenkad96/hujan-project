export const uuid=/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
export const money=(v:unknown):string|null=>{
 const s=typeof v==='string'?v:typeof v==='number'&&Number.isSafeInteger(v)?String(v):'';
 return /^\d{1,16}(?:\.\d{1,2})?$/.test(s)&&/[^.0]/.test(s)?s:null;
};
export function invoiceInput(v:unknown){
 if(!v||typeof v!=='object'||Array.isArray(v))return null;
 const x=v as Record<string,unknown>;
 const dueDate=x.dueDate==null||x.dueDate===''?null:x.dueDate;
 const validDate=dueDate===null||(typeof dueDate==='string'&&/^\d{4}-\d{2}-\d{2}$/.test(dueDate)&&!Number.isNaN(Date.parse(dueDate))&&new Date(dueDate+'T00:00:00Z').toISOString().slice(0,10)===dueDate);
 if(!uuid.test(String(x.eventId))||!money(x.amount)||!validDate)return null;
 return {eventId:x.eventId as string,amount:money(x.amount)!,dueDate:dueDate as string|null};
}
export function paymentInput(v:unknown){
 if(!v||typeof v!=='object'||Array.isArray(v))return null;
 const x=v as Record<string,unknown>,amount=money(x.amount);
 const reference=x.reference==null||x.reference===''?null:typeof x.reference==='string'?x.reference.trim():null;
 if(!amount||(reference===null&&x.reference!=null&&x.reference!=='')||(reference?.length??0)>160)return null;
 return {amount,reference:reference||null};
}
export const minor=(s:string)=>{const [whole,fraction='']=s.split('.');return BigInt(whole)*100n+BigInt((fraction+'00').slice(0,2))};
export const decimal=(n:bigint)=>`${n<0n?'-':''}${(n<0n?-n:n)/100n}.${((n<0n?-n:n)%100n).toString().padStart(2,'0')}`;
export function invoiceBalance(amount:string,paid:string){
 const total=minor(amount),received=minor(paid);
 return {amount:decimal(total),paidAmount:decimal(received),outstanding:decimal(total-received),fullyPaid:received===total};
}
