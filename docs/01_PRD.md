# PRODUCT REQUIREMENTS DOCUMENT (PRD)
## Proyek: KeuanganAngkatan — Sistem Informasi & Manajemen Keuangan Angkatan Mahasiswa

---

## 1. PENDAHULUAN & PROBLEM STATEMENT

### 1.1 Latar Belakang Masalah
Dalam organisasi angkatan mahasiswa di perguruan tinggi, pengelolaan iuran kas menghadapi tantangan operasional dan transparansi yang kronis:
1. **Beban Rekapitulasi Manual bagi Multi-Bendahara:** Tim bendahara biasanya terdiri dari 2 orang atau lebih (Bendahara 1, Bendahara 2, dst.), masing-masing memegang rekening bank atau QRIS berbeda. Saat mahasiswa membayar, mereka mengirimkan bukti transfer via chat personal WhatsApp/LINE. Bendahara kewalahan memilah bukti bayar mana yang masuk ke rekening pribadinya vs rekening rekannya.
2. **Ketiadaan Sistem Tracking Terpusat:** Mahasiswa sering lupa apakah sudah membayar iuran bulan tertentu, nominal yang harus dibayar, atau ke rekening bendahara mana uang harus ditransfer.
3. **Ketidakpercayaan & Ketertutupan Finansial:** Rekap manual sering terlambat dipublikasikan ke angkatan, menimbulkan prasangka dan penurunan kepatuhan pembayaran kas.
4. **Hambatan Login/Registrasi yang Rumit:** Mahasiswa enggan membayar jika diwajibkan mendaftar akun, verifikasi email/password, atau mengunduh aplikasi terpisah hanya untuk membayar uang kas senilai Rp10.000–Rp50.000.
5. **Biaya Payment Gateway yang Tidak Masuk Akal:** Menggunakan payment gateway otomatis (seperti Midtrans/Xendit) membebankan biaya admin Rp2.000–Rp4.500 per transaksi atau persentase MDR, yang sangat memberatkan mahasiswa untuk iuran mikro rutin.

### 1.2 Tujuan Proyek (Goals)
1. **Memudahkan Pembayaran Mahasiswa Tanpa Login:** Mahasiswa cukup membuka link web, memilih kelas, mencari identitas via NIM/nama autocomplete, memilih tagihan, mentransfer via QRIS/Rekening PIC bendahara, dan mengunggah struk.
2. **Alokasi Transaksi per PIC Bendahara:** Setiap metode pembayaran terikat pada PIC Bendahara spesifik. Di dashboard, Bendahara 1 bisa langsung memfilter hanya transaksi yang masuk ke rekening miliknya.
3. **Verifikasi Super Cepat (1-Click Verification):** Bendahara dapat membuka antrean bukti transfer, memverifikasi kesesuaian struk secara visual, dan menyetujui (`Approve`) atau menolak (`Reject`) dalam 1 kali klik.
4. **Transparansi Otomatis Real-time (Google Sheets Sync):** Setiap transaksi yang berstatus `APPROVED` langsung tersinkronisasi otomatis ke Google Spreadsheet publik tanpa perlu input ulang manual.

### 1.3 Batasan & Bukan Tujuan (Non-Goals)
1. **Bukan Sistem Payment Gateway Otomatis:** Sistem ini tidak menggunakan webhook payment gateway pihak ketiga berbayar (Midtrans, Xendit, Tripay). Seluruh transfer murni manual dan diverifikasi oleh bendahara manusia.
2. **Bukan Akun Otentikasi Mahasiswa:** Mahasiswa tidak memiliki akun berbasis username/password. Identifikasi dilakukan via NIM dan nama yang telah terdaftar di database prodi.
3. **Bukan Sistem Akuntansi Perusahaan Kompleks:** Tidak menyediakan jurnal umum ganda (double-entry bookkeeping) atau neraca rugi laba perbankan. Fokus pada kas masuk (iuran mahasiswa) dan pencatatan kas keluar sederhana untuk transparansi publik.

---

## 2. USER PERSONAS

