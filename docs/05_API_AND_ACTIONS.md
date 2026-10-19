# SERVER ACTIONS & API SPECIFICATION
## Proyek: KeuanganAngkatan (Sistem Informasi & Manajemen Keuangan Angkatan Mahasiswa)

---

## 1. STANDAR RESPONSE FORMAT & ERROR HANDLING

Semua Server Action di aplikasi KasAngkatan menggunakan format balikan (*return type*) seragam untuk menjamin konsistensi pada komponen UI dan toast notification:

```typescript
export type ActionResponse<T = undefined> = {
  success: boolean;
  message?: string;
  data?: T;
  error?: string;
  fieldErrors?: Record<string, string[]>;
};
```

---

## 2. MODUL SERVER ACTIONS: TRANSAKSI & PEMBAYARAN (`actions/transactions.ts`)

### 2.1 Submit Pembayaran Mahasiswa (Public - Tanpa Login)
Mahasiswa memilih kelas, autocomplete NIM, memilih tagihan, metode transfer PIC bendahara, dan mengunggah struk transfer.

- **Schema Validasi Zod:**
```typescript
import { z } from "zod";

export const SubmitPaymentSchema = z.object({
  studentId: z.string().min(1, "Mahasiswa harus dipilih"),
  billId: z.string().min(1, "Tagihan iuran harus dipilih"),
  paymentMethodId: z.string().min(1, "Metode pembayaran harus dipilih"),
  amountPaid: z.coerce.number().positive("Nominal pembayaran harus lebih besar dari 0"),
  studentNotes: z.string().max(255, "Catatan maksimal 255 karakter").optional(),
});
```

- **Signature Server Action:**
```typescript
export async function submitPaymentAction(
  formData: FormData
): Promise<ActionResponse<{ referenceCode: string }>>;
```
- **Alur Kerja Server:**
  1. Validasi field `studentId`, `billId`, `paymentMethodId`, `amountPaid`, dan `studentNotes` via `SubmitPaymentSchema`.
  2. Ekstrak file berkas struk `proofFile` dari `formData`.
  3. Validasi tipe file (`image/jpeg`, `image/png`, `image/webp`) dan ukuran file (maksimal 5 MB).
  4. Simpan file gambar ke direktori `public/uploads/proofs/` dengan format nama unik `proof-[timestamp]-[randomUUID].jpg`.
  5. Generate kode referensi transaksi acak: `KAS-[YYYYMMDD]-[4 DIGIT RANDOM]`.
  6. Simpan transaksi ke tabel `Transaction` dengan status default `PENDING`.
  7. Kembalikan kode referensi untuk ditampilkan pada layar sukses mahasiswa.

---

### 2.2 Verifikasi 1-Klik: Approve Transaksi (`approveTransactionAction`)
Bendahara menyetujui transaksi setelah mengecek keaslian bukti struk dan mutasi rekening.

- **Schema Validasi Zod:**
```typescript
export const ApproveTransactionSchema = z.object({
  transactionId: z.string().min(1, "ID transaksi wajib disertakan"),
});
```

- **Signature Server Action:**
```typescript
export async function approveTransactionAction(
  transactionId: string
): Promise<ActionResponse<{ sheetSyncStatus: string }>>;
```
- **Alur Kerja Server:**
  1. Autentikasi sesi bendahara via NextAuth `auth()`. Jika tidak ada sesi, kembalikan error `Unauthorized`.
  2. Mulai transaksi basis data:
     - Update status transaksi: `status = "APPROVED"`, `verifiedById = session.user.id`, `verifiedAt = new Date()`.
  3. Trigger otomatis sinkronisasi ke Google Sheets:
     - Panggil `appendTransactionToSheet(...)`.
     - Jika berhasil: update `sheetSyncStatus = "SYNCED"`, `sheetSyncedAt = new Date()`.
     - Jika gagal: update `sheetSyncStatus = "FAILED"`, `sheetErrorLog = err.message`.
  4. Trigger `revalidatePath('/admin/verification')` dan `revalidatePath('/transparansi')`.
  5. Kembalikan response sukses.

---

### 2.3 Verifikasi 1-Klik: Reject Transaksi (`rejectTransactionAction`)
Bendahara menolak transaksi yang tidak valid, struk palsu, atau mutasi bank belum masuk.

- **Schema Validasi Zod:**
```typescript
export const RejectTransactionSchema = z.object({
  transactionId: z.string().min(1, "ID transaksi wajib disertakan"),
  rejectionReason: z
    .string()
    .min(5, "Alasan penolakan minimal 5 karakter")
    .max(255, "Alasan penolakan maksimal 255 karakter"),
});
```

- **Signature Server Action:**
```typescript
export async function rejectTransactionAction(
  data: z.infer<typeof RejectTransactionSchema>
): Promise<ActionResponse>;
```
- **Alur Kerja Server:**
  1. Autentikasi sesi bendahara via NextAuth `auth()`.
  2. Update status transaksi: `status = "REJECTED"`, `rejectionReason = data.rejectionReason`, `verifiedById = session.user.id`, `verifiedAt = new Date()`.
  3. Revalidate rute `/admin/verification`.
  4. Kembalikan response sukses.

---

### 2.4 Retry Sinkronisasi Google Sheets (`retrySheetSyncAction`)
Menjalankan ulang sinkronisasi untuk transaksi yang sudah `APPROVED` namun berstatus `FAILED` saat proses awal.

