import { prisma } from "@/lib/db";

export interface PortalClassOption {
  id: string;
  name: string;
  academicYear: string;
  students: Array<{
    id: string;
    nim: string | null;
    name: string;
  }>;
}

export interface PortalBillOption {
  id: string;
  slug: string | null;
  title: string;
  description: string | null;
  amount: number;
  dueDate: string | null;
  academicTerm: string | null;
  googleSheetUrl: string | null;
}

export interface PortalPaymentMethodOption {
  id: string;
  name: string;
  type: string;
  bankName: string;
  accountNumber: string;
  accountHolder: string;
  picName: string;
  qrisImageUrl: string | null;
  instructions: string | null;
}

export interface PortalStudentTransaction {
  studentId: string;
  billId: string;
  status: "PENDING" | "APPROVED";
  referenceCode: string;
}

export interface PaymentPortalData {
  classes: PortalClassOption[];
  bills: PortalBillOption[];
  methods: PortalPaymentMethodOption[];
  studentTransactions: PortalStudentTransaction[];
}

/**
 * Mengambil data awal untuk form portal pembayaran siswa (/bayar)
 */
export async function getPaymentPortalData(): Promise<PaymentPortalData> {
  const [classesRaw, billsRaw, methodsRaw, txsRaw] = await Promise.all([
    prisma.class.findMany({
      include: {
        students: {
          select: {
            id: true,
            nim: true,
            name: true,
          },
          orderBy: { name: "asc" },
        },
      },
      orderBy: { name: "asc" },
    }),
    prisma.bill.findMany({
      where: { isActive: true },
      orderBy: { createdAt: "desc" },
    }),
    prisma.paymentMethod.findMany({
      where: { isActive: true },
      orderBy: [{ displayOrder: "asc" }, { createdAt: "asc" }],
    }),
    prisma.transaction.findMany({
      where: {
        status: { in: ["PENDING", "APPROVED"] },
      },
      select: {
        studentId: true,
        billId: true,
        status: true,
        referenceCode: true,
      },
    }),
  ]);

  return {
    classes: classesRaw.map((c) => ({
      id: c.id,
      name: c.name,
      academicYear: c.academicYear,
      students: c.students,
    })),
    bills: billsRaw.map((b) => ({
      id: b.id,
      title: b.title,
      description: b.description,
      amount: b.amount,
      dueDate: b.dueDate ? b.dueDate.toISOString() : null,
      academicTerm: b.academicTerm,
      googleSheetUrl: b.googleSheetUrl,
      slug: b.slug,
    })),
    methods: methodsRaw.map((m) => ({
      id: m.id,
      name: m.name,
      type: m.type,
      bankName: m.bankName,
      accountNumber: m.accountNumber,
      accountHolder: m.accountHolder,
      picName: m.picName,
      qrisImageUrl: m.qrisImageUrl,
      instructions: m.instructions,
    })),
    studentTransactions: txsRaw.map((t) => ({
      studentId: t.studentId,
      billId: t.billId,
      status: t.status as "PENDING" | "APPROVED",
      referenceCode: t.referenceCode,
    })),
  };
}

export interface TransparencyClassItem {
  id: string;
  name: string;
  academicYear: string;
  totalStudents: number;
  approvedCount: number;
  totalCollected: number;
  percentage: number;
}

export interface TransparencyBillItem {
  id: string;
  title: string;
  amount: number;
  totalCollected: number;
  approvedCount: number;
  googleSheetUrl: string | null;
}

export interface TransparencyRecentTransaction {
  id: string;
  referenceCode: string;
  studentName: string;
  maskedNim: string;
  className: string;
  billTitle: string;
  amountPaid: number;
  verifiedAt: string;
  verifierName: string;
}

export interface TransparencyData {
  stats: {
    totalCollected: number;
    totalTransactionsApproved: number;
    totalStudents: number;
    overallCompletionRate: number;
    lastUpdated: string;
  };
  classesProgress: TransparencyClassItem[];
  billsSummary: TransparencyBillItem[];
  recentTransactions: TransparencyRecentTransaction[];
}

/**
 * Mengambil ringkasan transparansi kas angkatan publik (/transparansi)
 */
export async function getTransparencyData(): Promise<TransparencyData> {
  const [classesRaw, billsRaw, approvedTxRaw, totalStudentsCount] = await Promise.all([
    prisma.class.findMany({
      include: {
        students: {
          include: {
            transactions: {
              where: { status: "APPROVED" },
              select: { amountPaid: true },
            },
          },
        },
      },
      orderBy: { name: "asc" },
    }),
    prisma.bill.findMany({
      include: {
        transactions: {
          where: { status: "APPROVED" },
          select: { amountPaid: true },
        },
      },
      orderBy: { createdAt: "desc" },
    }),
    prisma.transaction.findMany({
      where: { status: "APPROVED" },
      include: {
        student: {
          include: { class: true },
        },
        bill: true,
        verifiedBy: true,
      },
      orderBy: { verifiedAt: "desc" },
      take: 12,
    }),
    prisma.student.count(),
  ]);

  // Hitung total kas masuk
  let totalCollected = 0;
  let totalApprovedCount = 0;

  const classesProgress: TransparencyClassItem[] = classesRaw.map((cls) => {
    let classCollected = 0;
    let studentsWhoPaid = 0;

    cls.students.forEach((st) => {
      if (st.transactions.length > 0) {
        studentsWhoPaid++;
        st.transactions.forEach((tx) => {
          classCollected += tx.amountPaid;
        });
      }
    });

    totalCollected += classCollected;
    totalApprovedCount += studentsWhoPaid;

    const percentage =
      cls.students.length > 0
        ? Math.round((studentsWhoPaid / cls.students.length) * 100)
        : 0;

    return {
      id: cls.id,
      name: cls.name,
      academicYear: cls.academicYear,
      totalStudents: cls.students.length,
      approvedCount: studentsWhoPaid,
      totalCollected: classCollected,
      percentage,
    };
  });

  const overallRate =
    totalStudentsCount > 0
      ? Math.round((totalApprovedCount / totalStudentsCount) * 100)
      : 0;

  const billsSummary: TransparencyBillItem[] = billsRaw.map((b) => {
    const billCollected = b.transactions.reduce((sum, t) => sum + t.amountPaid, 0);
    return {
      id: b.id,
      title: b.title,
      amount: b.amount,
      totalCollected: billCollected,
      approvedCount: b.transactions.length,
      googleSheetUrl: b.googleSheetUrl,
    };
  });

  const recentTransactions: TransparencyRecentTransaction[] = approvedTxRaw.map((t) => {
    // Mask NIM: contoh "230101001" -> "230101***"
    const rawNim = t.student.nim || "";
    const maskedNim = rawNim
      ? (rawNim.length > 4 ? `${rawNim.slice(0, -3)}***` : `${rawNim.slice(0, 1)}***`)
      : "-";

    return {
      id: t.id,
      referenceCode: t.referenceCode,
      studentName: t.student.name,
      maskedNim,
      className: t.student.class.name,
      billTitle: t.bill.title,
      amountPaid: t.amountPaid,
      verifiedAt: (t.verifiedAt || t.updatedAt).toISOString(),
      verifierName: t.verifiedBy?.fullName || "Bendahara",
    };
  });

  return {
    stats: {
      totalCollected,
      totalTransactionsApproved: totalApprovedCount,
      totalStudents: totalStudentsCount,
      overallCompletionRate: overallRate,
      lastUpdated: new Date().toISOString(),
    },
    classesProgress,
    billsSummary,
    recentTransactions,
  };
}
