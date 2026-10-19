"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { extractSpreadsheetId, initializeSheetTab, syncBillApprovedTransactions } from "@/lib/google-sheets";

function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

async function generateUniqueSlug(
  title: string,
  customSlug?: string | null,
  excludeId?: string
): Promise<string> {
  const base = slugify(customSlug?.trim() || title) || "tagihan";
  let slug = base;
  let counter = 1;

  while (true) {
    const existing = await prisma.bill.findFirst({
      where: {
        slug,
        ...(excludeId ? { NOT: { id: excludeId } } : {}),
      },
      select: { id: true },
    });
    if (!existing) return slug;
    counter++;
    slug = `${base}-${counter}`;
  }
}

const createBillSchema = z.object({
  title: z.string().min(3, "Judul tagihan minimal 3 karakter"),
  slug: z.string().optional().nullable(),
  description: z.string().optional().nullable(),
  amount: z.number().positive("Nominal harus lebih dari 0"),
  dueDate: z.string().optional().nullable(),
  academicTerm: z.string().min(2, "Tahun ajaran wajib diisi"),
  googleSheetInput: z.string().optional().nullable(),
});

const updateBillSchema = z.object({
  id: z.string().min(1, "ID tagihan tidak valid"),
  title: z.string().min(3, "Judul tagihan minimal 3 karakter"),
  slug: z.string().optional().nullable(),
  description: z.string().optional().nullable(),
  amount: z.number().positive("Nominal harus lebih dari 0"),
  dueDate: z.string().optional().nullable(),
  academicTerm: z.string().min(2, "Tahun ajaran wajib diisi"),
  isActive: z.boolean(),
  googleSheetInput: z.string().optional().nullable(),
});

/**
 * Server Action: Buat Tagihan Kas Baru (Menghubungkan Google Spreadsheet jika diisi)
 */
export async function createBillAction(data: {
  title: string;
  slug?: string | null;
  description?: string | null;
  amount: number;
  dueDate?: string | null;
  academicTerm: string;
  googleSheetInput?: string | null;
}) {
  try {
    const validated = createBillSchema.parse(data);
    const finalSlug = await generateUniqueSlug(validated.title, validated.slug);

    let googleSheetId: string | null = null;
    let googleSheetUrl: string | null = null;
    let sheetNote = "";

    // Jika pengguna memasukkan Google Sheet
    if (data.googleSheetInput?.trim()) {
      const extractedId = extractSpreadsheetId(data.googleSheetInput.trim());
      if (!extractedId) {
        return {
          success: false,
          error: "Format link atau ID Google Spreadsheet tidak valid.",
        };
      }

      const initRes = await initializeSheetTab(extractedId);
      if (!initRes.success) {
        return {
          success: false,
          error: `Gagal mengakses Google Spreadsheet: ${initRes.error}. Pastikan spreadsheet sudah dibagikan ke ${process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL || "my-bendahara@manminmun.iam.gserviceaccount.com"} sebagai Editor.`,
        };
      }

      googleSheetId = extractedId;
      googleSheetUrl =
        initRes.spreadsheetUrl ||
        `https://docs.google.com/spreadsheets/d/${extractedId}/edit`;
      sheetNote = " dan Google Spreadsheet berhasil dihubungkan";
    }

    const bill = await prisma.bill.create({
      data: {
        title: validated.title.trim(),
        slug: finalSlug,
        description: validated.description?.trim() || null,
        amount: validated.amount,
        dueDate: validated.dueDate ? new Date(validated.dueDate) : null,
        academicTerm: validated.academicTerm.trim(),
        isActive: true,
        googleSheetId,
        googleSheetUrl,
      },
    });

    if (googleSheetId) {
      await syncBillApprovedTransactions(bill.id);
    }

    revalidatePath("/dashboard/bills");
    revalidatePath("/dashboard");
    revalidatePath("/dashboard/verification");

    return {
      success: true,
      message: `Tagihan "${bill.title}" berhasil dibuat${sheetNote}!`,
      bill,
      googleSheetUrl,
    };
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : "Gagal membuat tagihan baru";
    return { success: false, error: errorMsg };
  }
}

/**
 * Server Action: Hubungkan Google Spreadsheet ke Tagihan yang sudah ada
 */
export async function linkSheetToBillAction(billId: string, sheetInput: string) {
  try {
    const bill = await prisma.bill.findUnique({
      where: { id: billId },
    });

    if (!bill) {
      return { success: false, error: "Tagihan tidak ditemukan" };
    }

    if (!sheetInput?.trim()) {
      // Hapus tautan spreadsheet jika input dikosongkan
      const updated = await prisma.bill.update({
        where: { id: billId },
        data: {
          googleSheetId: null,
          googleSheetUrl: null,
        },
      });
      revalidatePath("/dashboard/bills");
      return {
        success: true,
        message: `Tautan Google Spreadsheet untuk "${updated.title}" berhasil dihapus.`,
      };
    }

    const extractedId = extractSpreadsheetId(sheetInput.trim());
    if (!extractedId) {
      return {
        success: false,
        error: "Format link atau ID Google Spreadsheet tidak valid.",
      };
    }

    const initRes = await initializeSheetTab(extractedId);
    if (!initRes.success) {
      return {
        success: false,
        error: `Gagal mengakses Google Spreadsheet: ${initRes.error}. Pastikan spreadsheet sudah dibagikan ke ${process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL || "my-bendahara@manminmun.iam.gserviceaccount.com"} sebagai Editor.`,
      };
    }

    const updated = await prisma.bill.update({
      where: { id: billId },
      data: {
        googleSheetId: extractedId,
        googleSheetUrl:
          initRes.spreadsheetUrl ||
          `https://docs.google.com/spreadsheets/d/${extractedId}/edit`,
      },
    });

    // Otomatis sinkronkan transaksi APPROVED yang sudah ada ke tab kelas di sheet baru
    const syncRes = await syncBillApprovedTransactions(updated.id);

    revalidatePath("/dashboard/bills");
    revalidatePath("/dashboard");
    revalidatePath("/dashboard/verification");

    const syncInfo = syncRes.syncedCount > 0 ? ` (${syncRes.syncedCount} transaksi lunas berhasil disinkronkan)` : "";

    return {
      success: true,
      message: `Google Spreadsheet berhasil dihubungkan ke tagihan "${updated.title}"${syncInfo}!`,
      googleSheetUrl: updated.googleSheetUrl,
    };
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : "Gagal menghubungkan spreadsheet";
    return { success: false, error: errorMsg };
  }
}

