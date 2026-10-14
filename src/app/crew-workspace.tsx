'use client';
import {useCallback,useEffect,useState,type FormEvent} from 'react';
import {ChevronLeft,ChevronRight,Search} from 'lucide-react';
type Event={id:string;title:string;eventDate:string;status:string};
type Crew={id:string;name:string;role:string};
type Assignment={id:string;userId:string;userName:string;role:string;startAt:string;endAt:string};
const errorText=async(r:Response)=>{const x=await r.json().catch(()=>null);return typeof x?.error==='string'?x.error:'Permintaan gagal'};
export default function CrewWorkspace({canWrite}:{canWrite:boolean}){
 const [events,setEvents]=useState<Event[]>([]),[crew,setCrew]=useState<Crew[]>([]),[eventId,setEventId]=useState(''),[items,setItems]=useState<Assignment[]>([]);
 const [error,setError]=useState(''),[notice,setNotice]=useState(''),[saving,setSaving]=useState(false),[loading,setLoading]=useState(false);
 const [page,setPage]=useState(1),[hasMore,setHasMore]=useState(false),[query,setQuery]=useState(''),[appliedQuery,setAppliedQuery]=useState('');
 useEffect(()=>{const timer=setTimeout(()=>setAppliedQuery(query.trim()),250);return()=>clearTimeout(timer)},[query]);
 useEffect(()=>{void(async()=>{try{const r=await fetch('/api/events?limit=100',{cache:'no-store'});if(!r.ok)throw new Error(await errorText(r));const d=await r.json() as {items:Event[]};setEvents(d.items);setEventId(v=>v||d.items[0]?.id||'')}catch(e){setError(e instanceof Error?e.message:'Gagal memuat event')}})()},[]);
 useEffect(()=>{if(!canWrite)return;void(async()=>{try{const r=await fetch('/api/crew-directory',{cache:'no-store'});if(!r.ok)throw new Error(await errorText(r));const d=await r.json() as {items:Crew[]};setCrew(d.items)}catch(e){setError(e instanceof Error?e.message:'Gagal memuat kru')}})()},[canWrite]);
 const load=useCallback(async()=>{if(!eventId){setItems([]);setHasMore(false);return}setLoading(true);try{const params=new URLSearchParams({eventId,page:String(page),limit:'50'});if(appliedQuery)params.set('q',appliedQuery);const r=await fetch('/api/crew-assignments?'+params,{cache:'no-store'});if(!r.ok)throw new Error(await errorText(r));const d=await r.json() as {items:Assignment[];hasMore:boolean};setItems(d.items);setHasMore(d.hasMore)}catch(e){setError(e instanceof Error?e.message:'Gagal memuat jadwal')}finally{setLoading(false)}},[eventId,page,appliedQuery]);
 useEffect(()=>{setPage(1)},[eventId,appliedQuery]);
 useEffect(()=>{void load()},[load]);
 async function submit(e:FormEvent<HTMLFormElement>){e.preventDefault();setSaving(true);setError('');setNotice('');const form=e.currentTarget,d=new FormData(form);
  const start=String(d.get('startAt')||''),end=String(d.get('endAt')||'');
  if(!start||!end||new Date(start)>=new Date(end)){setError('Jam selesai harus setelah jam mulai.');setSaving(false);return}
  const payload={eventId,userId:String(d.get('userId')||''),role:String(d.get('role')||''),startAt:new Date(start).toISOString(),endAt:new Date(end).toISOString()};
  try{const r=await fetch('/api/crew-assignments',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(payload)});if(!r.ok)throw new Error(r.status===409?'Jadwal kru bentrok dengan event aktif atau penugasan tidak valid.':await errorText(r));setNotice('Penugasan kru tersimpan.');form.reset();await load()}catch(e){setError(e instanceof Error?e.message:'Penugasan gagal')}finally{setSaving(false)}
 }
 const selected=events.find(e=>e.id===eventId);
 return <section><div className="eo-title-row"><div><h1>Crew Scheduling</h1><p>Jadwal kru per event dengan pemeriksaan bentrok lintas event.</p></div></div>
 {error&&<p role="alert" className="eo-demo-note">{error}</p>}{notice&&<p role="status" className="eo-demo-note">{notice}</p>}
 <div className="eo-card"><label>Event Project <select aria-label="Pilih event" value={eventId} onChange={e=>{setEventId(e.target.value);setPage(1)}}><option value="">Pilih Event</option>{events.map(e=><option key={e.id} value={e.id}>{e.title} · {e.eventDate} · {e.status}</option>)}</select></label>
 {canWrite&&selected&&!['cancelled','completed'].includes(selected.status)&&<form className="eo-form" onSubmit={submit} style={{marginTop:16}}>
 <label>Kru / staf <select name="userId" required><option value="">Pilih kru</option>{crew.map(x=><option key={x.id} value={x.id}>{x.name} — {x.role}</option>)}</select></label>
 <label>Tugas saat Event <input name="role" required maxLength={100} placeholder="Contoh: Stage Manager"/></label>
 <label>Mulai <input name="startAt" type="datetime-local" required/></label>
 <label>Selesai <input name="endAt" type="datetime-local" required/></label>
 <button type="submit" className="eo-primary" disabled={saving||crew.length===0}>{saving?'Menyimpan...':'Assign Crew'}</button>
 </form>}
 <div className="eo-title-row" style={{marginTop:24}}><h2>Daftar Penugasan</h2><label className="eo-search"><Search size={16}/><input aria-label="Cari kru atau tugas" placeholder="Cari nama kru atau tugas..." value={query} onChange={e=>{setQuery(e.target.value);setPage(1)}}/></label></div>
 <div className="eo-table-scroll"><table><thead><tr><th>KRU</th><th>TUGAS</th><th>MULAI</th><th>SELESAI</th></tr></thead><tbody>{items.map(x=><tr key={x.id}><td>{x.userName||crew.find(c=>c.id===x.userId)?.name||x.userId}</td><td>{x.role}</td><td>{new Date(x.startAt).toLocaleString('id-ID')}</td><td>{new Date(x.endAt).toLocaleString('id-ID')}</td></tr>)}</tbody></table></div>
 {loading?<p className="eo-empty">Memuat jadwal...</p>:items.length===0?<p className="eo-empty">Belum ada penugasan untuk event ini.</p>:null}
 <div className="eo-pagination"><span>Halaman {page} · {items.length} penugasan</span><button aria-label="Halaman sebelumnya" disabled={page===1||loading} onClick={()=>setPage(p=>p-1)}><ChevronLeft size={16}/></button><button aria-label="Halaman berikutnya" disabled={!hasMore||loading} onClick={()=>setPage(p=>p+1)}><ChevronRight size={16}/></button></div>
 </div></section>
}
