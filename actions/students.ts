"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";

// Helper normalisasi nomor whatsapp: jika diawali 08, ubah jadi format bersih atau biarkan rapi
function sanitizePhone(phone?: string | null): string | null {
  if (!phone) return null;
  const cleaned = phone.replace(/[^0-9+]/g, "").trim();
  return cleaned.length > 0 ? cleaned : null;
}

const createStudentSchema = z.object({
  nim: z.string().optional().nullable(),
  name: z.string().min(2, "Nama mahasiswa minimal 2 karakter"),
  phone: z.string().optional().nullable(),
  classId: z.string().min(1, "Wajib memilih kelas"),
});

const updateStudentSchema = z.object({
  id: z.string().min(1, "ID mahasiswa tidak valid"),
  nim: z.string().optional().nullable(),
  name: z.string().min(2, "Nama mahasiswa minimal 2 karakter"),
  phone: z.string().optional().nullable(),
  classId: z.string().min(1, "Wajib memilih kelas"),
});

/**
 * Server Action: Tambah Mahasiswa Satuan
 */
export async function createStudentAction(data: {
  nim?: string | null;
  name: string;
  phone?: string | null;
  classId: string;
}) {
  try {
    const validated = createStudentSchema.parse(data);
    const cleanNim = validated.nim?.trim() ? validated.nim.trim() : null;

    // Cek duplikasi NIM jika diisi
    if (cleanNim) {
      const existing = await prisma.student.findUnique({
        where: { nim: cleanNim },
      });

      if (existing) {
        return {
          success: false,
          error: `Mahasiswa dengan NIM "${cleanNim}" sudah terdaftar (${existing.name}).`,
        };
      }
    }

    // Pastikan kelas valid
    const targetClass = await prisma.class.findUnique({
      where: { id: validated.classId },
    });

    if (!targetClass) {
      return { success: false, error: "Kelas yang dipilih tidak ditemukan." };
    }

    const newStudent = await prisma.student.create({
      data: {
        nim: cleanNim,
        name: validated.name.trim(),
        phone: sanitizePhone(validated.phone),
        classId: validated.classId,
      },
    });

    revalidatePath("/dashboard/students");
    revalidatePath("/dashboard/classes");
    revalidatePath("/dashboard");

    return {
      success: true,
      message: `Mahasiswa ${newStudent.name}${newStudent.nim ? ` (${newStudent.nim})` : ""} berhasil ditambahkan ke kelas ${targetClass.name}!`,
      data: newStudent,
    };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, error: error.issues[0]?.message || "Validasi gagal" };
    }
    console.error("Gagal menambahkan mahasiswa:", error);
    return { success: false, error: "Terjadi kesalahan sistem saat menyimpan data mahasiswa." };
  }
}

/**
 * Server Action: Perbarui Informasi Mahasiswa
 */
export async function updateStudentAction(data: {
  id: string;
  nim?: string | null;
  name: string;
  phone?: string | null;
  classId: string;
}) {
  try {
    const validated = updateStudentSchema.parse(data);
    const cleanNim = validated.nim?.trim() ? validated.nim.trim() : null;

    // Cek duplikasi NIM dengan mahasiswa lain jika diisi
    if (cleanNim) {
      const existing = await prisma.student.findFirst({
        where: {
          nim: cleanNim,
          NOT: { id: validated.id },
        },
      });

      if (existing) {
        return {
          success: false,
          error: `NIM "${cleanNim}" sudah digunakan oleh mahasiswa lain (${existing.name}).`,
        };
      }
    }

    const updated = await prisma.student.update({
      where: { id: validated.id },
      data: {
        nim: cleanNim,
        name: validated.name.trim(),
        phone: sanitizePhone(validated.phone),
        classId: validated.classId,
      },
    });

    revalidatePath("/dashboard/students");
    revalidatePath("/dashboard/classes");
    revalidatePath("/dashboard");

    return {
      success: true,
      message: `Data mahasiswa ${updated.name} berhasil diperbarui!`,
      data: updated,
    };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, error: error.issues[0]?.message || "Validasi gagal" };
    }
    console.error("Gagal memperbarui mahasiswa:", error);
    return { success: false, error: "Gagal memperbarui data mahasiswa." };
  }
}

