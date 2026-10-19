# IMPLEMENTATION ROADMAP & STEP-BY-STEP CHECKLIST
## Proyek: KeuanganAngkatan (Sistem Informasi & Manajemen Keuangan Angkatan Mahasiswa)

Roadmap ini merupakan panduan eksekusi bertahap dari tahap persiapan hingga sistem siap dideploy ke lingkungan produksi. Setiap fase memiliki kriteria penyelesaian (*definition of done*) yang jelas.

---

## 📋 IKHTISAR FASE IMPLEMENTASI

```
[Phase 1] Pondasi Sistem, Dependencies & Design System (shadcn/ui)
   │
   ▼
[Phase 2] Pemodelan Basis Data & Seeding Multi-Bendahara (Prisma + SQLite)
   │
   ▼
[Phase 3] Autentikasi Bendahara & Proteksi Terpusat (NextAuth + proxy.ts)
   │
   ▼
[Phase 4] Portal Publik Mahasiswa (Autocomplete NIM, Upload Struk, Cek Kas)
   │
   ▼
[Phase 5] Dashboard Verifikasi 1-Klik & Auto-Sync Google Sheets API
   │
   ▼
[Phase 6] Polishing UI/UX, Uji Coba Transaksional & Audit Kesiapan Rilis
```

---

## 🛠️ DETAIL CHECKLIST PER FASE

### PHASE 1: Pondasi Sistem, Dependencies & Design System Setup
- [ ] **1.1 Verifikasi Versi Next.js & Tailwind CSS:**
  - Periksa integrasi Next.js 16 App Router dengan Tailwind CSS v4.
  - Setup font modern Inter/Geist dan variabel tema warna Slate/Zinc di `app/globals.css`.
- [ ] **1.2 Inisialisasi Komponen shadcn/ui:**
  - Tambahkan komponen dasar shadcn/ui: `button`, `input`, `card`, `badge`, `dialog`, `table`, `select`, `command`, `separator`, `tooltip`, `tabs`, `textarea`, `progress`, `alert`.
  - Pasang library notifikasi `sonner` dan daftarkan `<Toaster />` di root layout `app/layout.tsx`.
- [ ] **1.3 Konfigurasi Utilitas Dasar:**
  - Setup `lib/utils.ts` untuk fungsi helper `cn()`, `formatRupiah()`, format tanggal lokal Indonesia.
  - Buat folder statis untuk unggahan berkas: `public/uploads/proofs/` dan `public/uploads/methods/`.

---

### PHASE 2: Pemodelan Basis Data & Seeding (Prisma + Better-SQLite3)
- [ ] **2.1 Skema Prisma (`prisma/schema.prisma`):**
  - Tulis model `Class` (Kelas mahasiswa).
  - Tulis model `Student` (Relasi ke Class, index NIM & Nama).
  - Tulis model `PaymentMethod` (Metode pembayaran terpisah dengan `picName` bendahara, no rekening, dan image QRIS).
  - Tulis model `Bill` (Tagihan kas).
  - Tulis model `Transaction` (Relasi Student, Bill, PaymentMethod, status, `sheetSyncStatus`).
  - Tulis model `Admin` (Akun login bendahara).
- [ ] **2.2 Migrasi Basis Data:**
  - Jalankan `npx prisma db push` atau migrasi untuk membentuk database lokal `prisma/dev.db`.
  - Pastikan adapter `@prisma/adapter-better-sqlite3` terkonfigurasi pada `lib/db.ts`.
- [ ] **2.3 Seeding Awal (`prisma/seed.ts`):**
  - Buat akun 2 Bendahara (Siti Nurhaliza - Bendahara 1 & Farhan Mahendra - Bendahara 2) dengan password hash bcrypt.
  - Buat 2 kelas percontohan (`TI-2023-A` dan `TI-2023-B`).
  - Buat data 10 mahasiswa percontohan.
  - Buat 3 metode pembayaran dengan PIC berbeda (BCA - Siti, QRIS - Siti, Mandiri - Farhan).
  - Buat 2 tagihan kas aktif.
  - Jalankan `npx prisma db seed`.

