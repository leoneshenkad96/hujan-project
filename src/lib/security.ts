/**
 * Enforce same-origin requests for cookie-authenticated mutations.
 * Browsers send Origin for fetch POST/PATCH; explicitly reject absent Origin in production.
 * Never trust x-forwarded-host as a replacement for the request URL.
 */
export function isTrustedOrigin(origin:string|null,requestUrl:string,production:boolean):boolean{
 if(!origin)return !production;
 try{
  const received=new URL(origin),target=new URL(requestUrl);
  return (received.protocol==='https:'||(!production&&received.protocol==='http:'))
    && received.origin===target.origin;
 }catch{return false}
}
export function redactHeaders(headers:Record<string,string>):Record<string,string>{
 const output:Record<string,string>={};
 for(const [name,value] of Object.entries(headers))output[name]=/authorization|cookie|token|secret|password/i.test(name)?'[REDACTED]':value;
 return output;
}
