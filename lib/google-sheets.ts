import { google } from "googleapis";
import { prisma } from "@/lib/db";

export const SHEET_HEADER_COLUMNS = [
  "Waktu Verifikasi (WIB)",
  "Kode Transaksi",
  "NIM",
  "Nama Mahasiswa",
  "Tagihan Kas",
  "Nominal (Rp)",
  "Metode Pembayaran",
  "PIC Bendahara",
  "Status",
  "Diverifikasi Oleh",
  "Tautan Bukti Transfer",
];

export interface SheetTransactionPayload {
  spreadsheetId?: string | null;
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
 * Menginisialisasi Google Sheets API Client
 * Menggunakan Service Account JWT jika tersedia, atau API Key sebagai fallback
 */
function getGoogleSheetsClient() {
  const email = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL?.trim();
  let privateKey = process.env.GOOGLE_PRIVATE_KEY?.trim();
  const apiKey = process.env.GOOGLE_API_KEY?.trim();

  // 1. Jika Service Account credentials lengkap (metode utama untuk tulis/append dan buat sheet baru)
  if (email && privateKey) {
    privateKey = privateKey.replace(/\\n/g, "\n");
    const auth = new google.auth.JWT({
      email,
      key: privateKey,
      scopes: [
        "https://www.googleapis.com/auth/spreadsheets",
        "https://www.googleapis.com/auth/drive",
      ],
    });
    return {
      client: google.sheets({ version: "v4", auth }),
      driveClient: google.drive({ version: "v3", auth }),
      hasWritePermission: true,
    };
  }

  // 2. Jika hanya API Key yang tersedia
  if (apiKey) {
    return {
      client: google.sheets({ version: "v4", auth: apiKey }),
      driveClient: null,
      hasWritePermission: false,
    };
  }

  throw new Error(
    "Kredensial Google Sheets belum dikonfigurasi di environment variables. Harap atur GOOGLE_SERVICE_ACCOUNT_EMAIL & GOOGLE_PRIVATE_KEY."
  );
}

/**
 * Ekstraksi Spreadsheet ID dari URL Google Sheets atau ID mentah
 */
export function extractSpreadsheetId(input: string): string | null {
  if (!input) return null;
  const trimmed = input.trim();
  // Regex untuk URL Google Sheets: /spreadsheets/d/([a-zA-Z0-9-_]+)
  const match = trimmed.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
  if (match && match[1]) {
    return match[1];
  }
  // Jika pengguna memasukkan langsung ID (panjang minimal 20 karakter)
  if (/^[a-zA-Z0-9-_]{20,}$/.test(trimmed)) {
    return trimmed;
  }
  return null;
}

// ==========================================
// PALET WARNA MINIMALIS MODERN (NOTION / LINEAR STYLE)
// ==========================================
const PALETTE = {
  white: { red: 1, green: 1, blue: 1 },
  slate50: { red: 0.973, green: 0.98, blue: 0.988 },   // #F8FAFC
  slate100: { red: 0.945, green: 0.961, blue: 0.976 }, // #F1F5F9
  slate200: { red: 0.886, green: 0.91, blue: 0.941 },  // #E2E8F0
  slate300: { red: 0.796, green: 0.835, blue: 0.882 }, // #CBD5E1
  slate400: { red: 0.58, green: 0.639, blue: 0.722 },  // #94A3B8
  slate500: { red: 0.392, green: 0.455, blue: 0.545 }, // #64748B
  slate700: { red: 0.2, green: 0.255, blue: 0.333 },   // #334155
  slate900: { red: 0.059, green: 0.09, blue: 0.165 },  // #0F172A
  emerald50: { red: 0.925, green: 0.992, blue: 0.961 }, // #ECFDF5
  emerald600: { red: 0.02, green: 0.596, blue: 0.412 }, // #059669
  rose50: { red: 1, green: 0.945, blue: 0.949 },       // #FFF1F2
  rose600: { red: 0.882, green: 0.114, blue: 0.282 },   // #E11D48
  amber50: { red: 1, green: 0.984, blue: 0.922 },      // #FFFBEB
  amber600: { red: 0.851, green: 0.467, blue: 0.024 },  // #D97706
  indigo600: { red: 0.31, green: 0.275, blue: 0.898 },  // #4F46E5
};

/**
 * Menerapkan styling visual minimalis modern untuk Tab "Ringkasan" (Notion / Linear Style)
 */
export async function formatSummarySheet(
  sheets: any,
  spreadsheetId: string,
  sheetId: number,
  totalRowIndex: number
) {
  try {
    const colWidths = [50, 140, 110, 110, 110, 160, 160, 160, 110, 130];
    const requests: any[] = [
      // Lebar kolom
      ...colWidths.map((pixelSize, idx) => ({
        updateDimensionProperties: {
          range: {
            sheetId,
            dimension: "COLUMNS",
            startIndex: idx,
            endIndex: idx + 1,
          },
          properties: { pixelSize },
          fields: "pixelSize",
        },
      })),
      // Tinggi baris
      {
        updateDimensionProperties: {
          range: { sheetId, dimension: "ROWS", startIndex: 0, endIndex: 1 },
          properties: { pixelSize: 42 },
          fields: "pixelSize",
        },
      },
      {
        updateDimensionProperties: {
          range: { sheetId, dimension: "ROWS", startIndex: 1, endIndex: 2 },
          properties: { pixelSize: 24 },
          fields: "pixelSize",
        },
      },
      {
        updateDimensionProperties: {
          range: { sheetId, dimension: "ROWS", startIndex: 2, endIndex: 3 },
          properties: { pixelSize: 12 },
          fields: "pixelSize",
        },
      },
      {
        updateDimensionProperties: {
          range: { sheetId, dimension: "ROWS", startIndex: 3, endIndex: 4 },
          properties: { pixelSize: 22 },
          fields: "pixelSize",
        },
      },
      {
        updateDimensionProperties: {
          range: { sheetId, dimension: "ROWS", startIndex: 4, endIndex: 5 },
          properties: { pixelSize: 38 },
          fields: "pixelSize",
        },
      },
      {
        updateDimensionProperties: {
          range: { sheetId, dimension: "ROWS", startIndex: 5, endIndex: 6 },
          properties: { pixelSize: 14 },
          fields: "pixelSize",
        },
      },
      {
        updateDimensionProperties: {
          range: { sheetId, dimension: "ROWS", startIndex: 6, endIndex: 7 },
          properties: { pixelSize: 26 },
          fields: "pixelSize",
        },
      },
      {
        updateDimensionProperties: {
          range: { sheetId, dimension: "ROWS", startIndex: 7, endIndex: 8 },
          properties: { pixelSize: 34 },
          fields: "pixelSize",
        },
      },
      // Row 1: Judul Utama (Minimalist Clean White + Slate-900)
      {
        mergeCells: {
          range: { sheetId, startRowIndex: 0, endRowIndex: 1, startColumnIndex: 0, endColumnIndex: 10 },
          mergeType: "MERGE_ALL",
        },
      },
      {
        repeatCell: {
          range: { sheetId, startRowIndex: 0, endRowIndex: 1, startColumnIndex: 0, endColumnIndex: 10 },
          cell: {
            userEnteredFormat: {
              backgroundColorStyle: { rgbColor: PALETTE.white },
              textFormat: {
                foregroundColorStyle: { rgbColor: PALETTE.slate900 },
                bold: true,
                fontSize: 14,
              },
              horizontalAlignment: "LEFT",
              verticalAlignment: "MIDDLE",
            },
          },
          fields: "userEnteredFormat(backgroundColorStyle,textFormat,horizontalAlignment,verticalAlignment)",
        },
      },
      // Row 2: Sub-info (Muted Slate-500)
      {
        mergeCells: {
          range: { sheetId, startRowIndex: 1, endRowIndex: 2, startColumnIndex: 0, endColumnIndex: 10 },
          mergeType: "MERGE_ALL",
        },
      },
      {
        repeatCell: {
          range: { sheetId, startRowIndex: 1, endRowIndex: 2, startColumnIndex: 0, endColumnIndex: 10 },
          cell: {
            userEnteredFormat: {
              backgroundColorStyle: { rgbColor: PALETTE.white },
              textFormat: {
                foregroundColorStyle: { rgbColor: PALETTE.slate500 },
                fontSize: 9,
              },
              horizontalAlignment: "LEFT",
              verticalAlignment: "MIDDLE",
            },
          },
          fields: "userEnteredFormat(backgroundColorStyle,textFormat,horizontalAlignment,verticalAlignment)",
        },
      },
      // ==========================================
      // 4 FLOATING KPI CARDS (B4:I5)
      // ==========================================
      // Merge Card 1 (Total Mahasiswa)
      {
        mergeCells: {
          range: { sheetId, startRowIndex: 3, endRowIndex: 4, startColumnIndex: 1, endColumnIndex: 3 },
          mergeType: "MERGE_ALL",
        },
      },
      {
        mergeCells: {
          range: { sheetId, startRowIndex: 4, endRowIndex: 5, startColumnIndex: 1, endColumnIndex: 3 },
          mergeType: "MERGE_ALL",
        },
      },
      // Merge Card 2 (Mahasiswa Lunas)
      {
        mergeCells: {
          range: { sheetId, startRowIndex: 3, endRowIndex: 4, startColumnIndex: 3, endColumnIndex: 5 },
          mergeType: "MERGE_ALL",
        },
      },
      {
        mergeCells: {
          range: { sheetId, startRowIndex: 4, endRowIndex: 5, startColumnIndex: 3, endColumnIndex: 5 },
          mergeType: "MERGE_ALL",
        },
      },
      // Merge Card 3 (Total Terkumpul)
      {
        mergeCells: {
          range: { sheetId, startRowIndex: 3, endRowIndex: 4, startColumnIndex: 5, endColumnIndex: 7 },
          mergeType: "MERGE_ALL",
        },
      },
      {
        mergeCells: {
          range: { sheetId, startRowIndex: 4, endRowIndex: 5, startColumnIndex: 5, endColumnIndex: 7 },
          mergeType: "MERGE_ALL",
        },
      },
      // Merge Card 4 (Sisa Kekurangan)
      {
        mergeCells: {
          range: { sheetId, startRowIndex: 3, endRowIndex: 4, startColumnIndex: 7, endColumnIndex: 9 },
          mergeType: "MERGE_ALL",
        },
      },
      {
        mergeCells: {
          range: { sheetId, startRowIndex: 4, endRowIndex: 5, startColumnIndex: 7, endColumnIndex: 9 },
          mergeType: "MERGE_ALL",
        },
      },
      // Format Background & Base Style 4 KPI Cards (Slate-50)
      {
        repeatCell: {
          range: { sheetId, startRowIndex: 3, endRowIndex: 5, startColumnIndex: 1, endColumnIndex: 9 },
          cell: {
            userEnteredFormat: {
              backgroundColorStyle: { rgbColor: PALETTE.slate50 },
              horizontalAlignment: "CENTER",
              verticalAlignment: "MIDDLE",
            },
          },
          fields: "userEnteredFormat(backgroundColorStyle,horizontalAlignment,verticalAlignment)",
        },
      },
      // Card Labels (Row 4) - Small Uppercase Slate-500
      {
        repeatCell: {
          range: { sheetId, startRowIndex: 3, endRowIndex: 4, startColumnIndex: 1, endColumnIndex: 9 },
          cell: {
            userEnteredFormat: {
              textFormat: {
                bold: true,
                fontSize: 8,
                foregroundColorStyle: { rgbColor: PALETTE.slate500 },
              },
            },
          },
          fields: "userEnteredFormat(textFormat)",
        },
      },
      // Card 1 Value: Total Mahasiswa (Bold Slate-900)
      {
        repeatCell: {
          range: { sheetId, startRowIndex: 4, endRowIndex: 5, startColumnIndex: 1, endColumnIndex: 3 },
          cell: {
            userEnteredFormat: {
              textFormat: {
                bold: true,
                fontSize: 14,
                foregroundColorStyle: { rgbColor: PALETTE.slate900 },
              },
            },
          },
          fields: "userEnteredFormat(textFormat)",
        },
      },
      // Card 2 Value: Mahasiswa Lunas (Modern Emerald-600)
      {
        repeatCell: {
          range: { sheetId, startRowIndex: 4, endRowIndex: 5, startColumnIndex: 3, endColumnIndex: 5 },
          cell: {
            userEnteredFormat: {
              textFormat: {
                bold: true,
                fontSize: 13,
                foregroundColorStyle: { rgbColor: PALETTE.emerald600 },
              },
            },
          },
          fields: "userEnteredFormat(textFormat)",
        },
      },
      // Card 3 Value: Total Terkumpul (Modern Emerald-600 + Currency)
      {
        repeatCell: {
          range: { sheetId, startRowIndex: 4, endRowIndex: 5, startColumnIndex: 5, endColumnIndex: 7 },
          cell: {
            userEnteredFormat: {
              textFormat: {
                bold: true,
                fontSize: 13,
                foregroundColorStyle: { rgbColor: PALETTE.emerald600 },
              },
              numberFormat: { type: "CURRENCY", pattern: "\"Rp\"#,##0" },
            },
          },
          fields: "userEnteredFormat(textFormat,numberFormat)",
        },
      },
      // Card 4 Value: Sisa Kekurangan (Modern Rose-600 + Currency)
      {
        repeatCell: {
          range: { sheetId, startRowIndex: 4, endRowIndex: 5, startColumnIndex: 7, endColumnIndex: 9 },
          cell: {
            userEnteredFormat: {
              textFormat: {
                bold: true,
                fontSize: 13,
                foregroundColorStyle: { rgbColor: PALETTE.rose600 },
              },
              numberFormat: { type: "CURRENCY", pattern: "\"Rp\"#,##0" },
            },
          },
          fields: "userEnteredFormat(textFormat,numberFormat)",
        },
      },
      // Borders untuk masing-masing KPI Card
      ...[
        { start: 1, end: 3 },
        { start: 3, end: 5 },
        { start: 5, end: 7 },
        { start: 7, end: 9 },
      ].map((card) => ({
        updateBorders: {
          range: {
            sheetId,
            startRowIndex: 3,
            endRowIndex: 5,
            startColumnIndex: card.start,
            endColumnIndex: card.end,
          },
          top: { style: "SOLID", colorStyle: { rgbColor: PALETTE.slate200 } },
          bottom: { style: "SOLID", colorStyle: { rgbColor: PALETTE.slate200 } },
          left: { style: "SOLID", colorStyle: { rgbColor: PALETTE.slate200 } },
          right: { style: "SOLID", colorStyle: { rgbColor: PALETTE.slate200 } },
        },
      })),
      // Row 7: Section Header (Clean Minimalist Label)
      {
        repeatCell: {
          range: { sheetId, startRowIndex: 6, endRowIndex: 7, startColumnIndex: 0, endColumnIndex: 10 },
          cell: {
            userEnteredFormat: {
              backgroundColorStyle: { rgbColor: PALETTE.white },
              textFormat: {
                foregroundColorStyle: { rgbColor: PALETTE.slate400 },
                bold: true,
                fontSize: 9,
              },
              horizontalAlignment: "LEFT",
              verticalAlignment: "MIDDLE",
            },
          },
          fields: "userEnteredFormat(backgroundColorStyle,textFormat,horizontalAlignment,verticalAlignment)",
        },
      },
      // Row 8: Table Header (Slate-100 Minimalist Header, NO dark green!)
      {
        repeatCell: {
          range: { sheetId, startRowIndex: 7, endRowIndex: 8, startColumnIndex: 0, endColumnIndex: 10 },
          cell: {
            userEnteredFormat: {
              backgroundColorStyle: { rgbColor: PALETTE.slate100 },
              textFormat: {
                foregroundColorStyle: { rgbColor: PALETTE.slate700 },
                bold: true,
                fontSize: 9,
              },
              horizontalAlignment: "CENTER",
              verticalAlignment: "MIDDLE",
            },
          },
          fields: "userEnteredFormat(backgroundColorStyle,textFormat,horizontalAlignment,verticalAlignment)",
        },
      },
      {
        updateBorders: {
          range: { sheetId, startRowIndex: 7, endRowIndex: 8, startColumnIndex: 0, endColumnIndex: 10 },
          bottom: { style: "SOLID_MEDIUM", colorStyle: { rgbColor: PALETTE.slate300 } },
          top: { style: "SOLID", colorStyle: { rgbColor: PALETTE.slate200 } },
        },
      },
      // Table Data Rows formatting
      {
        repeatCell: {
          range: { sheetId, startRowIndex: 8, endRowIndex: totalRowIndex, startColumnIndex: 0, endColumnIndex: 10 },
          cell: {
            userEnteredFormat: {
              backgroundColorStyle: { rgbColor: PALETTE.white },
              textFormat: {
                fontSize: 9,
                foregroundColorStyle: { rgbColor: PALETTE.slate700 },
              },
              verticalAlignment: "MIDDLE",
            },
          },
          fields: "userEnteredFormat(backgroundColorStyle,textFormat,verticalAlignment)",
        },
      },
      // Currency Kolom 5, 6, 7 (Target, Terkumpul, Kekurangan)
      {
        repeatCell: {
          range: { sheetId, startRowIndex: 8, endRowIndex: totalRowIndex, startColumnIndex: 5, endColumnIndex: 8 },
          cell: {
            userEnteredFormat: {
              horizontalAlignment: "RIGHT",
              numberFormat: { type: "CURRENCY", pattern: "\"Rp\"#,##0" },
            },
          },
          fields: "userEnteredFormat(horizontalAlignment,numberFormat)",
        },
      },
      // Center alignment Kolom 0-5 dan 8-10
      {
        repeatCell: {
          range: { sheetId, startRowIndex: 8, endRowIndex: totalRowIndex, startColumnIndex: 0, endColumnIndex: 5 },
          cell: { userEnteredFormat: { horizontalAlignment: "CENTER" } },
          fields: "userEnteredFormat(horizontalAlignment)",
        },
      },
      {
        repeatCell: {
          range: { sheetId, startRowIndex: 8, endRowIndex: totalRowIndex, startColumnIndex: 8, endColumnIndex: 10 },
          cell: { userEnteredFormat: { horizontalAlignment: "CENTER" } },
          fields: "userEnteredFormat(horizontalAlignment)",
        },
      },
      // Aksen warna data baris
      {
        repeatCell: {
          range: { sheetId, startRowIndex: 8, endRowIndex: totalRowIndex, startColumnIndex: 1, endColumnIndex: 2 },
          cell: { userEnteredFormat: { textFormat: { bold: true, foregroundColorStyle: { rgbColor: PALETTE.slate900 } } } },
          fields: "userEnteredFormat(textFormat)",
        },
      },
      {
        repeatCell: {
          range: { sheetId, startRowIndex: 8, endRowIndex: totalRowIndex, startColumnIndex: 3, endColumnIndex: 4 },
          cell: { userEnteredFormat: { textFormat: { bold: true, foregroundColorStyle: { rgbColor: PALETTE.emerald600 } } } },
          fields: "userEnteredFormat(textFormat)",
        },
      },
      {
        repeatCell: {
          range: { sheetId, startRowIndex: 8, endRowIndex: totalRowIndex, startColumnIndex: 4, endColumnIndex: 5 },
          cell: { userEnteredFormat: { textFormat: { bold: true, foregroundColorStyle: { rgbColor: PALETTE.rose600 } } } },
          fields: "userEnteredFormat(textFormat)",
        },
      },
      // Subtle horizontal dividers on table rows
      {
        updateBorders: {
          range: { sheetId, startRowIndex: 8, endRowIndex: totalRowIndex, startColumnIndex: 0, endColumnIndex: 10 },
          innerHorizontal: { style: "SOLID", colorStyle: { rgbColor: PALETTE.slate100 } },
        },
      },
      // Conditional Formatting untuk Status Kelas
      {
        addConditionalFormatRule: {
          rule: {
            ranges: [{ sheetId, startRowIndex: 8, endRowIndex: totalRowIndex, startColumnIndex: 9, endColumnIndex: 10 }],
            booleanRule: {
              condition: { type: "TEXT_EQ", values: [{ userEnteredValue: "LUNAS" }] },
              format: {
                backgroundColorStyle: { rgbColor: PALETTE.emerald50 },
                textFormat: { foregroundColorStyle: { rgbColor: PALETTE.emerald600 }, bold: true },
              },
            },
          },
          index: 0,
        },
      },
      {
        addConditionalFormatRule: {
          rule: {
            ranges: [{ sheetId, startRowIndex: 8, endRowIndex: totalRowIndex, startColumnIndex: 9, endColumnIndex: 10 }],
            booleanRule: {
              condition: { type: "TEXT_EQ", values: [{ userEnteredValue: "BELUM LUNAS" }] },
              format: {
                backgroundColorStyle: { rgbColor: PALETTE.amber50 },
                textFormat: { foregroundColorStyle: { rgbColor: PALETTE.amber600 }, bold: true },
              },
            },
          },
          index: 1,
        },
      },
      // Grand Total Row Formatting (Slate-100 Elegant Minimalist, NO harsh black!)
      {
        repeatCell: {
          range: { sheetId, startRowIndex: totalRowIndex, endRowIndex: totalRowIndex + 1, startColumnIndex: 0, endColumnIndex: 10 },
          cell: {
            userEnteredFormat: {
              backgroundColorStyle: { rgbColor: PALETTE.slate100 },
              textFormat: {
                foregroundColorStyle: { rgbColor: PALETTE.slate900 },
                bold: true,
                fontSize: 10,
              },
              horizontalAlignment: "CENTER",
              verticalAlignment: "MIDDLE",
            },
          },
          fields: "userEnteredFormat(backgroundColorStyle,textFormat,horizontalAlignment,verticalAlignment)",
        },
      },
      {
        repeatCell: {
          range: { sheetId, startRowIndex: totalRowIndex, endRowIndex: totalRowIndex + 1, startColumnIndex: 5, endColumnIndex: 8 },
          cell: {
            userEnteredFormat: {
              horizontalAlignment: "RIGHT",
              numberFormat: { type: "CURRENCY", pattern: "\"Rp\"#,##0" },
            },
          },
          fields: "userEnteredFormat(horizontalAlignment,numberFormat)",
        },
      },
      {
        updateBorders: {
          range: { sheetId, startRowIndex: totalRowIndex, endRowIndex: totalRowIndex + 1, startColumnIndex: 0, endColumnIndex: 10 },
          top: { style: "SOLID_MEDIUM", colorStyle: { rgbColor: PALETTE.slate300 } },
          bottom: { style: "DOUBLE", colorStyle: { rgbColor: PALETTE.slate400 } },
        },
      },
    ];

    await sheets.spreadsheets.batchUpdate({
      spreadsheetId,
      requestBody: { requests },
    });
  } catch (err) {
    console.warn("Peringatan styling tab Ringkasan:", err);
  }
}

/**
 * Menerapkan styling visual minimalis modern untuk Tab Kelas masing-masing (Notion / Linear Style):
 * - Baris 1: Header Minimalis Kelas (Putih + Slate-900)
 * - Baris 2-3: KPI Ribbon Kelas (Clean Slate-50 Labels + Soft Accents)
 * - Baris 5: Header Tabel Transaksi (Slate-100 Minimalist Header, Frozen Row 5)
 * - Baris 6+: Data Transaksi dengan format bersih
 */
export async function formatClassSheet(
  sheets: any,
  spreadsheetId: string,
  sheetId: number
) {
  try {
    const colWidths = [170, 155, 110, 180, 200, 130, 200, 150, 120, 150, 150];
    const requests: any[] = [
      // Freeze rows 1-5
      {
        updateSheetProperties: {
          properties: {
            sheetId,
            gridProperties: { frozenRowCount: 5 },
          },
          fields: "gridProperties.frozenRowCount",
        },
      },
      // 0. RESET TOTAL AREA HEADER (Baris 0-6, Kolom 0-15) ke PUTIH BERSIH & HAPUS SEMUA BORDER/WARNA HIJAU LAMA
      {
        repeatCell: {
          range: { sheetId, startRowIndex: 0, endRowIndex: 6, startColumnIndex: 0, endColumnIndex: 15 },
          cell: {
            userEnteredFormat: {
              backgroundColorStyle: { rgbColor: PALETTE.white },
            },
          },
          fields: "userEnteredFormat.backgroundColorStyle",
        },
      },
      {
        updateBorders: {
          range: { sheetId, startRowIndex: 0, endRowIndex: 6, startColumnIndex: 0, endColumnIndex: 15 },
          top: { style: "NONE" },
          bottom: { style: "NONE" },
          left: { style: "NONE" },
          right: { style: "NONE" },
          innerHorizontal: { style: "NONE" },
          innerVertical: { style: "NONE" },
        },
      },
      // Lebar kolom
      ...colWidths.map((pixelSize, idx) => ({
        updateDimensionProperties: {
          range: {
            sheetId,
            dimension: "COLUMNS",
            startIndex: idx,
            endIndex: idx + 1,
          },
          properties: { pixelSize },
          fields: "pixelSize",
        },
      })),
      // Tinggi baris
      {
        updateDimensionProperties: {
          range: { sheetId, dimension: "ROWS", startIndex: 0, endIndex: 1 },
          properties: { pixelSize: 40 },
          fields: "pixelSize",
        },
      },
      {
        updateDimensionProperties: {
          range: { sheetId, dimension: "ROWS", startIndex: 1, endIndex: 2 },
          properties: { pixelSize: 22 },
          fields: "pixelSize",
        },
      },
      {
        updateDimensionProperties: {
          range: { sheetId, dimension: "ROWS", startIndex: 2, endIndex: 3 },
          properties: { pixelSize: 32 },
          fields: "pixelSize",
        },
      },
      {
        updateDimensionProperties: {
          range: { sheetId, dimension: "ROWS", startIndex: 3, endIndex: 4 },
          properties: { pixelSize: 12 },
          fields: "pixelSize",
        },
      },
      {
        updateDimensionProperties: {
          range: { sheetId, dimension: "ROWS", startIndex: 4, endIndex: 5 },
          properties: { pixelSize: 34 },
          fields: "pixelSize",
        },
      },
      // Row 1: Header Minimalis Kelas (Clean White Background, NO dark green banner!)
      {
        mergeCells: {
          range: { sheetId, startRowIndex: 0, endRowIndex: 1, startColumnIndex: 0, endColumnIndex: 11 },
          mergeType: "MERGE_ALL",
        },
      },
      {
        repeatCell: {
          range: { sheetId, startRowIndex: 0, endRowIndex: 1, startColumnIndex: 0, endColumnIndex: 11 },
          cell: {
            userEnteredFormat: {
              backgroundColorStyle: { rgbColor: PALETTE.white },
              textFormat: {
                foregroundColorStyle: { rgbColor: PALETTE.slate900 },
                bold: true,
                fontSize: 13,
              },
              horizontalAlignment: "LEFT",
              verticalAlignment: "MIDDLE",
            },
          },
          fields: "userEnteredFormat(backgroundColorStyle,textFormat,horizontalAlignment,verticalAlignment)",
        },
      },
      {
        updateBorders: {
          range: { sheetId, startRowIndex: 0, endRowIndex: 1, startColumnIndex: 0, endColumnIndex: 11 },
          bottom: { style: "SOLID", colorStyle: { rgbColor: PALETTE.slate200 } },
        },
      },
      // Merge Status Kelas pada Row 2 & Row 3 (Kolom 8-10 / I-K) agar pas dengan 11 kolom tabel
      {
        mergeCells: {
          range: { sheetId, startRowIndex: 1, endRowIndex: 2, startColumnIndex: 8, endColumnIndex: 11 },
          mergeType: "MERGE_ALL",
        },
      },
      {
        mergeCells: {
          range: { sheetId, startRowIndex: 2, endRowIndex: 3, startColumnIndex: 8, endColumnIndex: 11 },
          mergeType: "MERGE_ALL",
        },
      },
      // Row 2: KPI Labels (Slate-50 + Slate-500 Uppercase penuh 11 kolom)
      {
        repeatCell: {
          range: { sheetId, startRowIndex: 1, endRowIndex: 2, startColumnIndex: 0, endColumnIndex: 11 },
          cell: {
            userEnteredFormat: {
              backgroundColorStyle: { rgbColor: PALETTE.slate50 },
              textFormat: {
                foregroundColorStyle: { rgbColor: PALETTE.slate500 },
                bold: true,
                fontSize: 8,
              },
              horizontalAlignment: "CENTER",
              verticalAlignment: "MIDDLE",
            },
          },
          fields: "userEnteredFormat(backgroundColorStyle,textFormat,horizontalAlignment,verticalAlignment)",
        },
      },
      {
        updateBorders: {
          range: { sheetId, startRowIndex: 1, endRowIndex: 2, startColumnIndex: 0, endColumnIndex: 11 },
          top: { style: "SOLID", colorStyle: { rgbColor: PALETTE.slate200 } },
          bottom: { style: "SOLID", colorStyle: { rgbColor: PALETTE.slate200 } },
        },
      },
      // Row 3: KPI Values (Clean White Background penuh 11 kolom)
      {
        repeatCell: {
          range: { sheetId, startRowIndex: 2, endRowIndex: 3, startColumnIndex: 0, endColumnIndex: 11 },
          cell: {
            userEnteredFormat: {
              backgroundColorStyle: { rgbColor: PALETTE.white },
              textFormat: { bold: true, fontSize: 10, foregroundColorStyle: { rgbColor: PALETTE.slate900 } },
              horizontalAlignment: "CENTER",
              verticalAlignment: "MIDDLE",
            },
          },
          fields: "userEnteredFormat(backgroundColorStyle,textFormat,horizontalAlignment,verticalAlignment)",
        },
      },
      // Row 3: Sudah Bayar (Modern Emerald-600)
      {
        repeatCell: {
          range: { sheetId, startRowIndex: 2, endRowIndex: 3, startColumnIndex: 1, endColumnIndex: 2 },
          cell: {
            userEnteredFormat: {
              textFormat: { bold: true, foregroundColorStyle: { rgbColor: PALETTE.emerald600 } },
            },
          },
          fields: "userEnteredFormat(textFormat)",
        },
      },
      // Row 3: Belum Bayar (Modern Rose-600)
      {
        repeatCell: {
          range: { sheetId, startRowIndex: 2, endRowIndex: 3, startColumnIndex: 2, endColumnIndex: 3 },
          cell: {
            userEnteredFormat: {
              textFormat: { bold: true, foregroundColorStyle: { rgbColor: PALETTE.rose600 } },
            },
          },
          fields: "userEnteredFormat(textFormat)",
        },
      },
      // Row 3: Currency pada Cols 3, 4, 5, 6
      {
        repeatCell: {
          range: { sheetId, startRowIndex: 2, endRowIndex: 3, startColumnIndex: 3, endColumnIndex: 7 },
          cell: {
            userEnteredFormat: {
              horizontalAlignment: "RIGHT",
              numberFormat: { type: "CURRENCY", pattern: "\"Rp\"#,##0" },
            },
          },
          fields: "userEnteredFormat(horizontalAlignment,numberFormat)",
        },
      },
      // Row 3: Terkumpul (Emerald-600)
      {
        repeatCell: {
          range: { sheetId, startRowIndex: 2, endRowIndex: 3, startColumnIndex: 5, endColumnIndex: 6 },
          cell: {
            userEnteredFormat: {
              textFormat: { bold: true, foregroundColorStyle: { rgbColor: PALETTE.emerald600 } },
            },
          },
          fields: "userEnteredFormat(textFormat)",
        },
      },
      // Row 3: Defisit (Rose-600)
      {
        repeatCell: {
          range: { sheetId, startRowIndex: 2, endRowIndex: 3, startColumnIndex: 6, endColumnIndex: 7 },
          cell: {
            userEnteredFormat: {
              textFormat: { bold: true, foregroundColorStyle: { rgbColor: PALETTE.rose600 } },
            },
          },
          fields: "userEnteredFormat(textFormat)",
        },
      },
      {
        updateBorders: {
          range: { sheetId, startRowIndex: 2, endRowIndex: 3, startColumnIndex: 0, endColumnIndex: 11 },
          bottom: { style: "SOLID", colorStyle: { rgbColor: PALETTE.slate300 } },
        },
      },
      // Row 4: Spacer (Putih Bersih tanpa border)
      {
        repeatCell: {
          range: { sheetId, startRowIndex: 3, endRowIndex: 4, startColumnIndex: 0, endColumnIndex: 11 },
          cell: {
            userEnteredFormat: {
              backgroundColorStyle: { rgbColor: PALETTE.white },
            },
          },
          fields: "userEnteredFormat(backgroundColorStyle)",
        },
      },
      // Row 5: Table Header (Slate-100 Minimalist Header, NO dark green!)
      {
        repeatCell: {
          range: { sheetId, startRowIndex: 4, endRowIndex: 5, startColumnIndex: 0, endColumnIndex: 11 },
          cell: {
            userEnteredFormat: {
              backgroundColorStyle: { rgbColor: PALETTE.slate100 },
              textFormat: {
                foregroundColorStyle: { rgbColor: PALETTE.slate700 },
                bold: true,
                fontSize: 9,
              },
              horizontalAlignment: "CENTER",
              verticalAlignment: "MIDDLE",
            },
          },
          fields: "userEnteredFormat(backgroundColorStyle,textFormat,horizontalAlignment,verticalAlignment)",
        },
      },
      {
        updateBorders: {
          range: { sheetId, startRowIndex: 4, endRowIndex: 5, startColumnIndex: 0, endColumnIndex: 11 },
          bottom: { style: "SOLID_MEDIUM", colorStyle: { rgbColor: PALETTE.slate300 } },
          top: { style: "SOLID", colorStyle: { rgbColor: PALETTE.slate200 } },
        },
      },
      // Table Data Rows formatting
      {
        repeatCell: {
          range: { sheetId, startRowIndex: 5, endRowIndex: 250, startColumnIndex: 0, endColumnIndex: 11 },
          cell: {
            userEnteredFormat: {
              backgroundColorStyle: { rgbColor: PALETTE.white },
              verticalAlignment: "MIDDLE",
              textFormat: { fontSize: 9, foregroundColorStyle: { rgbColor: PALETTE.slate700 } },
            },
          },
          fields: "userEnteredFormat(backgroundColorStyle,verticalAlignment,textFormat)",
        },
      },
      // Col 5 (Nominal) Currency
      {
        repeatCell: {
          range: { sheetId, startRowIndex: 5, endRowIndex: 250, startColumnIndex: 5, endColumnIndex: 6 },
          cell: {
            userEnteredFormat: {
              horizontalAlignment: "RIGHT",
              numberFormat: { type: "CURRENCY", pattern: "\"Rp\"#,##0" },
              textFormat: { bold: true, foregroundColorStyle: { rgbColor: PALETTE.slate900 } },
            },
          },
          fields: "userEnteredFormat(horizontalAlignment,numberFormat,textFormat)",
        },
      },
      // Center on Cols 0, 1, 2, 8, 10
      {
        repeatCell: {
          range: { sheetId, startRowIndex: 5, endRowIndex: 250, startColumnIndex: 0, endColumnIndex: 3 },
          cell: { userEnteredFormat: { horizontalAlignment: "CENTER" } },
          fields: "userEnteredFormat(horizontalAlignment)",
        },
      },
      {
        repeatCell: {
          range: { sheetId, startRowIndex: 5, endRowIndex: 250, startColumnIndex: 8, endColumnIndex: 9 },
          cell: { userEnteredFormat: { horizontalAlignment: "CENTER" } },
          fields: "userEnteredFormat(horizontalAlignment)",
        },
      },
      // Link Tautan Bukti (Indigo-600 with clean underline)
      {
        repeatCell: {
          range: { sheetId, startRowIndex: 5, endRowIndex: 250, startColumnIndex: 10, endColumnIndex: 11 },
          cell: {
            userEnteredFormat: {
              horizontalAlignment: "CENTER",
              textFormat: {
                foregroundColorStyle: { rgbColor: PALETTE.indigo600 },
                underline: true,
                bold: true,
              },
            },
          },
          fields: "userEnteredFormat(horizontalAlignment,textFormat)",
        },
      },
      // Subtle horizontal dividers on transaction rows
      {
        updateBorders: {
          range: { sheetId, startRowIndex: 5, endRowIndex: 250, startColumnIndex: 0, endColumnIndex: 11 },
          innerHorizontal: { style: "SOLID", colorStyle: { rgbColor: PALETTE.slate100 } },
        },
      },
      // Conditional Formatting for Status Mahasiswa (LUNAS, BELUM BAYAR, MENUNGGU VERIFIKASI)
      {
        addConditionalFormatRule: {
          rule: {
            ranges: [{ sheetId, startRowIndex: 5, endRowIndex: 250, startColumnIndex: 8, endColumnIndex: 9 }],
            booleanRule: {
              condition: { type: "TEXT_EQ", values: [{ userEnteredValue: "LUNAS" }] },
              format: {
                backgroundColorStyle: { rgbColor: PALETTE.emerald50 },
                textFormat: { foregroundColorStyle: { rgbColor: PALETTE.emerald600 }, bold: true },
              },
            },
          },
          index: 0,
        },
      },
      {
        addConditionalFormatRule: {
          rule: {
            ranges: [{ sheetId, startRowIndex: 5, endRowIndex: 250, startColumnIndex: 8, endColumnIndex: 9 }],
            booleanRule: {
              condition: { type: "TEXT_EQ", values: [{ userEnteredValue: "APPROVED" }] },
              format: {
                backgroundColorStyle: { rgbColor: PALETTE.emerald50 },
                textFormat: { foregroundColorStyle: { rgbColor: PALETTE.emerald600 }, bold: true },
              },
            },
          },
          index: 1,
        },
      },
      {
        addConditionalFormatRule: {
          rule: {
            ranges: [{ sheetId, startRowIndex: 5, endRowIndex: 250, startColumnIndex: 8, endColumnIndex: 9 }],
            booleanRule: {
              condition: { type: "TEXT_EQ", values: [{ userEnteredValue: "BELUM BAYAR" }] },
              format: {
                backgroundColorStyle: { rgbColor: PALETTE.rose50 },
                textFormat: { foregroundColorStyle: { rgbColor: PALETTE.rose600 }, bold: true },
              },
            },
          },
          index: 2,
        },
      },
      {
        addConditionalFormatRule: {
          rule: {
            ranges: [{ sheetId, startRowIndex: 5, endRowIndex: 250, startColumnIndex: 8, endColumnIndex: 9 }],
            booleanRule: {
              condition: { type: "TEXT_EQ", values: [{ userEnteredValue: "MENUNGGU VERIFIKASI" }] },
              format: {
                backgroundColorStyle: { rgbColor: PALETTE.amber50 },
                textFormat: { foregroundColorStyle: { rgbColor: PALETTE.amber600 }, bold: true },
              },
            },
          },
          index: 3,
        },
      },
    ];

    await sheets.spreadsheets.batchUpdate({
      spreadsheetId,
      requestBody: { requests },
    });
  } catch (err) {
    console.warn("Peringatan styling tab kelas:", err);
  }
}

/**
 * Menginisialisasi spreadsheet:
 * 1. Membuat tab "Ringkasan" di index 0 (halaman pertama berisi ringkasan seluruh kelas)
 * 2. Membuat tab khusus untuk masing-masing kelas (misal: "TI-2023-A", "TI-2023-B")
 * 3. Menghapus tab bawaan default Google ("Sheet1") dan "Kas_Masuk_Approved"
 */
export async function initializeSheetTab(spreadsheetId: string): Promise<{
  success: boolean;
  spreadsheetUrl?: string;
  error?: string;
}> {
  try {
    const { client: sheets, hasWritePermission } = getGoogleSheetsClient();
    if (!hasWritePermission) {
      return { success: false, error: "Service Account tidak memiliki izin tulis." };
    }

    // 1. Ambil daftar semua kelas dari database
    const classes = await prisma.class.findMany({
      select: { name: true },
      orderBy: { name: "asc" },
    });

    const classNames = classes.map((c) => c.name.trim()).filter(Boolean);
    if (classNames.length === 0) {
      classNames.push("Semua Kelas");
    }

    // 2. Baca daftar tab sheet yang sudah ada saat ini
    const spreadsheet = await sheets.spreadsheets.get({ spreadsheetId });
    const existingSheets = spreadsheet.data.sheets || [];
    const existingTitles = existingSheets.map((s) => s.properties?.title || "");

    // 3. Tambahkan tab "Ringkasan" (jika belum ada) dan tab kelas
    const addSheetRequests: any[] = [];
    if (!existingTitles.includes("Ringkasan")) {
      addSheetRequests.push({
        addSheet: {
          properties: {
            title: "Ringkasan",
            index: 0,
          },
        },
      });
    }

    for (const className of classNames) {
      if (!existingTitles.includes(className)) {
        addSheetRequests.push({
          addSheet: {
            properties: {
              title: className,
              gridProperties: {
                frozenRowCount: 5,
              },
            },
          },
        });
      }
    }

    if (addSheetRequests.length > 0) {
      await sheets.spreadsheets.batchUpdate({
        spreadsheetId,
        requestBody: {
          requests: addSheetRequests,
        },
      });
    }

    // Pastikan "Ringkasan" di index 0
    const refreshed = await sheets.spreadsheets.get({ spreadsheetId });
    const currentSheets = refreshed.data.sheets || [];
    const summarySheet = currentSheets.find((s) => s.properties?.title === "Ringkasan");
    if (summarySheet && summarySheet.properties?.index !== 0 && summarySheet.properties?.sheetId !== undefined) {
      try {
        await sheets.spreadsheets.batchUpdate({
          spreadsheetId,
          requestBody: {
            requests: [
              {
                updateSheetProperties: {
                  properties: {
                    sheetId: summarySheet.properties.sheetId,
                    index: 0,
                  },
                  fields: "index",
                },
              },
            ],
          },
        });
      } catch (idxErr) {
        console.warn("Peringatan saat menyetel index tab Ringkasan:", idxErr);
      }
    }

    // 4. Hapus tab bawaan ("Sheet1", "Sheet 1") dan tab lama ("Kas_Masuk_Approved")
    const refreshedSpreadsheet = await sheets.spreadsheets.get({ spreadsheetId });
    const allCurrentSheets = refreshedSpreadsheet.data.sheets || [];

    const sheetsToDelete = allCurrentSheets.filter((s) => {
      const title = s.properties?.title?.trim().toLowerCase() || "";
      const isDefaultSheet = title === "sheet1" || title === "sheet 1";
      const isOldTab =
        title === "kas_masuk_approved" &&
        !classNames.some((c) => c.toLowerCase() === "kas_masuk_approved");
      return isDefaultSheet || isOldTab;
    });

    // Syarat Google: sebuah spreadsheet harus memiliki setidaknya 1 sheet tersisa
    if (sheetsToDelete.length > 0 && allCurrentSheets.length > sheetsToDelete.length) {
      const deleteRequests = sheetsToDelete.map((s) => ({
        deleteSheet: {
          sheetId: s.properties?.sheetId,
        },
      }));

      try {
        await sheets.spreadsheets.batchUpdate({
          spreadsheetId,
          requestBody: {
            requests: deleteRequests,
          },
        });
      } catch (delErr) {
        console.warn("Peringatan saat menghapus sheet bawaan:", delErr);
      }
    }

    return {
      success: true,
      spreadsheetUrl: `https://docs.google.com/spreadsheets/d/${spreadsheetId}/edit`,
    };
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Gagal mengakses spreadsheet";
    console.error("Gagal menginisialisasi tab kelas spreadsheet:", error);
    return { success: false, error: msg };
  }
}

/**
 * Membuat Google Spreadsheet baru secara otomatis untuk sebuah Tagihan Kas
 * dan membagikannya ke email bendahara (GOOGLE_ACCOUNT_EMAIL)
 */
export async function createBillSpreadsheet({
  billTitle,
  academicTerm,
}: {
  billTitle: string;
  academicTerm?: string | null;
}): Promise<{
  success: boolean;
  spreadsheetId?: string;
  spreadsheetUrl?: string;
  error?: string;
}> {
  try {
    const { client: sheets, driveClient, hasWritePermission } = getGoogleSheetsClient();

    if (!hasWritePermission || !driveClient) {
      return {
        success: false,
        error: "Service Account diperlukan untuk membuat Google Spreadsheet baru secara otomatis.",
      };
    }

    const title = `Kas - ${billTitle}${academicTerm ? ` (${academicTerm})` : ""}`;
    const tabName = process.env.GOOGLE_SHEET_TAB_NAME || "Kas_Masuk_Approved";

    const createRes = await sheets.spreadsheets.create({
      requestBody: {
        properties: {
          title,
        },
        sheets: [
          {
            properties: {
              title: tabName,
              gridProperties: {
                frozenRowCount: 1,
              },
            },
            data: [
              {
                startRow: 0,
                startColumn: 0,
                rowData: [
                  {
                    values: [
                      { userEnteredValue: { stringValue: "Waktu Verifikasi (WIB)" } },
                      { userEnteredValue: { stringValue: "Kode Transaksi" } },
                      { userEnteredValue: { stringValue: "Kelas" } },
                      { userEnteredValue: { stringValue: "NIM" } },
                      { userEnteredValue: { stringValue: "Nama Mahasiswa" } },
                      { userEnteredValue: { stringValue: "Tagihan Kas" } },
                      { userEnteredValue: { stringValue: "Nominal (Rp)" } },
                      { userEnteredValue: { stringValue: "Metode Pembayaran" } },
                      { userEnteredValue: { stringValue: "PIC Bendahara" } },
                      { userEnteredValue: { stringValue: "Status" } },
                      { userEnteredValue: { stringValue: "Diverifikasi Oleh" } },
                      { userEnteredValue: { stringValue: "Tautan Bukti Transfer" } },
                    ],
                  },
                ],
              },
            ],
          },
        ],
      },
    });

    const spreadsheetId = createRes.data.spreadsheetId;
    const spreadsheetUrl =
      createRes.data.spreadsheetUrl ||
      `https://docs.google.com/spreadsheets/d/${spreadsheetId}/edit`;

    if (!spreadsheetId) {
      return { success: false, error: "Gagal mendapatkan Spreadsheet ID dari Google." };
    }

    // Bagikan spreadsheet ke email bendahara (GOOGLE_ACCOUNT_EMAIL / hnzsama@gmail.com) sebagai Editor
    const userEmail = process.env.GOOGLE_ACCOUNT_EMAIL || "hnzsama@gmail.com";
    if (userEmail && driveClient) {
      try {
        await driveClient.permissions.create({
          fileId: spreadsheetId,
          requestBody: {
            role: "writer",
            type: "user",
            emailAddress: userEmail,
          },
        });
        console.log(`✅ Spreadsheet "${title}" berhasil dibagikan ke ${userEmail}`);
      } catch (driveErr) {
        console.warn("Peringatan: Gagal menambahkan permission Drive (tetap dapat diakses jika link dibuka):", driveErr);
      }
    }

    return {
      success: true,
      spreadsheetId,
      spreadsheetUrl,
    };
  } catch (error: unknown) {
    const errorMsg = error instanceof Error ? error.message : "Gagal membuat spreadsheet baru";
    console.error("Gagal membuat spreadsheet tagihan:", error);
    return {
      success: false,
      error: errorMsg,
    };
  }
}

/**
 * Menambahkan 1 baris transaksi yang telah disetujui (APPROVED) ke Google Spreadsheet
 * Mendukung spreadsheet spesifik per-tagihan atau fallback ke global GOOGLE_SHEET_ID
 */
export async function appendTransactionToSheet(
  data: SheetTransactionPayload
): Promise<SyncResult> {
  const spreadsheetId = data.spreadsheetId || process.env.GOOGLE_SHEET_ID;
  const targetTab = data.className?.trim() || process.env.GOOGLE_SHEET_TAB_NAME || "Kas_Masuk_Approved";
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

  if (!spreadsheetId) {
    return {
      success: false,
      error: "Spreadsheet ID belum dikonfigurasi untuk tagihan ini dan tidak ada fallback di .env.",
    };
  }

  try {
    const { client: sheets, hasWritePermission } = getGoogleSheetsClient();

    if (!hasWritePermission) {
      return {
        success: false,
        error:
          "Google API Key terdeteksi, namun Google Sheets memerlukan Service Account (OAuth 2.0 / JWT) dengan hak Editor untuk menulis baris baru.",
      };
    }

    // Pastikan tab untuk kelas ini ada di spreadsheet, jika belum ada buat otomatis beserta headernya
    const spreadsheet = await sheets.spreadsheets.get({ spreadsheetId });
    const sheetList = spreadsheet.data.sheets || [];
    const hasTargetTab = sheetList.some((s) => s.properties?.title === targetTab);

    if (!hasTargetTab) {
      await sheets.spreadsheets.batchUpdate({
        spreadsheetId,
        requestBody: {
          requests: [
            {
              addSheet: {
                properties: {
                  title: targetTab,
                  gridProperties: {
                    frozenRowCount: 1,
                  },
                },
              },
            },
          ],
        },
      });

      await sheets.spreadsheets.values.update({
        spreadsheetId,
        range: `'${targetTab}'!A1:K1`,
        valueInputOption: "USER_ENTERED",
        requestBody: {
          values: [SHEET_HEADER_COLUMNS],
        },
      });
    }

    // Hindari duplikasi baris jika transaksi ini sudah tercatat sebelumnya di tab ini
    try {
      const existingRows = await sheets.spreadsheets.values.get({
        spreadsheetId,
        range: `'${targetTab}'!B:B`,
      });
      const codes = (existingRows.data.values || []).map((row) => row[0]);
      if (codes.includes(data.referenceCode)) {
        return {
          success: true,
          rowInserted: 0,
        };
      }
    } catch {
      // Jika terjadi error saat cek, lanjutkan proses append
    }

    // Format tanggal ke waktu lokal WIB (Asia/Jakarta)
    const formattedDate = new Intl.DateTimeFormat("id-ID", {
      dateStyle: "medium",
      timeStyle: "medium",
      timeZone: "Asia/Jakarta",
    }).format(data.verifiedAt);

    const absoluteProofUrl = data.proofImageUrl?.startsWith("http")
      ? data.proofImageUrl
      : `${baseUrl}${data.proofImageUrl?.startsWith("/") ? "" : "/"}${data.proofImageUrl || ""}`;

    const proofCell = data.proofImageUrl ? absoluteProofUrl : "-";

    // Baris data sesuai dengan urutan Kolom A sampai K (tanpa kolom Kelas)
    const rowValues = [
      formattedDate,
      data.referenceCode,
      data.nim,
      data.studentName,
      data.billTitle,
      Number(data.amountPaid),
      `${data.paymentMethodName} (${data.accountNumber})`,
      data.picName,
      data.status,
      data.verifierName,
      proofCell,
    ];

    const response = await sheets.spreadsheets.values.append({
      spreadsheetId,
      range: `'${targetTab}'!A:K`,
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
  } catch (error: unknown) {
    const errorMsg = error instanceof Error ? error.message : "Terjadi kesalahan koneksi";
    console.error("Gagal melakukan append ke Google Sheets:", error);
    return {
      success: false,
      error: errorMsg,
    };
  }
}

/**
 * Sinkronisasi seluruh transaksi APPROVED yang ada untuk tagihan tertentu
 * ke masing-masing tab kelas di Google Spreadsheet.
 */
export async function syncBillApprovedTransactions(billId: string): Promise<{
  success: boolean;
  syncedCount: number;
  error?: string;
}> {
  try {
    const bill = await prisma.bill.findUnique({
      where: { id: billId },
      include: {
        transactions: {
          include: {
            student: { include: { class: true } },
            paymentMethod: true,
            verifiedBy: true,
          },
          orderBy: { createdAt: "desc" },
        },
      },
    });

    if (!bill || !bill.googleSheetId) {
      return {
        success: false,
        syncedCount: 0,
        error: "Tagihan atau Google Spreadsheet tidak ditemukan.",
      };
    }

    const spreadsheetId = bill.googleSheetId;
    const { client: sheetsClient } = getGoogleSheetsClient();
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

    const classes = await prisma.class.findMany({
      include: {
        students: {
          orderBy: { nim: "asc" },
        },
      },
      orderBy: { name: "asc" },
    });

    const formattedNow = new Intl.DateTimeFormat("id-ID", {
      dateStyle: "medium",
      timeStyle: "short",
      timeZone: "Asia/Jakarta",
    }).format(new Date());

    // 1. Hitung statistik per kelas dan grand total
    let grandTotalStudents = 0;
    let grandTotalPaid = 0;
    let grandTotalTarget = 0;
    let grandTotalCollected = 0;
    const txIdsToMark: string[] = [];

    const classSummaries = classes.map((c) => {
      const classApproved = bill.transactions.filter(
        (t) => t.student.classId === c.id && t.status === "APPROVED"
      );
      const totalStudents = c.students.length;
      const paidStudents = classApproved.length;
      const unpaidStudents = Math.max(0, totalStudents - paidStudents);
      const targetAmount = totalStudents * bill.amount;
      const collectedAmount = classApproved.reduce(
        (acc, t) => acc + t.amountPaid,
        0
      );
      const deficitAmount = Math.max(0, targetAmount - collectedAmount);
      const progressPct =
        targetAmount > 0
          ? ((collectedAmount / targetAmount) * 100).toFixed(1) + "%"
          : "0%";
      const status = unpaidStudents === 0 && totalStudents > 0 ? "LUNAS" : "BELUM LUNAS";

      grandTotalStudents += totalStudents;
      grandTotalPaid += paidStudents;
      grandTotalTarget += targetAmount;
      grandTotalCollected += collectedAmount;

      classApproved.forEach((tx) => txIdsToMark.push(tx.id));

      return {
        classId: c.id,
        className: c.name,
        totalStudents,
        paidStudents,
        unpaidStudents,
        targetAmount,
        collectedAmount,
        deficitAmount,
        progressPct,
        status,
        students: c.students,
      };
    });

    const grandTotalUnpaid = Math.max(0, grandTotalStudents - grandTotalPaid);
    const grandTotalDeficit = Math.max(0, grandTotalTarget - grandTotalCollected);
    const grandOverallProgress =
      grandTotalTarget > 0
        ? ((grandTotalCollected / grandTotalTarget) * 100).toFixed(1) + "%"
        : "0%";
    const grandStatus =
      grandTotalUnpaid === 0 && grandTotalStudents > 0 ? "LUNAS LENGKAP" : "BELUM LUNAS";

    const spreadsheet = await sheetsClient.spreadsheets.get({ spreadsheetId });
    const sheetList = spreadsheet.data.sheets || [];
    const sheetLocale = spreadsheet.data.properties?.locale || "id_ID";
    const formulaSep = sheetLocale.toLowerCase().startsWith("id") ? ";" : ",";

    // ==========================================
    // 2. UPDATE TAB "Ringkasan" (Executive Summary)
    // ==========================================
    const summarySheet = sheetList.find((s) => s.properties?.title === "Ringkasan");
    if (summarySheet && summarySheet.properties?.sheetId !== undefined) {
      try {
        await sheetsClient.spreadsheets.values.clear({
          spreadsheetId,
          range: "'Ringkasan'!A1:Z100",
        });

        const summaryRows: any[][] = [
          // Row 1: Banner Judul (Minimalist Notion Style)
          [`📊 Ringkasan Iuran: ${bill.title}`],
          // Row 2: Sub-info
          [
            `Semester ${bill.academicTerm || "-"}  •  Target Rp ${bill.amount.toLocaleString(
              "id-ID"
            )} / mhs  •  Sinkronisasi: ${formattedNow} WIB`,
          ],
          // Row 3: Blank
          [],
          // Row 4: Header KPI Cards
          [
            "",
            "TOTAL MAHASISWA",
            "",
            "MAHASISWA LUNAS",
            "",
            "TOTAL TERKUMPUL",
            "",
            "SISA KEKURANGAN",
          ],
          // Row 5: Value KPI Cards
          [
            "",
            `${grandTotalStudents} Mahasiswa`,
            "",
            `${grandTotalPaid} Mahasiswa (${grandOverallProgress})`,
            "",
            Number(grandTotalCollected),
            "",
            Number(grandTotalDeficit),
          ],
          // Row 6: Blank
          [],
          // Row 7: Section Header
          ["RINCIAN PER KELAS"],
          // Row 8: Table Header
          [
            "No",
            "Nama Kelas",
            "Total Mhs",
            "Sudah Bayar",
            "Belum Bayar",
            "Target Iuran (Rp)",
            "Terkumpul (Rp)",
            "Kekurangan (Rp)",
            "Progres (%)",
            "Status",
          ],
        ];

        classSummaries.forEach((cs, idx) => {
          summaryRows.push([
            idx + 1,
            cs.className,
            cs.totalStudents,
            cs.paidStudents,
            cs.unpaidStudents,
            cs.targetAmount,
            cs.collectedAmount,
            cs.deficitAmount,
            cs.progressPct,
            cs.status,
          ]);
        });

        summaryRows.push([
          "TOTAL",
          "SEMUA KELAS",
          grandTotalStudents,
          grandTotalPaid,
          grandTotalUnpaid,
          grandTotalTarget,
          grandTotalCollected,
          grandTotalDeficit,
          grandOverallProgress,
          grandStatus,
        ]);

        await sheetsClient.spreadsheets.values.update({
          spreadsheetId,
          range: "'Ringkasan'!A1:J" + summaryRows.length,
          valueInputOption: "USER_ENTERED",
          requestBody: { values: summaryRows },
        });

        await formatSummarySheet(
          sheetsClient,
          spreadsheetId,
          summarySheet.properties.sheetId!,
          summaryRows.length - 1
        );
      } catch (sumErr) {
        console.error("Gagal mengupdate tab Ringkasan:", sumErr);
      }
    }

    // ==========================================
    // 3. UPDATE DETAIL TAB KELAS (TI-2023-A, TI-2023-B, dst)
    // ==========================================
    let synced = 0;

    for (const cs of classSummaries) {
      const classSheet = sheetList.find((s) => s.properties?.title === cs.className);
      if (!classSheet || classSheet.properties?.sheetId === undefined) continue;

      try {
        await sheetsClient.spreadsheets.values.clear({
          spreadsheetId,
          range: `'${cs.className}'!A1:Z500`,
        });

        const classRows: any[][] = [
          // Row 1: Header Minimalis Kelas (Notion Style)
          [`⚡ Rincian Kelas: ${cs.className}  •  ${bill.title}`],
          // Row 2: KPI Labels (11 Kolom Lengkap)
          [
            "Total Mahasiswa",
            "Sudah Bayar",
            "Belum Bayar",
            "Nominal / Mhs",
            "Target Kelas",
            "Total Terkumpul",
            "Kekurangan Uang",
            "Progres",
            "Status Kelas",
            "",
            "",
          ],
          // Row 3: KPI Values (11 Kolom Lengkap)
          [
            `${cs.totalStudents} Mahasiswa`,
            `${cs.paidStudents} Mahasiswa`,
            `${cs.unpaidStudents} Mahasiswa`,
            Number(bill.amount),
            Number(cs.targetAmount),
            Number(cs.collectedAmount),
            Number(cs.deficitAmount),
            cs.progressPct,
            cs.status,
            "",
            "",
          ],
          // Row 4: Blank
          [],
          // Row 5: Table Header
          SHEET_HEADER_COLUMNS,
        ];

        // Rows 6+: Daftar seluruh mahasiswa di kelas ini (baik yang sudah maupun belum bayar)
        const studentRows = cs.students.map((student) => {
          const approvedTx = bill.transactions.find(
            (t) => t.studentId === student.id && t.status === "APPROVED"
          );
          const pendingTx = bill.transactions.find(
            (t) => t.studentId === student.id && t.status === "PENDING"
          );

          if (approvedTx) {
            const formattedDate = new Intl.DateTimeFormat("id-ID", {
              dateStyle: "medium",
              timeStyle: "medium",
              timeZone: "Asia/Jakarta",
            }).format(approvedTx.verifiedAt || new Date());

            const absoluteProofUrl = approvedTx.proofImageUrl?.startsWith("http")
              ? approvedTx.proofImageUrl
              : `${baseUrl}${approvedTx.proofImageUrl?.startsWith("/") ? "" : "/"}${approvedTx.proofImageUrl || ""}`;

            return {
              order: 0,
              nim: student.nim,
              name: student.name,
              data: [
                formattedDate,
                approvedTx.referenceCode,
                student.nim || "-",
                student.name,
                bill.title,
                Number(approvedTx.amountPaid),
                `${approvedTx.paymentMethod.name} (${approvedTx.paymentMethod.accountNumber})`,
                approvedTx.paymentMethod.picName,
                "LUNAS",
                approvedTx.verifiedBy?.fullName || "Bendahara",
                approvedTx.proofImageUrl ? absoluteProofUrl : "-",
              ],
            };
          } else if (pendingTx) {
            const absoluteProofUrl = pendingTx.proofImageUrl?.startsWith("http")
              ? pendingTx.proofImageUrl
              : `${baseUrl}${pendingTx.proofImageUrl?.startsWith("/") ? "" : "/"}${pendingTx.proofImageUrl || ""}`;

            return {
              order: 1,
              nim: student.nim,
              name: student.name,
              data: [
                "-",
                pendingTx.referenceCode,
                student.nim || "-",
                student.name,
                bill.title,
                Number(pendingTx.amountPaid),
                `${pendingTx.paymentMethod.name} (${pendingTx.paymentMethod.accountNumber})`,
                pendingTx.paymentMethod.picName,
                "MENUNGGU VERIFIKASI",
                "-",
                pendingTx.proofImageUrl ? absoluteProofUrl : "-",
              ],
            };
          } else {
            return {
              order: 2,
              nim: student.nim,
              name: student.name,
              data: [
                "-",
                "-",
                student.nim || "-",
                student.name,
                bill.title,
                0,
                "-",
                "-",
                "BELUM BAYAR",
                "-",
                "-",
              ],
            };
          }
        });

        // Urutkan: Lunas di atas, diikuti Menunggu Verifikasi, lalu Belum Bayar (di dalam grup diurutkan sesuai Nama/NIM)
        studentRows.sort(
          (a, b) =>
            a.order - b.order ||
            (a.nim && b.nim ? a.nim.localeCompare(b.nim) : 0) ||
            a.name.localeCompare(b.name)
        );

        studentRows.forEach((sr) => {
          classRows.push(sr.data);
        });

        await sheetsClient.spreadsheets.values.update({
          spreadsheetId,
          range: `'${cs.className}'!A1:K` + classRows.length,
          valueInputOption: "USER_ENTERED",
          requestBody: { values: classRows },
        });

        await formatClassSheet(
          sheetsClient,
          spreadsheetId,
          classSheet.properties.sheetId!
        );

        synced += studentRows.filter((s) => s.order === 0).length;
      } catch (clsErr) {
        console.error(`Gagal mengupdate tab ${cs.className}:`, clsErr);
      }
    }

    // Tandai status sync di database
    if (txIdsToMark.length > 0) {
      await prisma.transaction.updateMany({
        where: { id: { in: txIdsToMark } },
        data: {
          sheetSyncStatus: "SYNCED",
          sheetSyncedAt: new Date(),
          sheetErrorLog: null,
        },
      });
    }

    return { success: true, syncedCount: synced };
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Gagal sinkronisasi transaksi tagihan";
    return { success: false, syncedCount: 0, error: msg };
  }
}

/**
 * Tes koneksi ke spreadsheet untuk memverifikasi Service Account
 */
export async function testGoogleConnection(customSheetId?: string): Promise<{
  success: boolean;
  message: string;
  spreadsheetTitle?: string;
}> {
  const spreadsheetId = customSheetId || process.env.GOOGLE_SHEET_ID;

  if (!spreadsheetId) {
    return {
      success: false,
      message: "GOOGLE_SHEET_ID belum disetel di file .env atau pada tagihan.",
    };
  }

  try {
    const { client: sheets, hasWritePermission } = getGoogleSheetsClient();

    const res = await sheets.spreadsheets.get({
      spreadsheetId,
    });

    const title = res.data.properties?.title || "Spreadsheet Tanpa Judul";

    if (hasWritePermission) {
      return {
        success: true,
        message: `Koneksi Google Sheets berhasil via Service Account! Judul: "${title}" (Izin Tulis Aktif)`,
        spreadsheetTitle: title,
      };
    } else {
      return {
        success: true,
        message: `Koneksi Google Sheets berhasil via API Key! Judul: "${title}" (Read-only).`,
        spreadsheetTitle: title,
      };
    }
  } catch (error: unknown) {
    const errorMsg = error instanceof Error ? error.message : "Gagal menghubungi Google Sheets API.";
    return {
      success: false,
      message: errorMsg,
    };
  }
}
