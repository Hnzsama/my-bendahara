# PROJECT CODING & ARCHITECTURE RULES: "KeuanganAngkatan"

Dokumen ini merupakan aturan baku dan absolut bagi seluruh tim pengembang serta AI Agent dalam membangun aplikasi web **KeuanganAngkatan** (Sistem Informasi & Manajemen Keuangan Angkatan Mahasiswa).

---

## 1. GOLDEN RULE: UI & KOMPONEN (SHADCN/UI 100%)
1. **Wajib Komponen shadcn/ui:** Selama terdapat komponen padanan di library **shadcn/ui**, developer/AI **DILARANG KERAS** menggunakan tag HTML native mentah!
   - ❌ DILARANG: `<button>` ➔ ✅ WAJIB: `<Button variant="..." size="...">`
   - ❌ DILARANG: `<input>` ➔ ✅ WAJIB: `<Input ...>`
   - ❌ DILARANG: `<textarea>` ➔ ✅ WAJIB: `<Textarea ...>`
   - ❌ DILARANG: `<select>` / `<option>` ➔ ✅ WAJIB: `<Select>`, `<SelectTrigger>`, `<SelectContent>`, `<SelectItem>`
   - ❌ DILARANG: `<dialog>` / modal custom ➔ ✅ WAJIB: `<Dialog>`, `<DialogContent>`, `<DialogHeader>`, `<DialogFooter>`
   - ❌ DILARANG: `<table>`, `<tr>`, `<td>` mentah ➔ ✅ WAJIB: `<Table>`, `<TableHeader>`, `<TableRow>`, `<TableCell>`, `<TableBody>`
   - ❌ DILARANG: Badge/pill manual `<div>` ➔ ✅ WAJIB: `<Badge variant="...">`
   - ❌ DILARANG: Alert / box peringatan custom ➔ ✅ WAJIB: `<Alert>`, `<AlertTitle>`, `<AlertDescription>`
   - ❌ DILARANG: Notification / alert window native ➔ ✅ WAJIB: `sonner` (`toast.success()`, `toast.error()`)
   - ❌ DILARANG: Box container card mentah ➔ ✅ WAJIB: `<Card>`, `<CardHeader>`, `<CardTitle>`, `<CardDescription>`, `<CardContent>`, `<CardFooter>`
   - ❌ DILARANG: Tooltip custom ➔ ✅ WAJIB: `<Tooltip>`, `<TooltipTrigger>`, `<TooltipContent>`
   - ❌ DILARANG: Dropdown menu manual ➔ ✅ WAJIB: `<DropdownMenu>`, `<DropdownMenuTrigger>`, `<DropdownMenuContent>`, `<DropdownMenuItem>`
2. **Ikonografi:** Gunakan **`lucide-react`** secara konsisten untuk seluruh ikon (ukuran seragam, semantik jelas).
3. **Pemberitahuan Interaktif:** Gunakan library **`sonner`** sebagai toast notification resmi sistem.

---

## 2. ATURAN DESIGN SYSTEM & STYLING
1. **Palet Warna Modern & Elegan:**
   - Gunakan palet Slate/Zinc dengan kontras yang tajam dan ramah mata (WCAG AAA compliant).
   - Warna aksen: Indigo/Blue/Emerald untuk status finansial (contoh: Emerald untuk `APPROVED`, Amber untuk `PENDING`, Rose/Destructive untuk `REJECTED`).
2. **Desain Clean & Glassmorphism Halus:**
   - Background canvas bersih, kartu dengan border tipis halus (`border-border/60`), efek shadow lembut (`shadow-sm`, `shadow-md`), serta backdrop blur pada navbar/dialog (`backdrop-blur-md bg-background/80`).
3. **Tipografi & Hirarki Visual:**
   - Gunakan font sans-serif modern (Inter / Geist).
   - Hirarki judul tajam: `tracking-tight font-semibold` atau `font-bold`.
   - Hindari teks terlalu kecil atau kontras rendah (hindari `text-gray-400` di background putih).
4. **Responsivitas Mutlak:**
   - Semua tampilan publik (Portal Mahasiswa) harus Mobile-First karena 90%+ mahasiswa melakukan pembayaran dan upload bukti transfer lewat smartphone.
   - Dashboard Admin harus responsif dan nyaman digunakan di tablet maupun desktop laptop bendahara.

---

## 3. ATURAN BASE TAMPILAN LOGIN & DASHBOARD (MANDATORY REFERENCE)
Seluruh pengerjaan tampilan login dan dashboard admin **WAJIB MENGIKUTI BASE/TEMPLAT RESMI YANG SUDAH TERSEDIA DI PROYEK**:

