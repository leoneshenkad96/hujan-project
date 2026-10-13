'use client';
import { useState,type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
export default function Login(){
 const router=useRouter();const [busy,setBusy]=useState(false);const [error,setError]=useState('');
 async function submit(e:FormEvent<HTMLFormElement>){
 e.preventDefault();setBusy(true);setError('');
 const fd=new FormData(e.currentTarget);
 try{const res=await fetch('/api/auth/login',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({email:fd.get('email'),password:fd.get('password')})});
 if(!res.ok){setError('Login gagal. Periksa email dan password atau hubungi administrator.');return}
 router.push('/');router.refresh();
 }catch{setError('Tidak dapat menghubungi server.')}finally{setBusy(false)}
 }
 const field={display:'block',width:'100%',padding:12,marginTop:6,border:'1px solid #ded9e2',borderRadius:10,boxSizing:'border-box' as const};
 return <main style={{minHeight:'100vh',display:'grid',placeItems:'center',padding:20,background:'#f6f4f8'}}><form onSubmit={submit} style={{width:'min(100%,390px)',padding:28,borderRadius:16,background:'white',boxShadow:'0 12px 35px #30223818',display:'grid',gap:16}}>
 <h1 style={{margin:0,fontSize:26}}>Vinca ERP</h1><p style={{margin:0,color:'#7d7788'}}>Masuk ke workspace Event Organizer</p>
 <label htmlFor="login-email">Email<input id="login-email" required name="email" type="email" autoComplete="username" autoCapitalize="none" autoCorrect="off" style={field}/></label>
 <label htmlFor="login-password">Password<input id="login-password" required name="password" type="password" autoComplete="current-password" style={field}/></label>
 {error&&<p role="alert" style={{color:'#b42355'}}>{error}</p>}
 <button disabled={busy} type="submit" style={{background:'#d64d89',color:'white',border:0,padding:13,borderRadius:9,fontWeight:700,cursor:'pointer'}}>{busy?'Memproses...':'Masuk'}</button>
 <small style={{color:'#8c8798'}}>Akun dikelola oleh administrator. Hubungi administrator untuk akses.</small></form></main>;
}
