# SIMBARA v2

SIMBARA v2 adalah aplikasi inventaris internal berbasis React untuk pencatatan barang, verifikasi rutin, mutasi lokasi, laporan kerusakan, scan QR, cetak label QR, dan export laporan Excel.

## Tech Stack

- React 19
- TypeScript
- Vite
- Tailwind CSS 4
- Supabase
- Vitest
- `html5-qrcode` untuk scan QR
- `qrcode` untuk generate label QR
- `xlsx` untuk export Excel

## Prasyarat

Pastikan sudah terpasang:

- Node.js 20 atau lebih baru
- npm
- Akun/project Supabase

Untuk Windows PowerShell, beberapa mesin memblokir `npm.ps1`. Jika itu terjadi, gunakan `npm.cmd` pada semua command npm.

## Setup Lokal

Masuk ke folder project:

```bash
cd simbara-v2
```

Install dependency:

```bash
npm install
```

Jika di PowerShell gagal karena execution policy:

```bash
npm.cmd install
```

## Setup Environment

Buat file `.env.local` di root `simbara-v2`:

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=your-supabase-publishable-key
```

Nilai tersebut bisa diambil dari dashboard Supabase:

- `VITE_SUPABASE_URL`: Project Settings > API > Project URL
- `VITE_SUPABASE_PUBLISHABLE_KEY`: Project Settings > API > publishable/anon public key

Jangan commit `.env.local`. File ini sudah diabaikan oleh `.gitignore`.

## Setup Database Supabase

1. Buka Supabase Dashboard.
2. Pilih project.
3. Masuk ke SQL Editor.
4. Copy seluruh isi file `supabase-schema.sql`.
5. Jalankan query tersebut.

Schema akan membuat tabel:

- `items`
- `locations`
- `officers`
- `activity_logs`
- `system_profiles`

Schema juga mengisi data awal lokasi, petugas, dan profil sistem.

PIN awal aplikasi:

```text
1234
```

## Menjalankan Aplikasi

Development server:

```bash
npm run dev
```

Versi PowerShell-safe:

```bash
npm.cmd run dev
```

Default URL:

```text
http://localhost:5173
```

Jika ingin bind ke localhost eksplisit:

```bash
npm.cmd run dev -- --host 127.0.0.1 --port 5173
```

## Script Project

Run test:

```bash
npm.cmd test
```

Run lint:

```bash
npm.cmd run lint
```

Build production:

```bash
npm.cmd run build
```

Preview hasil build:

```bash
npm.cmd run preview
```

## Struktur Folder

```text
simbara-v2/
  public/                  aset publik untuk logo, maskot, favicon
  src/
    components/            komponen UI umum dan QR label
    features/              halaman/fitur utama aplikasi
    lib/                   helper umum seperti Supabase client, session, format
    services/              service data dan utility inventaris
    types/                 tipe TypeScript domain inventaris
    App.tsx                shell aplikasi, navigasi, quick search, notifikasi
    main.tsx               entry React
  supabase-schema.sql      schema database Supabase
  package.json             script dan dependency
```

## Fitur Utama

- Dashboard ringkasan inventaris.
- Database barang dengan search dan filter.
- Scan QR via kamera, upload gambar QR, atau input manual.
- Detail barang, riwayat, verifikasi, mutasi, laporan masalah, cetak QR.
- Cetak QR massal dengan filter lokasi.
- Export Excel untuk inventaris dan log.
- Pengaturan profil sistem, lokasi, petugas, dan PIN.

## Troubleshooting

Jika muncul error:

```text
Supabase URL dan publishable key belum dikonfigurasi.
```

Pastikan `.env.local` ada di folder `simbara-v2` dan berisi `VITE_SUPABASE_URL` serta `VITE_SUPABASE_PUBLISHABLE_KEY`.

Jika `npm run dev` gagal di PowerShell:

```bash
npm.cmd run dev
```

Jika data tidak muncul:

- Pastikan `supabase-schema.sql` sudah dijalankan.
- Pastikan URL dan key Supabase sesuai project.
- Pastikan browser tidak memakai cache lama.
- Cek console browser untuk error Supabase.

Jika kamera QR tidak aktif:

- Gunakan HTTPS atau `localhost`.
- Pastikan izin kamera browser diaktifkan.
- Gunakan fallback upload foto QR atau pencarian manual.

## Catatan Production

Schema saat ini mengizinkan akses read/write untuk role publik Supabase agar setup lokal cepat. Sebelum production, sebaiknya:

- Gunakan Supabase Auth.
- Batasi RLS berdasarkan role admin/operator/viewer.
- Jangan simpan PIN sebagai plaintext.
- Pisahkan akses admin untuk pengaturan master data.
- Gunakan backup database berkala.
