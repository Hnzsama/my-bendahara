"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { generateReferenceCode } from "@/lib/utils";
import { syncBillApprovedTransactions } from "@/lib/google-sheets";

const submitPaymentSchema = z.object({
  studentId: z.string().min(1, "Wajib memilih identitas mahasiswa"),
  billId: z.string().min(1, "Wajib memilih tagihan kas"),
  paymentMethodId: z.string().min(1, "Wajib memilih metode transfer"),
  amountPaid: z.number().min(1000, "Nominal transfer minimal Rp 1.000"),
  proofImageUrl: z.string().min(1, "Wajib mengunggah bukti transfer"),
  studentNotes: z.string().optional().nullable(),
});

/**
 * 1. Submit Pembayaran Kas oleh Mahasiswa
 */
export async function submitStudentPaymentAction(data: {
  studentId: string;
  billId: string;
  paymentMethodId: string;
  amountPaid: number;
  proofImageUrl: string;
  studentNotes?: string | null;
}) {
  try {
    const validated = submitPaymentSchema.parse(data);

    // Verifikasi keberadaan mahasiswa
    const student = await prisma.student.findUnique({
      where: { id: validated.studentId },
      include: { class: true },
    });
    if (!student) {
      return { success: false, error: "Data mahasiswa tidak ditemukan." };
    }

    // Verifikasi tagihan
    const bill = await prisma.bill.findUnique({
      where: { id: validated.billId },
    });
    if (!bill) {
      return { success: false, error: "Tagihan kas tidak ditemukan." };
    }

    // Verifikasi metode pembayaran
    const paymentMethod = await prisma.paymentMethod.findUnique({
      where: { id: validated.paymentMethodId },
    });
    if (!paymentMethod) {
      return { success: false, error: "Metode pembayaran tidak valid." };
    }

    // Cek apakah mahasiswa sudah lunas untuk tagihan ini
    const approvedTx = await prisma.transaction.findFirst({
      where: {
        studentId: student.id,
        billId: bill.id,
        status: "APPROVED",
      },
    });

    if (approvedTx) {
      return {
        success: false,
        error: `Tagihan ini sudah lunas untuk ${student.name}. Anda tidak perlu melakukan pembayaran lagi.`,
      };
    }

    // Cek duplikasi transaksi yang masih pending untuk tagihan yang sama
    const pendingTx = await prisma.transaction.findFirst({
      where: {
        studentId: student.id,
        billId: bill.id,
        status: "PENDING",
      },
    });

    if (pendingTx) {
      return {
        success: false,
        error: `Anda sudah memiliki transaksi pembayaran untuk tagihan ini yang sedang menunggu verifikasi bendahara (Kode: ${pendingTx.referenceCode}).`,
      };
    }

    // Generate kode unik referensi transaksi
    let referenceCode = generateReferenceCode();
    let isUnique = false;
    let attempts = 0;

    while (!isUnique && attempts < 5) {
      const existing = await prisma.transaction.findUnique({
        where: { referenceCode },
      });
      if (!existing) {
        isUnique = true;
      } else {
        referenceCode = generateReferenceCode();
        attempts++;
      }
    }

    // Simpan transaksi baru
    const createdTx = await prisma.transaction.create({
      data: {
        referenceCode,
        studentId: student.id,
        billId: bill.id,
        paymentMethodId: paymentMethod.id,
        amountPaid: validated.amountPaid,
        proofImageUrl: validated.proofImageUrl.trim(),
        studentNotes: validated.studentNotes?.trim() || null,
        status: "PENDING",
      },
      include: {
        student: { include: { class: true } },
        bill: true,
        paymentMethod: true,
      },
    });

    // Sinkronisasi status pending ke Google Spreadsheet jika tagihan terhubung
    if (bill.googleSheetId) {
      try {
        await syncBillApprovedTransactions(bill.id);
      } catch (sheetErr) {
        console.error("Gagal sinkronisasi Google Sheets pada submit portal:", sheetErr);
      }
    }

    // Revalidasi halaman admin & publik
    revalidatePath("/dashboard/verification");
    revalidatePath("/status");
    revalidatePath("/transparansi");

    return {
      success: true,
      message: "Bukti pembayaran kas berhasil dikirim! Menunggu verifikasi bendahara.",
      data: {
        referenceCode: createdTx.referenceCode,
        studentName: createdTx.student.name,
        className: createdTx.student.class.name,
        billTitle: createdTx.bill.title,
        amountPaid: createdTx.amountPaid,
        googleSheetUrl: createdTx.bill.googleSheetUrl || null,
        createdAt: createdTx.createdAt.toISOString(),
      },
    };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, error: error.issues[0]?.message || "Validasi gagal" };
    }
    console.error("Gagal submit pembayaran kas:", error);
    return { success: false, error: "Terjadi kesalahan internal saat memproses bukti pembayaran." };
  }
}

