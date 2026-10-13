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

## Login dan aktivasi Owner UAT

Tidak ada akun demo atau password default. Akun Owner UAT saat ini:

- **Organization slug:** `vinca-uat`
- **Email:** `leoneshenkad@gmail.com`
- **Status:** **nonaktif dan belum memiliki password**, sehingga belum bisa login.

Di branch integrasi sudah tersedia halaman `/activate` dan dua API `/api/auth/activation/request` dan `/api/auth/activation/complete`. Link aktivasi sekali pakai berlaku 15 menit; token hanya disimpan sebagai hash. Agar alur ini dapat digunakan, **Preview terbaru** harus berjalan dan variabel berikut harus terpasang **khusus Preview branch UAT**:

| Environment variable | Fungsi |
|---|---|
| `DATABASE_URL` | Koneksi ke Neon branch UAT Vinca, bukan production |
| `UAT_ACTIVATION_ENABLED` | `true` hanya untuk UAT |
| `UAT_ACTIVATION_BASE_URL` | HTTPS origin persis dari Preview yang digunakan |
| `RESEND_API_KEY` | Kunci Resend dengan izin email sending, simpan sebagai secret |
| `ACTIVATION_FROM_EMAIL` | Alamat pengirim yang diizinkan oleh akun Resend |

Pengirim trial Resend mungkin memiliki batasan penerima. **Jangan menganggap email sudah dikirim** sebelum pengiriman dan aktivasi diverifikasi. Aktivasi memakai Safari/iPhone setelah Preview dan pengirim email berfungsi. Jangan pernah membagikan password lewat chat, menaruh token aktivasi pada issue/README, atau meng-commit kredensial.

## UAT dan kualitas

- PR integrasi: [#17 — Final Integration & UAT](https://github.com/leoneshenkad96/Event-Organizer-ERP-/pull/17) (Draft, tidak boleh di-merge sebelum sign-off).
- Dokumen skenario dan blocker: [Final Integration & UAT](docs/FINAL-INTEGRATION-UAT.md).
- Prosedur release: [Production Release Runbook](docs/RELEASE-RUNBOOK.md).
- `scripts/uat-http-smoke.mjs`: smoke test login, session, CSRF dan isolasi dua organisasi; perlu dua akun aktif khusus UAT.
- `scripts/uat-finance-concurrency.mjs`: pengujian tulis transaksi paralel dan idempotency key. **Berpotensi membuat pembayaran**; wajib memakai invoice fixture disposable, dua organisasi, dan `UAT_FINANCE_WRITE_ACK=DISPOSABLE_UAT_ONLY`. Runner ini **tidak berjalan otomatis di CI**.
- `GET /api/finance/reconciliation`: laporan anomali pembayaran **read-only** (hak akses `finance:read`).

CI menjalankan tes statis/unit, build dan audit dependensi. **Belum lulus UAT langsung** untuk dua organisasi, pembayaran paralel, browser iPhone/tablet/desktop, dan pemulihan backup. Neon UAT memiliki 9 migrasi (0000–0008), sementara status database development/production harus diverifikasi terpisah sebelum release.

## Git dan deployment

Pekerjaan terdiri dari **stacked PR #01 → #16**, diikuti **PR #17** (`integration/final-uat` berbasis `feature/16-release-readiness`). Review dan gabungkan sesuai urutan dependensi setelah UAT disetujui; hasil CI tiap PR sendiri tidak otomatis menjamin hasil gabungan pada `main`.

- Vercel project: `eo-erp` (terhubung dengan `leoneshenkad96/Event-Organizer-ERP-`).
- Database UAT: Neon branch `br-long-wildflower-b3nsciay`, project `fancy-cell-64250119`. **Jangan diarahkan ke Vinca production.**
- Deployment Preview sebelumnya pernah `READY`, tetapi **commit terbaru belum di-redeploy** akibat batas kuota harian Vercel.
- Tidak ada izin implisit untuk merge ke `main`, menjalankan migrasi production, atau melakukan deployment production.

## Persyaratan sebelum production GO

Akun Owner aktif melalui email terverifikasi; dua organisasi dengan role berbeda sudah diuji (akses 401/403/404 dan IDOR); pembayaran paralel/idempotency, pembukuan dan audit direkonsiliasi; UI responsif dan aksesibilitas diuji; backup/restore diuji pada branch disposable; keamanan proxy, header dan dependensi ditinjau; lalu mendapat persetujuan owner untuk merge, migrasi, dan deploy.

**Disusun dan dikembangkan untuk Vinca Event Organizer ERP.**