- **Signature Server Action:**
```typescript
export async function retrySheetSyncAction(
  transactionId: string
): Promise<ActionResponse>;
```
- **Alur Kerja Server:**
  1. Cek sesi admin.
  2. Cari record transaksi dengan status `APPROVED`.
  3. Panggil `appendTransactionToSheet(...)`.
  4. Jika berhasil, perbarui status menjadi `SYNCED`.

---

## 3. MODUL SERVER ACTIONS: MAHASISWA & PENCARIAN (`actions/students.ts`)

### 3.1 Autocomplete Pencarian Mahasiswa Berdasarkan Kelas & Keyword
Digunakan oleh komponen Combobox pada form pembayaran publik.

- **Schema Validasi Zod:**
```typescript
export const SearchStudentSchema = z.object({
  classId: z.string().min(1, "Kelas harus dipilih"),
  query: z.string().min(2, "Ketik minimal 2 karakter"),
});
```

- **Signature Server Action:**
```typescript
export type StudentSearchResult = {
  id: string;
  nim: string;
  name: string;
  phone: string | null;
  className: string;
};

export async function searchStudentsAction(
  classId: string,
  query: string
): Promise<ActionResponse<StudentSearchResult[]>>;
```
- **Alur Kerja Server:**
  1. Query ke database:
     `prisma.student.findMany` where `classId == classId` AND (`nim` contains query OR `name` contains query).
  2. Batasi hasil maksimal 10 records untuk performa respon instan.

---

### 3.2 Ambil Riwayat Tagihan Siswa (`getStudentBillsAction`)
Menampilkan daftar tagihan yang belum lunas dan yang sudah lunas untuk mahasiswa yang dipilih.

- **Signature Server Action:**
```typescript
export type StudentBillStatus = {
  billId: string;
  title: string;
  amount: number;
  dueDate: Date | null;
  isPaid: boolean;
  transactionStatus?: "PENDING" | "APPROVED" | "REJECTED";
  referenceCode?: string;
};

export async function getStudentBillsAction(
  studentId: string
): Promise<ActionResponse<StudentBillStatus[]>>;
```

---

## 4. MODUL SERVER ACTIONS: METODE PEMBAYARAN PIC (`actions/payment-methods.ts`)

### 4.1 Tambah / Edit Metode Pembayaran (Admin)
- **Schema Validasi Zod:**
```typescript
export const UpsertPaymentMethodSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(3, "Nama kanal minimal 3 karakter"),
  type: z.enum(["QRIS", "BANK_TRANSFER", "EWALLET"]),
  bankName: z.string().min(2, "Nama Bank / E-Wallet minimal 2 karakter"),
  accountNumber: z.string().min(4, "Nomor rekening minimal 4 digit"),
  accountHolder: z.string().min(3, "Atas nama minimal 3 karakter"),
  picName: z.string().min(3, "Nama PIC Bendahara harus jelas"),
  instructions: z.string().max(500).optional(),
  isActive: z.boolean().default(true),
  displayOrder: z.coerce.number().default(0),
});
```

- **Signature Server Action:**
```typescript
export async function upsertPaymentMethodAction(
  formData: FormData
): Promise<ActionResponse>;
```
- **Alur Kerja Server:**
  1. Cek otentikasi admin.
  2. Simpan gambar QRIS jika tipe adalah `QRIS` dan berkas diunggah.
  3. Lakukan `create` atau `update` record `PaymentMethod`.
  4. Revalidate path `/admin/methods` dan `/bayar`.

---

## 5. MODUL SERVER ACTIONS: MASTER TAGIHAN (`actions/bills.ts`)

### 5.1 Buat / Perbarui Tagihan Iuran Kas (Admin)
- **Schema Validasi Zod:**
```typescript
export const UpsertBillSchema = z.object({
  id: z.string().optional(),
  title: z.string().min(3, "Judul tagihan minimal 3 karakter"),
  description: z.string().max(500).optional(),
  amount: z.coerce.number().min(1000, "Nominal minimal Rp1.000"),
  dueDate: z.string().optional(), // ISO Date String
  academicTerm: z.string().optional(),
  isActive: z.boolean().default(true),
});
```

- **Signature Server Action:**
```typescript
export async function upsertBillAction(
  data: z.infer<typeof UpsertBillSchema>
): Promise<ActionResponse>;
```

---

## 6. MODUL SERVER ACTIONS: AUTENTIKASI BENDAHARA (`actions/auth.ts`)

### 6.1 Login Bendahara
- **Schema Validasi Zod:**
```typescript
export const LoginAdminSchema = z.object({
  usernameOrEmail: z.string().min(3, "Username atau Email wajib diisi"),
  password: z.string().min(6, "Password minimal 6 karakter"),
});
```

- **Signature Server Action:**
```typescript
export async function loginAdminAction(
  data: z.infer<typeof LoginAdminSchema>
): Promise<ActionResponse<{ redirectUrl: string }>>;
```
- **Alur Kerja Server:**
  1. Validasi kredensial menggunakan fungsi `signIn("credentials", { ... })` dari NextAuth.js.
  2. Jika berhasil, kembalikan URL tujuan `/admin`.
  3. Jika gagal, kembalikan pesan ramah: "Username atau password salah".

---

### 6.2 Logout Bendahara
```typescript
export async function logoutAdminAction(): Promise<ActionResponse>;
```
- Mengakhiri sesi JWT dan mengarahkan kembali ke `/login`.
