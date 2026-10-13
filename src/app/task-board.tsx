'use client';
import {useCallback,useEffect,useState,type FormEvent} from 'react';
import {Plus,ChevronLeft,ChevronRight} from 'lucide-react';

type Task={id:string;eventId:string;title:string;ownerId:string|null;status:'todo'|'in_progress'|'done'|'blocked';dueDate:string|null};
type Event={id:string;title:string};
const STATES=['todo','in_progress','done','blocked'] as const;
const LABELS={todo:'To Do',in_progress:'In Progress',done:'Done',blocked:'Blocked'};
export default function TaskBoard({canWrite}:{canWrite:boolean}){
 const [tasks,setTasks]=useState<Task[]>([]),[events,setEvents]=useState<Event[]>([]);
 const [eventId,setEventId]=useState(''),[page,setPage]=useState(1),[hasMore,setHasMore]=useState(false);
 const [busy,setBusy]=useState(false),[saving,setSaving]=useState(false),[dialog,setDialog]=useState(false);
 const [error,setError]=useState(''),[notice,setNotice]=useState('');
 const load=useCallback(async()=>{
  setBusy(true);setError('');
  try{const q=new URLSearchParams({page:String(page),limit:'60'});if(eventId)q.set('eventId',eventId);
  const r=await fetch('/api/tasks?'+q,{cache:'no-store'});if(!r.ok)throw new Error('Gagal mengambil tugas.');
  const x=await r.json() as {items:Task[];hasMore:boolean};setTasks(x.items);setHasMore(x.hasMore);
  }catch(e){setError(e instanceof Error?e.message:'Gagal memuat tugas.')}finally{setBusy(false)}
 },[eventId,page]);
 useEffect(()=>{void load()},[load]);
 useEffect(()=>{void (async()=>{try{const r=await fetch('/api/events?limit=100',{cache:'no-store'});if(r.ok){const x=await r.json() as {items:Event[]};setEvents(x.items)}}catch{}})()},[]);
 async function update(task:Task,patch:Partial<Pick<Task,'status'|'dueDate'|'ownerId'|'title'>>){
  setError('');
  try{const r=await fetch('/api/tasks/'+task.id,{method:'PATCH',headers:{'Content-Type':'application/json'},body:JSON.stringify(patch)});
  if(!r.ok)throw new Error('Gagal memperbarui tugas.');
  const data=await r.json() as {task:Task};setTasks(old=>old.map(t=>t.id===task.id?data.task:t));
  setNotice('Perubahan tugas tersimpan.');
  }catch(e){setError(e instanceof Error?e.message:'Gagal memperbarui tugas.')}
 }
 async function create(e:FormEvent<HTMLFormElement>){
  e.preventDefault();setSaving(true);setError('');
  const form=new FormData(e.currentTarget);
  const body={eventId:String(form.get('eventId')||''),title:String(form.get('title')||''),dueDate:String(form.get('dueDate')||'')||null};
  try{const r=await fetch('/api/tasks',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)});
   if(!r.ok){const x=await r.json().catch(()=>({error:'Gagal membuat tugas.'}));throw new Error(x.error||'Gagal membuat tugas.')}
   setDialog(false);setNotice('Tugas dibuat.');setPage(1);await load();
  }catch(e){setError(e instanceof Error?e.message:'Gagal membuat tugas.')}finally{setSaving(false)}
 }
 return <section>
  <div className="eo-title-row"><div><h1>Tasks & Timeline</h1><p>Kanban tugas event dengan status dan deadline yang disimpan di Neon.</p></div>
  {canWrite&&<button className="eo-primary" onClick={()=>setDialog(true)}><Plus size={16}/> Add Task</button>}</div>
  {error&&<p role="alert" className="eo-demo-note">{error}</p>}{notice&&<p role="status" className="eo-demo-note">{notice}</p>}
  <div className="eo-filters" style={{marginBottom:16}}><select aria-label="Filter event" value={eventId} onChange={e=>{setEventId(e.target.value);setPage(1)}}><option value="">Semua Event</option>{events.map(e=><option key={e.id} value={e.id}>{e.title}</option>)}</select></div>
  <div className="eo-kanban">{STATES.map(status=><section key={status}><h2>{LABELS[status]} <span className="eo-badge">{tasks.filter(t=>t.status===status).length}</span></h2>
   {tasks.filter(t=>t.status===status).map(t=><div className="eo-card" key={t.id}><b>{t.title}</b><small>{events.find(e=>e.id===t.eventId)?.title||'Event'}</small><small>Deadline: {t.dueDate||'Belum ditentukan'}</small>
   {canWrite&&<><label style={{display:'grid',gap:5,fontSize:11}}>Status<select aria-label={'Status '+t.title} value={t.status} onChange={e=>void update(t,{status:e.target.value as Task['status']})}>{STATES.map(s=><option key={s} value={s}>{LABELS[s]}</option>)}</select></label><label style={{display:'grid',gap:5,fontSize:11,marginTop:10}}>Deadline<input aria-label={'Deadline '+t.title} type="date" value={t.dueDate||''} onChange={e=>void update(t,{dueDate:e.target.value||null})}/></label></>}
   </div>)}
  </section>)}</div>
  {busy&&<p className="eo-empty">Memuat tugas...</p>}
  {!busy&&tasks.length===0&&<p className="eo-empty">Belum ada tugas yang cocok.</p>}
  <div className="eo-pagination"><span>Halaman {page} · {tasks.length} tugas tampil</span><button aria-label="Previous page" disabled={page===1||busy} onClick={()=>setPage(p=>p-1)}><ChevronLeft size={16}/></button><button aria-label="Next page" disabled={!hasMore||busy} onClick={()=>setPage(p=>p+1)}><ChevronRight size={16}/></button></div>
  {dialog&&<div className="eo-modalback" onClick={e=>{if(e.target===e.currentTarget)setDialog(false)}}><form className="eo-modal" onSubmit={create}><header><h2>Tambah Tugas Event</h2><button aria-label="Tutup" type="button" onClick={()=>setDialog(false)}>×</button></header>
   <div className="eo-form"><label>Event<select name="eventId" required>{events.length===0&&<option value="">Buat event dulu</option>}{events.map(e=><option value={e.id} key={e.id}>{e.title}</option>)}</select></label><label>Nama Tugas<input name="title" maxLength={240} required/></label><label>Deadline<input name="dueDate" type="date"/></label></div>
   <footer><button className="eo-secondary" type="button" onClick={()=>setDialog(false)}>Batal</button><button className="eo-primary" disabled={saving||events.length===0} type="submit">{saving?'Menyimpan...':'Simpan Tugas'}</button></footer></form></div>}
 </section>;
}
