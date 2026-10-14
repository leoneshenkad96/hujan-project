'use client';
import {useCallback,useEffect,useState,type FormEvent} from 'react';
import {Plus,RefreshCw,Users,ShieldCheck} from 'lucide-react';
type User={id:string;name:string;email:string;role:string;active:boolean;createdAt:string};
const roles=['owner','admin','project_manager','sales','finance','production','crew'] as const;
const roleLabel=(role:string)=>role.replaceAll('_',' ').replace(/\b\w/g,x=>x.toUpperCase());
export default function UsersSettings({currentRole}:{currentRole:string}){
 const [items,setItems]=useState<User[]>([]),[loading,setLoading]=useState(true),[busy,setBusy]=useState(false),[error,setError]=useState(''),[notice,setNotice]=useState('');
 const [selected,setSelected]=useState<User|null>(null),[adding,setAdding]=useState(false),[query,setQuery]=useState('');
 const load=useCallback(async()=>{setLoading(true);setError('');try{const response=await fetch('/api/users',{cache:'no-store'});if(!response.ok)throw new Error(response.status===403?'Akses tidak diizinkan.':'Gagal mengambil daftar user.');const data=await response.json();setItems(data.items??[])}catch(e){setError(e instanceof Error?e.message:'Gagal memuat data')}finally{setLoading(false)}},[]);
 useEffect(()=>{void load()},[load]);
 const filtered=items.filter(u=>[u.name,u.email,u.role].some(v=>v.toLowerCase().includes(query.toLowerCase())));
 async function save(event:FormEvent<HTMLFormElement>){
  event.preventDefault();if(busy)return;setBusy(true);setError('');setNotice('');
  const fd=new FormData(event.currentTarget);const password=String(fd.get('password')||'');
  const base={name:String(fd.get('name')||'').trim(),role:String(fd.get('role')||'')};
  const body=selected?{...base,active:fd.get('active')==='true',...(password?{password}:{})}:{...base,email:String(fd.get('email')||'').trim(),password};
  try{
   const response=await fetch(selected?'/api/users/'+encodeURIComponent(selected.id):'/api/users',{method:selected?'PATCH':'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)});
   if(!response.ok){const data=await response.json().catch(()=>({}));throw new Error(response.status===409?'Email sudah terdaftar atau perubahan akun ditolak.':response.status===403?'Hak akses tidak cukup.':String(data.error||'Penyimpanan gagal'))}
   setSelected(null);setAdding(false);setNotice(selected?'Perubahan user tersimpan.':'User berhasil dibuat.');await load();
  }catch(e){setError(e instanceof Error?e.message:'Penyimpanan gagal')}finally{setBusy(false)}
 }
 const editing=adding||!!selected;
 return <section>
  <div className="eo-title-row"><div><h1>Users & Settings</h1><p>Kelola user dan hak akses untuk organisasi ini.</p></div><button className="eo-primary" onClick={()=>{setAdding(true);setSelected(null);setError('');setNotice('')}}><Plus size={16}/> Add User</button></div>
  {notice&&<p role="status" className="eo-users-success">{notice}</p>}{error&&<p role="alert" className="eo-users-error">{error}</p>}
  <div className="eo-card">
   <div className="eo-users-toolbar"><div className="eo-users-heading"><Users size={18}/><strong>Daftar User ({items.length})</strong></div><div className="eo-users-actions"><input aria-label="Cari user" placeholder="Cari nama, email, role..." value={query} onChange={e=>setQuery(e.target.value)}/><button type="button" className="eo-secondary" onClick={()=>void load()} disabled={loading}><RefreshCw size={14}/> Refresh</button></div></div>
   <div className="eo-table-scroll"><table><thead><tr><th>Nama</th><th>Email</th><th>Role</th><th>Status</th><th>Aksi</th></tr></thead><tbody>
   {filtered.map(u=><tr key={u.id}><td>{u.name}</td><td>{u.email}</td><td>{roleLabel(u.role)}</td><td><span className="eo-badge">{u.active?'Aktif':'Nonaktif'}</span></td><td><button className="eo-secondary" onClick={()=>{setSelected(u);setAdding(false);setError('');setNotice('')}}>Edit</button></td></tr>)}
   {!loading&&filtered.length===0&&<tr><td colSpan={5}>{items.length?'Tidak ada hasil pencarian.':'Belum ada user.'}</td></tr>}
   {loading&&<tr><td colSpan={5}>Memuat daftar user...</td></tr>}
   </tbody></table></div>
  </div>
  {editing&&<div className="eo-modalback" onClick={e=>{if(e.target===e.currentTarget&&!busy){setAdding(false);setSelected(null)}}}><form className="eo-modal" onSubmit={save}><header><h2>{selected?'Edit User':'Add User'}</h2><button disabled={busy} type="button" aria-label="Tutup" onClick={()=>{setAdding(false);setSelected(null)}}>×</button></header><div className="eo-form">
   <label>Nama<input name="name" required minLength={2} maxLength={150} defaultValue={selected?.name||''}/></label>
   <label>Email<input type="email" name="email" required disabled={!!selected} autoCapitalize="none" defaultValue={selected?.email||''}/></label>
   <label>Role<select name="role" defaultValue={selected?.role||'crew'}>{roles.filter(r=>r!=='owner'||currentRole==='owner'||selected?.role==='owner').map(r=><option value={r} key={r}>{roleLabel(r)}</option>)}</select></label>
   {selected&&<label>Status<select name="active" defaultValue={String(selected.active)}><option value="true">Aktif</option><option value="false">Nonaktif</option></select></label>}
   <label>{selected?'Password baru (opsional)':'Password sementara'}<input name="password" type="password" autoComplete="new-password" minLength={12} maxLength={256} required={!selected}/></label>
   <small><ShieldCheck size={13} style={{verticalAlign:'middle'}}/> Password minimal 12 karakter. Jangan membagikannya melalui chat atau dokumen publik. Mengubah password/role akan mencabut sesi lama.</small>
  </div><footer><button type="button" disabled={busy} className="eo-secondary" onClick={()=>{setAdding(false);setSelected(null)}}>Batal</button><button type="submit" disabled={busy} className="eo-primary">{busy?'Menyimpan...':'Simpan'}</button></footer></form></div>}
 </section>;
}
