# Aruna Cafee - Self-Order, Reservasi & Pemotongan Stok Bahan Baku

Sistem aplikasi web restoran/kafe modern mobile-first berbasis **Next.js (App Router)** dan **Supabase (PostgreSQL + Storage + Realtime)**, dirancang khusus sesuai alur operasional kafe:

## Fitur Utama

1. **Guest Self-Order Ala Gacoan (`/order`)**:
   - Deteksi nomor meja otomatis via parameter QR code (`/order?table=Meja%2001`).
   - Pilihan varian menu (Level pedas 0–4, topping, dan catatan khusus).
   - Keranjang belanja melayang (floating cart) responsif.
   - Mode **Reservasi Meja** (pemilihan tanggal, jam kedatangan, dan jumlah tamu).
   - Checkout dengan 2 opsi pembayaran:
     - **Bayar di Kasir** (Tunai / EDC).
     - **QRIS BRI Merchant** (Menampilkan QR statis kafe + nominal total + formulir upload bukti transfer).
   - Pelacakan status pesanan live (`/order/status/[id]`).

2. **Dashboard Kasir & Kitchen (`/kasir`)**:
   - Alert audio lonceng sintetis (*Web Audio API*) saat order baru masuk tanpa butuh file mp3 eksternal.
   - Notifikasi otomatis ke grup WhatsApp staf kasir via API Gateway (`/api/notify-wa`).
   - Modal preview dan zoom screenshot bukti transfer QRIS BRI.
   - Alur status pesanan: *Menunggu Konfirmasi ➔ Diterima / Proses Dapur ➔ Selesai & Potong Stok*.
   - **Tombol Print Struk Thermal iware**: Format cetak thermal ESC/POS 58mm/80mm (nama kafe, nomor meja, rincian menu, varian, grand total, metode bayar).
   - **Checkbox Manual Majoo**: Penanda pengingat bagi kasir untuk mencatat transaksi ke POS Majoo demi pembukuan internal.

3. **Resep & Pemotongan Stok Bahan Baku Otomatis (`/kasir/stok`)**:
   - Master bahan baku dengan satuan (gram, ml, pcs, porsi) dan peringatan batas minimum stok.
   - Master Resep (BOM - *Bill of Materials*): pemetaan pemakaian bahan baku per menu/porsi.
   - Pemotongan otomatis: Ketika order diubah ke status **"Selesai"**, sistem secara otomatis mendebit stok bahan baku sesuai resep dan mencatatnya ke riwayat mutasi.
   - Fitur restock bahan baku manual dengan pencatatan alasan.

4. **Generator QR Code Meja (`/kasir/meja`)**:
   - Membuat QR code untuk Meja 01 s/d Meja N secara dinamis.
   - Tombol cetak stiker barcode meja siap tempel di setiap meja kafe.

---

## Konfigurasi Supabase

Skema SQL lengkap, fungsi stored procedure pemotongan stok otomatis, dan data awal (*seed data*) telah tersedia di file:
`supabase/schema.sql`

Langkah menghubungkan ke Supabase:
1. Buat project baru di [Supabase Console](https://supabase.com).
2. Buka menu **SQL Editor**, salin dan jalankan seluruh isi file `supabase/schema.sql`.
3. Buat Bucket Storage bernama `payment_proofs` (beri akses public read agar kasir bisa melihat bukti upload).
4. Buat file `.env.local` dan isi kredensial berikut:
```env
NEXT_PUBLIC_SUPABASE_URL=https://xxxxxxxxxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJh......
SUPABASE_SERVICE_ROLE_KEY=eyJh......

# Opsional untuk WhatsApp Gateway (Fonnte / Wablas)
WA_GATEWAY_API_URL=https://api.fonnte.com/send
WA_GATEWAY_API_KEY=your-api-key
WA_KASIR_GROUP_ID=120363024823948293@g.us
```

> **Catatan**: Jika Supabase belum dikonfigurasi, sistem secara otomatis berjalan dalam mode *Smart Local Fallback* sehingga seluruh fitur (order, upload bukti, mutasi stok, cetak struk) dapat langsung diuji coba secara mulus di `npm run dev`.

---

## Menjalankan Proyek

```bash
# Menjalankan server development
npm run dev

# Membangun produksi
npm run build
npm run start
```
Buka browser di `http://localhost:3000`.