/**
 * Server Action: Perbarui Tagihan Kas
 */
export async function updateBillAction(data: {
  id: string;
  title: string;
  slug?: string | null;
  description?: string | null;
  amount: number;
  dueDate?: string | null;
  academicTerm: string;
  isActive: boolean;
  googleSheetInput?: string | null;
}) {
  try {
    const validated = updateBillSchema.parse(data);
    const finalSlug = await generateUniqueSlug(validated.title, validated.slug, validated.id);

    let googleSheetUpdate: { googleSheetId?: string | null; googleSheetUrl?: string | null } = {};

    if (data.googleSheetInput !== undefined) {
      if (data.googleSheetInput?.trim()) {
        const extractedId = extractSpreadsheetId(data.googleSheetInput.trim());
        if (!extractedId) {
          return {
            success: false,
            error: "Format link atau ID Google Spreadsheet tidak valid.",
          };
        }

        const initRes = await initializeSheetTab(extractedId);
        if (!initRes.success) {
          return {
            success: false,
            error: `Gagal mengakses Google Spreadsheet: ${initRes.error}. Pastikan spreadsheet sudah dibagikan ke ${process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL || "my-bendahara@manminmun.iam.gserviceaccount.com"} sebagai Editor.`,
          };
        }

        googleSheetUpdate = {
          googleSheetId: extractedId,
          googleSheetUrl:
            initRes.spreadsheetUrl ||
            `https://docs.google.com/spreadsheets/d/${extractedId}/edit`,
        };
      } else {
        googleSheetUpdate = {
          googleSheetId: null,
          googleSheetUrl: null,
        };
      }
    }

    const updated = await prisma.bill.update({
      where: { id: validated.id },
      data: {
        title: validated.title.trim(),
        slug: finalSlug,
        description: validated.description?.trim() || null,
        amount: validated.amount,
        dueDate: validated.dueDate ? new Date(validated.dueDate) : null,
        academicTerm: validated.academicTerm.trim(),
        isActive: validated.isActive,
        ...googleSheetUpdate,
      },
    });

    if (googleSheetUpdate.googleSheetId) {
      await syncBillApprovedTransactions(updated.id);
    }

    revalidatePath("/dashboard/bills");
    revalidatePath("/dashboard");

    return {
      success: true,
      message: `Tagihan "${updated.title}" berhasil diperbarui!`,
      bill: updated,
    };
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : "Gagal memperbarui tagihan";
    return { success: false, error: errorMsg };
  }
}

/**
 * Server Action: Sinkronkan ulang seluruh transaksi lunas ke tab kelas Google Spreadsheet
 */
export async function syncBillTransactionsAction(billId: string) {
  try {
    const bill = await prisma.bill.findUnique({
      where: { id: billId },
    });

    if (!bill || !bill.googleSheetId) {
      return {
        success: false,
        error: "Tagihan ini belum memiliki tautan Google Spreadsheet.",
      };
    }

    const initRes = await initializeSheetTab(bill.googleSheetId);
    if (!initRes.success) {
      return { success: false, error: `Gagal akses Google Sheet: ${initRes.error}` };
    }

    const syncRes = await syncBillApprovedTransactions(bill.id);

    revalidatePath("/dashboard/bills");
    revalidatePath("/dashboard");
    revalidatePath("/dashboard/verification");

    return {
      success: true,
      message: `Berhasil menyinkronkan ${syncRes.syncedCount} transaksi lunas ke tab kelas Google Spreadsheet!`,
    };
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : "Gagal sinkronisasi transaksi";
    return { success: false, error: errorMsg };
  }
}

/**
 * Server Action: Toggle Status Aktif/Arsip Tagihan
 */
export async function toggleBillStatusAction(id: string) {
  try {
    const existing = await prisma.bill.findUnique({
      where: { id },
      select: { id: true, title: true, isActive: true },
    });

    if (!existing) {
      return { success: false, error: "Tagihan tidak ditemukan" };
    }

    const updated = await prisma.bill.update({
      where: { id },
      data: { isActive: !existing.isActive },
    });

    revalidatePath("/dashboard/bills");
    revalidatePath("/dashboard");

    return {
      success: true,
      message: `Status tagihan "${updated.title}" diubah menjadi ${updated.isActive ? "Aktif" : "Non-Aktif/Diarsipkan"}!`,
      isActive: updated.isActive,
    };
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : "Gagal mengubah status tagihan";
    return { success: false, error: errorMsg };
  }
}
