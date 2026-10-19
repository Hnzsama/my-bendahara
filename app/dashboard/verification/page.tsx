import { connection } from "next/server";
import { SiteHeader } from "@/components/site-header";
import { VerificationView } from "@/components/verification/verification-view";
import { getVerificationData } from "@/lib/verification-data";

export const instant = false;

export default async function Page() {
  await connection();
  const data = await getVerificationData();

  return (
    <>
      <SiteHeader title="Verifikasi 1-Klik" />
      <VerificationView data={data} />
    </>
  );
}
