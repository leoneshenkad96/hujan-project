'use client';
import { useState,type FormEvent } from 'react';
import Link from 'next/link';
import PasswordInput from '../password-input';
export default function OwnerSetup(){
 const [busy,setBusy]=useState(false),[message,setMessage]=useState(''),[done,setDone]=useState(false);
 async function submit(e:FormEvent<HTMLFormElement>){
  e.preventDefault();setBusy(true);setMessage('');
  const fields=new FormData(e.currentTarget);
  const password=String(fields.get('password')??''),confirm=String(fields.get('confirm')??'');
  if(password!==confirm){setMessage('Konfirmasi password tidak sama.');setBusy(false);return;}
  try {
   const res=await fetch('/api/uat/owner-setup',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({username:'leoneshenkad',setupCode:fields.get('setupCode'),password})});
   if(res.ok){setDone(true);e.currentTarget.reset();}
   else if(res.status===429)setMessage('Terlalu banyak percobaan. Coba lagi setelah 15 menit.');
   else if(res.status===409)setMessage('Akun Owner sudah diaktifkan atau tidak tersedia untuk setup ulang. Coba masuk lewat halaman Login.');
   else if(res.status===401)setMessage('Kode setup tidak cocok. Pastikan menggunakan kode UAT yang tepat, bukan password login.');
   else if(res.status===404)setMessage('Aktivasi Owner tidak diaktifkan pada deployment ini.');
   else if(res.status===503)setMessage('Layanan aktivasi atau koneksi database UAT belum tersedia. Hubungi administrator.');
   else if(res.status===403)setMessage('Permintaan ditolak oleh pengamanan alamat website. Buka halaman Preview secara langsung di Safari.');
   else setMessage('Aktivasi gagal. Silakan periksa input dan coba kembali.');
  }catch{setMessage('Gagal menghubungi server.')}finally{setBusy(false);}
 }
 const field={width:'100%',padding:13,border:'1px solid #e3dce6',borderRadius:10,fontSize:16,boxSizing:'border-box' as const};
 return <main style={{minHeight:'100vh',background:'#f7f3f7',display:'grid',placeItems:'center',padding:20}}>
  <section style={{maxWidth:420,width:'100%',background:'#fff',padding:26,borderRadius:18,boxShadow:'0 12px 32px #33142914'}}>
   <h1 style={{fontSize:23,marginBottom:8}}>Aktivasi Owner UAT</h1>
   {done?<><p>Password berhasil dibuat. Sekarang login menggunakan username <b>leoneshenkad</b>.</p><Link href="/login">Ke halaman Login</Link></>:
   <form onSubmit={submit} style={{display:'grid',gap:14}}>
    <p style={{fontSize:14,color:'#69606e',lineHeight:1.5}}>Khusus pengujian Vinca. Masukkan kode setup dari administrator dan buat password pribadi. Kode bukan password login.</p>
    <label>Username<input style={field} value="leoneshenkad" readOnly/></label>
    <label>Kode setup<PasswordInput style={field} required name="setupCode" autoComplete="off"/></label>
    <label>Password baru (minimal 12 karakter)<PasswordInput style={field} required name="password" minLength={12} maxLength={256} autoComplete="new-password"/></label>
    <label>Konfirmasi password<PasswordInput style={field} required name="confirm" minLength={12} autoComplete="new-password"/></label>
    {message&&<p role="alert" style={{color:'#a52650'}}>{message}</p>}
    <button type="submit" disabled={busy} style={{padding:14,border:0,borderRadius:10,background:'#c44c83',color:'white',fontWeight:700}}>{busy?'Memproses…':'Aktifkan Owner'}</button>
    <Link href="/login">Kembali ke Login</Link>
   </form>}
  </section>
 </main>
}
