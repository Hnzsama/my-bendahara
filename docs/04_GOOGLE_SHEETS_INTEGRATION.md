# GOOGLE SPREADSHEETS INTEGRATION SPECIFICATION
## Proyek: KeuanganAngkatan — Otomatisasi Transparansi Keuangan Angkatan

---

## 1. TUJUAN INTEGRASI

Google Sheets digunakan sebagai **kanal transparansi publik yang terpercaya dan terdesentralisasi**. Setiap transaksi kas yang diverifikasi (`APPROVED`) oleh bendahara akan secara otomatis dikirimkan ke Google Spreadsheet publik milik angkatan mahasiswa. Dengan cara ini:
1. Seluruh mahasiswa angkatan dapat melihat rekapitulasi terkini tanpa harus meminta rekap manual secara berkala kepada bendahara.
2. Bendahara terbebas dari pekerjaan ganda (rekap di WhatsApp/Excel lalu memindahkan ke Google Sheet).
3. Transparansi keuangan terjamin karena data yang disetujui terekam secara permanen dengan timestamp dan nama PIC bendahara terkait.

---

## 2. PANDUAN SETUP GOOGLE CLOUD SERVICE ACCOUNT

### 2.1 Langkah Konfigurasi Google Cloud Console (GCP)
1. **Buat Proyek Baru di Google Cloud:**
   - Kunjungi [Google Cloud Console](https://console.cloud.google.com/).
   - Buat proyek baru dengan nama: `kas-angkatan-sync`.
2. **Aktifkan Google Sheets API:**
   - Navigasi ke menu **APIs & Services** > **Library**.
   - Cari **"Google Sheets API"** dan klik tombol **Enable**.
3. **Buat Service Account:**
   - Buka menu **APIs & Services** > **Credentials**.
   - Klik **Create Credentials** > pilih **Service Account**.
   - Isi Service account name: `kas-sync-service-account`.
   - Klik **Done** (Role permissions tidak perlu diisi pada tingkat GCP project).
4. **Buat & Unduh Key JSON:**
   - Klik akun service account yang baru dibuat.
   - Masuk ke tab **Keys** > klik **Add Key** > pilih **Create new key**.
   - Pilih tipe **JSON** dan unduh file.
   - Simpan kredensial dengan aman.
5. **Bagikan Akses Spreadsheet ke Email Service Account:**
   - Buka Google Spreadsheet yang akan dijadikan buku kas angkatan.
   - Klik tombol **Share (Bagikan)** di kanan atas.
   - Masukkan alamat email service account (contoh: `kas-sync-service-account@kas-angkatan-sync.iam.gserviceaccount.com`).
   - Berikan izin akses sebagai **Editor** (Wajib agar dapat menulis/append baris).
   - Simpan ID Spreadsheet dari URL browser:
     `https://docs.google.com/spreadsheets/d/[SPREADSHEET_ID]/edit`

---

## 3. STRUKTUR SHEET & MAPPING KOLOM

### 3.1 Nama Lembar (Sheet Name)
Data akan di-append ke lembar bernama: **`Kas_Masuk_Approved`** (atau nama tab yang dikonfigurasi di environment variable `GOOGLE_SHEET_TAB_NAME`).

### 3.2 Header Baris Pertama (Row 1)

| Kolom | Nama Kolom Header | Format Data / Deskripsi | Contoh Nilai |
| :---: | :--- | :--- | :--- |
| **A** | **Timestamp Verifikasi** | `YYYY-MM-DD HH:mm:ss` (WIB) | `2026-10-12 14:30:15` |
| **B** | **Kode Referensi** | Kode unik transaksi | `KAS-20261012-0002` |
| **C** | **Kelas** | Nama kelas dari relasi `Class` | `TI-2023-A` |
| **D** | **NIM** | Nomor Induk Mahasiswa | `230101002` |
| **E** | **Nama Mahasiswa** | Nama lengkap mahasiswa | `Budi Santoso` |
| **F** | **Nama Tagihan (Iuran)** | Judul tagihan kas dari `Bill` | `Iuran Kas Bulan Oktober 2026` |
| **G** | **Nominal (Rp)** | Angka integer (Formatted Currency) | `20000` |
| **H** | **Metode Pembayaran** | Nama kanal & nomor rekening | `BCA Kas Angkatan (8735019284)` |
| **I** | **PIC Bendahara** | Nama bendahara pemilik rekening | `Siti Nurhaliza (Bendahara 1)` |
| **J** | **Status** | Status transaksi | `APPROVED` |
| **K** | **Diverifikasi Oleh** | Nama admin/bendahara yang memvalidasi | `Siti Nurhaliza` |
| **L** | **Tautan Bukti Transfer** | URL publik foto struk | `https://kas.kampus.ac.id/uploads/proofs/proof-xxx.jpg` |

---

## 4. KONFIGURASI ENVIRONMENT VARIABLES

Simpan variabel berikut pada file `.env.local`:

```env
# Google Spreadsheet Credentials
GOOGLE_SHEET_ID="1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms"
GOOGLE_SHEET_TAB_NAME="Kas_Masuk_Approved"

# Metode 1: Service Account JSON Langsung dalam Base64 / Escaped String
GOOGLE_SERVICE_ACCOUNT_EMAIL="kas-sync@kas-angkatan-sync.iam.gserviceaccount.com"
GOOGLE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nMIIEvgIBADANBgkqhkiG9w0BAQEFAASCBKgwggSkAgEAAoIBAQC...\n-----END PRIVATE KEY-----\n"

# Base URL Aplikasi untuk link bukti transfer absolut
NEXT_PUBLIC_APP_URL="http://localhost:3000"
```

---

## 5. SPESIFIKASI UTILITAS `lib/google-sheets.ts`

Berikut adalah implementasi lengkap logika helper `lib/google-sheets.ts` yang siap digunakan:

```typescript
import { google } from "googleapis";

interface SheetTransactionPayload {
  referenceCode: string;
  verifiedAt: Date;
  className: string;
  nim: string;
  studentName: string;
  billTitle: string;
  amountPaid: number;
  paymentMethodName: string;
  accountNumber: string;
  picName: string;
  status: string;
  verifierName: string;
  proofImageUrl: string;
}

export interface SyncResult {
  success: boolean;
  rowInserted?: number;
  error?: string;
}

/**
 * Menginisialisasi Google Sheets API Client menggunakan Service Account
 */
function getGoogleSheetsClient() {
  const email = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
  let privateKey = process.env.GOOGLE_PRIVATE_KEY;

  if (!email || !privateKey) {
    throw new Error("Kredensial Google Service Account belum disetel di environment variables.");
  }

  // Mengganti literal \n jika string private key di-escape dalam environment file
  privateKey = privateKey.replace(/\\n/g, "\n");

  const auth = new google.auth.JWT({
    email,
    key: privateKey,
    scopes: ["https://www.googleapis.com/auth/spreadsheets"],
  });

  return google.sheets({ version: "v4", auth });
}

/**
 * Menambahkan 1 baris transaksi yang telah disetujui (APPROVED) ke Google Spreadsheet
 */
export async function appendTransactionToSheet(
  data: SheetTransactionPayload
): Promise<SyncResult> {
  const spreadsheetId = process.env.GOOGLE_SHEET_ID;
  const tabName = process.env.GOOGLE_SHEET_TAB_NAME || "Kas_Masuk_Approved";
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

  if (!spreadsheetId) {
    console.error("GOOGLE_SHEET_ID tidak ditemukan.");
    return { success: false, error: "GOOGLE_SHEET_ID tidak terkonfigurasi" };
  }

  try {
    const sheets = getGoogleSheetsClient();

    // Format tanggal ke waktu lokal WIB (Asia/Jakarta)
    const formattedDate = new Intl.DateTimeFormat("id-ID", {
      dateStyle: "medium",
      timeStyle: "medium",
      timeZone: "Asia/Jakarta",
    }).format(data.verifiedAt);

    // Format tautan bukti bayar
    const absoluteProofUrl = data.proofImageUrl.startsWith("http")
      ? data.proofImageUrl
      : `${baseUrl}${data.proofImageUrl}`;

    // Baris data sesuai dengan urutan Kolom A sampai L
    const rowValues = [
      formattedDate,
      data.referenceCode,
      data.className,
      data.nim,
      data.studentName,
      data.billTitle,
      data.amountPaid,
      `${data.paymentMethodName} (${data.accountNumber})`,
      data.picName,
      data.status,
      data.verifierName,
      absoluteProofUrl,
    ];

    const response = await sheets.spreadsheets.values.append({
      spreadsheetId,
      range: `${tabName}!A:L`,
      valueInputOption: "USER_ENTERED",
      insertDataOption: "INSERT_ROWS",
      requestBody: {
        values: [rowValues],
      },
    });

    const updatedRows = response.data.updates?.updatedRows || 1;
    return {
      success: true,
      rowInserted: updatedRows,
    };
  } catch (error: any) {
    console.error("Gagal melakukan append ke Google Sheets:", error);
    return {
      success: false,
      error: error?.message || "Terjadi kesalahan koneksi ke Google Sheets API",
    };
  }
}

/**
 * Memastikan lembar (sheet tab) dan baris header pertama tersedia
 */
export async function ensureSheetHeader(): Promise<void> {
  const spreadsheetId = process.env.GOOGLE_SHEET_ID;
  const tabName = process.env.GOOGLE_SHEET_TAB_NAME || "Kas_Masuk_Approved";

  if (!spreadsheetId) return;

  try {
    const sheets = getGoogleSheetsClient();
    
    // Periksa apakah baris header sudah terisi
    const checkRange = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: `${tabName}!A1:L1`,
    });

    if (!checkRange.data.values || checkRange.data.values.length === 0) {
      const headers = [
        "Timestamp Verifikasi",
        "Kode Referensi",
        "Kelas",
        "NIM",
        "Nama Mahasiswa",
        "Nama Tagihan (Iuran)",
        "Nominal (Rp)",
        "Metode Pembayaran",
        "PIC Bendahara",
        "Status",
        "Diverifikasi Oleh",
        "Tautan Bukti Transfer",
      ];

      await sheets.spreadsheets.values.update({
        spreadsheetId,
        range: `${tabName}!A1:L1`,
        valueInputOption: "RAW",
        requestBody: {
          values: [headers],
        },
      });
      console.log("✅ Header tabel Google Sheet berhasil diinisialisasi.");
    }
  } catch (error) {
    console.warn("Gagal mengecek header Google Sheet:", error);
  }
}
```

---

## 6. PENANGANAN KEGAGALAN & RETRY LOGIC (FAIL-SAFE DESIGN)

Koneksi internet pihak ketiga atau Google API rate limit tidak boleh menggagalkan transaksi di sistem lokal:

1. **Non-Blocking Execution:**
   - Saat bendahara mengklik `Approve`, status di basis data SQLite diubah menjadi `APPROVED` dalam blok transaksi Prisma.
   - Panggilan ke `appendTransactionToSheet()` dieksekusi secara asinkron.
2. **Pencatatan Status Sinkronisasi (`sheetSyncStatus`):**
   - Jika Google Sheets API mengembalikan `success: true`:
     - `sheetSyncStatus = "SYNCED"`
     - `sheetSyncedAt = new Date()`
     - `sheetErrorLog = null`
   - Jika Google Sheets API gagal (timeout/jaringan/credential error):
     - `sheetSyncStatus = "FAILED"`
     - `sheetErrorLog = error.message`
3. **Manual Retry Button di Admin:**
   - Pada tabel verifikasi atau halaman laporan, transaksi yang berstatus `APPROVED` namun memiliki `sheetSyncStatus = "FAILED"` akan menampilkan badge peringatan oranye *"Sync Failed"* dengan tombol aksi **[Retry Sync]**.
   - Menekan tombol ini akan memanggil Server Action `retrySheetSyncAction(transactionId)` tanpa perlu menyetujui ulang transaksi.
