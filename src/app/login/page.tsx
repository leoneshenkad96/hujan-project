'use client';
import { useState,type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
export default function Login(){
 const router=useRouter();const [busy,setBusy]=useState(false);const [error,setError]=useState('');
 async function submit(e:FormEvent<HTMLFormElement>){
 e.preventDefault();setBusy(true);setError('');
 const fd=new FormData(e.currentTarget);
 try{const res=await fetch('/api/auth/login',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({organization:fd.get('organization'),email:fd.get('email'),password:fd.get('password')})});
 if(!res.ok){setError('Login gagal. Periksa organisasi, email, dan password.');return}
 router.push('/');router.refresh();
 }catch{setError('Tidak dapat menghubungi server.')}finally{setBusy(false)}
 }
 return <main style={{minHeight:'100vh',display:'grid',placeItems:'center',padding:20,background:'#f6f4f8'}}><form onSubmit={submit} style={{width:'min(100%,390px)',padding:28,borderRadius:16,background:'white',boxShadow:'0 12px 35px #30223818',display:'grid',gap:14}}>
 <h1 style={{margin:0,fontSize:25}}>Vinca ERP</h1><p style={{margin:0,color:'#7d7788'}}>Masuk ke workspace Event Organizer</p>
 <label>Organisasi<input aria-label="Organisasi" required name="organization" autoComplete="organization" placeholder="vinca" style={{display:'block',width:'100%',padding:11,marginTop:6}}/></label>
 <label>Email<input aria-label="Email" required name="email" type="email" autoComplete="username" style={{display:'block',width:'100%',padding:11,marginTop:6}}/></label>
 <label>Password<input aria-label="Password" required name="password" type="password" autoComplete="current-password" style={{display:'block',width:'100%',padding:11,marginTop:6}}/></label>
 {error&&<p role="alert" style={{color:'#b42355'}}>{error}</p>}
 <button disabled={busy} type="submit" style={{background:'#d64d89',color:'white',border:0,padding:13,borderRadius:9,fontWeight:700}}>{busy?'Memproses...':'Login'}</button>
 <small style={{color:'#8c8798'}}>Tidak ada akun demo default. Akun pertama harus dibuat secara aman oleh administrator.</small></form></main>
}
