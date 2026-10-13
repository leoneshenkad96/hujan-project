export function cents(value:string):bigint {
 if(!/^-?\d+(?:\.\d{1,2})?$/.test(value))throw new Error('Invalid money');
 const negative=value.startsWith('-');const [whole,decimal='']=value.replace('-','').split('.');
 const result=BigInt(whole)*100n+BigInt((decimal+'00').slice(0,2));
 return negative?-result:result;
}
export function money(value:bigint):string {
 const n=value<0n?-value:value;
 return (value<0n?'-':'')+String(n/100n)+'.'+String(n%100n).padStart(2,'0');
}
export function profitability(input:{contractValue:string;invoiceAmounts:string[];receivedPayments:string[];actualExpenses:string[];committedPOs:string[];approvedBudget:string}){
 const sum=(values:string[])=>values.reduce((a,v)=>a+cents(v),0n);
 const contracted=cents(input.contractValue),invoiced=sum(input.invoiceAmounts),received=sum(input.receivedPayments),actual=sum(input.actualExpenses),committed=sum(input.committedPOs),budget=cents(input.approvedBudget);
 const profit=contracted-actual;
 const marginBps=contracted===0n?null:Number(profit*10000n/contracted);
 return {contractValue:money(contracted),invoiced:money(invoiced),cashReceived:money(received),actualExpenses:money(actual),poCommitments:money(committed),approvedBudget:money(budget),estimatedGrossProfit:money(profit),estimatedGrossMarginPercent:marginBps===null?null:marginBps/100,budgetVarianceAfterActual:money(budget-actual),invoiceOutstanding:money(invoiced-received),cashFlowProxy:money(received-actual),basis:'Contract value less recorded actual expenses; excludes tax, overhead, accruals and PO-to-expense reconciliation' as const};
}
