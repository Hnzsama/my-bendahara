"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";

const createClassSchema = z.object({
  name: z.string().min(2, "Nama kelas minimal 2 karakter"),
  academicYear: z.string().min(4, "Tahun akademik minimal 4 karakter"),
  description: z.string().optional().nullable(),
});

const updateClassSchema = z.object({
  id: z.string().min(1, "ID kelas tidak valid"),
  name: z.string().min(2, "Nama kelas minimal 2 karakter"),
  academicYear: z.string().min(4, "Tahun akademik minimal 4 karakter"),
  description: z.string().optional().nullable(),
});

/**
 * Server Action: Tambah Kelas Baru
 */
export async function createClassAction(data: {
  name: string;
  academicYear: string;
  description?: string | null;
}) {
  try {
    const validated = createClassSchema.parse(data);

    // Cek duplikasi nama kelas
    const existing = await prisma.class.findUnique({
      where: { name: validated.name.trim() },
    });

    if (existing) {
      return {
        success: false,
        error: `Kelas dengan nama "${validated.name}" sudah ada.`,
      };
    }

    const newClass = await prisma.class.create({
      data: {
        name: validated.name.trim(),
        academicYear: validated.academicYear.trim(),
        description: validated.description?.trim() || null,
      },
    });

    revalidatePath("/dashboard/students");
    revalidatePath("/dashboard/classes");
    revalidatePath("/dashboard");

    return {
      success: true,
      message: `Kelas ${newClass.name} berhasil ditambahkan!`,
      data: newClass,
    };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, error: error.issues[0]?.message || "Validasi gagal" };
    }
    console.error("Gagal menambahkan kelas:", error);
    return { success: false, error: "Terjadi kesalahan internal saat menyimpan kelas." };
  }
}

/**
 * Server Action: Perbarui Informasi Kelas
 */
export async function updateClassAction(data: {
  id: string;
  name: string;
  academicYear: string;
  description?: string | null;
}) {
  try {
    const validated = updateClassSchema.parse(data);

    // Cek duplikasi nama jika berganti nama
    const existing = await prisma.class.findFirst({
      where: {
        name: validated.name.trim(),
        NOT: { id: validated.id },
      },
    });

    if (existing) {
      return {
        success: false,
        error: `Nama kelas "${validated.name}" sudah digunakan oleh kelas lain.`,
      };
    }

    const updated = await prisma.class.update({
      where: { id: validated.id },
      data: {
        name: validated.name.trim(),
        academicYear: validated.academicYear.trim(),
        description: validated.description?.trim() || null,
      },
    });

    revalidatePath("/dashboard/students");
    revalidatePath("/dashboard/classes");
    revalidatePath("/dashboard");

    return {
      success: true,
      message: `Informasi kelas ${updated.name} berhasil diperbarui!`,
      data: updated,
    };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, error: error.issues[0]?.message || "Validasi gagal" };
    }
    console.error("Gagal mengupdate kelas:", error);
    return { success: false, error: "Terjadi kesalahan internal saat mengupdate kelas." };
  }
}

/**
 * Server Action: Hapus Kelas
 */
export async function deleteClassAction(classId: string) {
  try {
    if (!classId) {
      return { success: false, error: "ID kelas tidak valid." };
    }

    // Cek apakah masih ada mahasiswa di kelas ini
    const studentCount = await prisma.student.count({
      where: { classId },
    });

    if (studentCount > 0) {
      return {
        success: false,
        error: `Kelas tidak dapat dihapus karena masih menampung ${studentCount} mahasiswa. Silakan pindahkan atau hapus mahasiswa terlebih dahulu.`,
      };
    }

    const deleted = await prisma.class.delete({
      where: { id: classId },
    });

    revalidatePath("/dashboard/students");
    revalidatePath("/dashboard/classes");
    revalidatePath("/dashboard");

    return {
      success: true,
      message: `Kelas ${deleted.name} berhasil dihapus.`,
    };
  } catch (error) {
    console.error("Gagal menghapus kelas:", error);
    return { success: false, error: "Gagal menghapus kelas." };
  }
}