### Persona 1: Mahasiswa Pembayar (Rizky Pratama)
- **Peran:** Mahasiswa Aktif Prodi (Kelas TI-A, NIM 230101001)
- **Karakteristik:** Sibuk dengan tugas kuliah, mengakses aplikasi via smartphone (mobile browser), tidak mau repot registrasi/ingat password baru.
- **Kebutuhan:**
  - Melihat daftar tagihan kas miliknya yang belum lunas.
  - Mendapatkan informasi rekening/QRIS bendahara yang jelas dan mudah di-copy/scan.
  - Mengunggah bukti transfer dalam hitungan detik.
  - Mendapatkan kepastian bahwa pembayarannya sudah tercatat dan diverifikasi.

### Persona 2: Bendahara PIC Rekening (Siti Nurhaliza - Bendahara 1)
- **Peran:** Bendahara Umum 1 Angkatan
- **Karakteristik:** Bertanggung jawab atas Rekening BCA dan QRIS Kas 1. Mengakses via laptop dan HP saat mengecek mutasi mobile banking.
- **Kebutuhan:**
  - Memfilter daftar transaksi masuk hanya untuk metode pembayaran atas namanya.
  - Memeriksa keaslian bukti struk secara cepat (preview gambar besar/zoom).
  - Melakukan 1-Click Approve untuk mempercepat validasi ratusan mahasiswa.
  - Memberikan alasan penolakan jika mutasi bank belum masuk atau nominal tidak sesuai.
  - Menghindari entri ulang ke Google Spreadsheet publik angkatan.

### Persona 3: Koordinator Bendahara / Admin Utama (Farhan - Bendahara 2)
- **Peran:** Bendahara 2 & Koordinator Kas Angkatan
- **Karakteristik:** Bertanggung jawab atas Rekening Mandiri/E-Wallet dan rekap total kas angkatan.
- **Kebutuhan:**
  - Menambahkan data master mahasiswa dan kelas baru.
  - Membuat tagihan iuran kas baru (misal: "Kas September 2026", "Iuran Makrab Angkatan").
  - Menambah/mengubah daftar rekening & PIC Bendahara.
  - Memantau rekapitulasi persentase pelunasan per kelas (TI-A vs TI-B).

---

## 3. USER JOURNEY & ALUR BISNIS

### 3.1 Journey Mahasiswa (Pembayaran Iuran Kas)
```
[Buka Website] 
      │
      ▼
[Pilih Kelas: TI-A] ──► [Ketik NIM / Nama di Search Autocomplete]
                                 │
                                 ▼
                     [Data Mahasiswa Terpilih]
                                 │
                                 ▼
             [Tampil Daftar Tagihan (Lunas / Belum Lunas)]
                                 │
                                 ▼
                    [Pilih Tagihan yang Akan Dibayar]
                                 │
                                 ▼
             [Pilih Metode Pembayaran & PIC Bendahara]
             (Contoh: "QRIS Kas - Bendahara 1" / "BCA - Bendahara 2")
                                 │
                                 ▼
          [Tampil Detail Rekening / QRIS + Tombol Salin No Rek]
                                 │
                                 ▼
               [Mahasiswa Transfer via M-Banking/E-Wallet]
                                 │
                                 ▼
               [Upload File Bukti Transfer (JPG/PNG/WEBP)]
                                 │
                                 ▼
              [Klik "Kirim Bukti Pembayaran"]
                                 │
                                 ▼
           [Status Transaksi Menjadi: PENDING]
                                 │
                                 ▼
       [Mahasiswa Mendapat Kode Transaksi / Link Cek Status]
```

### 3.2 Journey Bendahara (Verifikasi & Sinkronisasi)
```
[Login Admin via /login]
         │
         ▼
[Admin Dashboard: Tab Verifikasi Transaksi]
         │
         ▼
[Filter Berdasarkan: PIC Bendahara / Metode Pembayaran]
         │
         ▼
[Tampil List Transaksi PENDING (Nama, NIM, Nominal, Waktu)]
         │
         ▼
[Klik Baris / Modal Preview Bukti Struk Transfer]
         │
         ├───► [Bukti Valid & Mutasi Masuk] ──► [Klik "APPROVE"]
         │                                            │
         │                                            ▼
         │                             [Status Berubah: APPROVED]
         │                                            │
         │                                            ▼
         │                         [Auto-Sync ke Google Spreadsheet]
         │                                            │
         │                                            ▼
         │                         [Notifikasi Sukses via Sonner Toast]
         │
         └───► [Bukti Palsu / Nominal Kurang] ──► [Klik "REJECT"]
                                                      │
                                                      ▼
                                       [Input Alasan Penolakan]
                                                      │
                                                      ▼
                                       [Status Berubah: REJECTED]
```

