'use client';

import { useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';

const palette = { sky: '#99CDD8', mint: '#DAEBE3', cream: '#FDE8D3', sage: '#CFD6C4', ink: '#657166', deep: '#46524d' };

export default function Login() {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    setError('');
    const fd = new FormData(e.currentTarget);
    try {
      const res = await fetch('/api/auth/login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ username: fd.get('username'), password: fd.get('password') }) });
      if (!res.ok) {
        if (res.status===429) {
          const retry = Number(res.headers.get('Retry-After'));
          const minutes = Number.isFinite(retry) && retry > 0 ? Math.ceil(retry / 60) : null;
          setError(minutes ? `Terlalu banyak percobaan login. Coba lagi setelah sekitar ${minutes} menit.` : 'Terlalu banyak percobaan login. Coba lagi nanti.');
          return;
        }
        if (res.status===503) { setError('Layanan login sedang tidak tersedia. Coba kembali nanti.'); return; }
        setError('Login gagal. Periksa username dan password atau hubungi administrator.');
        return;
      }
      router.push('/');
      router.refresh();
    } catch { setError('Tidak dapat menghubungi server.'); } finally { setBusy(false); }
  }

  const field = { display: 'block', width: '100%', padding: 13, marginTop: 7, border: `1px solid ${palette.sage}`, borderRadius: 10, boxSizing: 'border-box' as const, background: '#fffdf9', color: palette.deep };

  return <main style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', padding: 24, background: `linear-gradient(135deg, ${palette.mint} 0%, ${palette.cream} 52%, ${palette.sky} 100%)` }}>
    <form onSubmit={submit} style={{ width: 'min(100%, 410px)', padding: 30, borderRadius: 24, background: '#fffdf9eF', border: `1px solid ${palette.sage}`, boxShadow: '0 24px 70px #65716638', display: 'grid', gap: 16 }}>
      <div style={{ display: 'grid', placeItems: 'center', marginBottom: 4 }}><img src="/branding/hujan-project-logo-transparent.png" alt="Hujan Project" style={{ width: 'min(100%, 300px)', height: 150, objectFit: 'contain' }} /></div>
      <div><h1 style={{ margin: 0, fontSize: 28, color: palette.deep }}>Vinca ERP</h1><p style={{ margin: '6px 0 0', color: palette.ink }}>Masuk ke workspace Event Organizer</p></div>
      <label htmlFor="login-username" style={{ color: palette.deep }}>Username<input id="login-username" required name="username" type="text" autoComplete="username" autoCapitalize="none" autoCorrect="off" style={field} /></label>
      <label htmlFor="login-password" style={{ color: palette.deep }}>Password<input id="login-password" required name="password" type="password" autoComplete="current-password" style={field} /></label>
      {error && <p role="alert" style={{ color: '#8d4c43', margin: 0 }}>{error}</p>}
      <button disabled={busy} type="submit" style={{ background: palette.ink, color: '#fffdf9', border: 0, padding: 13, borderRadius: 10, fontWeight: 700, cursor: busy ? 'not-allowed' : 'pointer', opacity: busy ? .6 : 1 }}>{busy ? 'Memproses...' : 'Masuk'}</button>
      <small style={{ color: palette.ink }}>Akun dikelola oleh administrator. Hubungi administrator untuk akses.</small>
    </form>
  </main>;
}
