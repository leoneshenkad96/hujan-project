export const uuid=/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
export function parseMoney(v:unknown):string|null{
 const s=typeof v==='string'?v:typeof v==='number'&&Number.isSafeInteger(v)?String(v):'';
 return /^\d{1,16}(?:\.\d{1,2})?$/.test(s)?s:null;
}
export function parseExpense(v:unknown){
 if(!v||typeof v!=='object'||Array.isArray(v))return null;
 const x=v as Record<string,unknown>;
 const description=typeof x.description==='string'?x.description.trim():'';
 const amount=parseMoney(x.amount);
 const vendorId=x.vendorId==null||x.vendorId===''?null:x.vendorId;
 if(!description||description.length>240||!amount||Number(amount)===0||typeof x.eventId!=='string'||!uuid.test(x.eventId)||(vendorId!==null&&(typeof vendorId!=='string'||!uuid.test(vendorId))))return null;
 return {description,amount,eventId:x.eventId,vendorId:vendorId as string|null};
}
export function minorUnits(v:string):bigint{
 const [major,minor='']=v.split('.');
 if(!/^\d+$/.test(major)||!/^(?:\d{0,2})$/.test(minor))throw new Error('Invalid decimal');
 return BigInt(major)*100n+BigInt((minor+'00').slice(0,2));
}
export function formatMinor(v:bigint):string{
 const negative=v<0n,abs=negative?-v:v;
 return (negative?'-':'')+(abs/100n).toString()+'.'+(abs%100n).toString().padStart(2,'0');
}
export function summarizeBudget(approved:string,actualAmounts:string[],committedAmounts:string[]){
 const actual=actualAmounts.reduce((s,v)=>s+minorUnits(v),0n);
 const commitments=committedAmounts.reduce((s,v)=>s+minorUnits(v),0n);
 const budget=minorUnits(approved);
 return {approvedBudget:formatMinor(budget),actualSpent:formatMinor(actual),openCommitments:formatMinor(commitments),remainingAfterActual:formatMinor(budget-actual),budgetVarianceActualMinusApproved:formatMinor(actual-budget),remainingAfterCommitmentsOnly:formatMinor(budget-commitments)};
}
