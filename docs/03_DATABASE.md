# DATABASE ARCHITECTURE & PRISMA SPECIFICATION
## Proyek: KeuanganAngkatan (Sistem Informasi & Manajemen Keuangan Angkatan Mahasiswa)

---

## 1. DESAIN RELASIONAL & PENJELASAN TABEL

Aplikasi KasAngkatan menggunakan SQLite dengan Prisma ORM v7 (menggunakan `@prisma/adapter-better-sqlite3`). SQLite dipilih karena tidak memerlukan container terpisah, zero-latency local I/O, serta sangat stabil dan mudah di-backup untuk skala kas angkatan (ratusan hingga ribuan transaksi per semester).

### 1.1 Entitas Utama & Relasi
1. **`Class` (Kelas Mahasiswa):**
   - Entitas independen untuk mengelompokkan mahasiswa (misal: `TI-2023-A`, `TI-2023-B`).
   - Berelasi `1-to-many` ke entitas `Student`.
2. **`Student` (Mahasiswa Pembayar):**
   - Berisi NIM, Nama Lengkap, Nomor WhatsApp, dan referensi ke `Class`.
   - Berelasi `1-to-many` ke entitas `Transaction`.
3. **`PaymentMethod` (Metode Pembayaran & PIC Bendahara):**
   - Entitas mandiri yang memisahkan kanal transfer.
   - Menyimpan jenis metode (`QRIS`, `BANK_TRANSFER`, `EWALLET`), nama bank/penyedia, nomor rekening, atas nama, URL gambar QRIS, dan **`picName`** (nama bendahara pemilik rekening, misal: "Siti - Bendahara 1").
   - Berelasi `1-to-many` ke entitas `Transaction`.
4. **`Bill` (Tagihan Iuran Kas):**
   - Mewakili kewajiban pembayaran kas (contoh: "Iuran Kas September 2026", "Dana Makrab Angkatan").
   - Memiliki nominal tagihan (`amount`), tenggat waktu (`dueDate`), dan status aktif.
   - Berelasi `1-to-many` ke entitas `Transaction`.
5. **`Transaction` (Catatan Pembayaran & Verifikasi):**
   - Menghubungkan `Student`, `Bill`, dan `PaymentMethod`.
   - Memiliki status: `PENDING`, `APPROVED`, `REJECTED`.
   - Menyimpan URL foto bukti struk (`proofImageUrl`), nominal yang dibayar (`amountPaid`), catatan mahasiswa, catatan/alasan penolakan (`rejectionReason`), bendahara yang memverifikasi (`verifiedById` merujuk ke `Admin`), serta status sinkronisasi spreadsheet (`sheetSyncStatus`, `sheetSyncedAt`).
6. **`Admin` (Akun Bendahara):**
   - Menyimpan akun login tim bendahara untuk NextAuth (Email/Username, password hash bcrypt, nama lengkap, role).
   - Berelasi `1-to-many` ke `Transaction` (sebagai verifikator).

---

## 2. SKEMA LENGKAP PRISMA (`prisma/schema.prisma`)