/**
 * 2. Cek Status Pembayaran Mahasiswa (Bisa via Kode Referensi atau NIM)
 */
export async function checkTransactionStatusAction(query: string) {
  try {
    const q = query.trim();
    if (!q) {
      return { success: false, error: "Masukkan Kode Referensi Transaksi, Nama, atau NIM." };
    }

    const isRefCode = q.toUpperCase().startsWith("KAS-");

    const transactions = await prisma.transaction.findMany({
      where: isRefCode
        ? { referenceCode: q }
        : {
            student: {
              OR: [
                { nim: q },
                { name: { contains: q } },
              ],
            },
          },
      include: {
        student: {
          include: {
            class: true,
          },
        },
        bill: true,
        paymentMethod: true,
        verifiedBy: {
          select: {
            fullName: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    if (transactions.length === 0) {
      return {
        success: false,
        error: isRefCode
          ? `Transaksi dengan kode "${q}" tidak ditemukan.`
          : `Tidak ada riwayat pembayaran yang terdata untuk "${q}".`,
      };
    }

    const mapped = transactions.map((t) => ({
      id: t.id,
      referenceCode: t.referenceCode,
      amountPaid: t.amountPaid,
      proofImageUrl: t.proofImageUrl,
      studentNotes: t.studentNotes,
      status: t.status as "PENDING" | "APPROVED" | "REJECTED",
      rejectionReason: t.rejectionReason,
      createdAt: t.createdAt.toISOString(),
      verifiedAt: t.verifiedAt ? t.verifiedAt.toISOString() : null,
      verifierName: t.verifiedBy?.fullName || null,
      student: {
        id: t.student.id,
        nim: t.student.nim,
        name: t.student.name,
        className: t.student.class.name,
      },
      bill: {
        id: t.bill.id,
        title: t.bill.title,
        amount: t.bill.amount,
      },
      paymentMethod: {
        id: t.paymentMethod.id,
        name: t.paymentMethod.name,
        bankName: t.paymentMethod.bankName,
        accountNumber: t.paymentMethod.accountNumber,
        accountHolder: t.paymentMethod.accountHolder,
        picName: t.paymentMethod.picName,
      },
    }));

    return {
      success: true,
      data: mapped,
    };
  } catch (error) {
    console.error("Gagal cek status transaksi:", error);
    return { success: false, error: "Gagal memuat status transaksi." };
  }
}

/**
 * 3. Mengambil status tagihan untuk mahasiswa tertentu (PENDING / APPROVED)
 */
export async function getStudentBillStatusAction(studentId: string) {
  try {
    if (!studentId) return { success: false, data: [] };
    const transactions = await prisma.transaction.findMany({
      where: {
        studentId,
        status: { in: ["PENDING", "APPROVED"] },
      },
      select: {
        id: true,
        billId: true,
        status: true,
        referenceCode: true,
      },
    });
    return {
      success: true,
      data: transactions.map((t) => ({
        billId: t.billId,
        status: t.status as "PENDING" | "APPROVED",
        referenceCode: t.referenceCode,
      })),
    };
  } catch {
    return { success: false, data: [] };
  }
}

