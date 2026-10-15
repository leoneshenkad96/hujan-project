# Hujan Project — Event Organizer ERP

Aplikasi ERP untuk mengelola pekerjaan Event Organizer, mulai dari prospek klien, perencanaan event, koordinasi kru dan vendor, hingga invoice, pembayaran, dan evaluasi profitabilitas.

Repositori: [leoneshenkad96/hujan-project](https://github.com/leoneshenkad96/hujan-project)

> Proyek masih dalam pengembangan dan pengujian UAT. Ketersediaan modul di kode bukan bukti bahwa seluruh alur telah lulus pengujian operasional atau siap digunakan di production.

## Fitur

| Modul | Cakupan |
| --- | --- |
| Dashboard | Ringkasan event, pekerjaan, dan metrik sesuai hak akses |
| CRM & Clients | Klien, lead, tindak lanjut, dan konversi lead menjadi event |
| Event Projects | Pengelolaan event, tanggal, PIC, progres, dan penutupan event |
| Kalender Event | Tampilan jadwal event dan akses ke proyek terkait |
| Tasks & Timeline | Penugasan dan pemantauan pekerjaan |
| Crew Scheduling | Direktori kru dan penugasan ke event |
| Vendor & PO | Data vendor dan purchase order |
| Budget & RAB | Anggaran, biaya aktual, dan selisih anggaran |
| Rundown & Show | Susunan acara dan status pelaksanaan |
| Quotations & Contracts | Penawaran dan kontrak dengan status internal |
| Finance & Invoices | Invoice, pembayaran bertahap, saldo, dan rekonsiliasi |
| Profitability | Estimasi pendapatan, biaya, dan keuntungan event |
| Users & Settings | Pengelolaan pengguna dan role |
| Client Portal | Halaman khusus pengguna dengan role `client_viewer` |

Nilai profitabilitas merupakan estimasi operasional. Komitmen biaya PO dan pengeluaran aktual perlu direkonsiliasi agar tidak dihitung ganda. Status kontrak internal tidak mewakili tanda tangan elektronik terverifikasi.

## Teknologi

- **Aplikasi dan API:** Next.js 15 App Router, React 19, TypeScript.
- **Database:** PostgreSQL di Neon, Drizzle ORM, dan migrasi SQL berversi.
- **Autentikasi:** username dan password, hash `scrypt`, sesi cookie HttpOnly, serta role-based access control (RBAC).
- **Tampilan:** CSS dan Lucide React.
- **Pemeriksaan:** Node.js test runner, TypeScript, ESLint, Drizzle Kit, dan GitHub Actions.

Nama paket internal masih `vinca-event-organizer-erp`. Sebagian dokumen dan variabel UAT juga masih memakai nama Vinca.

## Menjalankan secara lokal

### 1. Persyaratan

- Node.js **22+** dan npm.
- Git.
- Database Neon PostgreSQL khusus development atau UAT.
- Akun aplikasi aktif untuk mengakses workspace.

### 2. Unduh dan pasang dependensi

```bash
git clone https://github.com/leoneshenkad96/hujan-project.git
cd hujan-project
npm ci
```

Repositori bersifat privat; akses GitHub yang sesuai diperlukan untuk melakukan clone.

### 3. Siapkan environment

Salin `.env.example` menjadi `.env.local`.

**Windows PowerShell:**

```powershell
Copy-Item .env.example .env.local
```

**macOS / Linux:**

```bash
cp .env.example .env.local
```

Isi `DATABASE_URL` dengan connection string database development/UAT yang benar dan gunakan TLS. Next.js membaca `.env.local` saat aplikasi dijalankan. Jangan commit connection string, password, atau file environment berisi rahasia.

`.env.example` juga memuat `AUTH_SECRET` sebagai placeholder lama; implementasi sesi saat ini tidak membaca variabel tersebut.

### 4. Siapkan database dan akun

Schema berada di [src/db/schema.ts](src/db/schema.ts), sedangkan migrasi tersimpan di [drizzle/](drizzle/).

Untuk database development/UAT yang memang disiapkan untuk proyek ini, tinjau target dan SQL sebelum menerapkan migrasi:

```bash
npm run db:migrate
```

**Drizzle Kit membaca `DATABASE_URL` dari environment proses; konfigurasi saat ini tidak otomatis memuat `.env.local`.** Pastikan variabel tersedia di terminal atau runner yang menjalankan perintah migrasi.

Tidak tersedia kredensial demo/default. Provisioning Owner UAT menggunakan [scripts/provision-owner-uat.mjs](scripts/provision-owner-uat.mjs), dengan `DATABASE_URL`, `VINCA_UAT_DB_HOST`, dan `VINCA_UAT_ACK=ISOLATED_UAT_ONLY` pada environment proses. Script meminta password melalui terminal. Ikuti [panduan bootstrap Windows](docs/UAT-OWNER-BOOTSTRAP-WINDOWS.md) dan periksa target database sebelum menjalankannya.

### 5. Jalankan aplikasi

```bash
npm run dev
```

Buka [localhost:3000](http://localhost:3000), lalu masuk melalui `/login` menggunakan akun aktif.

Untuk menjalankan hasil build lokal:

```bash
npm run build
npm start
```

## Perintah pengembangan

| Perintah | Fungsi |
| --- | --- |
| `npm run dev` | Menjalankan server development |
| `npm run build` | Membuat build aplikasi |
| `npm start` | Menjalankan hasil build |
| `npm run typecheck` | Memeriksa tipe TypeScript |
| `npm run lint` | Memeriksa kode dengan ESLint |
| `npm test` | Menjalankan tes di direktori `tests/` |
| `npm run db:check` | Memeriksa konsistensi migrasi Drizzle |
| `npm run db:generate` | Menghasilkan migrasi dari perubahan schema |
| `npm run db:migrate` | Menerapkan migrasi ke database target |
| `npm run auth:hash` | Menjalankan utilitas hash password |

## Struktur proyek

```text
.github/workflows/   Pemeriksaan otomatis GitHub Actions
docs/                Dokumentasi modul, UAT, dan release
drizzle/             Migrasi SQL, snapshot, dan journal
public/              Aset statis dan branding
scripts/             Utilitas autentikasi, UAT, dan preflight
src/
  app/               Halaman, workspace, dan API routes
  db/                Koneksi database dan schema Drizzle
  lib/               Autentikasi, permission, validasi, dan kalkulasi
tests/               Tes otomatis
```

## Autentikasi dan akses

Login menggunakan username dan password melalui `POST /api/auth/login`. Sesi disimpan melalui cookie HttpOnly; database menyimpan hash token sesi. Akses data dibatasi berdasarkan organisasi dan permission pada server.

Role yang didefinisikan di [src/lib/permissions.ts](src/lib/permissions.ts):

`owner`, `admin`, `project_manager`, `sales`, `finance`, `production`, `crew`, dan `client_viewer`.

- Workspace internal: `/`.
- Login: `/login`.
- Pengelolaan pengguna: `/users`.
- Portal klien: `/client-portal`.
- Informasi sesi: `GET /api/auth/me`.
- Permission pengguna: `GET /api/auth/permissions`.

Login tidak memerlukan Resend atau OTP email. Role dan permission menjadi sumber aturan akses; menu yang terlihat dapat berbeda untuk setiap pengguna.

## Validasi dan UAT

Pemeriksaan lokal sebelum mengirim perubahan:

```bash
node scripts/release-preflight.mjs
npm run typecheck
npm run lint
npm test
npm run build
npm run db:check
npm audit --omit=dev --audit-level=high
```

Pemeriksaan di atas tidak menggantikan pengujian browser dan integrasi database.

Utilitas UAT tambahan:

- [uat-http-smoke.mjs](scripts/uat-http-smoke.mjs): menguji login, sesi, CSRF, dan isolasi dua organisasi.
- [uat-finance-concurrency.mjs](scripts/uat-finance-concurrency.mjs): menguji transaksi pembayaran paralel dan idempotency. Script ini dapat membuat pembayaran; gunakan fixture disposable dan `UAT_FINANCE_WRITE_ACK=DISPOSABLE_UAT_ONLY`.
- [verify-uat-schema.mjs](scripts/verify-uat-schema.mjs): pemeriksaan schema UAT.
- [audit-uat-integrity.mjs](scripts/audit-uat-integrity.mjs): utilitas audit integritas UAT.

Untuk integrasi pembayaran, gunakan `Idempotency-Key` per transaksi sesuai implementasi API. Laporan anomali saldo tersedia melalui `GET /api/finance/reconciliation` dengan permission `finance:read`.

## Dokumentasi

| Topik | Panduan |
| --- | --- |
| Database | [DATABASE.md](docs/DATABASE.md) |
| Autentikasi | [AUTH.md](docs/AUTH.md) |
| CRM | [CRM.md](docs/CRM.md) |
| Budget | [BUDGET.md](docs/BUDGET.md) |
| Procurement | [PROCUREMENT.md](docs/PROCUREMENT.md) |
| Rundown | [RUNDOWN.md](docs/RUNDOWN.md) |
| Penawaran dan kontrak | [SALES-DOCUMENTS.md](docs/SALES-DOCUMENTS.md) |
| Invoice | [INVOICES.md](docs/INVOICES.md) |
| Profitabilitas | [PROFITABILITY.md](docs/PROFITABILITY.md) |
| Dashboard | [DASHBOARD.md](docs/DASHBOARD.md) |
| QA dan keamanan | [QA-SECURITY.md](docs/QA-SECURITY.md) |
| Integrasi dan UAT | [FINAL-INTEGRATION-UAT.md](docs/FINAL-INTEGRATION-UAT.md) |
| Prosedur release | [RELEASE-RUNBOOK.md](docs/RELEASE-RUNBOOK.md) |

Sebagian dokumen mencatat keadaan pada tahap PR sebelumnya. Cocokkan informasi historis seperti status akun, jumlah migrasi terpasang, URL repositori, dan deployment dengan kode serta environment target saat ini.

## Deployment

Aplikasi ditujukan untuk deployment Next.js di Vercel dengan database Neon PostgreSQL. Pisahkan environment development, Preview/UAT, dan production beserta kredensial databasenya.

Sebelum release production, verifikasi login, RBAC, isolasi organisasi, pembayaran paralel, rekonsiliasi keuangan, tampilan browser, serta backup/restore. Ikuti [release runbook](docs/RELEASE-RUNBOOK.md) dan pastikan persetujuan release serta target infrastruktur sudah benar.

README ini menjelaskan kode di repositori; status deployment, provisioning akun, dan kelulusan UAT live tidak diverifikasi melalui pembaruan dokumentasi ini.
