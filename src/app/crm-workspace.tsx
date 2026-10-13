'use client';
import {useCallback,useEffect,useState,type FormEvent} from 'react';
import {Search,Plus,ChevronLeft,ChevronRight} from 'lucide-react';

type Client={id:string;name:string;email:string|null;phone:string|null;createdAt:string};
type Lead={id:string;title:string;status:string;clientId:string|null;estimatedValue:string;createdAt:string};
type PageResult<T>={items:T[];page:number;limit:number;hasMore:boolean};
const statuses=['new','qualified','proposal','negotiation','won','lost'];
const money=(v:string)=>'Rp '+Number(v).toLocaleString('id-ID');
export default function CrmWorkspace({canWrite}:{canWrite:boolean}){
 const [tab,setTab]=useState<'clients'|'leads'>('clients');
 const [clients,setClients]=useState<Client[]>([]);
 const [leads,setLeads]=useState<Lead[]>([]);
 const [query,setQuery]=useState('');
 const [status,setStatus]=useState('');
 const [page,setPage]=useState(1);
 const [hasMore,setHasMore]=useState(false);
 const [busy,setBusy]=useState(false);
 const [saving,setSaving]=useState(false);
 const [error,setError]=useState('');
 const [notice,setNotice]=useState('');
 const [modal,setModal]=useState(false);
 const load=useCallback(async()=>{
  setBusy(true);setError('');
  const url=new URL('/api/crm/'+tab,window.location.origin);
  url.searchParams.set('page',String(page));url.searchParams.set('limit','10');
  if(query.trim())url.searchParams.set('q',query.trim());
  if(tab==='leads'&&status)url.searchParams.set('status',status);
  try{
   const r=await fetch(url.toString(),{cache:'no-store'});
   if(!r.ok)throw new Error(r.status===403?'Role tidak memiliki akses CRM.':'Gagal mengambil data CRM.');
   const data=await r.json() as PageResult<Client|Lead>;
   if(tab==='clients')setClients(data.items as Client[]);else setLeads(data.items as Lead[]);
   setHasMore(data.hasMore);
  }catch(e){setError(e instanceof Error?e.message:'Gagal memuat data.')}
  finally{setBusy(false)}
 },[tab,page,query,status]);
 useEffect(()=>{void load()},[load]);
 async function save(e:FormEvent<HTMLFormElement>){
  e.preventDefault();setSaving(true);setError('');
  const form=new FormData(e.currentTarget);
  const payload=tab==='clients'?{
   name:String(form.get('name')||''),email:String(form.get('email')||''),phone:String(form.get('phone')||'')
  }:{
   title:String(form.get('title')||''),status:String(form.get('status')||'new'),
   clientId:String(form.get('clientId')||'')||null,estimatedValue:String(form.get('estimatedValue')||'0')
  };
  try{
   const r=await fetch('/api/crm/'+tab,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(payload)});
   if(!r.ok){const problem=await r.json().catch(()=>({error:'Tidak dapat menyimpan.'}));throw new Error(problem.error||'Gagal menyimpan.')}
   setModal(false);setNotice(tab==='clients'?'Klien tersimpan.':'Lead tersimpan.');setPage(1);await load();
  }catch(e){setError(e instanceof Error?e.message:'Gagal menyimpan.')}
  finally{setSaving(false)}
 }
 return <section>
  <div className="eo-title-row"><div><h1>CRM & Sales Pipeline</h1><p>Klien dan prospek tersimpan di Neon sesuai organisasi akun.</p></div>
  {canWrite&&<button type="button" className="eo-primary" onClick={()=>{setModal(true);setError('')}}><Plus size={16}/> {tab==='clients'?'Add Client':'Add Lead'}</button>}</div>
  <div className="eo-card">
   <div className="eo-filters">
    <button type="button" className={tab==='clients'?'eo-primary':'eo-secondary'} onClick={()=>{setTab('clients');setPage(1);setQuery('')}}>Clients</button>
    <button type="button" className={tab==='leads'?'eo-primary':'eo-secondary'} onClick={()=>{setTab('leads');setPage(1);setQuery('')}}>Sales Leads</button>
    <label className="eo-search"><Search size={16}/><input aria-label="Search CRM" placeholder="Cari nama..." value={query} onChange={e=>{setQuery(e.target.value);setPage(1)}}/></label>
    {tab==='leads'&&<select aria-label="Lead status" value={status} onChange={e=>{setStatus(e.target.value);setPage(1)}}><option value="">Semua status</option>{statuses.map(s=><option key={s} value={s}>{s}</option>)}</select>}
   </div>
   {error&&<p role="alert" className="eo-demo-note">{error}</p>}
   {notice&&<p role="status" className="eo-demo-note">{notice}</p>}
   <div className="eo-table-scroll"><table><thead><tr>{(tab==='clients'?['CLIENT','EMAIL','PHONE']:['OPPORTUNITY','STATUS','ESTIMATED VALUE']).map(h=><th key={h}>{h}</th>)}</tr></thead><tbody>
   {tab==='clients'?clients.map(c=><tr key={c.id}><td><b>{c.name}</b></td><td>{c.email||'—'}</td><td>{c.phone||'—'}</td></tr>):leads.map(l=><tr key={l.id}><td><b>{l.title}</b></td><td><span className="eo-badge">{l.status}</span></td><td>{money(l.estimatedValue)}</td></tr>)}
   </tbody></table></div>
   {!busy&&(tab==='clients'?clients.length:leads.length)===0&&<p className="eo-empty">Belum ada data yang sesuai pencarian.</p>}
   {busy&&<p className="eo-empty">Memuat data...</p>}
   <div className="eo-pagination"><span>Page {page}</span><button aria-label="Previous page" disabled={page===1||busy} onClick={()=>setPage(p=>p-1)}><ChevronLeft size={16}/></button><button aria-label="Next page" disabled={!hasMore||busy} onClick={()=>setPage(p=>p+1)}><ChevronRight size={16}/></button></div>
  </div>
  {modal&&<div className="eo-modalback" onClick={e=>{if(e.target===e.currentTarget)setModal(false)}}><form onSubmit={save} className="eo-modal"><header><h2>{tab==='clients'?'Add Client':'Add Sales Lead'}</h2><button type="button" aria-label="Close" onClick={()=>setModal(false)}>×</button></header>
   <div className="eo-form">{tab==='clients'?<><label>Client name<input required name="name" maxLength={180}/></label><label>Email<input name="email" type="email" maxLength={254}/></label><label>Phone<input name="phone" maxLength={40}/></label></>:<><label>Opportunity<input required name="title" maxLength={180}/></label><label>Status<select name="status">{statuses.map(s=><option key={s}>{s}</option>)}</select></label><label>Estimated value (Rp)<input name="estimatedValue" type="number" min="0" step="0.01" required defaultValue="0"/></label><label>Related client ID (optional)<input name="clientId" placeholder="UUID"/></label></>}</div>
   <footer><button type="button" className="eo-secondary" onClick={()=>setModal(false)}>Cancel</button><button className="eo-primary" type="submit" disabled={saving}>{saving?'Saving...':'Save'}</button></footer>
  </form></div>}
 </section>;
}
