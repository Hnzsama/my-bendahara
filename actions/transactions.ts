"use server";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import {
  appendTransactionToSheet,
  syncBillApprovedTransactions,
  testGoogleConnection,
} from "@/lib/google-sheets";
import { revalidatePath } from "next/cache";

export type ActionResponse<T = undefined> = {
  success: boolean;
  message?: string;
  data?: T;
  error?: string;
};

/**
 * Helper: Memastikan ID admin/verifikator valid ada di database
 * guna mencegah galat P2003 Foreign Key Constraint Violation jika ID sesi kadaluarsa/re-seeded
 */
async function resolveValidAdminId(candidateId?: string | null): Promise<{ id: string | null; name: string }> {
  if (candidateId) {
    const admin = await prisma.admin.findUnique({
      where: { id: candidateId },
      select: { id: true, fullName: true },
    });
    if (admin) {
      return { id: admin.id, name: admin.fullName };
    }
  }

  const fallbackAdmin = await prisma.admin.findFirst({
    where: { isActive: true },
    select: { id: true, fullName: true },
  });

  if (fallbackAdmin) {
    return { id: fallbackAdmin.id, name: fallbackAdmin.fullName };
  }

  return { id: null, name: "Bendahara" };
}

/**
 * 1. Approve Transaksi Kas Mahasiswa
 * Memperbarui status di basis data lokal dan mengirim data ke Google Sheets
 */
export async function approveTransactionAction(
  transactionId: string
): Promise<ActionResponse<{ sheetSyncStatus: string; referenceCode: string }>> {
  if (!transactionId) {
    return { success: false, error: "ID transaksi tidak valid" };
  }

  try {
    const session = await auth();

    // Dapatkan data transaksi riil beserta seluruh relasi
    const transaction = await prisma.transaction.findUnique({
      where: { id: transactionId },
      include: {
        student: {
          include: {
            class: true,
          },
        },
        bill: true,
        paymentMethod: true,
        verifiedBy: true,
      },
    });

    if (!transaction) {
      return { success: false, error: "Transaksi tidak ditemukan" };
    }

    const verifiedAt = new Date();
    const verifier = await resolveValidAdminId(session?.user?.id || transaction.verifiedById);

    // 1. Perbarui status transaksi lokal menjadi APPROVED
    await prisma.transaction.update({
      where: { id: transactionId },
      data: {
        status: "APPROVED",
        verifiedAt,
        verifiedById: verifier.id,
        rejectionReason: null,
      },
    });

    const verifierName = verifier.name;

    // 2. Eksekusi sinkronisasi data ke Google Sheets
    let syncSuccess = false;
    let syncError: string | null = null;

    if (transaction.bill.googleSheetId) {
      const syncRes = await syncBillApprovedTransactions(transaction.billId);
      syncSuccess = syncRes.success;
      syncError = syncRes.error || null;
    } else {
      const appendResult = await appendTransactionToSheet({
        spreadsheetId: undefined,
        referenceCode: transaction.referenceCode,
        verifiedAt,
        className: transaction.student.class.name,
        nim: transaction.student.nim || "-",
        studentName: transaction.student.name,
        billTitle: transaction.bill.title,
        amountPaid: transaction.amountPaid,
        paymentMethodName: transaction.paymentMethod.name,
        accountNumber: transaction.paymentMethod.accountNumber,
        picName: transaction.paymentMethod.picName,
        status: "APPROVED",
        verifierName,
        proofImageUrl: transaction.proofImageUrl,
      });
      syncSuccess = appendResult.success;
      syncError = appendResult.error || null;
    }

    // 3. Simpan status sinkronisasi lembar spreadsheet
    const finalSyncStatus = syncSuccess ? "SYNCED" : "FAILED";
    await prisma.transaction.update({
      where: { id: transactionId },
      data: {
        sheetSyncStatus: finalSyncStatus,
        sheetSyncedAt: syncSuccess ? new Date() : null,
        sheetErrorLog: syncSuccess ? null : syncError,
      },
    });

    revalidatePath("/dashboard");
    revalidatePath("/dashboard/verification");
    revalidatePath("/dashboard/bills");

    if (syncSuccess) {
      return {
        success: true,
        message: `Transaksi ${transaction.referenceCode} berhasil disetujui dan disinkronkan ke Google Sheets!`,
        data: {
          sheetSyncStatus: "SYNCED",
          referenceCode: transaction.referenceCode,
        },
      };
    } else {
      return {
        success: true,
        message: `Transaksi ${transaction.referenceCode} disetujui di basis data lokal, namun sinkronisasi Google Sheets tertunda: ${syncError}`,
        data: {
          sheetSyncStatus: "FAILED",
          referenceCode: transaction.referenceCode,
        },
      };
    }
  } catch (error: any) {
    console.error("Error approveTransactionAction:", error);
    return {
      success: false,
      error: error?.message || "Terjadi kesalahan saat menyetujui transaksi",
    };
  }
}

