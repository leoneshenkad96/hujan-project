# Vinca Event Organizer ERP

ERP untuk mengelola operasional Event Organizer (EO) dari prospek klien hingga proyek, vendor, rundown, invoice, pembayaran, dan pelaporan.

> **Status: development / Final Integration & UAT — production NO-GO.** Kode masih berupa rangkaian PR #01–#17 dan **belum digabungkan ke `main`**. Jangan memasukkan data klien atau transaksi sungguhan ke lingkungan UAT. CI yang lulus **bukan** bukti bahwa semua alur browser dan API telah diuji langsung.

## Teknologi

- **Frontend & API:** Next.js 15 App Router, React 19, TypeScript
- **Database:** PostgreSQL di Neon, Drizzle ORM dan migrasi SQL berversi
- **Autentikasi:** sesi cookie HttpOnly, password `scrypt`, role-based access control (RBAC)
- **Hosting:** Vercel (proyek khusus `eo-erp`)
- **Testing:** Node test runner, TypeScript, ESLint, Next.js build, pemeriksaan schema dan audit dependency

Proyek ini **terpisah dari Kasapink ERP**, meskipun dikelola dalam akun Vercel yang sama. Jangan pernah menggunakan database, environment variable, atau proyek deploy Kasapink untuk Vinca.

## Modul

| Area | Fitur |
|---|---|
| Dashboard | Ringkasan event, progres, task dan metrik finance berdasarkan hak akses |
| CRM | Data klien, lead, status prospek |
| Event / Project | Event, PIC, progres, status dan tanggal |
| Task | Penugasan dan pemantauan pekerjaan |
| Vendor / Procurement | Vendor, purchase order, komitmen biaya |
| Budget / RAB | Anggaran, pengeluaran aktual dan variance |
| Rundown | Susunan acara dan status pelaksanaan |
| Sales | Penawaran dan kontrak (status internal, **bukan tanda tangan elektronik yang terverifikasi**) |
| Finance | Invoice, cicilan, pembayaran, saldo dan rekonsiliasi |
| Reporting | Profitability estimasi, dashboard keuangan dan daftar anomali saldo |

**Penting:** Nilai kontrak/profitabilitas adalah estimasi operasional, bukan otomatis laporan akuntansi final. PO commitment dan biaya aktual ditampilkan terpisah agar tidak dihitung ganda. Pembayaran memerlukan `Idempotency-Key` per transaksi untuk mengurangi risiko duplikasi ketika koneksi terputus.

## Menjalankan secara lokal

Persyaratan: **Node.js 22+**, npm dan akses ke **database Vinca development** (jangan pakai production).

```bash
npm ci
npm run dev
```

Buka `http://localhost:3000`. Pemeriksaan sebelum PR:

```bash
node scripts/release-preflight.mjs
npm run typecheck
npm run lint
npm test
npm run build
npm run db:check
npm audit --omit=dev --audit-level=high
```

Buat `.env.local` sendiri (jangan di-commit). Minimal `DATABASE_URL` harus menunjuk branch database Vinca **development / UAT yang benar**, dengan koneksi TLS. Migrasi hanya dijalankan pada branch database yang telah mendapat persetujuan untuk diubah; jangan otomatis menjalankan `db:migrate` ke production.

## Login Owner UAT (tanpa Resend)

Login mengikuti pola ERP Kasapink: **username + password**, bukan tautan email/OTP/Resend. Halaman `/login` mengirim kredensial ke `POST /api/auth/login`; autentikasi menggunakan password `scrypt`, sesi cookie `HttpOnly`, rate limiting, dan RBAC. Endpoint permintaan aktivasi email sudah dinonaktifkan (HTTP 410), sedangkan `/activate` mengarah ke `/login`.

- **Organisasi UAT:** `vinca-uat`
- **Username Owner UAT:** `leoneshenkad` (diturunkan dari email awal)
- **Email kontak Owner:** `leoneshenkad@gmail.com`
- **Status saat pemeriksaan 14 Oktober 2026:** belum aktif dan belum memiliki password; belum bisa login.