```prisma
// datasource and generator configuration
datasource db {
  provider = "sqlite"
}

generator client {
  provider = "prisma-client-js"
}

// -------------------------------------------------------------
// 1. TABEL KELAS (Class)
// -------------------------------------------------------------
model Class {
  id          String    @id @default(cuid())
  name        String    @unique // Contoh: "TI-2023-A", "TI-2023-B"
  academicYear String   // Contoh: "2023/2024"
  description String?   // Catatan kelas opsional
  createdAt   DateTime  @default(now())
  updatedAt   DateTime  @updatedAt

  students    Student[]

  @@map("classes")
}

// -------------------------------------------------------------
// 2. TABEL MAHASISWA (Student)
// -------------------------------------------------------------
model Student {
  id           String        @id @default(cuid())
  nim          String        @unique // Nomor Induk Mahasiswa (kunci pencarian utama)
  name         String        // Nama Lengkap Mahasiswa
  phone        String?       // Kontak WhatsApp untuk konfirmasi jika diperlukan
  classId      String
  class        Class         @relation(fields: [classId], references: [id], onDelete: Restrict)
  createdAt    DateTime      @default(now())
  updatedAt    DateTime      @updatedAt

  transactions Transaction[]

  @@index([classId])
  @@index([name])
  @@map("students")
}

// -------------------------------------------------------------
// 3. TABEL METODE PEMBAYARAN (PaymentMethod) - PIC Bendahara
// -------------------------------------------------------------
model PaymentMethod {
  id           String        @id @default(cuid())
  name         String        // Nama kanal, contoh: "BCA Kas Angkatan", "QRIS Kas 1"
  type         String        // "QRIS" | "BANK_TRANSFER" | "EWALLET"
  bankName     String        // "BCA", "Mandiri", "Gopay", "Dana", "ShopeePay"
  accountNumber String       // Nomor Rekening atau Nomor E-Wallet
  accountHolder String       // Atas Nama Pemilik Rekening
  picName      String        // PIC Bendahara: "Siti (Bendahara 1)", "Farhan (Bendahara 2)"
  qrisImageUrl String?       // Path file gambar QRIS jika type == "QRIS"
  instructions String?       // Panduan transfer spesifik
  isActive     Boolean       @default(true) // Switch aktif/non-aktifkan kanal
  displayOrder Int           @default(0)    // Urutan tampilan di form pembayaran
  createdAt    DateTime      @default(now())
  updatedAt    DateTime      @updatedAt

  transactions Transaction[]

  @@index([isActive])
  @@index([picName])
  @@map("payment_methods")
}

// -------------------------------------------------------------
// 4. TABEL TAGIHAN IURAN (Bill)
// -------------------------------------------------------------
model Bill {
  id             String        @id @default(cuid())
  title          String        // Contoh: "Iuran Kas Bulan Oktober 2026"
  description    String?       // Detail kegunaan kas
  amount         Int           // Nominal tagihan dalam Rupiah (misal: 20000)
  dueDate        DateTime?     // Batas waktu pembayaran
  academicTerm   String?       // Contoh: "Ganjil 2026/2027"
  isActive       Boolean       @default(true)
  googleSheetId  String?       // ID Google Spreadsheet khusus tagihan ini
  googleSheetUrl String?       // URL Google Spreadsheet khusus tagihan ini
  createdAt      DateTime      @default(now())
  updatedAt      DateTime      @updatedAt

  transactions   Transaction[]

  @@index([isActive])
  @@map("bills")
}

// -------------------------------------------------------------
// 5. TABEL TRANSAKSI KAS (Transaction)
// -------------------------------------------------------------
model Transaction {
  id              String        @id @default(cuid())
  referenceCode   String        @unique // Kode unik: "KAS-20261012-XXXX"
  studentId       String
  student         Student       @relation(fields: [studentId], references: [id], onDelete: Restrict)
  billId          String
  bill            Bill          @relation(fields: [billId], references: [id], onDelete: Restrict)
  paymentMethodId String
  paymentMethod   PaymentMethod @relation(fields: [paymentMethodId], references: [id], onDelete: Restrict)
  
  amountPaid      Int           // Nominal yang ditransfer mahasiswa
  proofImageUrl   String        // Path berkas struk di /uploads/proofs/
  studentNotes    String?       // Catatan dari mahasiswa (opsional)
  
  status          String        @default("PENDING") // "PENDING" | "APPROVED" | "REJECTED"
  rejectionReason String?       // Alasan penolakan jika status == "REJECTED"
  
  verifiedById    String?
  verifiedBy      Admin?        @relation(fields: [verifiedById], references: [id], onDelete: SetNull)
  verifiedAt      DateTime?

  // Integrasi Google Spreadsheet
  sheetSyncStatus String        @default("NOT_SYNCED") // "NOT_SYNCED" | "SYNCED" | "FAILED"
  sheetSyncedAt   DateTime?
  sheetErrorLog   String?       // Menyimpan pesan galat jika sync gagal

  createdAt       DateTime      @default(now())
  updatedAt       DateTime      @updatedAt

  @@index([studentId])
  @@index([billId])
  @@index([paymentMethodId])
  @@index([status])
  @@index([sheetSyncStatus])
  @@map("transactions")
}

// -------------------------------------------------------------
// 6. TABEL AKUN BENDAHARA / ADMIN (Admin)
// -------------------------------------------------------------
model Admin {
  id           String        @id @default(cuid())
  email        String        @unique
  username     String        @unique
  passwordHash String        // Terenkripsi bcrypt
  fullName     String        // Contoh: "Siti Nurhaliza (Bendahara 1)"
  role         String        @default("TREASURER") // "TREASURER" | "SUPER_ADMIN"
  phone        String?
  isActive     Boolean       @default(true)
  createdAt    DateTime      @default(now())
  updatedAt    DateTime      @updatedAt

  verifiedTransactions Transaction[]

  @@map("admins")
}
```

