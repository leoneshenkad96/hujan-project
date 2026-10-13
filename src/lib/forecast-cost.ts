import {minorUnits,formatMinor} from './budget-validation';

/** Financial LOCK: a PO amount is NOT a remaining commitment until its fulfilled
 * share is explicitly matched to actual expense records. Never infer matches
 * from vendor, amount or status alone. */
export type MatchedCommitment={poAmount:string;matchedActual:string};
export function forecastCost(input:{
 approvedBudget:string;
 actualExpenses:string[];
 commitments:MatchedCommitment[];
 otherForecastRemaining:string[];
}){
 const sum=(values:string[])=>values.reduce((n,v)=>n+minorUnits(v),0n);
 const approved=minorUnits(input.approvedBudget),actual=sum(input.actualExpenses);
 const matched=input.commitments.map(p=>{
  const po=minorUnits(p.poAmount),used=minorUnits(p.matchedActual);
  if(po<0n||used<0n||used>po)throw new Error('Invalid PO reconciliation');
  return po-used;
 });
 const openCommitment=matched.reduce((a,v)=>a+v,0n);
 const uncommitted=sum(input.otherForecastRemaining);
 if(actual<0n||approved<0n||uncommitted<0n)throw new Error('Invalid cost');
 const forecast=actual+openCommitment+uncommitted;
 return {
  approvedBudget:formatMinor(approved),
  actualSpent:formatMinor(actual),
  openCommitments:formatMinor(openCommitment),
  otherForecastRemaining:formatMinor(uncommitted),
  forecastAtCompletion:formatMinor(forecast),
  budgetVarianceActualMinusApproved:formatMinor(actual-approved),
  forecastVariance:formatMinor(forecast-approved)
 };
}