---

## 4. PERSYARATAN FUNGSIONAL (FUNCTIONAL REQUIREMENTS)

### Modul 1: Portal Publik Mahasiswa
- **FR-PUB-01: Filter Kelas Dinamis:** Mahasiswa dapat memilih kelas (berasal dari tabel `Class`).
- **FR-PUB-02: Autocomplete Pencarian Identitas:** Mahasiswa dapat mengetikkan minimal 2 karakter NIM atau Nama lengkap; sistem menampilkan dropdown saran dan otomatis mengunci identitas saat dipilih.
- **FR-PUB-03: Ringkasan Tagihan Siswa:** Sistem menampilkan riwayat tagihan mahasiswa bersangkutan (Tagihan Lunas bertanda Badge Hijau, Belum Lunas bertanda Badge Merah/Kuning).
- **FR-PUB-04: Seleksi Metode Pembayaran & PIC:** Menampilkan daftar metode pembayaran aktif dari tabel `PaymentMethod` dengan logo/jenis, nomor rekening, atas nama, dan nama PIC Bendahara.
- **FR-PUB-05: Salin Rekening & Display QRIS:** Tersedia tombol 1-klik untuk menyalin nomor rekening ke clipboard dan modal preview QRIS beresolusi tinggi.
- **FR-PUB-06: Upload Struk Transfer:** Mahasiswa dapat mengunggah file bukti transfer maksimal 5 MB dengan format JPG/PNG/WEBP, dilengkapi preview gambar sebelum dikirim.
- **FR-PUB-07: Tracking Status Pembayaran:** Mahasiswa dapat memeriksa status transaksi miliknya (`PENDING`, `APPROVED`, `REJECTED`) menggunakan kode referensi transaksi atau via pencarian NIM.
- **FR-PUB-08: Halaman Transparansi Kas Angkatan:** Publikasi saldo total kas masuk, pengeluaran kas, grafik pelunasan per kelas, dan tabel transaksi approved (tanpa menampilkan data privat/rekening pribadi mahasiswa).

### Modul 2: Autentikasi & Otorisasi Bendahara
- **FR-AUTH-01: Login Bendahara Terpusat:** Login menggunakan email/username dan password terenkripsi bcrypt.
- **FR-AUTH-02: Session Handling:** Sesi berbasis JWT dengan NextAuth v5 yang aman, otomatis logout saat sesi kedaluwarsa.
- **FR-AUTH-03: Route Protection via `proxy.ts`:** Seluruh rute `/admin/*` dijamin tidak bisa diakses tanpa sesi valid dan diarahkan langsung ke `/login`.

### Modul 3: Manajemen Verifikasi Transaksi (1-Click Verification)
- **FR-VER-01: Antrean Verifikasi Real-time:** Daftar transaksi berstatus `PENDING` diurutkan dari yang paling baru.
- **FR-VER-02: Filter Multi-Bendahara (PIC Filter):** Filter dropdown untuk memilah transaksi berdasarkan `paymentMethodId` atau PIC Bendahara (misal: "Hanya Rekening Saya (Siti - BCA)").
- **FR-VER-03: Modal Dialog Preview Struk:** Dialog besar dengan fitur zoom/rotasi gambar bukti bayar dan perbandingan nominal tagihan vs nominal yang dibayarkan.
- **FR-VER-04: Verifikasi 1-Klik (Approve):** Tombol aksi cepat untuk mengubah status transaksi menjadi `APPROVED` secara instan.
- **FR-VER-05: Penolakan dengan Alasan (Reject):** Tombol tolak yang membuka input dialog untuk mencatat alasan penolakan (misal: "Struk buram", "Uang belum masuk ke rekening PIC").

