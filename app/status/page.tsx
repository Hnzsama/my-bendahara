import { Suspense } from "react";
import { PublicHeader } from "@/components/public-header";
import { StatusCheckerView } from "@/components/portal/status-checker-view";

export const instant = false;

export const metadata = {
  title: "Cek Status Transaksi Kas — KeuanganAngkatan",
  description: "Lacak status verifikasi pembayaran kas mahasiswa angkatan.",
};

export default function Page() {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <PublicHeader />
      <main className="flex-1">
        <Suspense
          fallback={
            <div className="max-w-4xl mx-auto py-20 text-center">
              <div className="size-6 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-2" />
              <p className="text-xs text-muted-foreground">Memuat pelacak status transaksi...</p>
            </div>
          }
        >
          <StatusCheckerView />
        </Suspense>
      </main>
    </div>
  );
}
