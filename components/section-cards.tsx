"use client";

import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardFooter,
} from "@/components/ui/card";
import {
  TrendUpIcon,
  ClockIcon,
  UsersIcon,
  ReceiptIcon,
  CheckCircleIcon,
} from "@phosphor-icons/react";
import { formatRupiah } from "@/lib/utils";

export interface SectionCardsProps {
  stats?: {
    totalApprovedAmount: number;
    totalPendingAmount: number;
    pendingCount: number;
    totalStudents: number;
    classesCount: number;
    paidStudentsCount: number;
    activeBillsCount: number;
    completionRate: number;
  };
}

export function SectionCards({ stats }: SectionCardsProps) {
  const data = stats || {
    totalApprovedAmount: 110000,
    totalPendingAmount: 90000,
    pendingCount: 3,
    totalStudents: 10,
    classesCount: 2,
    paidStudentsCount: 4,
    activeBillsCount: 2,
    completionRate: 40,
  };

  return (
    <div className="grid grid-cols-1 gap-4 px-4 sm:grid-cols-2 lg:grid-cols-4 lg:px-6">
      {/* Card 1: Total Dana Terkumpul */}
      <Card className="rounded-xl border border-border/60 bg-card shadow-xs transition-all duration-200 hover:border-emerald-500/30 hover:shadow-sm">
        <div className="p-5 pb-3">
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs font-medium text-muted-foreground">
              Total Dana Masuk
            </span>
            <Badge
              variant="outline"
              className="shrink-0 border-emerald-500/30 bg-emerald-500/10 text-[11px] font-medium text-emerald-600 dark:text-emerald-400"
            >
              <TrendUpIcon className="mr-1 size-3" />
              Terverifikasi
            </Badge>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-bold tracking-tight text-emerald-600 dark:text-emerald-400 font-sans sm:text-3xl">
              {formatRupiah(data.totalApprovedAmount)}
            </div>
          </div>
        </div>
        <CardFooter className="mt-auto flex-col items-start gap-1 border-t border-border/50 bg-muted/20 px-5 py-3 text-xs">
          <div className="flex items-center gap-1.5 font-medium text-foreground">
            <span>Saldo riil kas angkatan</span>
            <CheckCircleIcon className="size-3.5 text-emerald-500" />
          </div>
          <div className="text-[11px] text-muted-foreground">
            Dana berhasil masuk ke rekening PIC
          </div>
        </CardFooter>
      </Card>

      {/* Card 2: Menunggu Verifikasi */}
      <Card className="rounded-xl border border-border/60 bg-card shadow-xs transition-all duration-200 hover:border-amber-500/30 hover:shadow-sm">
        <div className="p-5 pb-3">
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs font-medium text-muted-foreground">
              Menunggu Verifikasi
            </span>
            <Badge
              variant="outline"
              className="shrink-0 border-amber-500/30 bg-amber-500/10 text-[11px] font-medium text-amber-600 dark:text-amber-400"
            >
              <ClockIcon className="mr-1 size-3" />
              Perlu Dicek
            </Badge>
          </div>
          <div className="mt-3">
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold tracking-tight text-amber-600 dark:text-amber-400 font-sans sm:text-3xl">
                {data.pendingCount}
              </span>
              <span className="text-sm font-medium text-muted-foreground">
                Transaksi
              </span>
            </div>
          </div>
        </div>
        <CardFooter className="mt-auto flex-col items-start gap-1 border-t border-border/50 bg-muted/20 px-5 py-3 text-xs">
          <div className="flex items-center gap-1.5 font-medium text-foreground">
            <span>{formatRupiah(data.totalPendingAmount)} tertunda</span>
            <ClockIcon className="size-3.5 text-amber-500" />
          </div>
          <div className="text-[11px] text-muted-foreground">
            Struk transfer siap diverifikasi PIC
          </div>
        </CardFooter>
      </Card>

      {/* Card 3: Mahasiswa Terdaftar */}
      <Card className="rounded-xl border border-border/60 bg-card shadow-xs transition-all duration-200 hover:border-blue-500/30 hover:shadow-sm">
        <div className="p-5 pb-3">
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs font-medium text-muted-foreground">
              Partisipasi Mahasiswa
            </span>
            <Badge
              variant="outline"
              className="shrink-0 border-border bg-muted/40 text-[11px] font-medium text-foreground"
            >
              <UsersIcon className="mr-1 size-3 text-muted-foreground" />
              {data.classesCount} Kelas
            </Badge>
          </div>
          <div className="mt-3">
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold tracking-tight text-foreground font-sans sm:text-3xl">
                {data.paidStudentsCount}
                <span className="text-lg font-normal text-muted-foreground sm:text-xl">
                  /{data.totalStudents}
                </span>
              </span>
              <span className="text-sm font-medium text-muted-foreground">
                Mahasiswa
              </span>
            </div>
          </div>
        </div>
        <CardFooter className="mt-auto flex-col items-start gap-1 border-t border-border/50 bg-muted/20 px-5 py-3 text-xs">
          <div className="flex items-center gap-1.5 font-medium text-foreground">
            <span>Telah melakukan pembayaran</span>
            <UsersIcon className="size-3.5 text-blue-500" />
          </div>
          <div className="text-[11px] text-muted-foreground">
            Dari seluruh mahasiswa angkatan aktif
          </div>
        </CardFooter>
      </Card>

      {/* Card 4: Tingkat Pelunasan */}
      <Card className="rounded-xl border border-border/60 bg-card shadow-xs transition-all duration-200 hover:border-primary/30 hover:shadow-sm">
        <div className="p-5 pb-3">
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs font-medium text-muted-foreground">
              Tingkat Pelunasan
            </span>
            <Badge
              variant="outline"
              className="shrink-0 border-border bg-muted/40 text-[11px] font-medium text-foreground"
            >
              <ReceiptIcon className="mr-1 size-3 text-muted-foreground" />
              {data.activeBillsCount} Tagihan
            </Badge>
          </div>
          <div className="mt-3">
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold tracking-tight text-foreground font-sans sm:text-3xl">
                {data.completionRate}%
              </span>
              <span className="text-sm font-medium text-muted-foreground">
                Lunas
              </span>
            </div>
          </div>
        </div>
        <CardFooter className="mt-auto flex-col items-start gap-1 border-t border-border/50 bg-muted/20 px-5 py-3 text-xs">
          <div className="flex items-center gap-1.5 font-medium text-foreground">
            <span>Rasio kepatuhan angkatan</span>
            <TrendUpIcon className="size-3.5 text-primary" />
          </div>
          <div className="text-[11px] text-muted-foreground">
            Persentase iuran yang telah lunas
          </div>
        </CardFooter>
      </Card>
    </div>
  );
}