/**
 * 2. Reject Transaksi Kas Mahasiswa
 */
export async function rejectTransactionAction(
  transactionId: string,
  rejectionReason: string = "Bukti transfer tidak valid atau belum masuk"
): Promise<ActionResponse> {
  if (!transactionId) {
    return { success: false, error: "ID transaksi tidak valid" };
  }

  try {
    const session = await auth();
    const verifier = await resolveValidAdminId(session?.user?.id);

    const rejectedTx = await prisma.transaction.update({
      where: { id: transactionId },
      data: {
        status: "REJECTED",
        rejectionReason,
        verifiedAt: new Date(),
        verifiedById: verifier.id,
      },
      include: { bill: true },
    });

    if (rejectedTx.bill?.googleSheetId) {
      try {
        await syncBillApprovedTransactions(rejectedTx.billId);
      } catch (sheetErr) {
        console.error("Gagal sinkronisasi Google Sheets pada reject transaksi:", sheetErr);
      }
    }

    revalidatePath("/dashboard");
    revalidatePath("/dashboard/verification");
    revalidatePath("/dashboard/bills");
    return {
      success: true,
      message: "Transaksi telah berhasil ditolak.",
    };
  } catch (error: any) {
    console.error("Error rejectTransactionAction:", error);
    return {
      success: false,
      error: error?.message || "Gagal menolak transaksi",
    };
  }
}

/**
 * 3. Retry Sinkronisasi Transaksi ke Google Sheets
 */
export async function retrySheetSyncAction(
  transactionId: string
): Promise<ActionResponse<{ sheetSyncStatus: string }>> {
  if (!transactionId) {
    return { success: false, error: "ID transaksi tidak valid" };
  }

  try {
    const transaction = await prisma.transaction.findUnique({
      where: { id: transactionId },
      include: {
        student: {
          include: {
            class: true,
          },
        },
        bill: true,
        paymentMethod: true,
        verifiedBy: true,
      },
    });

    if (!transaction) {
      return { success: false, error: "Transaksi tidak ditemukan" };
    }

    if (transaction.status !== "APPROVED") {
      return {
        success: false,
        error: "Hanya transaksi yang telah disetujui (APPROVED) yang dapat disinkronkan ke Google Sheets.",
      };
    }

    let syncSuccess = false;
    let syncError: string | null = null;

    if (transaction.bill.googleSheetId) {
      const syncRes = await syncBillApprovedTransactions(transaction.billId);
      syncSuccess = syncRes.success;
      syncError = syncRes.error || null;
    } else {
      const appendResult = await appendTransactionToSheet({
        spreadsheetId: undefined,
        referenceCode: transaction.referenceCode,
        verifiedAt: transaction.verifiedAt || new Date(),
        className: transaction.student.class.name,
        nim: transaction.student.nim || "-",
        studentName: transaction.student.name,
        billTitle: transaction.bill.title,
        amountPaid: transaction.amountPaid,
        paymentMethodName: transaction.paymentMethod.name,
        accountNumber: transaction.paymentMethod.accountNumber,
        picName: transaction.paymentMethod.picName,
        status: "APPROVED",
        verifierName: transaction.verifiedBy?.fullName || "Bendahara",
        proofImageUrl: transaction.proofImageUrl,
      });
      syncSuccess = appendResult.success;
      syncError = appendResult.error || null;
    }

    const newSyncStatus = syncSuccess ? "SYNCED" : "FAILED";
    await prisma.transaction.update({
      where: { id: transactionId },
      data: {
        sheetSyncStatus: newSyncStatus,
        sheetSyncedAt: syncSuccess ? new Date() : null,
        sheetErrorLog: syncSuccess ? null : syncError,
      },
    });

    revalidatePath("/dashboard");

    if (syncSuccess) {
      return {
        success: true,
        message: `Sinkronisasi ulang ${transaction.referenceCode} ke Google Sheets BERHASIL!`,
        data: { sheetSyncStatus: "SYNCED" },
      };
    } else {
      return {
        success: false,
        error: `Gagal menyinkronkan: ${syncError}`,
        data: { sheetSyncStatus: "FAILED" },
      };
    }
  } catch (error: any) {
    console.error("Error retrySheetSyncAction:", error);
    return {
      success: false,
      error: error?.message || "Terjadi kesalahan saat sinkronisasi ulang",
    };
  }
}

/**
 * 4. Uji Koneksi Google Sheets API
 */
export async function testGoogleSheetsAction(): Promise<ActionResponse<{ title?: string }>> {
  try {
    const res = await testGoogleConnection();
    if (res.success) {
      return {
        success: true,
        message: res.message,
        data: { title: res.spreadsheetTitle },
      };
    } else {
      return {
        success: false,
        error: res.message,
      };
    }
  } catch (error: any) {
    return {
      success: false,
      error: error?.message || "Koneksi Google Sheets gagal",
    };
  }
}
