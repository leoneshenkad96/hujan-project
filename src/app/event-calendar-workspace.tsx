'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { CalendarDays, ChevronLeft, ChevronRight, MapPin } from 'lucide-react';

type EventItem = {
  id: string;
  code: string;
  title: string;
  eventDate: string;
  type: string;
  venue: string | null;
  status: string;
  progress: number;
};

const STATUS_LABEL: Record<string, string> = {
  planning: 'Perencanaan',
  confirmed: 'Terkonfirmasi',
  pre_production: 'Pra-produksi',
  live: 'Berlangsung',
  completed: 'Selesai',
  cancelled: 'Dibatalkan',
};
const WEEKDAYS = ['Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab', 'Min'];
const toIsoDate = (date: Date) => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
const fromIsoDate = (value: string) => {
  const [year, month, day] = value.split('-').map(Number);
  return new Date(year, month - 1, day);
};

export default function EventCalendarWorkspace({ onOpenProjects }: { onOpenProjects: () => void }) {
  const [month, setMonth] = useState(() => new Date(new Date().getFullYear(), new Date().getMonth(), 1));
  const [status, setStatus] = useState('');
  const [items, setItems] = useState<EventItem[]>([]);
  const [selected, setSelected] = useState<EventItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    const from = toIsoDate(new Date(month.getFullYear(), month.getMonth(), 1));
    const to = toIsoDate(new Date(month.getFullYear(), month.getMonth() + 1, 1));
    try {
      const all: EventItem[] = [];
      let page = 1;
      let hasMore = true;
      while (hasMore && page <= 100) {
        const params = new URLSearchParams({ from, to, page: String(page), limit: '100' });
        if (status) params.set('status', status);
        const response = await fetch(`/api/events?${params}`, { cache: 'no-store' });
        if (!response.ok) throw new Error(response.status === 403 ? 'Akses kalender tidak tersedia untuk akun ini.' : 'Kalender event gagal dimuat.');
        const data = await response.json() as { items: EventItem[]; hasMore: boolean };
        all.push(...data.items);
        hasMore = data.hasMore;
        page += 1;
      }
      setItems(all);
      setSelected(current => current ? all.find(item => item.id === current.id) ?? null : null);
    } catch (cause) {
      setItems([]);
      setError(cause instanceof Error ? cause.message : 'Kalender event gagal dimuat.');
    } finally {
      setLoading(false);
    }
  }, [month, status]);

  useEffect(() => { void load(); }, [load]);

  const days = useMemo(() => {
    const first = new Date(month.getFullYear(), month.getMonth(), 1);
    const offset = (first.getDay() + 6) % 7;
    const gridStart = new Date(first.getFullYear(), first.getMonth(), 1 - offset);
    return Array.from({ length: 42 }, (_, index) => new Date(gridStart.getFullYear(), gridStart.getMonth(), gridStart.getDate() + index));
  }, [month]);
  const byDate = useMemo(() => {
    const grouped = new Map<string, EventItem[]>();
    for (const item of items) grouped.set(item.eventDate, [...(grouped.get(item.eventDate) ?? []), item]);
    return grouped;
  }, [items]);
  const monthLabel = new Intl.DateTimeFormat('id-ID', { month: 'long', year: 'numeric' }).format(month);
  const today = toIsoDate(new Date());

  return <section className="eo-calendar-workspace">
    <div className="eo-title-row">
      <div><h1>Kalender Event</h1><p>Jadwal acara per bulan, tersambung ke event yang tersimpan di Vinca.</p></div>
      <button className="eo-primary" onClick={onOpenProjects}>Kelola Event</button>
    </div>

    {error && <p role="alert" className="eo-demo-note">{error}</p>}
    <div className="eo-calendar-layout">
      <div className="eo-card eo-calendar-card">
        <div className="eo-calendar-toolbar">
          <div className="eo-calendar-month"><CalendarDays size={19} /><h2>{monthLabel}</h2></div>
          <div className="eo-calendar-actions">
            <label className="eo-calendar-status">Status
              <select aria-label="Filter status event" value={status} onChange={event => setStatus(event.target.value)}>
                <option value="">Semua status</option>
                {Object.entries(STATUS_LABEL).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
              </select>
            </label>
            <button className="eo-secondary" onClick={() => setMonth(new Date(new Date().getFullYear(), new Date().getMonth(), 1))}>Hari ini</button>
            <button className="eo-secondary eo-calendar-arrow" aria-label="Bulan sebelumnya" onClick={() => setMonth(value => new Date(value.getFullYear(), value.getMonth() - 1, 1))}><ChevronLeft size={17} /></button>
            <button className="eo-secondary eo-calendar-arrow" aria-label="Bulan berikutnya" onClick={() => setMonth(value => new Date(value.getFullYear(), value.getMonth() + 1, 1))}><ChevronRight size={17} /></button>
          </div>
        </div>
        <div className="eo-calendar-grid" role="grid" aria-label={`Kalender event ${monthLabel}`}>
          {WEEKDAYS.map(day => <div className="eo-calendar-weekday" role="columnheader" key={day}>{day}</div>)}
          {days.map(day => {
            const iso = toIsoDate(day);
            const events = byDate.get(iso) ?? [];
            const inMonth = day.getMonth() === month.getMonth();
            return <div className={`eo-calendar-day${inMonth ? '' : ' is-outside'}${iso === today ? ' is-today' : ''}`} role="gridcell" key={iso}>
              <div className="eo-calendar-day-number">{day.getDate()}{iso === today && <span>Hari ini</span>}</div>
              <div className="eo-calendar-events">
                {events.slice(0, 3).map(item => <button key={item.id} className={`eo-event-chip status-${item.status}`} onClick={() => setSelected(item)} aria-label={`${item.title}, ${STATUS_LABEL[item.status] ?? item.status}`}>
                  <span>{item.title}</span>
                </button>)}
                {events.length > 3 && <button className="eo-calendar-more" onClick={() => setSelected(events[3])}>+{events.length - 3} event lainnya</button>}
              </div>
            </div>;
          })}
        </div>
        <div className="eo-calendar-foot"><span>{loading ? 'Memuat jadwal…' : `${items.length} event pada ${monthLabel}`}</span><span className="eo-calendar-legend"><i className="status-planning" /> Perencanaan <i className="status-confirmed" /> Terkonfirmasi <i className="status-live" /> Berlangsung</span></div>
      </div>

      <aside className="eo-card eo-calendar-detail" aria-live="polite">
        {selected ? <>
          <span className={`eo-badge status-badge-${selected.status}`}>{STATUS_LABEL[selected.status] ?? selected.status}</span>
          <h2>{selected.title}</h2>
          <p className="eo-calendar-code">{selected.code} · {selected.type}</p>
          <div className="eo-calendar-detail-row"><CalendarDays size={16} /><span>{new Intl.DateTimeFormat('id-ID', { dateStyle: 'full' }).format(fromIsoDate(selected.eventDate))}</span></div>
          {selected.venue && <div className="eo-calendar-detail-row"><MapPin size={16} /><span>{selected.venue}</span></div>}
          <div className="eo-calendar-progress"><div><span>Progres persiapan</span><b>{selected.progress}%</b></div><div className="eo-progress"><span style={{ width: `${selected.progress}%` }} /></div></div>
          <button className="eo-secondary eo-calendar-open" onClick={onOpenProjects}>Buka modul Event Projects</button>
        </> : <div className="eo-calendar-empty"><CalendarDays size={30} /><h2>Pilih event</h2><p>Klik event di kalender untuk melihat tanggal, lokasi, dan progresnya.</p></div>}
      </aside>
    </div>
    {!loading && !error && items.length === 0 && <p className="eo-calendar-no-events">Belum ada event untuk bulan dan filter ini.</p>}
  </section>;
}
