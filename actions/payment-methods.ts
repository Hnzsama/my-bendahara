"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";

const createPaymentMethodSchema = z.object({
  name: z.string().min(3, "Nama metode minimal 3 karakter"),
  type: z.enum(["BANK_TRANSFER", "QRIS", "EWALLET"]),
  bankName: z.string().min(2, "Nama bank/e-wallet wajib diisi"),
  accountNumber: z.string().min(3, "Nomor rekening/telepon wajib diisi"),
  accountHolder: z.string().min(2, "Nama pemilik rekening wajib diisi"),
  picName: z.string().min(2, "Nama PIC Bendahara wajib diisi"),
  qrisImageUrl: z.string().optional().nullable(),
  instructions: z.string().optional().nullable(),
  displayOrder: z.number().default(0),
});

const updatePaymentMethodSchema = z.object({
  id: z.string().min(1, "ID metode tidak valid"),
  name: z.string().min(3, "Nama metode minimal 3 karakter"),
  type: z.enum(["BANK_TRANSFER", "QRIS", "EWALLET"]),
  bankName: z.string().min(2, "Nama bank/e-wallet wajib diisi"),
  accountNumber: z.string().min(3, "Nomor rekening/telepon wajib diisi"),
  accountHolder: z.string().min(2, "Nama pemilik rekening wajib diisi"),
  picName: z.string().min(2, "Nama PIC Bendahara wajib diisi"),
  qrisImageUrl: z.string().optional().nullable(),
  instructions: z.string().optional().nullable(),
  isActive: z.boolean(),
});

/**
 * Server Action: Tambah Metode Pembayaran / Rekening PIC Baru
 */
export async function createPaymentMethodAction(data: {
  name: string;
  type: "BANK_TRANSFER" | "QRIS" | "EWALLET";
  bankName: string;
  accountNumber: string;
  accountHolder: string;
  picName: string;
  qrisImageUrl?: string | null;
  instructions?: string | null;
  displayOrder?: number;
}) {
  try {
    const validated = createPaymentMethodSchema.parse(data);

    const created = await prisma.paymentMethod.create({
      data: {
        name: validated.name.trim(),
        type: validated.type,
        bankName: validated.bankName.trim(),
        accountNumber: validated.accountNumber.trim(),
        accountHolder: validated.accountHolder.trim(),
        picName: validated.picName.trim(),
        qrisImageUrl: validated.qrisImageUrl?.trim() || null,
        instructions: validated.instructions?.trim() || null,
        displayOrder: validated.displayOrder || 0,
        isActive: true,
      },
    });

    revalidatePath("/dashboard/methods");
    revalidatePath("/dashboard/verification");
    revalidatePath("/dashboard");

    return {
      success: true,
      message: `Metode "${created.name}" berhasil ditambahkan!`,
      method: created,
    };
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : "Gagal menambahkan metode pembayaran";
    return { success: false, error: errorMsg };
  }
}

/**
 * Server Action: Perbarui Metode Pembayaran / Rekening PIC
 */
export async function updatePaymentMethodAction(data: {
  id: string;
  name: string;
  type: "BANK_TRANSFER" | "QRIS" | "EWALLET";
  bankName: string;
  accountNumber: string;
  accountHolder: string;
  picName: string;
  qrisImageUrl?: string | null;
  instructions?: string | null;
  isActive: boolean;
}) {
  try {
    const validated = updatePaymentMethodSchema.parse(data);

    const updated = await prisma.paymentMethod.update({
      where: { id: validated.id },
      data: {
        name: validated.name.trim(),
        type: validated.type,
        bankName: validated.bankName.trim(),
        accountNumber: validated.accountNumber.trim(),
        accountHolder: validated.accountHolder.trim(),
        picName: validated.picName.trim(),
        qrisImageUrl: validated.qrisImageUrl?.trim() || null,
        instructions: validated.instructions?.trim() || null,
        isActive: validated.isActive,
      },
    });

    revalidatePath("/dashboard/methods");
    revalidatePath("/dashboard/verification");
    revalidatePath("/dashboard");

    return {
      success: true,
      message: `Metode "${updated.name}" berhasil diperbarui!`,
      method: updated,
    };
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : "Gagal memperbarui metode pembayaran";
    return { success: false, error: errorMsg };
  }
}

/**
 * Server Action: Toggle Status Aktif / Non-Aktif Kanal Pembayaran
 */
export async function togglePaymentMethodStatusAction(id: string) {
  try {
    const existing = await prisma.paymentMethod.findUnique({
      where: { id },
      select: { id: true, name: true, isActive: true },
    });

    if (!existing) {
      return { success: false, error: "Metode pembayaran tidak ditemukan" };
    }

    const updated = await prisma.paymentMethod.update({
      where: { id },
      data: { isActive: !existing.isActive },
    });

    revalidatePath("/dashboard/methods");
    revalidatePath("/dashboard/verification");
    revalidatePath("/dashboard");

    return {
      success: true,
      message: `Status "${updated.name}" diubah menjadi ${updated.isActive ? "Aktif" : "Non-Aktif"}!`,
      isActive: updated.isActive,
    };
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : "Gagal mengubah status metode pembayaran";
    return { success: false, error: errorMsg };
  }
}
