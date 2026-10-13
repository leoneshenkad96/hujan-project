# Aktivasi Owner Pertama — Vinca UAT (Windows PowerShell)

**Hanya untuk UAT terisolasi, bukan production.** Tidak perlu Resend atau Vercel.

## Persiapan
1. Gunakan PC pribadi/terpercaya dengan Node.js 22+, dan clone repository Vinca di branch `integration/final-uat`.
2. `npm ci`.
3. Dapatkan **connection string langsung dari Neon** untuk project Vinca (`fancy-cell-64250119`), branch **`uat-isolated-2026-10-13`** (`br-long-wildflower-b3nsciay`), database **`eventorganizer`**. Jangan gunakan connection string default/production; jangan masukkan URL ke issue, chat, atau GitHub.
4. Dalam PowerShell interaktif di folder repository, atur nilai *hanya di sesi terminal*:
   ```powershell
   $env:DATABASE_URL = Read-Host "Neon UAT connection string"
   $env:VINCA_BOOTSTRAP_BRANCH = "br-long-wildflower-b3nsciay"
   $env:VINCA_BOOTSTRAP_ACK = "ISOLATED_UAT_ONLY"
   ```
   **Catatan:** `Read-Host` untuk connection string dapat menampilkan karakter di terminal; gunakan terminal privat, atau isi sebagai environment secret melalui password manager/secret injector yang mendukungnya. Jangan screenshot atau bagikan isi terminal.

## Jalankan
```powershell
node scripts/bootstrap-uat-owner.mjs
```
Skrip memverifikasi identitas project, branch, dan database **di server** sebelum meminta password. Buat password kuat minimal 12 karakter, konfirmasikan dalam input tersembunyi. Skrip menolak akun Owner yang sudah aktif atau memiliki password hash, dan tidak akan menimpa password lama.

## Pemeriksaan setelah aktivasi
```powershell
$env:VINCA_UAT_BRANCH = "br-long-wildflower-b3nsciay"
$env:VINCA_UAT_VERIFY_ACK = "ISOLATED_UAT_ONLY"
node scripts/verify-uat-schema.mjs
```
Gunakan Neon SQL Editor, pastikan branch UAT yang sama dipilih; jalankan kueri *read-only*:
```sql
SELECT count(*) FILTER (WHERE u.active AND u.password_hash IS NOT NULL) AS ready_owners
FROM users u JOIN organizations o ON u.organization_id=o.id
WHERE o.slug='vinca-uat' AND u.role='owner';
```
Harus menghasilkan **1**.

## Batas verifikasi
Aktivasi akun di database bukan bukti login HTTP/browser berhasil. Pengujian login penuh membutuhkan aplikasi berjalan dengan koneksi UAT (bukan production), lalu cek login, logout, session, role, dan multi-tenant. Jangan men-deploy ke Vercel atau mengubah production tanpa persetujuan.
