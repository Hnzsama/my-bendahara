"use client";

import * as React from "react";
import type { VerificationData } from "@/lib/verification-data";
import { formatRupiah } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Card, CardFooter } from "@/components/ui/card";
import { VerificationTable } from "./verification-table";
import {
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon,
  WarningCircleIcon,
} from "@phosphor-icons/react";

interface VerificationViewProps {
  data: VerificationData;
}

/**
 * Tampilan Utama Halaman Verifikasi 1-Klik
 * Menyediakan metrik antrean ringkas dan tabel verifikasi interaktif
 */
export function VerificationView({ data }: VerificationViewProps) {
  const { stats } = data;

  return (
    <div className="flex flex-1 flex-col gap-6 py-4 md:py-6">
      {/* 1. KARTU STATISTIK ANTREAN VERIFIKASI */}
      <div className="grid grid-cols-1 gap-4 px-4 sm:grid-cols-2 lg:grid-cols-4 lg:px-6">
        {/* Card 1: Antrean Pending */}
        <Card className="rounded-xl border border-amber-500/30 bg-card shadow-xs">
          <div className="p-5 pb-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-muted-foreground">
                Perlu Dicek (Pending)
              </span>
              <Badge
                variant="outline"
                className="border-amber-500/30 bg-amber-500/10 text-[11px] font-medium text-amber-600 dark:text-amber-400"
              >
                <ClockIcon className="mr-1 size-3" />
                Antrean
              </Badge>
            </div>
            <div className="mt-3 flex items-baseline gap-2">
              <span className="text-2xl font-bold tracking-tight text-amber-600 dark:text-amber-400 font-sans sm:text-3xl">
                {stats.pendingCount}
              </span>
              <span className="text-sm font-medium text-muted-foreground">
                Transaksi
              </span>
            </div>
          </div>
          <CardFooter className="mt-auto border-t border-border/50 bg-muted/20 px-5 py-2.5 text-xs text-muted-foreground">
            Total antrean: {formatRupiah(stats.pendingAmount)}
          </CardFooter>
        </Card>

        {/* Card 2: Disetujui */}
        <Card className="rounded-xl border border-emerald-500/30 bg-card shadow-xs">
          <div className="p-5 pb-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-muted-foreground">
                Disetujui
              </span>
              <Badge
                variant="outline"
                className="border-emerald-500/30 bg-emerald-500/10 text-[11px] font-medium text-emerald-600 dark:text-emerald-400"
              >
                <CheckCircleIcon className="mr-1 size-3" />
                Valid
              </Badge>
            </div>
            <div className="mt-3 flex items-baseline gap-2">
              <span className="text-2xl font-bold tracking-tight text-emerald-600 dark:text-emerald-400 font-sans sm:text-3xl">
                {stats.approvedCount}
              </span>
              <span className="text-sm font-medium text-muted-foreground">
                Transaksi
              </span>
            </div>
          </div>
          <CardFooter className="mt-auto border-t border-border/50 bg-muted/20 px-5 py-2.5 text-xs text-muted-foreground">
            Total masuk: {formatRupiah(stats.approvedAmount)}
          </CardFooter>
        </Card>

        {/* Card 3: Ditolak */}
        <Card className="rounded-xl border border-border/60 bg-card shadow-xs">
          <div className="p-5 pb-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-muted-foreground">
                Ditolak
              </span>
              <Badge variant="outline" className="text-[11px] font-medium text-rose-600 border-rose-500/30">
                <XCircleIcon className="mr-1 size-3" />
                Tidak Valid
              </Badge>
            </div>
            <div className="mt-3 flex items-baseline gap-2">
              <span className="text-2xl font-bold tracking-tight text-foreground font-sans sm:text-3xl">
                {stats.rejectedCount}
              </span>
              <span className="text-sm font-medium text-muted-foreground">
                Transaksi
              </span>
            </div>
          </div>
          <CardFooter className="mt-auto border-t border-border/50 bg-muted/20 px-5 py-2.5 text-xs text-muted-foreground">
            Struk ditolak karena tidak sesuai
          </CardFooter>
        </Card>

        {/* Card 4: Google Sheets Sync */}
        <Card className="rounded-xl border border-border/60 bg-card shadow-xs">
          <div className="p-5 pb-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-muted-foreground">
                Google Sheets Sync
              </span>
              {stats.failedSyncCount > 0 ? (
                <Badge variant="destructive" className="text-[11px]">
                  <WarningCircleIcon className="mr-1 size-3" />
                  {stats.failedSyncCount} Tertunda
                </Badge>
              ) : (
                <Badge variant="secondary" className="bg-emerald-500/10 text-emerald-600 text-[11px]">
                  Normal
                </Badge>
              )}
            </div>
            <div className="mt-3 flex items-baseline gap-2">
              <span className="text-2xl font-bold tracking-tight text-foreground font-sans sm:text-3xl">
                {stats.approvedCount - stats.failedSyncCount}/{stats.approvedCount}
              </span>
              <span className="text-sm font-medium text-muted-foreground">
                Tersinkron
              </span>
            </div>
          </div>
          <CardFooter className="mt-auto border-t border-border/50 bg-muted/20 px-5 py-2.5 text-xs text-muted-foreground">
            Otomatis terhubung ke Spreadsheet
          </CardFooter>
        </Card>
      </div>

      {/* 2. TABEL VERIFIKASI DENGAN FILTER SLEEK & STYLE IDENTIK DASHBOARD */}
      <VerificationTable data={data} />
    </div>
  );
}
