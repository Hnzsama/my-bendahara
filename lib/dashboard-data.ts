import { prisma } from "@/lib/db";
import type { TransactionItem } from "@/components/data-table";
import type { ChartPoint } from "@/components/chart-area-interactive";
import type { SectionCardsProps } from "@/components/section-cards";

export interface FinancialSummaryData {
  stats: NonNullable<SectionCardsProps["stats"]>;
  chartData: ChartPoint[];
  tableData: TransactionItem[];
}

/**
 * Service untuk mengambil dan mengolah seluruh data ringkasan keuangan
 * secara modular dan optimal menggunakan Promise.all paralel
 */
export async function getFinancialSummaryData(): Promise<FinancialSummaryData> {
  // 1. Ambil transaksi dan metrik master data secara paralel
  const [transactions, totalStudents, classesCount, activeBillsCount] =
    await Promise.all([
      prisma.transaction.findMany({
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
        orderBy: {
          createdAt: "desc",
        },
      }),
      prisma.student.count(),
      prisma.class.count(),
      prisma.bill.count({
        where: { isActive: true },
      }),
    ]);

  // 2. Kalkulasi statistik finansial
  const totalApprovedAmount = transactions
    .filter((t) => t.status === "APPROVED")
    .reduce((acc, t) => acc + t.amountPaid, 0);

  const totalPendingAmount = transactions
    .filter((t) => t.status === "PENDING")
    .reduce((acc, t) => acc + t.amountPaid, 0);

  const pendingCount = transactions.filter((t) => t.status === "PENDING").length;

  const distinctPaidStudents = new Set(
    transactions.filter((t) => t.status === "APPROVED").map((t) => t.studentId)
  ).size;

  const completionRate =
    totalStudents > 0
      ? Math.round((distinctPaidStudents / totalStudents) * 100)
      : 0;

  const stats = {
    totalApprovedAmount,
    totalPendingAmount,
    pendingCount,
    totalStudents,
    classesCount,
    paidStudentsCount: distinctPaidStudents,
    activeBillsCount,
    completionRate,
  };

  // 3. Agregasi data tren waktu 14 hari terakhir untuk grafik
  const dateMap = new Map<string, { terverifikasi: number; pending: number }>();

  // Inisialisasi rentang 14 hari terakhir
  for (let i = 13; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const dateStr = d.toISOString().split("T")[0];
    dateMap.set(dateStr, { terverifikasi: 0, pending: 0 });
  }

  // Agregasi transaksi ke dalam tanggal terkait
  transactions.forEach((t) => {
    const dateStr = t.createdAt.toISOString().split("T")[0];
    const entry = dateMap.get(dateStr) || { terverifikasi: 0, pending: 0 };
    if (t.status === "APPROVED") {
      entry.terverifikasi += t.amountPaid;
    } else if (t.status === "PENDING") {
      entry.pending += t.amountPaid;
    }
    dateMap.set(dateStr, entry);
  });

  const chartData: ChartPoint[] = Array.from(dateMap.entries()).map(
    ([date, val]) => ({
      date,
      terverifikasi: val.terverifikasi,
      pending: val.pending,
    })
  );

  // 4. Transformasi data transaksi ke format yang dibutuhkan DataTable
  const tableData: TransactionItem[] = transactions.map((t) => ({
    id: t.id,
    referenceCode: t.referenceCode,
    studentName: t.student.name,
    nim: t.student.nim,
    className: t.student.class.name,
    billTitle: t.bill.title,
    amountPaid: t.amountPaid,
    paymentMethodName: t.paymentMethod.name,
    picName: t.paymentMethod.picName,
    accountNumber: t.paymentMethod.accountNumber,
    status: t.status as "PENDING" | "APPROVED" | "REJECTED",
    rejectionReason: t.rejectionReason,
    proofImageUrl: t.proofImageUrl,
    studentNotes: t.studentNotes,
    sheetSyncStatus: t.sheetSyncStatus,
    verifiedByName: t.verifiedBy?.fullName,
    createdAt: t.createdAt.toISOString(),
  }));

  return {
    stats,
    chartData,
    tableData,
  };
}
