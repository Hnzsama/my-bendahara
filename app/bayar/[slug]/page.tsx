import { connection } from "next/server";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { PublicHeader } from "@/components/public-header";
import { PaymentPortalView } from "@/components/portal/payment-portal-view";
import { getPaymentPortalData } from "@/lib/portal-data";

export const instant = false;

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: PageProps) {
  const { slug } = await params;
  const bill = await prisma.bill.findFirst({
    where: {
      OR: [{ slug }, { id: slug }],
      isActive: true,
    },
    select: { title: true, description: true },
  });

  if (!bill) {
    return {
      title: "Portal Pembayaran — Manajemen Informatika 2025",
    };
  }

  return {
    title: `Bayar ${bill.title} — Manajemen Informatika 2025`,
    description: bill.description || `Formulir resmi pembayaran ${bill.title}.`,
  };
}

export default async function Page({ params }: PageProps) {
  await connection();
  const { slug } = await params;
  const data = await getPaymentPortalData();

  // Cek apakah tagihan dengan slug atau ID tersebut ada dan aktif
  const targetBill = data.bills.find(
    (b) => (b.slug && b.slug.toLowerCase() === slug.toLowerCase()) || b.id === slug
  );

  if (!targetBill) {
    notFound();
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <PublicHeader />
      <main className="flex-1">
        <PaymentPortalView data={data} preselectedBillSlug={slug} />
      </main>
    </div>
  );
}
