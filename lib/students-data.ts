import { prisma } from "@/lib/db";

export interface StudentItem {
  id: string;
  nim: string | null;
  name: string;
  phone: string | null;
  classId: string;
  className: string;
  academicYear: string;
  createdAt: string;
  totalTransactionsCount: number;
  approvedTransactionsCount: number;
  pendingTransactionsCount: number;
  totalPaidAmount: number;
}

export interface ClassItem {
  id: string;
  name: string;
  academicYear: string;
  description: string | null;
  createdAt: string;
  studentsCount: number;
  totalCollected: number;
  totalApprovedTransactions: number;
}

export interface StudentsStats {
  totalStudents: number;
  totalClasses: number;
  studentsWithPhoneCount: number;
  studentsWithPhonePercentage: number;
  totalCollectedAllClasses: number;
  totalTransactionsCount: number;
}

export interface StudentsPageData {
  stats: StudentsStats;
  students: StudentItem[];
  classes: ClassItem[];
}

/**
 * Service Data Layer untuk Halaman Mahasiswa & Kelas
 */
export async function getStudentsPageData(): Promise<StudentsPageData> {
  // 1. Ambil seluruh data kelas dengan relasi mahasiswa dan transaksi
  const classesRaw = await prisma.class.findMany({
    include: {
      students: {
        include: {
          transactions: {
            select: {
              id: true,
              amountPaid: true,
              status: true,
            },
          },
        },
      },
    },
    orderBy: {
      name: "asc",
    },
  });

  // 2. Ambil seluruh data mahasiswa secara terurut
  const studentsRaw = await prisma.student.findMany({
    include: {
      class: {
        select: {
          id: true,
          name: true,
          academicYear: true,
        },
      },
      transactions: {
        select: {
          id: true,
          amountPaid: true,
          status: true,
        },
      },
    },
    orderBy: [
      { class: { name: "asc" } },
      { nim: "asc" },
    ],
  });

  // 3. Mapping data kelas
  const classes: ClassItem[] = classesRaw.map((cls) => {
    let totalCollected = 0;
    let totalApprovedTransactions = 0;

    cls.students.forEach((student) => {
      student.transactions.forEach((tx) => {
        if (tx.status === "APPROVED") {
          totalCollected += tx.amountPaid;
          totalApprovedTransactions += 1;
        }
      });
    });

    return {
      id: cls.id,
      name: cls.name,
      academicYear: cls.academicYear,
      description: cls.description,
      createdAt: cls.createdAt.toISOString(),
      studentsCount: cls.students.length,
      totalCollected,
      totalApprovedTransactions,
    };
  });

  // 4. Mapping data mahasiswa
  const students: StudentItem[] = studentsRaw.map((st) => {
    const approvedTxs = st.transactions.filter((t) => t.status === "APPROVED");
    const pendingTxs = st.transactions.filter((t) => t.status === "PENDING");
    const totalPaid = approvedTxs.reduce((sum, t) => sum + t.amountPaid, 0);

    return {
      id: st.id,
      nim: st.nim,
      name: st.name,
      phone: st.phone,
      classId: st.classId,
      className: st.class.name,
      academicYear: st.class.academicYear,
      createdAt: st.createdAt.toISOString(),
      totalTransactionsCount: st.transactions.length,
      approvedTransactionsCount: approvedTxs.length,
      pendingTransactionsCount: pendingTxs.length,
      totalPaidAmount: totalPaid,
    };
  });

  // 5. Hitung ringkasan statistik
  const totalStudents = students.length;
  const totalClasses = classes.length;
  const studentsWithPhoneCount = students.filter((s) => s.phone && s.phone.trim().length > 0).length;
  const studentsWithPhonePercentage = totalStudents > 0 
    ? Math.round((studentsWithPhoneCount / totalStudents) * 100) 
    : 0;

  const totalCollectedAllClasses = classes.reduce((sum, c) => sum + c.totalCollected, 0);
  const totalTransactionsCount = students.reduce((sum, s) => sum + s.totalTransactionsCount, 0);

  return {
    stats: {
      totalStudents,
      totalClasses,
      studentsWithPhoneCount,
      studentsWithPhonePercentage,
      totalCollectedAllClasses,
      totalTransactionsCount,
    },
    students,
    classes,
  };
}
