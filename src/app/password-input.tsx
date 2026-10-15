'use client';
import { useState, type InputHTMLAttributes } from 'react';

type PasswordInputProps = Omit<InputHTMLAttributes<HTMLInputElement>, 'type'>;

export default function PasswordInput({ className, ...props }: PasswordInputProps) {
 const [visible,setVisible]=useState(false);
 return <span style={{display:'block',position:'relative'}}>
  <input {...props} type={visible?'text':'password'} className={className} style={{...props.style,paddingRight:44,width:'100%'}}/>
  <button type="button" aria-label={visible?'Sembunyikan password':'Tampilkan password'} aria-pressed={visible} onClick={()=>setVisible(value=>!value)} style={{position:'absolute',right:8,top:'50%',transform:'translateY(-50%)',border:0,background:'transparent',padding:6,color:'#716b7b',lineHeight:0}}>
   {visible?<svg aria-hidden="true" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="m3 3 18 18M10.6 5.1A10.8 10.8 0 0 1 12 5c6.4 0 10 7 10 7a15 15 0 0 1-3.1 3.9M6.2 6.2C3.5 8 2 12 2 12s3.6 7 10 7c1.2 0 2.3-.3 3.3-.7"/><path d="M9.9 9.9a3 3 0 0 0 4.2 4.2"/></svg>:<svg aria-hidden="true" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12Z"/><circle cx="12" cy="12" r="3"/></svg>}
  </button>
 </span>;
}
