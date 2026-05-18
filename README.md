# SIMBARA v2

SIMBARA v2 adalah aplikasi inventaris internal untuk Lapas Kelas IIB Tanjung. Aplikasi ini memakai React, TypeScript, Vite, Tailwind CSS, Supabase, QR scanner, QR label printing, dan export Excel.

## Fitur

- Dashboard ringkasan inventaris, barang rusak, barang belum dicek, dan aktivitas terbaru.
- Database barang dengan pencarian, filter lokasi, kondisi, status, dan status pengecekan.
- Scan QR lewat kamera, upload foto QR, atau pencarian manual.
- Detail barang dengan verifikasi rutin, mutasi lokasi, laporan kerusakan, riwayat, cetak QR, dan hapus barang.
- Cetak QR massal untuk semua barang, dengan pencarian dan filter lokasi.
- Export Excel untuk inventaris lengkap, per lokasi, barang rusak, dan log bulan berjalan.
- Pengaturan profil sistem, master lokasi, master petugas, dan PIN.

## Setup

1. Install dependencies:

```bash
npm install
```

2. Buat `.env.local`:

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

3. Jalankan schema di Supabase SQL Editor:

```sql
-- lihat file supabase-schema.sql
```

4. Jalankan aplikasi:

```bash
npm run dev
```

Jika PowerShell memblokir `npm.ps1`, gunakan:

```bash
npm.cmd run dev
```

## Script

```bash
npm.cmd test
npm.cmd run build
npm.cmd run lint
npm.cmd run preview
```

## Catatan Production

PIN awal dari schema adalah `1234`. Schema saat ini memberi akses read/write ke role `anon` agar migrasi lokal cepat. Sebelum dipakai production, ganti model akses ke Supabase Auth dan row level security berbasis role operator/admin.

## Struktur

- `src/App.tsx`: shell aplikasi, navigasi, notifikasi, quick search.
- `src/features/`: view utama aplikasi.
- `src/services/inventory.service.ts`: akses data Supabase.
- `src/services/inventory.utils.ts`: helper filter, pagination, dashboard, notifikasi, QR parsing.
- `src/components/`: komponen UI dan label QR.
- `supabase-schema.sql`: schema database awal.