/**
 * Server Action: Hapus Mahasiswa
 */
export async function deleteStudentAction(studentId: string) {
  try {
    if (!studentId) {
      return { success: false, error: "ID mahasiswa tidak valid." };
    }

    // Cek apakah mahasiswa punya riwayat transaksi kas
    const txCount = await prisma.transaction.count({
      where: { studentId },
    });

    if (txCount > 0) {
      return {
        success: false,
        error: `Mahasiswa tidak dapat dihapus karena memiliki ${txCount} riwayat transaksi kas tercatat. Hal ini untuk menjaga integritas pembukuan bendahara.`,
      };
    }

    const deleted = await prisma.student.delete({
      where: { id: studentId },
    });

    revalidatePath("/dashboard/students");
    revalidatePath("/dashboard/classes");
    revalidatePath("/dashboard");

    return {
      success: true,
      message: `Mahasiswa ${deleted.name} (${deleted.nim}) berhasil dihapus.`,
    };
  } catch (error) {
    console.error("Gagal menghapus mahasiswa:", error);
    return { success: false, error: "Gagal menghapus data mahasiswa." };
  }
}

/**
 * Server Action: Tambah Banyak Mahasiswa Sekaligus (Bulk Import)
 */
export async function bulkCreateStudentsAction(data: {
  classId: string;
  students: Array<{
    nim?: string | null;
    name: string;
    phone?: string | null;
  }>;
}) {
  try {
    if (!data.classId) {
      return { success: false, error: "Wajib memilih kelas tujuan." };
    }

    const targetClass = await prisma.class.findUnique({
      where: { id: data.classId },
    });

    if (!targetClass) {
      return { success: false, error: "Kelas tujuan tidak ditemukan." };
    }

    if (!Array.isArray(data.students) || data.students.length === 0) {
      return { success: false, error: "Daftar mahasiswa kosong." };
    }

    // Dapatkan semua NIM yang sudah ada di database (jika ada)
    const existingStudents = await prisma.student.findMany({
      where: { nim: { not: null } },
      select: { nim: true },
    });
    const existingNims = new Set(
      existingStudents
        .map((s) => s.nim?.trim())
        .filter((n): n is string => Boolean(n))
    );

    // Filter data yang valid dan belum terdaftar
    const validToInsert: Array<{ nim: string | null; name: string; phone: string | null; classId: string }> = [];
    const seenBatchNims = new Set<string>();
    let duplicateCount = 0;

    for (const item of data.students) {
      const nim = item.nim?.trim() ? item.nim.trim() : null;
      const name = item.name?.trim();
      const phone = sanitizePhone(item.phone);

      if (!name) continue;

      if (nim) {
        if (existingNims.has(nim) || seenBatchNims.has(nim)) {
          duplicateCount++;
          continue;
        }
        seenBatchNims.add(nim);
      }

      validToInsert.push({
        nim,
        name,
        phone,
        classId: data.classId,
      });
    }

    if (validToInsert.length === 0) {
      return {
        success: false,
        error: `Tidak ada mahasiswa baru yang dapat ditambahkan. ${
          duplicateCount > 0 ? `(${duplicateCount} NIM sudah terdaftar sebelumnya)` : ""
        }`,
      };
    }

    // Insert menggunakan createMany
    await prisma.student.createMany({
      data: validToInsert,
    });

    revalidatePath("/dashboard/students");
    revalidatePath("/dashboard/classes");
    revalidatePath("/dashboard");

    return {
      success: true,
      message: `Berhasil menambahkan ${validToInsert.length} mahasiswa ke kelas ${targetClass.name}!${
        duplicateCount > 0 ? ` (${duplicateCount} mahasiswa dilewati karena NIM sudah ada)` : ""
      }`,
      insertedCount: validToInsert.length,
      skippedCount: duplicateCount,
    };
  } catch (error) {
    console.error("Gagal melakukan bulk import mahasiswa:", error);
    return { success: false, error: "Terjadi kesalahan sistem saat menyimpan daftar mahasiswa." };
  }
}
