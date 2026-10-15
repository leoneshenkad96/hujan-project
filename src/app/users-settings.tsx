'use client';
import {useCallback,useEffect,useState,type FormEvent} from 'react';
import {ChevronLeft,ChevronRight,Plus,RefreshCw,Search,ShieldCheck,Users} from 'lucide-react';
import PasswordInput from './password-input';
type User={id:string;username:string;name:string;email:string;role:string;active:boolean;createdAt:string;eventId:string|null;eventTitle:string|null};
type EventOption={id:string;title:string;eventDate:string;status:string};
const roles=['owner','admin','project_manager','sales','finance','production','crew','client_viewer'] as const;
const roleLabel=(role:string)=>role==='client_viewer'?'Client (View-only)':role.replaceAll('_',' ').replace(/\b\w/g,x=>x.toUpperCase());
export default function UsersSettings({currentRole}:{currentRole:string}){
 const [items,setItems]=useState<User[]>([]),[loading,setLoading]=useState(true),[busy,setBusy]=useState(false),[error,setError]=useState(''),[notice,setNotice]=useState('');
 const [selected,setSelected]=useState<User|null>(null),[adding,setAdding]=useState(false),[query,setQuery]=useState(''),[appliedQuery,setAppliedQuery]=useState('');
 const [page,setPage]=useState(1),[hasMore,setHasMore]=useState(false),[roleFilter,setRoleFilter]=useState('');
 const [formRole,setFormRole]=useState<string>('crew'),[formEventId,setFormEventId]=useState(''),[eventQuery,setEventQuery]=useState(''),[eventOptions,setEventOptions]=useState<EventOption[]>([]);
 useEffect(()=>{const timer=setTimeout(()=>setAppliedQuery(query.trim()),250);return()=>clearTimeout(timer)},[query]);
 const load=useCallback(async()=>{setLoading(true);setError('');try{const params=new URLSearchParams({page:String(page),limit:'25'});if(appliedQuery)params.set('q',appliedQuery);if(roleFilter)params.set('role',roleFilter);const response=await fetch('/api/users?'+params,{cache:'no-store'});if(!response.ok)throw new Error(response.status===403?'Akses tidak diizinkan.':'Gagal mengambil daftar user.');const data=await response.json() as {items:User[];hasMore:boolean};setItems(data.items??[]);setHasMore(data.hasMore)}catch(e){setError(e instanceof Error?e.message:'Gagal memuat data')}finally{setLoading(false)}},[page,appliedQuery,roleFilter]);
 useEffect(()=>{void load()},[load]);
 const editing=adding||!!selected;
 useEffect(()=>{
  if(!editing||formRole!=='client_viewer')return;
  const timer=setTimeout(()=>{void(async()=>{try{const params=new URLSearchParams({page:'1',limit:'100'});if(eventQuery.trim())params.set('q',eventQuery.trim());const response=await fetch('/api/events?'+params,{cache:'no-store'});if(response.ok){const data=await response.json() as {items:EventOption[]};let options=data.items;if(selected?.eventId&&selected.eventTitle&&!options.some(x=>x.id===selected.eventId))options=[{id:selected.eventId,title:selected.eventTitle,eventDate:'',status:''},...options];setEventOptions(options)}}catch{setEventOptions([])}})()},250);
  return()=>clearTimeout(timer);
 },[editing,formRole,eventQuery,selected]);
 function openAdd(){setSelected(null);setAdding(true);setFormRole('crew');setFormEventId('');setEventQuery('');setError('');setNotice('')}
 function openEdit(user:User){setSelected(user);setAdding(false);setFormRole(user.role);setFormEventId(user.eventId||'');setEventQuery('');setError('');setNotice('')}
 async function save(event:FormEvent<HTMLFormElement>){
  event.preventDefault();if(busy)return;setBusy(true);setError('');setNotice('');
  const fd=new FormData(event.currentTarget),password=String(fd.get('password')||'');
  const base={name:String(fd.get('name')||'').trim(),role:formRole,...(formRole==='client_viewer'?{eventId:String(fd.get('eventId')||'')}: {})};
  const body=selected?{...base,active:fd.get('active')==='true',...(password?{password}:{})}:{...base,username:String(fd.get('username')||'').trim().toLowerCase(),email:String(fd.get('email')||'').trim(),password};
  try{
   const response=await fetch(selected?'/api/users/'+encodeURIComponent(selected.id):'/api/users',{method:selected?'PATCH':'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)});
   if(!response.ok){const data=await response.json().catch(()=>({}));throw new Error(response.status===409?'Email/username sudah terdaftar atau perubahan akun ditolak.':response.status===403?'Hak akses tidak cukup.':String(data.error||'Penyimpanan gagal'))}
   setSelected(null);setAdding(false);setNotice(selected?'Perubahan user tersimpan.':'User berhasil dibuat.');setPage(1);await load();
  }catch(e){setError(e instanceof Error?e.message:'Penyimpanan gagal')}finally{setBusy(false)}
 }
 return <section>
  <div className="eo-title-row"><div><h1>Users & Settings</h1><p>Kelola user dan hak akses untuk organisasi ini.</p></div><button className="eo-primary" onClick={openAdd}><Plus size={16}/> Add User</button></div>
  {notice&&<p role="status" className="eo-users-success">{notice}</p>}{error&&<p role="alert" className="eo-users-error">{error}</p>}
  <div className="eo-card">
   <div className="eo-users-toolbar"><div className="eo-users-heading"><Users size={18}/><strong>Daftar User</strong></div><div className="eo-users-actions"><label className="eo-search"><Search size={16}/><input aria-label="Cari user" placeholder="Cari nama, username, atau email..." value={query} onChange={e=>{setQuery(e.target.value);setPage(1)}}/></label><select aria-label="Filter role user" value={roleFilter} onChange={e=>{setRoleFilter(e.target.value);setPage(1)}}><option value="">Semua role</option>{roles.map(role=><option value={role} key={role}>{roleLabel(role)}</option>)}</select><button type="button" className="eo-secondary" onClick={()=>void load()} disabled={loading}><RefreshCw size={14}/> Refresh</button></div></div>
   <div className="eo-table-scroll"><table><thead><tr><th>Nama</th><th>Username</th><th>Email</th><th>Role</th><th>Event klien</th><th>Status</th><th>Aksi</th></tr></thead><tbody>
   {items.map(u=><tr key={u.id}><td>{u.name}</td><td>{u.username}</td><td>{u.email}</td><td>{roleLabel(u.role)}</td><td>{u.role==='client_viewer'?(u.eventTitle||'Event tidak tersedia'):'—'}</td><td><span className="eo-badge">{u.active?'Aktif':'Nonaktif'}</span></td><td><button className="eo-secondary" onClick={()=>openEdit(u)}>Edit</button></td></tr>)}
   {!loading&&items.length===0&&<tr><td colSpan={7}>Tidak ada user yang cocok.</td></tr>}
   {loading&&<tr><td colSpan={7}>Memuat daftar user...</td></tr>}
   </tbody></table></div>
   <div className="eo-pagination"><span>Halaman {page} · {items.length} user</span><button aria-label="Halaman sebelumnya" disabled={page===1||loading} onClick={()=>setPage(p=>p-1)}><ChevronLeft size={16}/></button><button aria-label="Halaman berikutnya" disabled={!hasMore||loading} onClick={()=>setPage(p=>p+1)}><ChevronRight size={16}/></button></div>
  </div>
  {editing&&<div className="eo-modalback" onClick={e=>{if(e.target===e.currentTarget&&!busy){setAdding(false);setSelected(null)}}}><form className="eo-modal" onSubmit={save}><header><h2>{selected?'Edit User':'Add User'}</h2><button disabled={busy} type="button" aria-label="Tutup" onClick={()=>{setAdding(false);setSelected(null)}}>×</button></header><div className="eo-form">
   <label>Nama<input name="name" required minLength={2} maxLength={150} defaultValue={selected?.name||''}/></label>
   {!selected&&<><label>Username<input name="username" required minLength={3} maxLength={64} pattern="[a-z0-9._-]{3,64}" autoCapitalize="none" autoCorrect="off"/></label><label>Email<input type="email" name="email" required autoCapitalize="none"/></label></>}
   {selected&&<label>Username<input value={selected.username} readOnly aria-readonly="true"/></label>}
   <label>Role<select name="role" value={formRole} onChange={e=>{setFormRole(e.target.value);if(e.target.value!=='client_viewer')setFormEventId('')}}>{roles.filter(r=>r!=='owner'||currentRole==='owner'||selected?.role==='owner').map(r=><option value={r} key={r}>{roleLabel(r)}</option>)}</select></label>
   {formRole==='client_viewer'&&<><label>Cari event<input aria-label="Cari event untuk akun klien" placeholder="Cari nama atau kode event..." value={eventQuery} onChange={e=>setEventQuery(e.target.value)}/></label><label>Event yang boleh dipantau<select name="eventId" required value={formEventId} onChange={e=>setFormEventId(e.target.value)}><option value="">Pilih event</option>{eventOptions.map(item=><option value={item.id} key={item.id}>{item.title}{item.eventDate?' · '+item.eventDate:''}</option>)}</select></label><small>Akun ini hanya dapat melihat progres event yang dipilih. Informasi keuangan dan data internal tidak dibuka.</small></>}
   {selected&&<label>Status<select name="active" defaultValue={String(selected.active)}><option value="true">Aktif</option><option value="false">Nonaktif</option></select></label>}
   <label>{selected?'Password baru (opsional)':'Password sementara'}<PasswordInput name="password" autoComplete="new-password" minLength={12} maxLength={256} required={!selected}/></label>
   <small><ShieldCheck size={13} style={{verticalAlign:'middle'}}/> Password minimal 12 karakter. Jangan membagikannya melalui chat atau dokumen publik. Mengubah password/role akan mencabut sesi lama.</small>
  </div><footer><button type="button" disabled={busy} className="eo-secondary" onClick={()=>{setAdding(false);setSelected(null)}}>Batal</button><button type="submit" disabled={busy} className="eo-primary">{busy?'Menyimpan...':'Simpan'}</button></footer></form></div>}
 </section>;
}
