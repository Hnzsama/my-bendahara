import { connection } from "next/server";
import { PublicHeader } from "@/components/public-header";
import { PaymentPortalView } from "@/components/portal/payment-portal-view";
import { getPaymentPortalData } from "@/lib/portal-data";

export const instant = false;

export const metadata = {
  title: "Portal Pembayaran Kas Siswa — KeuanganAngkatan",
  description: "Formulir resmi pembayaran kas dan iuran mahasiswa angkatan.",
};

export default async function Page({
  searchParams,
}: {
  searchParams?: Promise<{ bill?: string }>;
}) {
  await connection();
  const params = searchParams ? await searchParams : undefined;
  const data = await getPaymentPortalData();

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <PublicHeader />
      <main className="flex-1">
        <PaymentPortalView data={data} preselectedBillSlug={params?.bill} />
      </main>
    </div>
  );
}
