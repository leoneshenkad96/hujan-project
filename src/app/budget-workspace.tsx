'use client';
import {useCallback,useEffect,useState,type FormEvent} from 'react';
import {Plus} from 'lucide-react';
type Event={id:string;title:string};
type Cost={id:string;description:string;amount:string;status:string};
type Order={id:string;number:string;description:string;amount:string;status:string};
type Summary={approvedBudget:string;actualSpent:string;openCommitments:string;remainingAfterActual:string;remainingAfterCommitmentsOnly:string};
const rupiah=(v:string)=>'Rp '+Number(v).toLocaleString('id-ID',{minimumFractionDigits:2,maximumFractionDigits:2});
export default function BudgetWorkspace({canWrite}:{canWrite:boolean}){
 const [events,setEvents]=useState<Event[]>([]),[eventId,setEventId]=useState(''),[summary,setSummary]=useState<Summary|null>(null);
 const [costs,setCosts]=useState<Cost[]>([]),[orders,setOrders]=useState<Order[]>([]);
 const [modal,setModal]=useState(false),[busy,setBusy]=useState(false),[error,setError]=useState(''),[notice,setNotice]=useState('');
 useEffect(()=>{void (async()=>{try{const r=await fetch('/api/events?limit=100',{cache:'no-store'});if(r.ok){const x=await r.json();setEvents(x.items);setEventId((v:string)=>v||x.items[0]?.id||'')}}catch{setError('Daftar event tidak tersedia')}})()},[]);
 const load=useCallback(async()=>{if(!eventId)return;setBusy(true);setError('');try{const r=await fetch('/api/budgets?eventId='+encodeURIComponent(eventId),{cache:'no-store'});if(!r.ok)throw new Error('Gagal mengambil anggaran');const x=await r.json();setSummary(x.summary);setCosts(x.costs);setOrders(x.purchaseOrders)}catch(e){setError(e instanceof Error?e.message:'Gagal memuat anggaran')}finally{setBusy(false)}},[eventId]);
 useEffect(()=>{void load()},[load]);
 async function addExpense(e:FormEvent<HTMLFormElement>){e.preventDefault();setError('');const form=new FormData(e.currentTarget);const payload={eventId,description:form.get('description'),amount:form.get('amount')};try{const r=await fetch('/api/budgets/expenses',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(payload)});if(!r.ok){const x=await r.json().catch(()=>({error:'Gagal menyimpan'}));throw new Error(x.error)}setModal(false);setNotice('Biaya aktual tersimpan.');await load()}catch(e){setError(e instanceof Error?e.message:'Gagal menyimpan biaya')}}
 return <section><div className="eo-title-row"><div><h1>Budget & RAB</h1><p>Anggaran, komitmen purchase order, dan pengeluaran aktual ditampilkan terpisah.</p></div>{canWrite&&eventId&&<button className="eo-primary" onClick={()=>setModal(true)}><Plus size={16}/> Catat Biaya Aktual</button>}</div>
 <div className="eo-filters"><label>Pilih event <select value={eventId} onChange={e=>setEventId(e.target.value)} aria-label="Pilih event">{events.length===0&&<option value="">Belum ada event</option>}{events.map(e=><option key={e.id} value={e.id}>{e.title}</option>)}</select></label></div>
 {error&&<p role="alert" className="eo-demo-note">{error}</p>}{notice&&<p role="status" className="eo-demo-note">{notice}</p>}
 {busy&&<p className="eo-empty">Memuat data keuangan...</p>}
 {summary&&<div className="eo-kpis">{[['RAB Disetujui',summary.approvedBudget],['Biaya Aktual',summary.actualSpent],['Komitmen PO Terbuka',summary.openCommitments],['Sisa RAB Setelah Aktual',summary.remainingAfterActual]].map(([label,v])=><div className="eo-card" key={label}><small>{label}</small><strong style={{fontSize:19}}>{rupiah(v)}</strong><span>Event budget</span></div>)}</div>}
 <div className="eo-demo-note" style={{marginBottom:16}}>Komitmen PO bukan biaya aktual. Angka tersebut tidak dijumlahkan karena belum ada rekonsiliasi PO terhadap biaya aktual. Sisa RAB dihitung dari RAB disetujui dikurangi pengeluaran aktual saja.</div>
 <div className="eo-two"><div className="eo-card"><div className="eo-card-title"><h2>Actual Expense Ledger</h2></div><div className="eo-table-scroll"><table><thead><tr><th>DESCRIPTION</th><th>AMOUNT</th><th>STATUS</th></tr></thead><tbody>{costs.map(c=><tr key={c.id}><td>{c.description}</td><td>{rupiah(c.amount)}</td><td>{c.status}</td></tr>)}</tbody></table></div>{costs.length===0&&<p className="eo-empty">Belum ada biaya aktual.</p>}</div>
 <div className="eo-card"><div className="eo-card-title"><h2>Purchase Order Commitments</h2></div><div className="eo-table-scroll"><table><thead><tr><th>PO</th><th>AMOUNT</th><th>STATUS</th></tr></thead><tbody>{orders.map(o=><tr key={o.id}><td><b>{o.description}</b><small>{o.number}</small></td><td>{rupiah(o.amount)}</td><td>{o.status}</td></tr>)}</tbody></table></div>{orders.length===0&&<p className="eo-empty">Belum ada PO.</p>}</div></div>
 {modal&&<div className="eo-modalback" onClick={e=>{if(e.target===e.currentTarget)setModal(false)}}><form className="eo-modal" onSubmit={addExpense}><header><h2>Catat Biaya Aktual</h2><button aria-label="Tutup" type="button" onClick={()=>setModal(false)}>×</button></header><p className="eo-demo-note">Biaya ini tercatat sebagai pengeluaran aktual, bukan settlement PO.</p><div className="eo-form"><label>Deskripsi<input name="description" required maxLength={240}/></label><label>Jumlah (Rp)<input name="amount" type="number" min="0.01" step="0.01" required/></label></div><footer><button type="button" className="eo-secondary" onClick={()=>setModal(false)}>Batal</button><button type="submit" className="eo-primary">Simpan</button></footer></form></div>}
 </section>;
}
