import { prisma } from "@/lib/db";
import type { TransactionItem } from "@/components/data-table";

export interface VerificationStats {
  pendingCount: number;
  pendingAmount: number;
  approvedCount: number;
  approvedAmount: number;
  rejectedCount: number;
  failedSyncCount: number;
}

export interface VerificationData {
  stats: VerificationStats;
  transactions: TransactionItem[];
  paymentMethods: {
    id: string;
    name: string;
    picName: string;
    bankName: string;
  }[];
  classes: {
    id: string;
    name: string;
  }[];
}

/**
 * Service data modular untuk antrean Verifikasi 1-Klik
 */
export async function getVerificationData(): Promise<VerificationData> {
  const [transactions, paymentMethods, classes] = await Promise.all([
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
      orderBy: [
        // Prioritaskan status PENDING di paling atas antrean
        { status: "asc" },
        { createdAt: "desc" },
      ],
    }),
    prisma.paymentMethod.findMany({
      where: { isActive: true },
      select: {
        id: true,
        name: true,
        picName: true,
        bankName: true,
      },
      orderBy: { displayOrder: "asc" },
    }),
    prisma.class.findMany({
      select: {
        id: true,
        name: true,
      },
      orderBy: { name: "asc" },
    }),
  ]);

  // Kalkulasi statistik antrean
  const pendingTransactions = transactions.filter((t) => t.status === "PENDING");
  const approvedTransactions = transactions.filter((t) => t.status === "APPROVED");
  const rejectedTransactions = transactions.filter((t) => t.status === "REJECTED");
  const failedSyncTransactions = transactions.filter(
    (t) => t.status === "APPROVED" && t.sheetSyncStatus === "FAILED"
  );

  const pendingCount = pendingTransactions.length;
  const pendingAmount = pendingTransactions.reduce((acc, t) => acc + t.amountPaid, 0);

  const approvedCount = approvedTransactions.length;
  const approvedAmount = approvedTransactions.reduce((acc, t) => acc + t.amountPaid, 0);

  const rejectedCount = rejectedTransactions.length;
  const failedSyncCount = failedSyncTransactions.length;

  const mappedTransactions: TransactionItem[] = transactions.map((t) => ({
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
    stats: {
      pendingCount,
      pendingAmount,
      approvedCount,
      approvedAmount,
      rejectedCount,
      failedSyncCount,
    },
    transactions: mappedTransactions,
    paymentMethods,
    classes,
  };
}
