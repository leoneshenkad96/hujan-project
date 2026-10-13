'use client';
import {useCallback,useEffect,useState} from 'react';
type Item={id:string;title:string;status:string};
type Result={items:Item[];hasMore?:boolean};
async function problem(r:Response){const j=await r.json().catch(()=>null);return typeof j?.error==='string'?j.error:'Permintaan gagal'}
export default function EventClosing({eventId,status,canWrite,onUpdated}:{eventId:string;status:string;canWrite:boolean;onUpdated:()=>Promise<void>}){
 const [tasks,setTasks]=useState<Item[]>([]),[cues,setCues]=useState<Item[]>([]);
 const [loading,setLoading]=useState(true),[saving,setSaving]=useState(false),[error,setError]=useState(''),[notice,setNotice]=useState('');
 const refresh=useCallback(async()=>{
  setLoading(true);setError('');
  try{
   const eventQuery=encodeURIComponent(eventId);
   const loadTasks=async()=>{
    const all:Item[]=[];
    for(let page=1;page<=10000;page++){
     const response=await fetch('/api/tasks?eventId='+eventQuery+'&limit=100&page='+page,{cache:'no-store'});
     if(!response.ok)throw new Error(await problem(response));
     const data=await response.json() as Result;
     all.push(...data.items);
     if(!data.hasMore)return all;
    }
    throw new Error('Terlalu banyak halaman Task untuk diverifikasi.');
   };
   const [allTasks,c]=await Promise.all([loadTasks(),fetch('/api/rundown?eventId='+eventQuery,{cache:'no-store'})]);
   if(!c.ok)throw new Error(await problem(c));
   const cueData=await c.json() as Result;
   const taskData={items:allTasks};
   setTasks(taskData.items);setCues(cueData.items);
  }catch(e){setError(e instanceof Error?e.message:'Checklist tidak dapat dimuat')}finally{setLoading(false)}
 },[eventId]);
 useEffect(()=>{void refresh()},[refresh]);
 const pendingTasks=tasks.filter(x=>x.status!=='done'),pendingCues=cues.filter(x=>!['done','skipped'].includes(x.status));
 const ready=!loading&&!error&&pendingTasks.length===0&&pendingCues.length===0&&status==='live';
 async function complete(){if(!ready||!canWrite||!window.confirm('Tutup event sebagai Completed? Status ini tidak dapat dibuka kembali.'))return;
  setSaving(true);setError('');setNotice('');
  try{const response=await fetch('/api/events/'+eventId,{method:'PATCH',headers:{'Content-Type':'application/json'},body:JSON.stringify({status:'completed',progress:100})});
   if(!response.ok)throw new Error(await problem(response));setNotice('Event selesai dan ditutup.');await onUpdated();
  }catch(e){setError(e instanceof Error?e.message:'Gagal menutup event');await refresh()}finally{setSaving(false)}
 }
 return <section className="eo-card eo-closing" aria-label="Event closing checklist">
  <div className="eo-card-title"><div><h2>Event Closing Checklist</h2><p className="eo-help">Selesaikan aktivitas operasional sebelum Event dinyatakan Completed.</p></div><button className="eo-secondary" type="button" onClick={()=>void refresh()} disabled={loading||saving}>Refresh checklist</button></div>
  {error&&<p role="alert" className="eo-demo-note">{error}</p>}{notice&&<p role="status" className="eo-demo-note">{notice}</p>}
  {loading?<p className="eo-empty">Memeriksa Task dan Rundown...</p>:<div className="eo-closing-grid">
   <div className="eo-detail"><strong>Task</strong><p>{tasks.length-pendingTasks.length} / {tasks.length} selesai</p>{pendingTasks.length>0&&<ul className="eo-checklist">{pendingTasks.slice(0,8).map(x=><li key={x.id}>{x.title} <span>({x.status})</span></li>)}</ul>}{pendingTasks.length>8&&<small>+{pendingTasks.length-8} Task lainnya</small>}</div>
   <div className="eo-detail"><strong>Rundown</strong><p>{cues.length-pendingCues.length} / {cues.length} selesai / skipped</p>{pendingCues.length>0&&<ul className="eo-checklist">{pendingCues.slice(0,8).map(x=><li key={x.id}>{x.title} <span>({x.status})</span></li>)}</ul>}{pendingCues.length>8&&<small>+{pendingCues.length-8} segmen lainnya</small>}</div>
  </div>}
  <div className="eo-closing-actions"><p className="eo-help">{status==='completed'?'Event sudah Completed.':status==='cancelled'?'Event dibatalkan.':status!=='live'?'Event harus dalam tahap Live sebelum closing.':ready?'Seluruh pemeriksaan operasional terpenuhi.':'Closing terkunci sampai semua blocker selesai.'}</p>
   {canWrite&&<button type="button" className="eo-primary" disabled={!ready||saving} onClick={()=>void complete()}>{saving?'Menutup Event...':'Complete Event'}</button>}
  </div>
 </section>
}
