import { connection } from "next/server";
import { SiteHeader } from "@/components/site-header";
import { MethodsView } from "@/components/methods/methods-view";
import { getMethodsData } from "@/lib/methods-data";

export const instant = false;

export default async function Page() {
  await connection();
  const data = await getMethodsData();

  return (
    <>
      <SiteHeader title="Metode & PIC Rekening" />
      <MethodsView data={data} />
    </>
  );
}
