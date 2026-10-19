import { connection } from "next/server";
import { SiteHeader } from "@/components/site-header";
import { BillsView } from "@/components/bills/bills-view";
import { getBillsData } from "@/lib/bills-data";

export const instant = false;

export default async function Page() {
  await connection();
  const data = await getBillsData();

  return (
    <>
      <SiteHeader title="Tagihan & Iuran" />
      <BillsView data={data} />
    </>
  );
}
