import { SectionCards } from "@/components/section-cards";
import { ChartAreaInteractive } from "@/components/chart-area-interactive";
import { DataTable } from "@/components/data-table";
import type { FinancialSummaryData } from "@/lib/dashboard-data";

export interface FinancialSummaryViewProps {
  data: FinancialSummaryData;
}

/**
 * Komponen modular tampilan Ringkasan Keuangan
 * Menggabungkan kartu ringkasan metrik, grafik analitik tren kas, dan tabel transaksi
 */
export function FinancialSummaryView({ data }: FinancialSummaryViewProps) {
  const { stats, chartData, tableData } = data;

  return (
    <div className="flex flex-1 flex-col">
      <div className="@container/main flex flex-1 flex-col gap-2">
        <div className="flex flex-col gap-6 py-4 md:py-6">
          {/* 1. Baris 4 Kartu Metrik Utama */}
          <SectionCards stats={stats} />

          {/* 2. Grafik Interaktif Tren Kas 14 Hari */}
          <div className="px-4 lg:px-6">
            <ChartAreaInteractive data={chartData} />
          </div>

          {/* 3. Tabel Transaksi Nyata & Verifikasi */}
          <DataTable data={tableData} />
        </div>
      </div>
    </div>
  );
}
