/**
 * Vinca Financial LOCK: deterministic quote preview arithmetic.
 * Quantities use 3 decimals, monetary amounts 2 decimals.
 * Each line rounds half-up to a cent; percentage tax rounds half-up on the
 * discounted taxable total. No floating point arithmetic is used.
 * Used for client preview and server-side persisted quotation totals.
 */
const decimal=(v:string,places:number):bigint=>{
 if(typeof v!=='string'||!new RegExp('^\\d{1,16}(?:\\.\\d{1,'+places+'})?$').test(v))throw Error('Invalid decimal');
 const [whole,frac='']=v.split('.');
 return BigInt(whole)*10n**BigInt(places)+BigInt(frac.padEnd(places,'0'));
};
const formatted=(minor:bigint)=>`${minor/100n}.${(minor%100n).toString().padStart(2,'0')}`;
const roundHalfUp=(numerator:bigint,denominator:bigint)=>(numerator+denominator/2n)/denominator;
export type QuotationLine={description:string;unit?:string;quantity:string;unitPrice:string};
export type QuoteCalculation={lines:{description:string;unit:string;quantity:string;unitPrice:string;subtotal:string}[];subtotal:string;discount:string;taxableBase:string;taxRatePercent:string;tax:string;total:string};
export function calculateQuote(lines:QuotationLine[],discount:string='0',taxRatePercent:string='0'):QuoteCalculation{
 if(!Array.isArray(lines)||!lines.length||lines.length>200)throw Error('Invalid lines');
 const result=lines.map(line=>{
  if(!line||typeof line.description!=='string'||!line.description.trim()||line.description.length>240||typeof (line.unit??'unit')!=='string'||!(line.unit??'unit').trim()||(line.unit??'unit').length>40)throw Error('Invalid line');
  const qty=decimal(line.quantity,3),price=decimal(line.unitPrice,2);
  if(qty<=0n)throw Error('Quantity must be positive');
  return {description:line.description.trim(),unit:(line.unit??'unit').trim(),quantity:line.quantity,unitPrice:line.unitPrice,subtotal:formatted(roundHalfUp(qty*price,1000n))};
 });
 const subtotal=result.reduce((n,line)=>n+decimal(line.subtotal,2),0n);
 const discountMinor=decimal(discount,2),taxBasisPoints=decimal(taxRatePercent,2);
 if(discountMinor>subtotal)throw Error('Discount exceeds subtotal');
 if(taxBasisPoints>10000n)throw Error('Tax rate must be 0-100 percent');
 const taxable=subtotal-discountMinor;
 const tax=roundHalfUp(taxable*taxBasisPoints,10000n);
 if(subtotal+tax>999999999999999999n)throw Error('Quotation exceeds NUMERIC(18,2)');
 return {lines:result,subtotal:formatted(subtotal),discount:formatted(discountMinor),taxableBase:formatted(taxable),taxRatePercent,tax:formatted(tax),total:formatted(taxable+tax)};
}
export function calculateMarkupAndMargin(sell:string,cost:string){
 const price=decimal(sell,2),expense=decimal(cost,2);
 const gain=price-expense;
 const pct=(denominator:bigint)=>denominator===0n?null:Number(gain*10000n/denominator)/100;
 return {profitCents:gain.toString(),markupPercent:pct(expense),grossMarginPercent:pct(price)};
}