### Modul 4: Manajemen Master Data
- **FR-MST-01: Master Kelas:** Tambah, edit, dan arsipkan data kelas (misal: TI-23-A, TI-23-B).
- **FR-MST-02: Master Mahasiswa:** Import batch mahasiswa via CSV/Excel atau input satu per satu (NIM, Nama, Kelas, No HP/WhatsApp).
- **FR-MST-03: Master Tagihan (Bill):** Buat tagihan kas baru (Judul tagihan, Nominal, Tanggal Jatuh Tempo, Deskripsi).
- **FR-MST-04: Master Metode Pembayaran (PaymentMethod):**
  - Nama Bank/E-Wallet (contoh: BCA, Mandiri, Gopay, QRIS Kas).
  - Nomor Rekening / Nomor HP E-Wallet.
  - Atas Nama Rekening.
  - Upload Gambar Barcode QRIS.
  - **Nama PIC Bendahara Pemilik** (misal: "Bendahara 1 - Siti", "Bendahara 2 - Farhan").
  - Status aktif/non-aktif.

### Modul 5: Integrasi Google Spreadsheet
- **FR-GSH-01: Auto-Append Row:** Saat transaksi di-approve, sistem secara background mengirimkan data ke Google Sheet melalui Google Sheets API v4.
- **FR-GSH-02: Status Sync Tracking:** Mencatat status sinkronisasi (`SYNCED` atau `FAILED`) dan waktu sinkronisasi.
- **FR-GSH-03: Manual Re-Sync:** Menyediakan tombol re-sync manual jika terjadi kendala jaringan saat auto-append.

---

## 5. PERSYARATAN NON-FUNGSIONAL (NON-FUNCTIONAL REQUIREMENTS)

### 5.1 Performa
1. **Waktu Muat Halaman (Page Load):** Halaman publik mahasiswa harus memiliki Largest Contentful Paint (LCP) < 1.5 detik pada jaringan seluler 4G.
2. **Kecepatan Autocomplete:** Respon pencarian nama/NIM < 150 ms dengan debounce 300 ms.
3. **Eksekusi Verifikasi:** Respon Server Action saat verifikasi 1-klik < 500 ms (proses background sinkronisasi Google Sheets tidak boleh memblokir UI feedback).

### 5.2 Keandalan & Integritas Data
1. **ACID Transaction:** Mutasi status transaksi dibungkus dalam Prisma transaction `$transaction` untuk menjamin konsistensi status tagihan.
2. **Pencegahan Double-Submission:** Form pembayaran publik mengunci tombol submit dan menampilkan indikator loading saat proses upload sedang berlangsung.
3. **Penyimpanan Berkas Struk:** File bukti bayar disimpan dengan nama unik teracak (`uuid` + timestamp) guna mencegah konflik nama file dan overwrite.

### 5.3 Keamanan (Security)
1. **Proteksi Unggah Berkas:**
   - Validasi ketat MIME type (`image/jpeg`, `image/png`, `image/webp`).
   - Ekstensi file disanitasi.
   - Ukuran dibatasi maksimal 5 MB.
2. **Proteksi Rute Admin Terpusat:** Seluruh akses rute `/admin/*` dikunci oleh handler `proxy.ts`. Upaya akses langsung tanpa cookie sesi valid ditolak secara absolut.
3. **Sanitasi Input:** Semua parameter request divalidasi via Zod untuk mencegah SQL Injection (meskipun Prisma sudah parameterized) dan Cross-Site Scripting (XSS).
4. **Credential Secrets:** Kredensial Google Service Account, NextAuth Secret, dan konfigurasi database disimpan dalam environment variable (`.env.local`) dan tidak pernah dikomit ke repositori publik.

---

## 6. METRIK KEBERHASILAN (SUCCESS METRICS)
1. **Adopsi Pembayaran:** 95%+ mahasiswa angkatan melakukan konfirmasi pembayaran kas melalui web KasAngkatan tanpa chat manual ke bendahara.
2. **Efisiensi Waktu Bendahara:** Waktu verifikasi bukti transfer kas angkatan terpangkas hingga 80% (dari rata-rata 3 jam per bulan menjadi < 30 menit).
3. **Zero Reconciliation Discrepancy:** Selisih antara mutasi bank fisik bendahara dan catatan di Google Sheets bernilai Rp0 (100% akurat).
