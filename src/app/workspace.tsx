'use client';

import { useMemo, useState } from 'react';
import { LayoutDashboard, CalendarDays, Users, ListTodo, Wallet, Truck, Clapperboard, FileText, Settings, Menu, X, Search, ChevronLeft, ChevronRight, Plus, Bell, RotateCcw } from 'lucide-react';
import './workspace.css';
import { can } from '@/lib/permissions';
import CrmWorkspace from './crm-workspace';
import EventProjects from './event-projects';
import TaskBoard from './task-board';
import Procurement from './procurement';
import BudgetWorkspace from './budget-workspace';
import RundownWorkspace from './rundown-workspace';
import SalesDocuments from './sales-documents';
import InvoicesWorkspace from './invoices-workspace';
import ProfitabilityWorkspace from './profitability-workspace';

type EventStatus = 'Planning'|'Confirmed'|'Pre-Production'|'Live'|'Completed';
type Evt = {id:number;code:string;name:string;client:string;type:string;date:string;venue:string;pm:string;status:EventStatus;progress:number;value:number;budget:number};
type Task = {id:number;eventId:number;name:string;owner:string;status:'To Do'|'In Progress'|'Done';due:string};
type Cost = {id:number;eventId:number;name:string;vendor:string;amount:number;status:'Committed'|'Actual'};
type Invoice = {id:number;eventId:number;amount:number;paid:number};
const initialEvents:Evt[]=[
{id:1,code:'EVT-2026-001',name:'Annual Corporate Gathering',client:'PT Nusantara Teknologi',type:'Corporate',date:'2026-11-20',venue:'Grand Ballroom Jakarta',pm:'Andi Pratama',status:'Pre-Production',progress:68,value:150000000,budget:105000000},
{id:2,code:'EVT-2026-002',name:'Dream Wedding Celebration',client:'Anisa & Reza',type:'Wedding',date:'2026-11-28',venue:'The Glasshouse',pm:'Nadia Putri',status:'Planning',progress:35,value:85000000,budget:60000000},
{id:3,code:'EVT-2026-003',name:'Indonesia Creative Summit',client:'Creative Indonesia',type:'Conference',date:'2026-12-05',venue:'JCC Jakarta',pm:'Andi Pratama',status:'Confirmed',progress:24,value:200000000,budget:150000000},
{id:4,code:'EVT-2026-004',name:'Soundwave Music Festival',client:'Soundwave Indonesia',type:'Concert',date:'2026-12-19',venue:'Senayan',pm:'Rizky Wijaya',status:'Planning',progress:14,value:350000000,budget:260000000},
{id:5,code:'EVT-2026-005',name:'Beauty Brand Launch',client:'PT Aurora Kosmetik',type:'Launching',date:'2026-10-08',venue:'SCBD Jakarta',pm:'Nadia Putri',status:'Completed',progress:100,value:120000000,budget:85000000}
];
const initialTasks:Task[]=[{id:1,eventId:1,name:'Finalisasi layout venue',owner:'Andi',due:'2026-11-05',status:'In Progress'},{id:2,eventId:1,name:'Konfirmasi vendor sound',owner:'Nadia',due:'2026-11-07',status:'To Do'},{id:3,eventId:2,name:'Meeting keluarga',owner:'Nadia',due:'2026-11-02',status:'To Do'},{id:4,eventId:3,name:'Finalisasi speaker',owner:'Rizky',due:'2026-11-25',status:'Done'}];
const initialCosts:Cost[]=[{id:1,eventId:1,name:'Venue',vendor:'Grand Ballroom',amount:30000000,status:'Actual'},{id:2,eventId:1,name:'Sound & Lighting',vendor:'Pro Audio',amount:20000000,status:'Committed'},{id:3,eventId:1,name:'Catering',vendor:'Delight Catering',amount:25000000,status:'Committed'},{id:4,eventId:2,name:'Decoration',vendor:'Bright Stage',amount:32000000,status:'Committed'}];
const initialInvoices:Invoice[]=[{id:1,eventId:1,amount:75000000,paid:45000000},{id:2,eventId:2,amount:42500000,paid:20000000},{id:3,eventId:3,amount:100000000,paid:60000000}];
const nav=[{group:'WORKSPACE',items:[['dashboard','Dashboard',LayoutDashboard],['events','Event Projects',CalendarDays],['crm','CRM & Clients',Users],['sales','Quotations & Contracts',FileText],['tasks','Tasks & Timeline',ListTodo]]},{group:'OPERATIONS',items:[['budget','Budget & RAB',Wallet],['vendors','Vendor & PO',Truck],['rundown','Rundown & Show',Clapperboard]]},{group:'FINANCIAL',items:[['finance','Finance & Invoices',FileText],['profitability','Profitability',Wallet]]},{group:'SYSTEM',items:[['settings','Users & Settings',Settings]]}] as const;
const money=(v:number)=>'Rp '+Math.round(v).toLocaleString('id-ID');
const sampleVendors=[['Pro Audio Indonesia','Sound System'],['Bright Stage Production','Stage & Lighting'],['Delight Catering','Catering'],['Frame Studio','Documentation']];
const segments=[['07:00','Load In & Setup','Production'],['09:00','Sound Check','Stage Manager'],['11:00','Full Rehearsal','Show Director'],['13:00','Guest Registration','FOH'],['14:00','Opening Ceremony','MC'],['15:00','Entertainment','Talent Coordinator']];
const statuses:EventStatus[]=['Planning','Confirmed','Pre-Production','Live','Completed'];
function Badge({children}:{children:React.ReactNode}){return <span className="eo-badge">{children}</span>}
function Card({title,children,action}:{title?:string;children:React.ReactNode;action?:React.ReactNode}){return <section className="eo-card">{title&&<div className="eo-card-title"><h2>{title}</h2>{action}</div>}{children}</section>}
function Progress({value}:{value:number}){return <div className="eo-progress" aria-label={value+' percent'}><span style={{width:Math.max(0,Math.min(100,value))+'%'}} /></div>}
function Table({heads,children}:{heads:string[];children:React.ReactNode}){return <div className="eo-table-scroll"><table><thead><tr>{heads.map(x=><th key={x}>{x}</th>)}</tr></thead><tbody>{children}</tbody></table></div>}
type Page='dashboard'|'events'|'crm'|'sales'|'profitability'|'tasks'|'budget'|'vendors'|'rundown'|'finance'|'settings';
export default function Workspace({role}:{role:string}){
 const [page,setPage]=useState<Page>(can(role,'dashboard:read')?'dashboard':'events');const [open,setOpen]=useState(false);
 const [events,setEvents]=useState(initialEvents);const [tasks,setTasks]=useState(initialTasks);const [costs,setCosts]=useState(initialCosts);const [invoices,setInvoices]=useState(initialInvoices);
 const visible=(id:string)=>({dashboard:can(role,'dashboard:read'),events:can(role,'events:read'),crm:can(role,'clients:read'),sales:can(role,'clients:read'),tasks:can(role,'events:read'),budget:can(role,'finance:read'),vendors:can(role,'vendors:read'),rundown:can(role,'events:read'),finance:can(role,'finance:read'),profitability:can(role,'finance:read'),settings:can(role,'users:manage')} as Record<string,boolean>)[id]??false;
 const [selected,setSelected]=useState<number|null>(null);const [search,setSearch]=useState('');const [statusFilter,setStatusFilter]=useState('all');const [pageNo,setPageNo]=useState(1);const [modal,setModal]=useState<'event'|'task'|'cost'|'invoice'|null>(null);
 const [notice,setNotice]=useState('');const [runState,setRunState]=useState<string[]>(segments.map(()=>'Planned'));
 async function logout(){try{const r=await fetch('/api/auth/logout',{method:'POST'});if(r.ok){window.location.assign('/login');return}setNotice('Logout gagal. Coba kembali.')}catch{setNotice('Koneksi terputus saat logout.')}}
 const active=events.find(e=>e.id===selected);const contract=events.reduce((n,e)=>n+e.value,0);const planned=events.reduce((n,e)=>n+e.value-e.budget,0);const outstanding=invoices.reduce((n,i)=>n+i.amount-i.paid,0);
 const filtered=useMemo(()=>events.filter(e=>(statusFilter==='all'||e.status===statusFilter)&&[e.name,e.client,e.code].join(' ').toLowerCase().includes(search.toLowerCase())),[events,statusFilter,search]);
 const shown=filtered.slice((pageNo-1)*5,pageNo*5);
 const selectPage=(p:Page)=>{if(!visible(p))return;setPage(p);setOpen(false);setSelected(null);setPageNo(1)};
 function save(form:FormData){
  const required=modal==='event'?'events:write':modal==='task'?'tasks:write':modal==='cost'||modal==='invoice'?'finance:write':null;
  if(required&&!can(role,required)){setNotice('Hak akses tidak cukup untuk aksi tersebut.');setModal(null);return}
  const val=(k:string)=>String(form.get(k)||'').trim();const num=(k:string)=>Number(val(k));
  if(modal==='event'){const id=Math.max(0,...events.map(e=>e.id))+1;setEvents(old=>[{id,code:'EVT-2026-'+String(id).padStart(3,'0'),name:val('name'),client:val('client'),date:val('date'),type:val('type'),venue:val('venue'),pm:val('pm'),value:num('value'),budget:num('budget'),progress:0,status:'Planning'},...old]);setPage('events');setStatusFilter('all');setSearch('');setPageNo(1)}
  if(modal==='task')setTasks(old=>[...old,{id:Date.now(),eventId:num('eventId'),name:val('name'),owner:val('owner'),due:val('due'),status:'To Do'}]);
  if(modal==='cost')setCosts(old=>[...old,{id:Date.now(),eventId:num('eventId'),name:val('name'),vendor:val('vendor'),amount:num('amount'),status:'Committed'}]);
  if(modal==='invoice')setInvoices(old=>[...old,{id:Date.now(),eventId:num('eventId'),amount:num('amount'),paid:0}]);
  setModal(null);setNotice('Data demo berhasil diperbarui — tidak tersimpan ke server.');
 }
 const eventOptions=events.map(e=><option key={e.id} value={e.id}>{e.code} — {e.name}</option>);
 const currentPageName=selected?'Event Workspace':({dashboard:'Dashboard',events:'Event Projects',crm:'CRM & Clients',sales:'Quotations & Contracts',tasks:'Tasks & Timeline',budget:'Budget & RAB',vendors:'Vendor & PO',rundown:'Rundown & Show',finance:'Finance & Invoices',settings:'Users & Settings'} satisfies Record<Page,string>)[page];
 function renderContent(){
  if(selected&&active){const related=costs.filter(c=>c.eventId===active.id);const used=related.reduce((n,c)=>n+c.amount,0);return <><div className="eo-title-row"><div><button className="eo-link" onClick={()=>setSelected(null)}>← Kembali ke daftar</button><h1>{active.name}</h1><p>{active.code} · {active.client}</p></div><select aria-label="Status Event" value={active.status} onChange={e=>setEvents(old=>old.map(x=>x.id===active.id?{...x,status:e.target.value as EventStatus}:x))}>{statuses.map(s=><option key={s}>{s}</option>)}</select></div><div className="eo-grid3">{[['Client',active.client],['Venue',active.venue],['Project Manager',active.pm],['Contract',money(active.value)],['Approved Budget',money(active.budget)],['Remaining Budget',money(active.budget-used)]].map(x=><div className="eo-detail" key={x[0]}><small>{x[0]}</small><strong>{x[1]}</strong></div>)}</div><Card title="Project Readiness"><div className="eo-progress-header"><span>Progress</span><b>{active.progress}%</b></div><Progress value={active.progress}/><input aria-label="Project progress" type="range" min="0" max="100" value={active.progress} onChange={e=>setEvents(old=>old.map(x=>x.id===active.id?{...x,progress:Number(e.target.value)}:x))}/></Card><div className="eo-two"><Card title="Tasks"><Table heads={['Task','PIC','Status']}>{tasks.filter(t=>t.eventId===active.id).map(t=><tr key={t.id}><td>{t.name}</td><td>{t.owner}</td><td><Badge>{t.status}</Badge></td></tr>)}</Table></Card><Card title="Cost Summary"><p>Actual + Open Commitment (simulasi)</p><h2>{money(used)}</h2><Progress value={active.budget?used/active.budget*100:0}/></Card></div></>}
  if(page==='dashboard')return <><div className="eo-title-row"><div><h1>Good morning, Admin 👋</h1><p>Ringkasan portofolio Event Organizer</p></div><button className="eo-primary" onClick={()=>setModal('event')} disabled={!can(role,'events:write')}><Plus size={16}/> New Event</button></div><div className="eo-kpis">{[['Total Contract Value',money(contract)],['Planned Project Profit',money(planned)],['Active Events',String(events.filter(e=>e.status!=='Completed').length)],['Outstanding Invoices',money(outstanding)]].map(x=><div className="eo-card" key={x[0]}><small>{x[0]}</small><strong>{x[1]}</strong><span>Simulation data</span></div>)}</div><div className="eo-two"><Card title="Project Portfolio" action={<button className="eo-link" onClick={()=>selectPage('events')}>View All →</button>}><Table heads={['EVENT','DATE','PROGRESS','STATUS']}>{events.slice(0,5).map(e=><tr className="eo-click" key={e.id} onClick={()=>setSelected(e.id)}><td><b>{e.name}</b><small>{e.client}</small></td><td>{e.date}</td><td><Progress value={e.progress}/><small>{e.progress}%</small></td><td><Badge>{e.status}</Badge></td></tr>)}</Table></Card><Card title="Contract vs RAB">{events.map(e=><div className="eo-budgetbar" key={e.id}><div><b>{e.type}</b><small>{money(e.value)}</small></div><Progress value={e.value?e.budget/e.value*100:0}/></div>)}<p className="eo-helper">Filled bar = approved budget / contract</p></Card></div><div className="eo-two"><Card title="Pending Actions">{tasks.filter(t=>t.status!=='Done').slice(0,5).map(t=><div className="eo-feed" key={t.id}><span>{t.name}<small>{t.owner} · {t.due}</small></span><Badge>{t.status}</Badge></div>)}</Card><Card title="Finance Attention">{invoices.filter(i=>i.amount>i.paid).map(i=><div className="eo-feed" key={i.id}><span>{events.find(e=>e.id===i.eventId)?.client}<small>Outstanding receivable</small></span><b>{money(i.amount-i.paid)}</b></div>)}</Card></div></>;
  if(page==='events')return <EventProjects canWrite={can(role,'events:write')} />;
  if(page==='crm')return <CrmWorkspace canWrite={can(role,'clients:write')} />;
  if(page==='sales')return <SalesDocuments canWrite={can(role,'clients:write')} />;
  if(page==='tasks')return <TaskBoard canWrite={can(role,'tasks:write')} />;
  if(page==='budget')return <BudgetWorkspace canWrite={can(role,'finance:write')} />;
  if(page==='vendors')return <Procurement canWrite={can(role,'vendors:write')} />;
  if(page==='rundown')return <RundownWorkspace canWrite={can(role,'rundown:write')} />;
  if(page==='finance')return <InvoicesWorkspace canWrite={can(role,'finance:write')} />;
  if(page==='profitability')return <ProfitabilityWorkspace />;
  return <><div className="eo-title-row"><div><h1>Users & Settings</h1><p>Role-based access akan dibuat di PR #04.</p></div></div><Card title="Planned Roles"><div className="eo-grid3">{['Owner','Project Manager','Sales','Finance','Production','Crew'].map(x=><div className="eo-detail" key={x}><strong>{x}</strong><small>Configuration coming soon</small></div>)}</div></Card></>;
 }
 return <div className="eo-shell"><aside className={'eo-sidebar '+(open?'eo-open':'')}><div className="eo-brand"><div className="eo-mark">✳</div><div>vinca<span>EVENT ORGANIZER ERP</span></div><button className="eo-mobile-close" aria-label="Tutup navigasi" onClick={()=>setOpen(false)}><X size={18}/></button></div><nav aria-label="ERP navigation">{nav.map(group=><div key={group.group}><div className="eo-navgroup">{group.group}</div>{group.items.filter(([id])=>visible(id)).map(([id,label,Icon])=><button key={id} onClick={()=>selectPage(id)} className={'eo-nav-item '+(page===id?'active':'')}><Icon size={17}/>{label}</button>)}</div>)}</nav><div className="eo-user">EO <span><b>Demo Administrator</b><small>Simulation workspace</small></span></div></aside><div className="eo-main"><header className="eo-top"><div><button className="eo-hamburger" onClick={()=>setOpen(true)} aria-label="Buka navigasi"><Menu size={19}/></button><b>{currentPageName}</b><small>General Event Organizer · ERP Workspace</small></div><div className="eo-topright"><Badge>DEMO MODE</Badge><Bell size={17}/><button aria-label="Reset data demo" title="Reset demo" className="eo-iconbtn" onClick={()=>{setEvents(initialEvents);setTasks(initialTasks);setCosts(initialCosts);setInvoices(initialInvoices);setRunState(segments.map(()=>'Planned'));setSelected(null);setNotice('Data demo di-reset.')}}><RotateCcw size={16}/></button><button className="eo-secondary" onClick={logout}>Logout</button></div></header><main className="eo-content">{renderContent()}<div className="eo-demo-note">Interactive UI preview — seluruh data bersifat simulasi di memori browser. Refresh akan mengembalikan data awal. Tidak ada transaksi database Neon.</div></main></div>{open&&<button className="eo-backdrop" aria-label="Tutup navigasi" onClick={()=>setOpen(false)}/>}
 {notice&&<div className="eo-toast" role="status">{notice}<button onClick={()=>setNotice('')} aria-label="Tutup notifikasi"><X size={13}/></button></div>}
 {modal&&<div className="eo-modalback" onClick={e=>{if(e.target===e.currentTarget)setModal(null)}}><form className="eo-modal" onSubmit={e=>{e.preventDefault();save(new FormData(e.currentTarget))}}><header><h2>{modal==='event'?'Create Event':modal==='task'?'Add Task':modal==='cost'?'Add Cost':'New Invoice'}</h2><button type="button" onClick={()=>setModal(null)} aria-label="Close"><X size={18}/></button></header><div className="eo-form">
 {modal==='event'&&<><label>Event Name<input name="name" required maxLength={120}/></label><label>Client<input name="client" required maxLength={120}/></label><label>Type<select name="type"><option>Corporate</option><option>Wedding</option><option>Conference</option><option>Concert</option><option>Other</option></select></label><label>Date<input type="date" name="date" required/></label><label>Venue<input name="venue" required/></label><label>Project Manager<input name="pm" required/></label><label>Contract (Rp)<input type="number" name="value" min="0" required/></label><label>Approved Budget (Rp)<input type="number" name="budget" min="0" required/></label></>}
 {modal!=='event'&&<label>Event<select name="eventId" required>{eventOptions}</select></label>}
 {modal==='task'&&<><label>Task<input name="name" required/></label><label>PIC<input name="owner" required/></label><label>Due Date<input name="due" type="date" required/></label></>}
 {modal==='cost'&&<><label>Description<input name="name" required/></label><label>Vendor<input name="vendor" required/></label><label>Amount (Rp)<input name="amount" type="number" min="1" required/></label></>}
 {modal==='invoice'&&<label>Invoice amount (Rp)<input name="amount" type="number" min="1" required/></label>}
 </div><footer><button type="button" className="eo-secondary" onClick={()=>setModal(null)}>Cancel</button><button className="eo-primary" type="submit">Save Demo</button></footer></form></div>}
 </div>;
}
