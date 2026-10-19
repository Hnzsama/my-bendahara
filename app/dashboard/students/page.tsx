import { connection } from "next/server";
import { SiteHeader } from "@/components/site-header";
import { StudentsView } from "@/components/students/students-view";
import { getStudentsPageData } from "@/lib/students-data";

export const instant = false;

export default async function Page() {
  await connection();
  const data = await getStudentsPageData();

  return (
    <>
      <SiteHeader title="Mahasiswa & Kelas" />
      <StudentsView data={data} initialTab="students" />
    </>
  );
}
