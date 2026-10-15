'use client';

import { useState } from 'react';
import { LayoutDashboard, CalendarDays, Users, ListTodo, Wallet, Truck, Clapperboard, UserRoundCheck, FileText, Settings, Menu, X, Bell } from 'lucide-react';
import './workspace.css';
import { can } from '@/lib/permissions';
import CrmWorkspace from './crm-workspace';
import CrewWorkspace from './crew-workspace';
import EventProjects from './event-projects';
import TaskBoard from './task-board';
import Procurement from './procurement';
import BudgetWorkspace from './budget-workspace';
import RundownWorkspace from './rundown-workspace';
import SalesDocuments from './sales-documents';
import InvoicesWorkspace from './invoices-workspace';
import ProfitabilityWorkspace from './profitability-workspace';
import DashboardWorkspace from './dashboard-workspace';
import EventCalendarWorkspace from './event-calendar-workspace';

const nav=[{group:'WORKSPACE',items:[['dashboard','Dashboard',LayoutDashboard],['calendar','Kalender Event',CalendarDays],['events','Event Projects',CalendarDays],['crm','CRM & Clients',Users],['sales','Quotations & Contracts',FileText],['tasks','Tasks & Timeline',ListTodo]]},{group:'OPERATIONS',items:[['budget','Budget & RAB',Wallet],['vendors','Vendor & PO',Truck],['rundown','Rundown & Show',Clapperboard],['crew','Crew Scheduling',UserRoundCheck]]},{group:'FINANCIAL',items:[['finance','Finance & Invoices',FileText],['profitability','Profitability',Wallet]]},{group:'SYSTEM',items:[['settings','Users & Settings',Settings]]}] as const;
type Page='dashboard'|'calendar'|'events'|'crm'|'sales'|'profitability'|'tasks'|'budget'|'vendors'|'rundown'|'crew'|'finance'|'settings';
export default function Workspace({role}:{role:string}){
 const [page,setPage]=useState<Page>(can(role,'dashboard:read')?'dashboard':'events');const [open,setOpen]=useState(false);
 
 const visible=(id:string)=>({dashboard:can(role,'dashboard:read'),calendar:can(role,'events:read'),events:can(role,'events:read'),crm:can(role,'clients:read'),sales:can(role,'clients:read'),tasks:can(role,'events:read'),budget:can(role,'finance:read'),vendors:can(role,'vendors:read'),rundown:can(role,'events:read'),crew:can(role,'events:read'),finance:can(role,'finance:read'),profitability:can(role,'finance:read'),settings:can(role,'users:manage')} as Record<string,boolean>)[id]??false;
 
 const [notice,setNotice]=useState('');
 async function logout(){try{const r=await fetch('/api/auth/logout',{method:'POST'});if(r.ok){window.location.assign('/login');return}setNotice('Logout gagal. Coba kembali.')}catch{setNotice('Koneksi terputus saat logout.')}}
 
 const selectPage=(p:Page)=>{if(!visible(p))return;if(p==='settings'){window.location.assign('/users');return}setPage(p);setOpen(false);};
 const currentPageName=({dashboard:'Dashboard',calendar:'Kalender Event',events:'Event Projects',crm:'CRM & Clients',sales:'Quotations & Contracts',tasks:'Tasks & Timeline',budget:'Budget & RAB',vendors:'Vendor & PO',rundown:'Rundown & Show',crew:'Crew Scheduling',finance:'Finance & Invoices',profitability:'Profitability',settings:'Users & Settings'} satisfies Record<Page,string>)[page];
 function renderContent(){
  if(page==='dashboard')return <DashboardWorkspace />;
  if(page==='calendar')return <EventCalendarWorkspace onOpenProjects={()=>setPage('events')} />;
    if(page==='events')return <EventProjects canWrite={can(role,'events:write')} />;
  if(page==='crm')return <CrmWorkspace canWrite={can(role,'clients:write')} />;
  if(page==='sales')return <SalesDocuments canWrite={can(role,'clients:write')} />;
  if(page==='tasks')return <TaskBoard canWrite={can(role,'tasks:write')} />;
  if(page==='budget')return <BudgetWorkspace canWrite={can(role,'finance:write')} />;
  if(page==='vendors')return <Procurement canWrite={can(role,'vendors:write')} />;
  if(page==='rundown')return <RundownWorkspace canWrite={can(role,'rundown:write')} />;
  if(page==='crew')return <CrewWorkspace canWrite={can(role,'tasks:write')} />;
  if(page==='finance')return <InvoicesWorkspace canWrite={can(role,'finance:write')} />;
  if(page==='profitability')return <ProfitabilityWorkspace />;
  return null;
 }
 return <div className="eo-shell"><aside className={'eo-sidebar '+(open?'eo-open':'')}><div className="eo-brand"><div className="eo-mark">✳</div><div>vinca<span>EVENT ORGANIZER ERP</span></div><button className="eo-mobile-close" aria-label="Tutup navigasi" onClick={()=>setOpen(false)}><X size={18}/></button></div><nav aria-label="ERP navigation">{nav.map(group=><div key={group.group}><div className="eo-navgroup">{group.group}</div>{group.items.filter(([id])=>visible(id)).map(([id,label,Icon])=><button key={id} onClick={()=>selectPage(id)} className={'eo-nav-item '+(page===id?'active':'')}><Icon size={17}/>{label}</button>)}</div>)}</nav><div className="eo-user">EO <span><b>Vinca Workspace</b><small>Internal ERP</small></span></div></aside><div className="eo-main"><header className="eo-top"><div><button className="eo-hamburger" onClick={()=>setOpen(true)} aria-label="Buka navigasi"><Menu size={19}/></button><b>{currentPageName}</b><small>General Event Organizer · ERP Workspace</small></div><div className="eo-topright"><span className="eo-badge">Vinca ERP</span><Bell size={17}/><button className="eo-secondary" onClick={logout}>Logout</button></div></header><main className="eo-content">{renderContent()}<div className="eo-demo-note">{page==='settings'?'Kelola pengguna dan hak akses sesuai organisasi.':'Jadwal event, rundown, dan kru mengikuti data dan akses organisasi aktif.'}</div></main></div>{open&&<button className="eo-backdrop" aria-label="Tutup navigasi" onClick={()=>setOpen(false)}/>}
 {notice&&<div className="eo-toast" role="status">{notice}<button onClick={()=>setNotice('')} aria-label="Tutup notifikasi"><X size={13}/></button></div>}
 </div>;
}
