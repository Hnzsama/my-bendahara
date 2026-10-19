import { connection } from "next/server";
import { SiteHeader } from "@/components/site-header";
import { FinancialSummaryView } from "@/components/financial-summary-view";
import { getFinancialSummaryData } from "@/lib/dashboard-data";

export const instant = false;

export default async function Page() {
  await connection();
  const summaryData = await getFinancialSummaryData();

  return (
    <>
      <SiteHeader title="Ringkasan Keuangan" />
      <FinancialSummaryView data={summaryData} />
    </>
  );
}