---

### PHASE 3: Autentikasi Bendahara & Proteksi Rute Terpusat (`proxy.ts`)
- [ ] **3.1 Konfigurasi NextAuth.js v5 (`lib/auth.ts`):**
  - Konfigurasi `CredentialsProvider` yang mencocokkan input email/username dan verifikasi password hash admin dari tabel `Admin`.
  - Pasang callback JWT dan Session untuk menyertakan `id`, `name`, `email`, dan `role`.
- [ ] **3.2 Implementasi Proteksi Rute `proxy.ts`:**
  - Buat file `proxy.ts` di root proyek untuk memfilter akses ke `/admin/*`.
  - Cek cookie sesi valid; jika tidak ada, redirect user ke `/login?callbackUrl=...`.
  - Jika user sudah login dan mengakses `/login`, alihkan langsung ke `/admin`.
- [ ] **3.3 Halaman Login Admin (`app/login/page.tsx` / `app/(auth)/login/page.tsx`):**
  - **Base Template:** Mengadopsi langsung struktur dari [`app/login/page.tsx`](file:///home/Akuma/projects/my-bendahara/app/login/page.tsx) dan [`components/login-form.tsx`](file:///home/Akuma/projects/my-bendahara/components/login-form.tsx).
  - Menggunakan komponen shadcn `FieldGroup`, `Field`, `FieldLabel`, `Input`, `Button`, `FieldDescription`.
  - Hubungkan form login dengan Server Action `loginAdminAction` (NextAuth Credentials) dan feedback notifikasi `sonner`.

---

### PHASE 4: Portal Publik Mahasiswa (Tanpa Login)
- [ ] **4.1 Layout Publik Mahasiswa (`app/(public)/layout.tsx`):**
  - Navbar publik yang bersih dengan logo KasAngkatan, tautan "Bayar Kas", "Cek Status", dan "Transparansi Kas".
  - Footer dengan informasi identitas angkatan dan PIC Bendahara.
- [ ] **4.2 Form Pembayaran Kas Mahasiswa (`app/(public)/bayar/page.tsx`):**
  - Komponen Filter Kelas (`Select`).
  - Komponen Pencarian Autocomplete NIM / Nama (`Command` Combobox dengan debounce).
  - Tampilan Kartu Identitas Siswa & Tagihan yang Belum Dibayar.
  - Komponen Seleksi Metode Pembayaran & PIC Bendahara (Tampil nomor rekening, tombol Salin No Rek, dan preview QRIS).
  - Dropzone unggah bukti struk transfer dengan preview gambar dan validasi ukuran < 5 MB.
  - Tombol Submit dengan indikator loading (`Button`).
  - Dialog / Card Sukses yang menampilkan Kode Referensi Transaksi.
- [ ] **4.3 Halaman Tracking Status Pembayaran (`app/(public)/status/page.tsx`):**
  - Input pencarian kode referensi atau NIM.
  - Tabel transaksi dengan `Badge` status (`PENDING`, `APPROVED`, `REJECTED`).
  - Menampilkan alasan penolakan jika status `REJECTED`.
- [ ] **4.4 Halaman Transparansi Kas Angkatan (`app/(public)/transparansi/page.tsx`):**
  - Statistik total kas masuk, persentase pelunasan per kelas.
  - Tabel publik transaksi `APPROVED` terkini.

---

### PHASE 5: Dashboard Multi-Bendahara (1-Click Verification) & Google Sheets Sync
- [ ] **5.1 Layout Dashboard Admin (`app/(admin)/layout.tsx` / `app/dashboard`):**
  - **Base Template:** Mengadopsi arsitektur dari [`app/dashboard/page.tsx`](file:///home/Akuma/projects/my-bendahara/app/dashboard/page.tsx).
  - Wrapper: `SidebarProvider` (`--sidebar-width`, `--header-height`) + `<SidebarInset>`.
  - Integrasikan [`components/app-sidebar.tsx`](file:///home/Akuma/projects/my-bendahara/components/app-sidebar.tsx) (`variant="inset"`), disesuaikan menu: Verifikasi 1-Klik, Tagihan, Metode Rekening PIC, Siswa, Kelas.
  - Integrasikan [`components/site-header.tsx`](file:///home/Akuma/projects/my-bendahara/components/site-header.tsx) dengan `SidebarTrigger` dan breadcrumb.
  - Integrasikan [`components/section-cards.tsx`](file:///home/Akuma/projects/my-bendahara/components/section-cards.tsx) untuk statistik kas dan [`components/chart-area-interactive.tsx`](file:///home/Akuma/projects/my-bendahara/components/chart-area-interactive.tsx) untuk visualisasi tren kas.
- [ ] **5.2 Halaman Verifikasi 1-Klik (`app/(admin)/admin/verification/page.tsx`):**
  - Mengadopsi struktur tabel data dari [`components/data-table.tsx`](file:///home/Akuma/projects/my-bendahara/components/data-table.tsx).
  - Filter dropdown berdasarkan PIC Bendahara / Rekening (memudahkan Bendahara 1 hanya melihat transaksi ke rekeningnya).
  - Tabel antrean transaksi `PENDING`.
  - Modal Preview Struk Transfer resolusi tinggi.
  - Tombol Aksi Cepat:
    - **[Approve]**: 1-klik untuk menyetujui transaksi.
    - **[Reject]**: Membuka dialog input alasan penolakan.
- [ ] **5.3 Integrasi Google Sheets API (`lib/google-sheets.ts`):**
  - Konfigurasi Service Account auth via JSON credentials.
  - Logika append baris otomatis saat transaksi berstatus `APPROVED`.
  - Penanganan error: Jika Google Sheets offline/timeout, transaksi lokal tetap tersimpan dan diberi flag `sheetSyncStatus = "FAILED"`.
  - Tombol manual **[Retry Sync]** di dashboard untuk transaksi yang berstatus `FAILED`.
- [ ] **5.4 Master Data Management:**
  - Halaman CRUD Metode Pembayaran & PIC Rekening (`/admin/methods`).
  - Halaman CRUD Tagihan Iuran Kas (`/admin/bills`).
  - Halaman Manajemen Mahasiswa & Kelas (`/admin/students`).

---

### PHASE 6: Polishing UI/UX, Uji Coba Transaksional & Final Hand-off
- [ ] **6.1 Uji Alur Transaksi End-to-End (E2E Flow):**
  - Simulasi mahasiswa membayar via browser mobile -> upload struk -> status PENDING.
  - Simulasi bendahara login -> filter rekening miliknya -> preview struk -> klik Approve.
  - Verifikasi baris transaksi masuk ke Google Sheet publik secara instan.
- [ ] **6.2 Audit Aturan Proyek (Compliance Check):**
  - Pastikan 100% komponen UI menggunakan shadcn/ui tanpa elemen native terlarang.
  - Pastikan type-safety strict tanpa tipe `any`.
  - Pastikan seluruh rute `/admin/*` terlindungi oleh `proxy.ts`.
- [ ] **6.3 Finalisasi Dokumentasi & User Manual:**
  - Sediakan ringkasan cara menjalankan project untuk tim bendahara angkatan.

---

## 🚦 DEFINISI PENYELESAIAN (DEFINITION OF DONE)
Sistem KasAngkatan dinyatakan siap produksi apabila:
1. Mahasiswa dapat menyelesaikan pengunggahan bukti bayar kas dalam waktu kurang dari 60 detik di smartphone tanpa login.
2. Setiap bendahara dapat langsung memfilter dan memverifikasi pembayaran pada rekening PIC miliknya dalam 1-klik.
3. Transaksi approved tercatat di SQLite dan ter-append secara otomatis ke lembar Google Spreadsheet publik.
4. Seluruh aturan shadcn/ui dan proteksi rute `proxy.ts` terverifikasi 100% tanpa pelanggaran.
