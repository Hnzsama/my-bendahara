"use client";

import * as React from "react";
import { formatRupiah, formatDateTime } from "@/lib/utils";
import type { TransparencyData } from "@/lib/portal-data";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  CoinsIcon,
  CheckCircleIcon,
  ChartLineUpIcon,
  UsersIcon,
  TableIcon,
  ArrowSquareOutIcon,
  GraduationCapIcon,
  ShieldCheckIcon,
  ClockIcon,
  LockKeyIcon,
} from "@phosphor-icons/react";

interface TransparencyViewProps {
  data: TransparencyData;
}

export function TransparencyView({ data }: TransparencyViewProps) {
  const { stats, classesProgress, billsSummary, recentTransactions } = data;

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 sm:py-12 space-y-10">
      {/* Header Banner */}
      <div className="text-center max-w-2xl mx-auto">
        <Badge variant="outline" className="mb-2 px-3 py-1 text-xs bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20">
          <ShieldCheckIcon className="mr-1.5 size-3.5 inline" />
          Akuntabilitas & Keterbukaan Keuangan MI 2025
        </Badge>
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
          Transparansi Keuangan Manajemen Informatika 2025
        </h1>
        <p className="text-sm text-muted-foreground mt-2">
          Seluruh dana iuran, kas, dan kegiatan angkatan Manajemen Informatika 2025 tercatat secara terbuka, diverifikasi langsung oleh bendahara, dan dapat dipantau oleh setiap mahasiswa.
        </p>
      </div>

      {/* 4 Stat Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Kas Masuk */}
        <Card className="p-5 border rounded-2xl bg-card/60 backdrop-blur-xs shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground">Total Dana Terverifikasi</span>
            <div className="flex size-8 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
              <CoinsIcon className="size-4.5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 tracking-tight">
              {formatRupiah(stats.totalCollected)}
            </div>
            <p className="text-[11px] text-muted-foreground mt-0.5">
              Tercatat lunas di pembukuan
            </p>
          </div>
        </Card>

        {/* Tingkat Kelunasan */}
        <Card className="p-5 border rounded-2xl bg-card/60 backdrop-blur-xs shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground">Tingkat Kelunasan</span>
            <div className="flex size-8 items-center justify-center rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400">
              <ChartLineUpIcon className="size-4.5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-bold text-foreground tracking-tight">
              {stats.overallCompletionRate}%
            </div>
            <p className="text-[11px] text-muted-foreground mt-0.5">
              Dari seluruh mahasiswa aktif
            </p>
          </div>
        </Card>

        {/* Pembayaran Terverifikasi */}
        <Card className="p-5 border rounded-2xl bg-card/60 backdrop-blur-xs shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground">Transaksi Disetujui</span>
            <div className="flex size-8 items-center justify-center rounded-lg bg-violet-500/10 text-violet-600 dark:text-violet-400">
              <CheckCircleIcon className="size-4.5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-bold text-foreground tracking-tight">
              {stats.totalTransactionsApproved} Transaksi
            </div>
            <p className="text-[11px] text-muted-foreground mt-0.5">
              Tervalidasi oleh bendahara
            </p>
          </div>
        </Card>

        {/* Total Mahasiswa */}
        <Card className="p-5 border rounded-2xl bg-card/60 backdrop-blur-xs shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground">Mahasiswa Angkatan</span>
            <div className="flex size-8 items-center justify-center rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400">
              <UsersIcon className="size-4.5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-bold text-foreground tracking-tight">
              {stats.totalStudents} Mahasiswa
            </div>
            <p className="text-[11px] text-muted-foreground mt-0.5">
              Tersebar di {classesProgress.length} rombel kelas
            </p>
          </div>
        </Card>
      </div>

      {/* ========================================================= */}
      {/* SECTION 1: PROGRES KAS PER KELAS */}
      {/* ========================================================= */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex size-7 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <GraduationCapIcon className="size-4" />
            </div>
            <h2 className="text-lg font-bold text-foreground">Progres Pembayaran per Kelas</h2>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {classesProgress.map((cls) => (
            <Card
              key={cls.id}
              className="p-5 border rounded-2xl bg-card/60 backdrop-blur-xs shadow-xs flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-base text-foreground">{cls.name}</span>
                    <Badge variant="outline" className="text-[10px]">
                      {cls.academicYear}
                    </Badge>
                  </div>
                  <Badge variant="secondary" className="font-mono text-xs">
                    {cls.percentage}% Lunas
                  </Badge>
                </div>

                {/* Progress Bar */}
                <div className="w-full bg-muted rounded-full h-2.5 overflow-hidden my-3">
                  <div
                    className="bg-emerald-500 h-2.5 rounded-full transition-all duration-500"
                    style={{ width: `${Math.min(100, Math.max(0, cls.percentage))}%` }}
                  />
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs pt-2">
                  <div>
                    <span className="text-muted-foreground block text-[11px]">Mahasiswa Lunas</span>
                    <span className="font-semibold text-foreground">
                      {cls.approvedCount} dari {cls.totalStudents} Mahasiswa
                    </span>
                  </div>
                  <div>
                    <span className="text-muted-foreground block text-[11px]">Dana Terkumpul</span>
                    <span className="font-bold text-emerald-600 dark:text-emerald-400">
                      {formatRupiah(cls.totalCollected)}
                    </span>
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>

      {/* ========================================================= */}
      {/* SECTION 2: DAFTAR TAGIHAN & LINK GOOGLE SPREADSHEET */}
      {/* ========================================================= */}
      {billsSummary.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="flex size-7 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                <TableIcon className="size-4" />
              </div>
              <h2 className="text-lg font-bold text-foreground">Tagihan, Iuran & Link Google Sheets</h2>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {billsSummary.map((b) => (
              <Card
                key={b.id}
                className="p-5 border rounded-2xl bg-card/60 backdrop-blur-xs shadow-xs flex flex-col justify-between"
              >
                <div>
                  <span className="font-semibold text-sm text-foreground block">
                    {b.title}
                  </span>
                  <div className="flex items-baseline justify-between mt-3 text-xs">
                    <span className="text-muted-foreground">Target per Siswa:</span>
                    <span className="font-semibold text-foreground">
                      {formatRupiah(b.amount)}
                    </span>
                  </div>
                  <div className="flex items-baseline justify-between mt-1 text-xs">
                    <span className="text-muted-foreground">Total Terkumpul:</span>
                    <span className="font-bold text-emerald-600 dark:text-emerald-400">
                      {formatRupiah(b.totalCollected)}
                    </span>
                  </div>
                </div>

                {b.googleSheetUrl ? (
                  <a
                    href={b.googleSheetUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-4 pt-3 border-t flex items-center justify-between text-xs text-emerald-600 dark:text-emerald-400 font-medium hover:underline"
                  >
                    <span className="flex items-center gap-1.5">
                      <TableIcon className="size-3.5" />
                      Lihat Spreadsheet Lengkap
                    </span>
                    <ArrowSquareOutIcon className="size-3.5" />
                  </a>
                ) : (
                  <div className="mt-4 pt-3 border-t text-[11px] text-muted-foreground italic">
                    Tersinkron di buku kas offline
                  </div>
                )}
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* SECTION 3: RIWAYAT PEMBAYARAN KAS TERVERIFIKASI TERAKHIR */}
      {/* ========================================================= */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex size-7 items-center justify-center rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400">
              <ClockIcon className="size-4" />
            </div>
            <h2 className="text-lg font-bold text-foreground">Riwayat Pembayaran Terbaru</h2>
          </div>
          <span className="text-xs text-muted-foreground">
            Menampilkan 12 transaksi terakhir
          </span>
        </div>

        <div className="rounded-2xl border bg-card shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm border-collapse">
              <thead>
                <tr className="border-b bg-muted/40 text-[11px] font-medium text-muted-foreground uppercase tracking-wider">
                  <th className="py-3 px-4">Mahasiswa</th>
                  <th className="py-3 px-4">Kelas</th>
                  <th className="py-3 px-4">Tagihan Kas</th>
                  <th className="py-3 px-4">Nominal</th>
                  <th className="py-3 px-4">Waktu Verifikasi</th>
                  <th className="py-3 px-4">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {recentTransactions.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-xs text-muted-foreground">
                      Belum ada transaksi pembayaran yang disetujui.
                    </td>
                  </tr>
                ) : (
                  recentTransactions.map((tx) => (
                    <tr key={tx.id} className="hover:bg-muted/30 transition-colors text-xs">
                      {/* Mahasiswa Info */}
                      <td className="py-3 px-4">
                        <div className="flex flex-col">
                          <span className="font-medium text-foreground">{tx.studentName}</span>
                          <span className="font-mono text-[11px] text-muted-foreground">
                            {tx.maskedNim}
                          </span>
                        </div>
                      </td>

                      {/* Kelas */}
                      <td className="py-3 px-4">
                        <Badge variant="outline" className="text-[10px] font-normal">
                          {tx.className}
                        </Badge>
                      </td>

                      {/* Tagihan */}
                      <td className="py-3 px-4 text-muted-foreground">
                        {tx.billTitle}
                      </td>

                      {/* Nominal */}
                      <td className="py-3 px-4">
                        <span className="font-bold text-emerald-600 dark:text-emerald-400">
                          {formatRupiah(tx.amountPaid)}
                        </span>
                      </td>

                      {/* Tanggal */}
                      <td className="py-3 px-4 text-muted-foreground">
                        {formatDateTime(tx.verifiedAt)}
                      </td>

                      {/* Status */}
                      <td className="py-3 px-4">
                        <Badge variant="secondary" className="text-[10px] bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20 gap-1">
                          <CheckCircleIcon className="size-3" />
                          Lunas
                        </Badge>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          <div className="p-3 border-t bg-muted/20 text-center text-[11px] text-muted-foreground flex items-center justify-center gap-1.5">
            <LockKeyIcon className="size-3.5 text-muted-foreground shrink-0" />
            <span>NIM disamarkan demi privasi mahasiswa angkatan. Seluruh data diverifikasi secara sah oleh bendahara kelas.</span>
          </div>
        </div>
      </div>
    </div>
  );
}
