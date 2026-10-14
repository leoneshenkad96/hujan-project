'use client';
import { useState,type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import PasswordInput from '../password-input';
export default function Login(){
 const router=useRouter();const [busy,setBusy]=useState(false);const [error,setError]=useState('');
 async function submit(e:FormEvent<HTMLFormElement>){
 e.preventDefault();setBusy(true);setError('');
 const fd=new FormData(e.currentTarget);
 try{const res=await fetch('/api/auth/login',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({username:fd.get('username'),password:fd.get('password')})});
 if(!res.ok){
  if(res.status===429){const retry=Number(res.headers.get('Retry-After'));const minutes=Number.isFinite(retry)&&retry>0?Math.ceil(retry/60):null;setError(minutes?`Terlalu banyak percobaan login. Coba lagi setelah sekitar ${minutes} menit.`:'Terlalu banyak percobaan login. Coba lagi nanti.');return}
  if(res.status===503){setError('Layanan login sedang tidak tersedia. Coba kembali nanti.');return}
  setError('Login gagal. Periksa username dan password atau hubungi administrator.');return
 }
 router.push('/');router.refresh();
 }catch{setError('Tidak dapat menghubungi server.')}finally{setBusy(false)}
 }
 const field={display:'block',width:'100%',padding:12,marginTop:6,border:'1px solid #ded9e2',borderRadius:10,boxSizing:'border-box' as const};
 return <main style={{minHeight:'100vh',display:'grid',placeItems:'center',padding:20,background:'#f6f4f8'}}><form onSubmit={submit} style={{width:'min(100%,390px)',padding:28,borderRadius:16,background:'white',boxShadow:'0 12px 35px #30223818',display:'grid',gap:16}}>
 <h1 style={{margin:0,fontSize:26}}>Vinca ERP</h1><p style={{margin:0,color:'#7d7788'}}>Masuk ke workspace Event Organizer</p>
 <label htmlFor="login-username">Username<input id="login-username" required name="username" type="text" autoComplete="username" autoCapitalize="none" autoCorrect="off" style={field}/></label>
 <label htmlFor="login-password">Password<PasswordInput id="login-password" required name="password" autoComplete="current-password" style={field}/></label>
 {error&&<p role="alert" style={{color:'#b42355'}}>{error}</p>}
 <button disabled={busy} type="submit" style={{background:'#d64d89',color:'white',border:0,padding:13,borderRadius:9,fontWeight:700,cursor:busy?'not-allowed':'pointer',opacity:busy?.6:1}}>{busy?'Memproses...':'Masuk'}</button>
 <small style={{color:'#8c8798'}}>Akun dikelola oleh administrator. Hubungi administrator untuk akses.</small></form></main>;
}
