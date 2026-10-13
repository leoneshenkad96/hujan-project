import { LayoutDashboard, CalendarDays, Users, ListTodo, Wallet, Truck, Clapperboard, FileText, Settings, Plus } from 'lucide-react';

const menu = [
  { label: 'Dashboard', icon: LayoutDashboard },
  { label: 'Event Projects', icon: CalendarDays },
  { label: 'CRM & Clients', icon: Users },
  { label: 'Tasks & Timeline', icon: ListTodo },
  { label: 'Budget & RAB', icon: Wallet },
  { label: 'Vendor & PO', icon: Truck },
  { label: 'Rundown & Show', icon: Clapperboard },
  { label: 'Finance & Invoices', icon: FileText },
  { label: 'System Settings', icon: Settings },
];
const sample = [
  { event: 'Annual Corporate Gathering', client: 'PT Nusantara Teknologi', date: '20 Nov 2026', progress: 68, status: 'Pre-Production' },
  { event: 'Dream Wedding Celebration', client: 'Anisa & Reza', date: '28 Nov 2026', progress: 35, status: 'Planning' },
  { event: 'Indonesia Creative Summit', client: 'Creative Indonesia', date: '05 Dec 2026', progress: 24, status: 'Confirmed' },
  { event: 'Soundwave Music Festival', client: 'Soundwave Indonesia', date: '19 Dec 2026', progress: 14, status: 'Planning' },
];
export default function Home() {
  return <div className="layout">
    <aside className="sidebar" aria-label="Navigasi utama">
      <div className="brand">✳ Vinca ERP<small>EVENT ORGANIZER</small></div>
      <div className="navgroup">WORKSPACE</div>
      {menu.map(({ label, icon: Icon }, i) => <div key={label} className={'navitem '+(i === 0 ? 'active' : '')}><Icon size={17} aria-hidden="true" />{label}</div>)}
    </aside>
    <section className="main"><header className="topbar"><strong>Dashboard Overview</strong><span className="pill">DEVELOPMENT PREVIEW</span></header>
      <main className="content"><div className="heading"><div><h1>Welcome to Vinca ERP</h1><p className="eyebrow">Event management workspace · Foundation preview</p></div><button className="btn" disabled title="Tersedia di PR Event Management"><Plus size={14} style={{verticalAlign:'middle'}} /> New Event — Soon</button></div>
        <div className="kpis"><div className="card"><div className="kpi-label">Total Contract Value</div><div className="kpi-number">Rp 785 jt</div><div className="kpi-note">Sample UI — not live data</div></div><div className="card"><div className="kpi-label">Planned Project Profit</div><div className="kpi-number">Rp 225 jt</div><div className="kpi-note">Sample UI — not live data</div></div><div className="card"><div className="kpi-label">Active Events</div><div className="kpi-number">4</div><div className="kpi-note">Sample UI — not live data</div></div><div className="card"><div className="kpi-label">Outstanding Invoices</div><div className="kpi-number">Rp 78 jt</div><div className="kpi-note">Sample UI — not live data</div></div></div>
        <div className="grid"><section className="card"><h2>Project Portfolio</h2><div style={{overflowX:'auto',marginTop:18}}><table><thead><tr><th>EVENT / CLIENT</th><th>DATE</th><th>PROGRESS</th><th>STATUS</th></tr></thead><tbody>{sample.map(e=><tr key={e.event}><td><strong>{e.event}</strong><div className="muted">{e.client}</div></td><td>{e.date}</td><td style={{minWidth:90}}><div className="bar"><span style={{width:e.progress+'%'}} /></div><span className="muted">{e.progress}%</span></td><td><span className="pill">{e.status}</span></td></tr>)}</tbody></table></div></section><section className="card"><h2>Project Readiness</h2><div className="stack">{sample.map(e=><div key={e.event}><div style={{display:'flex',justifyContent:'space-between',fontSize:12,marginBottom:7}}><span>{e.event}</span><strong>{e.progress}%</strong></div><div className="bar"><span style={{width:e.progress+'%'}} /></div></div>)}</div></section></div>
        <div className="note">Ini preview desain PR #01, bukan sistem ERP yang sudah aktif. Semua KPI dan event di atas adalah data contoh. Modul interaktif dan database Neon akan ditambahkan melalui PR berikutnya.</div>
      </main>
    </section>
  </div>;
}