---

## 3. SKRIP SEEDING DATA LENGKAP (`prisma/seed.ts`)

Skrip ini menyiapkan basis data awal secara komprehensif, mencakup 2 akun Bendahara, 2 kelas, 10 mahasiswa percontohan, 3 metode pembayaran dengan PIC berbeda, dan 2 tagihan kas aktif.

```typescript
import { PrismaClient } from "@prisma/client";
import { PrismaBetterSqlite } from "@prisma/adapter-better-sqlite3";
import Database from "better-sqlite3";
import bcrypt from "bcryptjs";

const db = new Database("prisma/dev.db");
const adapter = new PrismaBetterSqlite(db);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log("🌱 Memulai proses seeding data awal KasAngkatan...");

  // 1. Bersihkan Data Lama
  await prisma.transaction.deleteMany();
  await prisma.bill.deleteMany();
  await prisma.paymentMethod.deleteMany();
  await prisma.student.deleteMany();
  await prisma.class.deleteMany();
  await prisma.admin.deleteMany();

  // 2. Buat Akun Admin / Multi-Bendahara
  const passwordHash = await bcrypt.hash("bendahara123", 10);

  const admin1 = await prisma.admin.create({
    data: {
      email: "bendahara1@kampus.ac.id",
      username: "bendahara1",
      passwordHash,
      fullName: "Siti Nurhaliza (Bendahara 1)",
      role: "SUPER_ADMIN",
      phone: "081234567891",
      isActive: true,
    },
  });

  const admin2 = await prisma.admin.create({
    data: {
      email: "bendahara2@kampus.ac.id",
      username: "bendahara2",
      passwordHash,
      fullName: "Farhan Mahendra (Bendahara 2)",
      role: "TREASURER",
      phone: "081234567892",
      isActive: true,
    },
  });

  console.log(`✅ Dibuat 2 Akun Admin: ${admin1.fullName} & ${admin2.fullName}`);

  // 3. Buat Master Data Kelas
  const classA = await prisma.class.create({
    data: {
      name: "TI-2023-A",
      academicYear: "2023/2024",
      description: "Teknik Informatika Angkatan 2023 Kelas A",
    },
  });

  const classB = await prisma.class.create({
    data: {
      name: "TI-2023-B",
      academicYear: "2023/2024",
      description: "Teknik Informatika Angkatan 2023 Kelas B",
    },
  });

  console.log(`✅ Dibuat 2 Kelas: ${classA.name} & ${classB.name}`);

  // 4. Buat Master Data Mahasiswa
  const studentsClassA = [
    { nim: "230101001", name: "Ahmad Fauzi", phone: "081200000001" },
    { nim: "230101002", name: "Budi Santoso", phone: "081200000002" },
    { nim: "230101003", name: "Citra Lestari", phone: "081200000003" },
    { nim: "230101004", name: "Dika Pratama", phone: "081200000004" },
    { nim: "230101005", name: "Eva Nuraini", phone: "081200000005" },
  ];

  const studentsClassB = [
    { nim: "230102001", name: "Fajar Ramadan", phone: "081200000006" },
    { nim: "230102002", name: "Gita Maharani", phone: "081200000007" },
    { nim: "230102003", name: "Hadi Kusuma", phone: "081200000008" },
    { nim: "230102004", name: "Indah Permata", phone: "081200000009" },
    { nim: "230102005", name: "Joko Widodo", phone: "081200000010" },
  ];

  for (const s of studentsClassA) {
    await prisma.student.create({
      data: {
        nim: s.nim,
        name: s.name,
        phone: s.phone,
        classId: classA.id,
      },
    });
  }

  for (const s of studentsClassB) {
    await prisma.student.create({
      data: {
        nim: s.nim,
        name: s.name,
        phone: s.phone,
        classId: classB.id,
      },
    });
  }

  console.log("✅ Dibuat 10 Mahasiswa percontohan.");

  // 5. Buat Metode Pembayaran Terpisah (Dengan PIC Bendahara)
  const method1 = await prisma.paymentMethod.create({
    data: {
      name: "BCA Kas Angkatan - Siti",
      type: "BANK_TRANSFER",
      bankName: "BCA",
      accountNumber: "8735019284",
      accountHolder: "SITI NURHALIZA",
      picName: "Siti Nurhaliza (Bendahara 1)",
      qrisImageUrl: null,
      instructions: "Transfer via BCA / BI-Fast. Beri berita: KAS [NIM].",
      isActive: true,
      displayOrder: 1,
    },
  });

  const method2 = await prisma.paymentMethod.create({
    data: {
      name: "QRIS Kas Angkatan - Siti",
      type: "QRIS",
      bankName: "QRIS",
      accountNumber: "NMID-ID1029384756",
      accountHolder: "KAS INFORMATIKA 2023",
      picName: "Siti Nurhaliza (Bendahara 1)",
      qrisImageUrl: "/uploads/methods/sample-qris.png",
      instructions: "Scan QRIS menggunakan mobile banking atau e-wallet apa saja (GoPay, OVO, Dana).",
      isActive: true,
      displayOrder: 2,
    },
  });

  const method3 = await prisma.paymentMethod.create({
    data: {
      name: "Bank Mandiri - Farhan",
      type: "BANK_TRANSFER",
      bankName: "Mandiri",
      accountNumber: "1370019283746",
      accountHolder: "FARHAN MAHENDRA",
      picName: "Farhan Mahendra (Bendahara 2)",
      qrisImageUrl: null,
      instructions: "Transfer melalui Livin' by Mandiri atau ATM. Screenshot struk sukses.",
      isActive: true,
      displayOrder: 3,
    },
  });

  console.log("✅ Dibuat 3 Metode Pembayaran PIC Multi-Bendahara.");

  // 6. Buat Master Tagihan Kas (Bill)
  const bill1 = await prisma.bill.create({
    data: {
      title: "Iuran Kas Bulan Oktober 2026",
      description: "Kas rutin bulanan angkatan untuk operasional prodi dan konsumsi tentir.",
      amount: 20000,
      dueDate: new Date("2026-10-31T23:59:59Z"),
      academicTerm: "Ganjil 2026/2027",
      isActive: true,
    },
  });

  const bill2 = await prisma.bill.create({
    data: {
      title: "Iuran Kas Makrab Angkatan",
      description: "Pembayaran tahap 1 pengadaan villa dan konsumsi malam keakraban.",
      amount: 50000,
      dueDate: new Date("2026-11-15T23:59:59Z"),
      academicTerm: "Ganjil 2026/2027",
      isActive: true,
    },
  });

  console.log("✅ Dibuat 2 Tagihan Kas Aktif.");

  // 7. Buat Transaksi Contoh (PENDING & APPROVED)
  const sampleStudentA = await prisma.student.findUniqueOrThrow({
    where: { nim: "230101001" },
  });
  const sampleStudentB = await prisma.student.findUniqueOrThrow({
    where: { nim: "230101002" },
  });

  await prisma.transaction.create({
    data: {
      referenceCode: "KAS-20261012-0001",
      studentId: sampleStudentA.id,
      billId: bill1.id,
      paymentMethodId: method1.id,
      amountPaid: 20000,
      proofImageUrl: "/uploads/proofs/sample-proof-1.jpg",
      studentNotes: "Sudah bayar via m-BCA min",
      status: "PENDING",
      sheetSyncStatus: "NOT_SYNCED",
    },
  });

  await prisma.transaction.create({
    data: {
      referenceCode: "KAS-20261012-0002",
      studentId: sampleStudentB.id,
      billId: bill1.id,
      paymentMethodId: method3.id,
      amountPaid: 20000,
      proofImageUrl: "/uploads/proofs/sample-proof-2.jpg",
      studentNotes: "Transfer via Livin Mandiri",
      status: "APPROVED",
      verifiedById: admin2.id,
      verifiedAt: new Date(),
      sheetSyncStatus: "SYNCED",
      sheetSyncedAt: new Date(),
    },
  });

  console.log("✅ Dibuat contoh transaksi PENDING dan APPROVED.");
  console.log("🎉 Seeding selesai dengan sukses!");
}

main()
  .catch((e) => {
    console.error("❌ Terjadi kesalahan saat seeding:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
```