**Provisioning Owner** harus dilakukan satu kali melalui jalur administrator privat terhadap database **Neon UAT** saja. Password dipilih dan dimasukkan sendiri melalui input tersembunyi, tidak ditulis di chat, GitHub, PR, log, maupun query SQL publik. Gunakan `scripts/hash-password.mjs` untuk menghasilkan hash `scrypt` yang kompatibel, lalu simpan hanya hash-nya dan aktifkan user yang benar sesudah memastikan target branch UAT. Verifikasi username unik secara global, role `owner`, dan login sesudah provisioning. Jangan membuat password default atau mengaktifkan Owner tanpa password.

Preview perlu terhubung ke branch UAT yang sesuai dan memakai build terbaru. Konfigurasi `RESEND_API_KEY`, `ACTIVATION_FROM_EMAIL`, `UAT_ACTIVATION_ENABLED`, dan `UAT_ACTIVATION_BASE_URL` **tidak diperlukan untuk login username/password**; bersihkan konfigurasi lama secara terkontrol setelah memeriksa tidak ada fitur lain yang menggunakannya. Tidak perlu merge/deploy production untuk uji login Preview.

## UAT dan kualitas

- PR integrasi: [#17 — Final Integration & UAT](https://github.com/leoneshenkad96/Event-Organizer-ERP-/pull/17) (Draft, tidak boleh di-merge sebelum sign-off).
- Dokumen skenario dan blocker: [Final Integration & UAT](docs/FINAL-INTEGRATION-UAT.md).
- Prosedur release: [Production Release Runbook](docs/RELEASE-RUNBOOK.md).
- `scripts/uat-http-smoke.mjs`: smoke test login, session, CSRF dan isolasi dua organisasi; perlu dua akun aktif khusus UAT.
- `scripts/uat-finance-concurrency.mjs`: pengujian tulis transaksi paralel dan idempotency key. **Berpotensi membuat pembayaran**; wajib memakai invoice fixture disposable, dua organisasi, dan `UAT_FINANCE_WRITE_ACK=DISPOSABLE_UAT_ONLY`. Runner ini **tidak berjalan otomatis di CI**.
- `GET /api/finance/reconciliation`: laporan anomali pembayaran **read-only** (hak akses `finance:read`).

CI menjalankan tes statis/unit, build dan audit dependensi. **Belum lulus UAT langsung** untuk dua organisasi, pembayaran paralel, browser iPhone/tablet/desktop, dan pemulihan backup. Pada pemeriksaan 14 Oktober 2026, Neon UAT telah mencatat 19 migrasi (0000–0018). Status development/production harus diverifikasi secara terpisah sebelum release.

## Git dan deployment

Pekerjaan terdiri dari **stacked PR #01 → #16**, diikuti **PR #17** (`integration/final-uat` berbasis `feature/16-release-readiness`). Review dan gabungkan sesuai urutan dependensi setelah UAT disetujui; hasil CI tiap PR sendiri tidak otomatis menjamin hasil gabungan pada `main`.

- Vercel project: `eo-erp` (terhubung dengan `leoneshenkad96/Event-Organizer-ERP-`).
- Database UAT: Neon branch `br-long-wildflower-b3nsciay`, project `fancy-cell-64250119`. **Jangan diarahkan ke Vinca production.**
- Deployment Preview sebelumnya pernah `READY`, tetapi **commit terbaru belum di-redeploy** akibat batas kuota harian Vercel.
- Tidak ada izin implisit untuk merge ke `main`, menjalankan migrasi production, atau melakukan deployment production.

## Persyaratan sebelum production GO

Akun Owner diprovisioning dengan password pribadi secara aman dan login berhasil; dua organisasi dengan role berbeda sudah diuji (akses 401/403/404 dan IDOR); pembayaran paralel/idempotency, pembukuan dan audit direkonsiliasi; UI responsif dan aksesibilitas diuji; backup/restore diuji pada branch disposable; keamanan proxy, header dan dependensi ditinjau; lalu mendapat persetujuan owner untuk merge, migrasi, dan deploy.

**Disusun dan dikembangkan untuk Vinca Event Organizer ERP.**
