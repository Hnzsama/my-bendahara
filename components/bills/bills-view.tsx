"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { formatRupiah, formatDateTime } from "@/lib/utils";
import type { BillsData, BillItem } from "@/lib/bills-data";
import { toggleBillStatusAction, syncBillTransactionsAction } from "@/actions/bills";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { CreateBillDialog } from "./create-bill-dialog";
import { EditBillDialog } from "./edit-bill-dialog";

import {
  ReceiptIcon,
  CheckCircleIcon,
  ClockIcon,
  CalendarBlankIcon,
  DotsThreeVerticalIcon,
  PencilSimpleIcon,
  ArchiveIcon,
  ArrowSquareOutIcon,
  MagnifyingGlassIcon,
  XCircleIcon,
  ChartLineUpIcon,
  UsersIcon,
  TableIcon,
  ArrowsClockwiseIcon,
  ShareNetworkIcon,
  WhatsappLogoIcon,
  LinkSimpleIcon,
} from "@phosphor-icons/react";

interface BillsViewProps {
  data: BillsData;
}

export function BillsView({ data }: BillsViewProps) {
  const router = useRouter();
  const { stats, bills: initialBills, academicTerms } = data;

  const [bills, setBills] = React.useState<BillItem[]>(initialBills);
  const [searchQuery, setSearchQuery] = React.useState("");
  const [statusFilter, setStatusFilter] = React.useState<"ALL" | "ACTIVE" | "ARCHIVED">("ALL");
  const [termFilter, setTermFilter] = React.useState<string>("ALL");
  const [syncingBillId, setSyncingBillId] = React.useState<string | null>(null);

  // State untuk modal edit bill
  const [editingBill, setEditingBill] = React.useState<BillItem | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = React.useState(false);

  React.useEffect(() => {
    setBills(initialBills);
  }, [initialBills]);

  // Handler toggle status aktif/arsip
  const handleToggleStatus = async (bill: BillItem) => {
    try {
      const res = await toggleBillStatusAction(bill.id);
      if (res.success) {
        toast.success(res.message);
        setBills((prev) =>
          prev.map((b) => (b.id === bill.id ? { ...b, isActive: !b.isActive } : b))
        );
        router.refresh();
      } else {
        toast.error(res.error || "Gagal mengubah status");
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Terjadi kesalahan";
      toast.error(msg);
    }
  };

  // Sync bill transactions to Google Sheets
  const handleSyncSheet = async (bill: BillItem) => {
    setSyncingBillId(bill.id);
    try {
      const res = await syncBillTransactionsAction(bill.id);
      if (res.success) {
        toast.success(res.message);
        router.refresh();
      } else {
        toast.error(res.error || "Gagal menyinkronkan data ke spreadsheet");
      }
    } catch {
      toast.error("Terjadi kesalahan saat menyinkronkan data.");
    } finally {
      setSyncingBillId(null);
    }
  };

  // Salin tautan form pembayaran untuk dibagikan
  const handleCopyShareLink = (bill: BillItem) => {
    const origin = typeof window !== "undefined" ? window.location.origin : "";
    const identifier = bill.slug || bill.id;
    const link = `${origin}/bayar/${identifier}`;
    navigator.clipboard.writeText(link);
    toast.success("Tautan form tagihan berhasil disalin ke clipboard!");
  };

  // Bagikan form pembayaran langsung ke WhatsApp
  const handleShareWhatsApp = (bill: BillItem) => {
    const origin = typeof window !== "undefined" ? window.location.origin : "";
    const identifier = bill.slug || bill.id;
    const link = `${origin}/bayar/${identifier}`;
    const text = `Halo teman-teman! 👋\nBerikut tautan pembayaran untuk *${bill.title}* (Nominal: ${formatRupiah(bill.amount)}):\n\n🔗 ${link}\n\nSilakan klik tautan di atas untuk konfirmasi & bayar kas. Terima kasih! 🙏`;
    const url = `https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`;
    window.open(url, "_blank", "noopener,noreferrer");
  };

  // Filter bills
  const filteredBills = React.useMemo(() => {
    return bills.filter((b) => {
      // 1. Status filter
      if (statusFilter === "ACTIVE" && !b.isActive) return false;
      if (statusFilter === "ARCHIVED" && b.isActive) return false;

      // 2. Term filter
      if (termFilter !== "ALL" && b.academicTerm !== termFilter) return false;

      // 3. Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesTitle = b.title.toLowerCase().includes(q);
        const matchesDesc = b.description?.toLowerCase().includes(q);
        if (!matchesTitle && !matchesDesc) return false;
      }

      return true;
    });
  }, [bills, statusFilter, termFilter, searchQuery]);

  const isFiltered = searchQuery !== "" || statusFilter !== "ALL" || termFilter !== "ALL";

  return (
    <div className="flex flex-1 flex-col gap-6 py-4 md:py-6">
      {/* 1. KARTU METRIK STATISTIK TAGIHAN */}
      <div className="grid grid-cols-1 gap-4 px-4 sm:grid-cols-2 lg:grid-cols-4 lg:px-6">
        {/* Card 1: Tagihan Aktif */}
        <Card className="rounded-xl border border-border/60 bg-card shadow-xs">
          <div className="p-5 pb-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-muted-foreground">
                Tagihan Aktif
              </span>
              <Badge
                variant="outline"
                className="border-emerald-500/30 bg-emerald-500/10 text-[11px] font-medium text-emerald-600 dark:text-emerald-400"
              >
                <ReceiptIcon className="mr-1 size-3" />
                Berjalan
              </Badge>
            </div>
            <div className="mt-3 flex items-baseline gap-2">
              <span className="text-2xl font-bold tracking-tight text-foreground font-sans sm:text-3xl">
                {stats.activeBills}
              </span>
              <span className="text-sm font-medium text-muted-foreground">
                dari {stats.totalBills} Tagihan
              </span>
            </div>
          </div>
          <CardFooter className="mt-auto border-t border-border/50 bg-muted/20 px-5 py-2.5 text-xs text-muted-foreground">
            Tampil pada portal bayar mahasiswa
          </CardFooter>
        </Card>

        {/* Card 2: Total Kas Terkumpul */}
        <Card className="rounded-xl border border-emerald-500/30 bg-card shadow-xs">
          <div className="p-5 pb-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-muted-foreground">
                Kas Terkumpul (Lunas)
              </span>
              <Badge
                variant="outline"
                className="border-emerald-500/30 bg-emerald-500/10 text-[11px] font-medium text-emerald-600 dark:text-emerald-400"
              >
                <CheckCircleIcon className="mr-1 size-3" />
                Terkumpul
              </Badge>
            </div>
            <div className="mt-3 flex items-baseline gap-2">
              <span className="text-2xl font-bold tracking-tight text-emerald-600 dark:text-emerald-400 font-sans sm:text-3xl">
                {formatRupiah(stats.totalCollectedAmount)}
              </span>
            </div>
          </div>
          <CardFooter className="mt-auto border-t border-border/50 bg-muted/20 px-5 py-2.5 text-xs text-muted-foreground">
            Dari seluruh tagihan aktif
          </CardFooter>
        </Card>

        {/* Card 3: Target Total Kas */}
        <Card className="rounded-xl border border-border/60 bg-card shadow-xs">
          <div className="p-5 pb-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-muted-foreground">
                Target Kas Angkatan
              </span>
              <Badge variant="outline" className="text-[11px] font-medium">
                <UsersIcon className="mr-1 size-3" />
                {stats.totalStudents} Mhs
              </Badge>
            </div>
            <div className="mt-3 flex items-baseline gap-2">
              <span className="text-2xl font-bold tracking-tight text-foreground font-sans sm:text-3xl">
                {formatRupiah(stats.totalTargetAmount)}
              </span>
            </div>
          </div>
          <CardFooter className="mt-auto border-t border-border/50 bg-muted/20 px-5 py-2.5 text-xs text-muted-foreground">
            Jika seluruh {stats.totalStudents} mahasiswa lunas
          </CardFooter>
        </Card>

        {/* Card 4: Persentase Pelunasan */}
        <Card className="rounded-xl border border-border/60 bg-card shadow-xs">
          <div className="p-5 pb-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-muted-foreground">
                Rata-rata Pelunasan
              </span>
              <Badge variant="secondary" className="text-[11px] font-medium">
                <ChartLineUpIcon className="mr-1 size-3" />
                Target
              </Badge>
            </div>
            <div className="mt-3 flex items-baseline gap-2">
              <span className="text-2xl font-bold tracking-tight text-foreground font-sans sm:text-3xl">
                {stats.overallCollectionRate}%
              </span>
              <span className="text-sm font-medium text-muted-foreground">
                Tercapai
              </span>
            </div>
          </div>
          <CardFooter className="mt-auto border-t border-border/50 bg-muted/20 px-5 py-2.5 text-xs text-muted-foreground">
            Progres penerimaan kas angkatan
          </CardFooter>
        </Card>
      </div>

      {/* 2. TOOLBAR FILTER & TOMBOL BUAT TAGIHAN */}
      <div className="flex flex-col gap-3 px-4 lg:px-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          {/* Kolom Kiri: Search & Filter Dropdown */}
          <div className="flex flex-wrap items-center gap-2.5">
            {/* Search Input */}
            <div className="relative flex-1 min-w-[200px] max-w-sm">
              <MagnifyingGlassIcon className="absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Cari judul tagihan atau keperluan..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="h-8 pl-8 pr-7 text-xs rounded-lg"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery("")}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground cursor-pointer"
                >
                  <XCircleIcon className="size-3.5" />
                </button>
              )}
            </div>

            {/* Filter Status */}
            <Select
              value={statusFilter}
              onValueChange={(val) => setStatusFilter((val || "ALL") as "ALL" | "ACTIVE" | "ARCHIVED")}
              items={[
                { label: "Semua Status", value: "ALL" },
                { label: "Hanya Aktif", value: "ACTIVE" },
                { label: "Diarsipkan", value: "ARCHIVED" },
              ]}
            >
              <SelectTrigger size="sm" className="h-8 w-fit min-w-[130px] rounded-lg text-xs">
                <SelectValue placeholder="Semua Status" />
              </SelectTrigger>
              <SelectContent align="start">
                <SelectGroup>
                  <SelectItem value="ALL">Semua Status</SelectItem>
                  <SelectItem value="ACTIVE">Hanya Aktif</SelectItem>
                  <SelectItem value="ARCHIVED">Diarsipkan</SelectItem>
                </SelectGroup>
              </SelectContent>
            </Select>

            {/* Filter Semester */}
            {academicTerms.length > 0 && (
              <Select
                value={termFilter}
                onValueChange={(val) => setTermFilter(val || "ALL")}
                items={[
                  { label: "Semua Semester", value: "ALL" },
                  ...academicTerms.map((t) => ({ label: t, value: t })),
                ]}
              >
                <SelectTrigger size="sm" className="h-8 w-fit min-w-[150px] rounded-lg text-xs">
                  <SelectValue placeholder="Semua Semester" />
                </SelectTrigger>
                <SelectContent align="start">
                  <SelectGroup>
                    <SelectItem value="ALL">Semua Semester</SelectItem>
                    {academicTerms.map((t) => (
                      <SelectItem key={t} value={t}>
                        {t}
                      </SelectItem>
                    ))}
                  </SelectGroup>
                </SelectContent>
              </Select>
            )}

            {/* Reset Filter Button */}
            {isFiltered && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setSearchQuery("");
                  setStatusFilter("ALL");
                  setTermFilter("ALL");
                }}
                className="h-8 px-2 text-xs text-muted-foreground hover:text-foreground gap-1 cursor-pointer"
              >
                <XCircleIcon className="size-3.5" />
                Reset
              </Button>
            )}
          </div>

          {/* Kolom Kanan: Tombol Buat Tagihan Baru */}
          <div className="flex items-center gap-2 ml-auto">
            <CreateBillDialog defaultAcademicTerm={academicTerms[0] || "Ganjil 2026/2027"} />
          </div>
        </div>
      </div>

      {/* 3. DAFTAR KARTU TAGIHAN INTERAKTIF */}
      <div className="px-4 lg:px-6">
        {filteredBills.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-xl border border-dashed p-10 text-center">
            <ReceiptIcon className="size-10 text-muted-foreground/60 mb-2" />
            <h3 className="text-sm font-semibold text-foreground">Tidak Ada Tagihan Ditemukan</h3>
            <p className="text-xs text-muted-foreground mt-1 max-w-sm">
              {isFiltered
                ? "Tidak ada tagihan yang sesuai dengan filter atau kata kunci pencarian Anda."
                : "Belum ada master tagihan kas yang dibuat. Klik tombol di atas untuk membuat tagihan baru."}
            </p>
            {isFiltered && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setSearchQuery("");
                  setStatusFilter("ALL");
                  setTermFilter("ALL");
                }}
                className="mt-4 text-xs rounded-lg"
              >
                Bersihkan Filter
              </Button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            {filteredBills.map((bill) => {
              return (
                <Card
                  key={bill.id}
                  className={`relative rounded-xl border transition-all duration-200 hover:shadow-md ${
                    bill.isActive
                      ? "border-border/70 bg-card"
                      : "border-border/40 bg-muted/20 opacity-80"
                  }`}
                >
                  <div className="p-5 pb-4">
                    {/* Header Baris Atas: Judul, Semester, & Menu */}
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1">
                        <div className="flex flex-wrap items-center gap-2 mb-1">
                          {bill.academicTerm && (
                            <Badge variant="outline" className="text-[10px] font-mono px-1.5 py-0">
                              {bill.academicTerm}
                            </Badge>
                          )}
                          <Badge
                            variant={bill.isActive ? "default" : "secondary"}
                            className={`text-[10px] px-1.5 py-0 ${
                              bill.isActive
                                ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/20"
                                : "text-muted-foreground"
                            }`}
                          >
                            {bill.isActive ? "Aktif" : "Diarsipkan"}
                          </Badge>
                          {bill.pendingTransactionsCount > 0 && (
                            <Badge
                              variant="outline"
                              className="border-amber-500/30 bg-amber-500/10 text-amber-600 dark:text-amber-400 text-[10px] px-1.5 py-0"
                            >
                              <ClockIcon className="mr-1 size-3" />
                              {bill.pendingTransactionsCount} Menunggu Cek
                            </Badge>
                          )}

                          {/* Link Slug Badge */}
                          {bill.slug && (
                            <button
                              type="button"
                              onClick={() => handleCopyShareLink(bill)}
                              title="Klik untuk salin tautan form langsung"
                              className="inline-flex items-center gap-1 text-[10px] font-mono px-2 py-0.5 rounded-full border border-primary/25 bg-primary/5 text-primary hover:bg-primary/15 transition-colors cursor-pointer font-medium"
                            >
                              <LinkSimpleIcon className="size-3" />
                              <span>/bayar/{bill.slug}</span>
                            </button>
                          )}

                          {/* Google Sheets Badge / Quick Link */}
                          {bill.googleSheetUrl ? (
                            <a
                              href={bill.googleSheetUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/20 transition-colors"
                              title="Buka Google Sheets untuk tagihan ini di tab baru"
                            >
                              <TableIcon className="size-3" />
                              <span>Sheet ↗</span>
                            </a>
                          ) : (
                            <button
                              type="button"
                              onClick={() => {
                                setEditingBill(bill);
                                setIsEditDialogOpen(true);
                              }}
                              className="inline-flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded-full border border-dashed border-border text-muted-foreground hover:text-foreground hover:border-foreground/40 transition-colors cursor-pointer"
                              title="Hubungkan Google Spreadsheet untuk tagihan ini"
                            >
                              <TableIcon className="size-3" />
                              <span>+ Hubungkan Sheet</span>
                            </button>
                          )}
                        </div>

                        <h3 className="text-base font-semibold text-foreground tracking-tight">
                          {bill.title}
                        </h3>

                        {bill.description && (
                          <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                            {bill.description}
                          </p>
                        )}
                      </div>

                      {/* Tombol Bagikan & Dropdown Aksi */}
                      <div className="flex items-center gap-1.5 shrink-0">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleCopyShareLink(bill)}
                          className="h-8 gap-1.5 text-xs rounded-lg cursor-pointer text-foreground hover:bg-muted font-normal px-2.5"
                          title="Salin tautan form tagihan untuk dibagikan ke grup"
                        >
                          <ShareNetworkIcon className="size-3.5 text-primary" />
                          <span className="hidden sm:inline">Bagikan</span>
                        </Button>

                        <DropdownMenu>
                          <DropdownMenuTrigger
                            render={
                              <Button
                                variant="ghost"
                                size="icon"
                                className="size-8 text-muted-foreground hover:bg-muted rounded-lg"
                              />
                            }
                          >
                            <DotsThreeVerticalIcon className="size-4" />
                            <span className="sr-only">Menu Tagihan</span>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-52 text-xs">
                            <DropdownMenuItem onClick={() => handleCopyShareLink(bill)}>
                              <LinkSimpleIcon className="mr-2 size-3.5 text-primary" />
                              Salin Tautan Form
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleShareWhatsApp(bill)}>
                              <WhatsappLogoIcon className="mr-2 size-3.5 text-emerald-500" />
                              Bagikan ke WhatsApp
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => window.open(`/bayar/${bill.slug || bill.id}`, "_blank")}
                            >
                              <ArrowSquareOutIcon className="mr-2 size-3.5 text-muted-foreground" />
                              Buka Form Mahasiswa
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              onClick={() => {
                                setEditingBill(bill);
                                setIsEditDialogOpen(true);
                              }}
                            >
                              <PencilSimpleIcon className="mr-2 size-3.5" />
                              Edit Detail Tagihan
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleToggleStatus(bill)}>
                              <ArchiveIcon className="mr-2 size-3.5" />
                              {bill.isActive ? "Arsipkan Tagihan" : "Aktifkan Kembali"}
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                          {bill.googleSheetUrl ? (
                            <>
                              <DropdownMenuItem
                                onClick={() => window.open(bill.googleSheetUrl!, "_blank", "noopener,noreferrer")}
                              >
                                <TableIcon className="mr-2 size-3.5 text-emerald-500" />
                                Buka Google Sheet
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                disabled={syncingBillId === bill.id}
                                onClick={() => handleSyncSheet(bill)}
                              >
                                <ArrowsClockwiseIcon
                                  className={`mr-2 size-3.5 text-blue-500 ${syncingBillId === bill.id ? "animate-spin" : ""}`}
                                />
                                {syncingBillId === bill.id ? "Menyinkronkan..." : "Sinkronkan ke Sheet"}
                              </DropdownMenuItem>
                            </>
                          ) : (
                            <DropdownMenuItem
                              onClick={() => {
                                setEditingBill(bill);
                                setIsEditDialogOpen(true);
                              }}
                            >
                              <TableIcon className="mr-2 size-3.5" />
                              Hubungkan Google Sheet
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuItem
                            onClick={() => router.push("/dashboard/verification")}
                          >
                            <ArrowSquareOutIcon className="mr-2 size-3.5" />
                            Lihat di Verifikasi
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>

                  {/* Nominal & Progress Pelunasan */}
                  <div className="mt-4 pt-3 border-t border-border/50">
                      <div className="flex items-baseline justify-between mb-2">
                        <div>
                          <span className="text-[11px] text-muted-foreground block">
                            Nominal Iuran
                          </span>
                          <span className="text-lg font-bold text-foreground tracking-tight">
                            {formatRupiah(bill.amount)}
                            <span className="text-xs font-normal text-muted-foreground ml-1">
                              / mahasiswa
                            </span>
                          </span>
                        </div>

                        <div className="text-right">
                          <span className="text-[11px] text-muted-foreground block">
                            Terkumpul
                          </span>
                          <span className="text-sm font-semibold text-emerald-600 dark:text-emerald-400">
                            {formatRupiah(bill.collectedAmount)}
                          </span>
                        </div>
                      </div>

                      {/* Visual Progress Bar Pelunasan */}
                      <div className="space-y-1.5 mt-3">
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-muted-foreground">
                            Progres: <strong className="text-foreground">{bill.paidStudentsCount}</strong> dari {bill.totalStudentsCount} mahasiswa
                          </span>
                          <span className="font-semibold text-foreground">
                            {bill.progressPercent}%
                          </span>
                        </div>
                        <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                          <div
                            className="h-full bg-emerald-600 transition-all duration-500 rounded-full"
                            style={{ width: `${bill.progressPercent}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Card Footer: Jatuh Tempo & Quick Links */}
                  <CardFooter className="flex items-center justify-between border-t border-border/50 bg-muted/20 px-5 py-2.5 text-xs text-muted-foreground">
                    <div className="flex items-center gap-1.5">
                      <CalendarBlankIcon className="size-3.5" />
                      {bill.dueDate ? (
                        <span>
                          Jatuh tempo: {formatDateTime(bill.dueDate).split(",")[0]}{" "}
                          {bill.isOverdue ? (
                            <span className="text-rose-600 font-medium">(Lewat tempo)</span>
                          ) : bill.daysLeft !== null && bill.daysLeft <= 7 ? (
                            <span className="text-amber-600 font-medium">({bill.daysLeft} hari lagi)</span>
                          ) : (
                            <span className="text-muted-foreground font-medium">({bill.daysLeft} hari lagi)</span>
                          )}
                        </span>
                      ) : (
                        <span>Tidak ada batas waktu</span>
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      {bill.pendingTransactionsCount > 0 ? (
                        <Link
                          href="/dashboard/verification"
                          className="font-medium text-amber-600 hover:underline flex items-center gap-1"
                        >
                          Verifikasi ({bill.pendingTransactionsCount})
                        </Link>
                      ) : (
                        <span className="text-[11px] text-muted-foreground">
                          {bill.approvedTransactionsCount} transaksi valid
                        </span>
                      )}
                    </div>
                  </CardFooter>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      {/* Modal Dialog Edit Bill */}
      <EditBillDialog
        bill={editingBill}
        open={isEditDialogOpen}
        onOpenChange={(open) => {
          setIsEditDialogOpen(open);
          if (!open) setEditingBill(null);
        }}
      />
    </div>
  );
}
