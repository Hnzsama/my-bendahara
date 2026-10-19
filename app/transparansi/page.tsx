import { connection } from "next/server";
import { PublicHeader } from "@/components/public-header";
import { TransparencyView } from "@/components/portal/transparency-view";
import { getTransparencyData } from "@/lib/portal-data";

export const instant = false;

export const metadata = {
  title: "Transparansi Keuangan Angkatan — KeuanganAngkatan",
  description: "Laporan keterbukaan dan akuntabilitas keuangan mahasiswa angkatan secara real-time.",
};

export default async function Page() {
  await connection();
  const data = await getTransparencyData();

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <PublicHeader />
      <main className="flex-1">
        <TransparencyView data={data} />
      </main>
    </div>
  );
}
