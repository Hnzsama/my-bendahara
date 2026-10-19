import { prisma } from "@/lib/db";

export interface PaymentMethodItem {
  id: string;
  name: string;
  type: "BANK_TRANSFER" | "QRIS" | "EWALLET";
  bankName: string;
  accountNumber: string;
  accountHolder: string;
  picName: string;
  qrisImageUrl: string | null;
  instructions: string | null;
  isActive: boolean;
  displayOrder: number;
  createdAt: string;
  totalTransactionsCount: number;
  approvedTransactionsCount: number;
  pendingTransactionsCount: number;
  collectedAmount: number;
}

export interface MethodsStats {
  totalMethods: number;
  activeMethods: number;
  totalPICs: number;
  totalCollected: number;
  totalPendingTransactions: number;
}

export interface MethodsData {
  stats: MethodsStats;
  methods: PaymentMethodItem[];
  picList: string[];
}

/**
 * Service Data Layer untuk Halaman Metode Pembayaran & PIC Bendahara
 */
export async function getMethodsData(): Promise<MethodsData> {
  const methods = await prisma.paymentMethod.findMany({
    include: {
      transactions: {
        select: {
          id: true,
          amountPaid: true,
          status: true,
        },
      },
    },
    orderBy: [
      { isActive: "desc" },
      { displayOrder: "asc" },
      { createdAt: "asc" },
    ],
  });

  const mappedMethods: PaymentMethodItem[] = methods.map((m) => {
    const approvedTransactions = m.transactions.filter((t) => t.status === "APPROVED");
    const pendingTransactions = m.transactions.filter((t) => t.status === "PENDING");
    const collectedAmount = approvedTransactions.reduce((acc, t) => acc + t.amountPaid, 0);

    return {
      id: m.id,
      name: m.name,
      type: m.type as "BANK_TRANSFER" | "QRIS" | "EWALLET",
      bankName: m.bankName,
      accountNumber: m.accountNumber,
      accountHolder: m.accountHolder,
      picName: m.picName,
      qrisImageUrl: m.qrisImageUrl,
      instructions: m.instructions,
      isActive: m.isActive,
      displayOrder: m.displayOrder,
      createdAt: m.createdAt.toISOString(),
      totalTransactionsCount: m.transactions.length,
      approvedTransactionsCount: approvedTransactions.length,
      pendingTransactionsCount: pendingTransactions.length,
      collectedAmount,
    };
  });

  const totalMethods = mappedMethods.length;
  const activeMethods = mappedMethods.filter((m) => m.isActive).length;

  const picSet = new Set<string>();
  mappedMethods.forEach((m) => picSet.add(m.picName));
  const picList = Array.from(picSet);

  const totalCollected = mappedMethods.reduce((acc, m) => acc + m.collectedAmount, 0);
  const totalPendingTransactions = mappedMethods.reduce((acc, m) => acc + m.pendingTransactionsCount, 0);

  return {
    stats: {
      totalMethods,
      activeMethods,
      totalPICs: picList.length,
      totalCollected,
      totalPendingTransactions,
    },
    methods: mappedMethods,
    picList,
  };
}