1. **Base Tampilan Login Admin:**
   - **File Referensi Utama:** [`app/login/page.tsx`](file:///home/Akuma/projects/my-bendahara/app/login/page.tsx) dan [`components/login-form.tsx`](file:///home/Akuma/projects/my-bendahara/components/login-form.tsx).
   - **Layout Shell:** Menggunakan wrapper layout:
     ```tsx
     <div className="flex min-h-svh flex-col items-center justify-center gap-6 bg-background p-6 md:p-10">
       <div className="w-full max-w-sm">
         <LoginForm />
       </div>
     </div>
     ```
   - **Form Pattern:** Menggunakan komponen form yang sudah terpasang (`FieldGroup`, `Field`, `FieldLabel`, `Input`, `Button`, `FieldDescription`, `FieldSeparator`).
   - **Branding & Auth:** Disesuaikan untuk KasAngkatan (Judul: *"KasAngkatan — Portal Bendahara"*, input Email/Username & Password, terintegrasi dengan NextAuth Credentials).

2. **Base Tampilan Dashboard Admin & Verifikasi:**
   - **File Referensi Utama:** [`app/dashboard/page.tsx`](file:///home/Akuma/projects/my-bendahara/app/dashboard/page.tsx) dan ekosistem komponennya:
     - [`components/app-sidebar.tsx`](file:///home/Akuma/projects/my-bendahara/components/app-sidebar.tsx) (`variant="inset"`)
     - [`components/site-header.tsx`](file:///home/Akuma/projects/my-bendahara/components/site-header.tsx)
     - [`components/section-cards.tsx`](file:///home/Akuma/projects/my-bendahara/components/section-cards.tsx) (Metrik total kas masuk, kas pending, saldo kas)
     - [`components/chart-area-interactive.tsx`](file:///home/Akuma/projects/my-bendahara/components/chart-area-interactive.tsx) (Grafik interaktif arus kas)
     - [`components/data-table.tsx`](file:///home/Akuma/projects/my-bendahara/components/data-table.tsx) (Tabel verifikasi kas & master data)
   - **Layout Shell:** Seluruh halaman admin wajib dibungkus dalam arsitektur `SidebarProvider` + `SidebarInset`:
     ```tsx
     <SidebarProvider
       style={{
         "--sidebar-width": "calc(var(--spacing) * 72)",
         "--header-height": "calc(var(--spacing) * 12)",
       } as React.CSSProperties}
     >
       <AppSidebar variant="inset" />
       <SidebarInset>
         <SiteHeader />
         <div className="flex flex-1 flex-col">
           <div className="@container/main flex flex-1 flex-col gap-2">
             {/* Konten Halaman Admin */}
           </div>
         </div>
       </SidebarInset>
     </SidebarProvider>
     ```
   - **Navigasi Sidebar (`AppSidebar`):** Disesuaikan dengan menu fungsional KasAngkatan (Dashboard Overview, Verifikasi 1-Klik, Tagihan Kas, Metode Pembayaran PIC, Master Mahasiswa & Kelas). Profil bendahara aktif (`NavUser`) menampilkan identitas PIC dan email bendahara.

---

## 4. ATURAN AUTENTIKASI & PROTEKSI RUTE (`proxy.ts`)
1. **NextAuth.js (Auth.js) v5:**
   - Autentikasi dikhususkan hanya untuk Admin/Bendahara menggunakan Credentials Provider (Email/Username + Password hashing bcrypt).
   - Mahasiswa **TIDAK MEMERLUKAN LOGIN** (Public Access).
2. **Route Protection via `proxy.ts`:**
   - Selaras dengan standar modern Next.js App Router, proteksi endpoint rute `/admin/*` diatur terpusat melalui arsitektur file `proxy.ts` (mengabstraksi interceptor auth, redirect unauthenticated user ke `/login`, dan menyaring request unauthorized pada API/Server Actions).
   - Sesi bendahara wajib membawa informasi `id`, `name`, `email`, dan `role`.

---

## 5. ATURAN TYPE-SAFETY & DATA VALIDATION
1. **Strict TypeScript:**
   - Dilarang keras menggunakan tipe `any` atau `unknown` tanpa type guard.
   - Semua parameter Server Action, Prisma queries, dan props komponen harus memiliki tipe yang jelas.
2. **Validasi Input Menggunakan Zod:**
   - Setiap mutasi data (upload bukti transfer, approve/reject transaksi, manajemen metode bayar, pembuatan tagihan) **WAJIB** divalidasi dengan Zod schema di Server Action.
   - Validasi error dikembalikan dalam format standar: `{ success: false, error: string, fieldErrors?: Record<string, string[]> }`.

---

## 6. ATURAN PRISMA ORM & DATABASE (SQLITE)
1. **Konvensi Penamaan:**
   - Nama model Prisma dalam format **PascalCase** tunggal: `Class`, `Student`, `PaymentMethod`, `Bill`, `Transaction`, `Admin`.
   - Nama field tabel dalam format **camelCase**: `studentId`, `paymentMethodId`, `proofImageUrl`, `createdAt`.
   - Relasi eksplisit dengan indeks (`@@index`) pada foreign keys untuk performa query optimal di SQLite.
2. **Integritas Transaksional & Relasi:**
   - Metode pembayaran (`PaymentMethod`) dan Kelas (`Class`) berdiri sendiri.
   - Hapus data (delete) yang berelasi dengan transaksi keuangan harus dicegah atau menggunakan soft delete / cascade terencana agar tidak merusak audit trail kas.
3. **Database Driver:**
   - Menggunakan Prisma Client dengan `@prisma/adapter-better-sqlite3` untuk kecepatan I/O tinggi dan kompatibilitas environment lokal.

---

## 7. ATURAN SERVER ACTIONS & FILE HANDLING
1. **Server Actions First:**
   - Semua mutasi data (CREATE, UPDATE, DELETE) dilakukan melalui Next.js Server Actions di folder `actions/`.
   - Wajib mendeklarasikan `'use server'` di awal file.
   - Selalu bungkus dalam blok `try...catch` dan kembalikan struktur response terstandar.
2. **Upload Bukti Transfer:**
   - Bukti struk transfer disimpan dalam direktori lokal `public/uploads/proofs/` dengan format nama unik `proof-[timestamp]-[nanoid/uuid].[ext]`.
   - Validasi ketat: MIME type hanya `image/jpeg`, `image/png`, `image/webp`. Ukuran file maksimal 5 MB.

---

## 8. ATURAN GOOGLE SPREADSHEETS SYNC
1. **Sinkronisasi Otomatis:**
   - Eksekusi sync **hanya terjadi ketika status transaksi berubah menjadi `APPROVED`**.
   - Gunakan Google Cloud Service Account API dengan file credential aman (disimpan via environment variable / path aman).
2. **Fail-Safe & Non-Blocking:**
   - Jika koneksi Google Sheets gagal/timeout, transaksi tetap berstatus `APPROVED` di database lokal, namun log kegagalan dicatat dan flag `sheetSyncStatus = FAILED` disimpan agar dapat di-retry otomatis atau manual oleh bendahara tanpa membatalkan transaksi.

---

## 9. STRUKTUR FOLDER RESMI PROYEK
```
├── actions/                  # Next.js Server Actions (Zod-validated)
│   ├── auth.ts
│   ├── bills.ts
│   ├── payment-methods.ts
│   ├── students.ts
│   └── transactions.ts
├── app/
│   ├── (admin)/              # Rute terlindungi (Dashboard Bendahara)
│   │   ├── admin/
│   │   │   ├── bills/
│   │   │   ├── classes/
│   │   │   ├── methods/
│   │   │   ├── students/
│   │   │   └── verification/ # 1-Click Verification
│   │   └── layout.tsx
│   ├── (public)/             # Rute publik (Mahasiswa & Transparansi)
│   │   ├── bayar/            # Form Pembayaran Mahasiswa
│   │   ├── status/           # Cek Status Transaksi Mahasiswa
│   │   ├── transparansi/     # Laporan Kas Publik
│   │   ├── layout.tsx
│   │   └── page.tsx          # Landing Page
│   ├── api/
│   │   ├── auth/[...nextauth]/
│   │   └── sync-sheet/
│   ├── globals.css
│   └── layout.tsx
├── components/
│   ├── admin/                # Komponen spesifik admin dashboard
│   ├── public/               # Komponen spesifik portal mahasiswa
│   ├── shared/               # Komponen bersama (Navbar, Footer, Modal)
│   └── ui/                   # Komponen murni shadcn/ui
├── docs/                     # Dokumentasi Arsitektur & Spesifikasi
├── lib/
│   ├── auth.ts               # Konfigurasi NextAuth v5
│   ├── db.ts                 # Prisma Client Singleton
│   ├── google-sheets.ts      # Service Account API Sync
│   └── utils.ts              # Helper functions (cn, formatRupiah, dll)
├── prisma/
│   ├── schema.prisma
│   └── seed.ts
├── proxy.ts                  # Route Protection & Middleware Proxy Core
├── .cursorrules              # File duplikat aturan coding untuk AI Agent
└── package.json
```
