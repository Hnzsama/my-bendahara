import { prisma } from "@/lib/db";

export interface BillItem {
  id: string;
  slug: string | null;
  title: string;
  description: string | null;
  amount: number;
  dueDate: string | null;
  academicTerm: string | null;
  isActive: boolean;
  createdAt: string;
  totalStudentsCount: number;
  paidStudentsCount: number;
  collectedAmount: number;
  targetAmount: number;
  progressPercent: number;
  pendingTransactionsCount: number;
  approvedTransactionsCount: number;
  rejectedTransactionsCount: number;
  daysLeft: number | null;
  isOverdue: boolean;
  googleSheetId: string | null;
  googleSheetUrl: string | null;
}

export interface BillsStats {
  totalBills: number;
  activeBills: number;
  totalTargetAmount: number;
  totalCollectedAmount: number;
  overallCollectionRate: number;
  totalStudents: number;
}

export interface BillsData {
  stats: BillsStats;
  bills: BillItem[];
  academicTerms: string[];
}

/**
 * Service Data Layer untuk Halaman Tagihan & Iuran Kas
 */
export async function getBillsData(): Promise<BillsData> {
  const [bills, totalStudents] = await Promise.all([
    prisma.bill.findMany({
      include: {
        transactions: {
          select: {
            id: true,
            studentId: true,
            amountPaid: true,
            status: true,
          },
        },
      },
      orderBy: [
        { isActive: "desc" },
        { createdAt: "desc" },
      ],
    }),
    prisma.student.count(),
  ]);

  const now = new Date();

  const mappedBills: BillItem[] = bills.map((bill) => {
    const approvedTransactions = bill.transactions.filter((t) => t.status === "APPROVED");
    const pendingTransactions = bill.transactions.filter((t) => t.status === "PENDING");
    const rejectedTransactions = bill.transactions.filter((t) => t.status === "REJECTED");

    // Menghitung mahasiswa unik yang telah lunas
    const uniquePaidStudents = new Set(approvedTransactions.map((t) => t.studentId));
    const paidStudentsCount = uniquePaidStudents.size;

    const collectedAmount = approvedTransactions.reduce((acc, t) => acc + t.amountPaid, 0);
    const targetAmount = bill.amount * totalStudents;
    const progressPercent = targetAmount > 0 ? Math.min(100, Math.round((collectedAmount / targetAmount) * 100)) : 0;

    let daysLeft: number | null = null;
    let isOverdue = false;

    if (bill.dueDate) {
      const due = new Date(bill.dueDate);
      const diffTime = due.getTime() - now.getTime();
      daysLeft = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      isOverdue = diffTime < 0;
    }

    return {
      id: bill.id,
      title: bill.title,
      description: bill.description,
      amount: bill.amount,
      dueDate: bill.dueDate ? bill.dueDate.toISOString() : null,
      academicTerm: bill.academicTerm,
      isActive: bill.isActive,
      createdAt: bill.createdAt.toISOString(),
      totalStudentsCount: totalStudents,
      paidStudentsCount,
      collectedAmount,
      targetAmount,
      progressPercent,
      pendingTransactionsCount: pendingTransactions.length,
      approvedTransactionsCount: approvedTransactions.length,
      rejectedTransactionsCount: rejectedTransactions.length,
      daysLeft,
      isOverdue,
      googleSheetId: bill.googleSheetId,
      googleSheetUrl: bill.googleSheetUrl,
      slug: bill.slug,
    };
  });

  const totalBills = mappedBills.length;
  const activeBills = mappedBills.filter((b) => b.isActive).length;
  const totalTargetAmount = mappedBills
    .filter((b) => b.isActive)
    .reduce((acc, b) => acc + b.targetAmount, 0);
  const totalCollectedAmount = mappedBills
    .filter((b) => b.isActive)
    .reduce((acc, b) => acc + b.collectedAmount, 0);

  const overallCollectionRate =
    totalTargetAmount > 0
      ? Math.min(100, Math.round((totalCollectedAmount / totalTargetAmount) * 100))
      : 0;

  // Kumpulan semester/tahun ajaran unik
  const termSet = new Set<string>();
  mappedBills.forEach((b) => {
    if (b.academicTerm) termSet.add(b.academicTerm);
  });
  const academicTerms = Array.from(termSet);

  return {
    stats: {
      totalBills,
      activeBills,
      totalTargetAmount,
      totalCollectedAmount,
      overallCollectionRate,
      totalStudents,
    },
    bills: mappedBills,
    academicTerms,
  };
}
