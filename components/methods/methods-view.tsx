"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { formatRupiah } from "@/lib/utils";
import type { MethodsData, PaymentMethodItem } from "@/lib/methods-data";
import { togglePaymentMethodStatusAction } from "@/actions/payment-methods";

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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { CreateMethodDialog } from "./create-method-dialog";
import { EditMethodDialog } from "./edit-method-dialog";

import {
  CreditCardIcon,
  CheckCircleIcon,
  ClockIcon,
  DotsThreeVerticalIcon,
  PencilSimpleIcon,
  ArchiveIcon,
  ArrowSquareOutIcon,
  MagnifyingGlassIcon,
  XCircleIcon,
  CopyIcon,
  QrCodeIcon,
  BankIcon,
  DeviceMobileIcon,
  UsersIcon,
  EyeIcon,
} from "@phosphor-icons/react";

interface MethodsViewProps {
  data: MethodsData;
}

export function MethodsView({ data }: MethodsViewProps) {
  const router = useRouter();
  const { stats, methods: initialMethods, picList } = data;

  const [methods, setMethods] = React.useState<PaymentMethodItem[]>(initialMethods);
  const [searchQuery, setSearchQuery] = React.useState("");
  const [typeFilter, setTypeFilter] = React.useState<string>("ALL");
  const [picFilter, setPicFilter] = React.useState<string>("ALL");

  // State untuk modal edit
  const [editingMethod, setEditingMethod] = React.useState<PaymentMethodItem | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = React.useState(false);

  // State untuk modal preview QRIS
  const [previewQris, setPreviewQris] = React.useState<PaymentMethodItem | null>(null);

  React.useEffect(() => {
    setMethods(initialMethods);
  }, [initialMethods]);

  // Handler toggle status
  const handleToggleStatus = async (method: PaymentMethodItem) => {
    try {
      const res = await togglePaymentMethodStatusAction(method.id);
      if (res.success) {
        toast.success(res.message);
        setMethods((prev) =>
          prev.map((m) => (m.id === method.id ? { ...m, isActive: !m.isActive } : m))
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

  // Copy to clipboard
  const handleCopyNumber = (num: string, label: string) => {
    navigator.clipboard.writeText(num);
    toast.success(`Nomor ${label} (${num}) disalin ke clipboard!`);
  };

  // Filter methods
  const filteredMethods = React.useMemo(() => {
    return methods.filter((m) => {
      // 1. Tipe filter
      if (typeFilter !== "ALL" && m.type !== typeFilter) return false;

      // 2. PIC filter
      if (picFilter !== "ALL" && m.picName !== picFilter) return false;

      // 3. Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesName = m.name.toLowerCase().includes(q);
        const matchesBank = m.bankName.toLowerCase().includes(q);
        const matchesNumber = m.accountNumber.toLowerCase().includes(q);
        const matchesHolder = m.accountHolder.toLowerCase().includes(q);
        const matchesPic = m.picName.toLowerCase().includes(q);
        if (!matchesName && !matchesBank && !matchesNumber && !matchesHolder && !matchesPic) {
          return false;
        }
      }

      return true;
    });
  }, [methods, typeFilter, picFilter, searchQuery]);

  const isFiltered = searchQuery !== "" || typeFilter !== "ALL" || picFilter !== "ALL";

  return (
    <div className="flex flex-1 flex-col gap-6 py-4 md:py-6">
      {/* 1. KARTU METRIK UTAMA KANAL PEMBAYARAN */}
      <div className="grid grid-cols-1 gap-4 px-4 sm:grid-cols-2 lg:grid-cols-4 lg:px-6">
        {/* Card 1: Kanal Aktif */}
        <Card className="rounded-xl border border-border/60 bg-card shadow-xs">
          <div className="p-5 pb-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-muted-foreground">
                Kanal Aktif
              </span>
              <Badge
                variant="outline"
                className="border-emerald-500/30 bg-emerald-500/10 text-[11px] font-medium text-emerald-600 dark:text-emerald-400"
              >
                <CreditCardIcon className="mr-1 size-3" />
                Siap Terima
              </Badge>
            </div>
            <div className="mt-3 flex items-baseline gap-2">
              <span className="text-2xl font-bold tracking-tight text-foreground font-sans sm:text-3xl">
                {stats.activeMethods}
              </span>
              <span className="text-sm font-medium text-muted-foreground">
                dari {stats.totalMethods} Rekening
              </span>
            </div>
          </div>
          <CardFooter className="mt-auto border-t border-border/50 bg-muted/20 px-5 py-2.5 text-xs text-muted-foreground">
            Tampil di pilihan pembayaran mahasiswa
          </CardFooter>
        </Card>

        {/* Card 2: PIC Bendahara */}
        <Card className="rounded-xl border border-border/60 bg-card shadow-xs">
          <div className="p-5 pb-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-muted-foreground">
                PIC Bendahara
              </span>
              <Badge variant="outline" className="text-[11px] font-medium">
                <UsersIcon className="mr-1 size-3" />
                Tim Keuangan
              </Badge>
            </div>
            <div className="mt-3 flex items-baseline gap-2">
              <span className="text-2xl font-bold tracking-tight text-foreground font-sans sm:text-3xl">
                {stats.totalPICs}
              </span>
              <span className="text-sm font-medium text-muted-foreground">
                Penanggung Jawab
              </span>
            </div>
          </div>
          <CardFooter className="mt-auto border-t border-border/50 bg-muted/20 px-5 py-2.5 text-xs text-muted-foreground">
            Pemegang mutasi rekening terdaftar
          </CardFooter>
        </Card>

        {/* Card 3: Total Kas Terkumpul via Rekening */}
        <Card className="rounded-xl border border-emerald-500/30 bg-card shadow-xs">
          <div className="p-5 pb-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-muted-foreground">
                Kas Diterima via Kanal
              </span>
              <Badge
                variant="outline"
                className="border-emerald-500/30 bg-emerald-500/10 text-[11px] font-medium text-emerald-600 dark:text-emerald-400"
              >
                <CheckCircleIcon className="mr-1 size-3" />
                Terverifikasi
              </Badge>
            </div>
            <div className="mt-3 flex items-baseline gap-2">
              <span className="text-2xl font-bold tracking-tight text-emerald-600 dark:text-emerald-400 font-sans sm:text-3xl">
                {formatRupiah(stats.totalCollected)}
              </span>
            </div>
          </div>
          <CardFooter className="mt-auto border-t border-border/50 bg-muted/20 px-5 py-2.5 text-xs text-muted-foreground">
            Akumulasi mutasi masuk yang disetujui
          </CardFooter>
        </Card>

        {/* Card 4: Antrean Verifikasi */}
        <Card className="rounded-xl border border-border/60 bg-card shadow-xs">
          <div className="p-5 pb-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-muted-foreground">
                Antrean Perlu Cek
              </span>
              {stats.totalPendingTransactions > 0 ? (
                <Badge
                  variant="outline"
                  className="border-amber-500/30 bg-amber-500/10 text-[11px] font-medium text-amber-600 dark:text-amber-400"
                >
                  <ClockIcon className="mr-1 size-3" />
                  Antrean
                </Badge>
              ) : (
                <Badge variant="secondary" className="text-[11px]">
                  Bersih
                </Badge>
              )}
            </div>
            <div className="mt-3 flex items-baseline gap-2">
              <span className="text-2xl font-bold tracking-tight text-foreground font-sans sm:text-3xl">
                {stats.totalPendingTransactions}
              </span>
              <span className="text-sm font-medium text-muted-foreground">
                Transaksi Menunggu
              </span>
            </div>
          </div>
          <CardFooter className="mt-auto border-t border-border/50 bg-muted/20 px-5 py-2.5 text-xs text-muted-foreground">
            Perlu dicocokkan dengan mutasi bank
          </CardFooter>
        </Card>
      </div>

      {/* 2. TOOLBAR FILTER & TOMBOL TAMBAH KANAL */}
      <div className="flex flex-col gap-3 px-4 lg:px-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          {/* Kolom Kiri: Search & Filter */}
          <div className="flex flex-wrap items-center gap-2.5">
            {/* Search Input */}
            <div className="relative flex-1 min-w-[200px] max-w-sm">
              <MagnifyingGlassIcon className="absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Cari bank, nomor rekening, nama PIC..."
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

            {/* Filter Tipe Kanal */}
            <Select
              value={typeFilter}
              onValueChange={(val) => setTypeFilter(val || "ALL")}
              items={[
                { label: "Semua Tipe", value: "ALL" },
                { label: "Transfer Bank", value: "BANK_TRANSFER" },
                { label: "QRIS Kas", value: "QRIS" },
                { label: "E-Wallet", value: "EWALLET" },
              ]}
            >
              <SelectTrigger size="sm" className="h-8 w-fit min-w-[130px] rounded-lg text-xs">
                <SelectValue placeholder="Semua Tipe" />
              </SelectTrigger>
              <SelectContent align="start">
                <SelectGroup>
                  <SelectItem value="ALL">Semua Tipe</SelectItem>
                  <SelectItem value="BANK_TRANSFER">Transfer Bank</SelectItem>
                  <SelectItem value="QRIS">QRIS Kas</SelectItem>
                  <SelectItem value="EWALLET">E-Wallet</SelectItem>
                </SelectGroup>
              </SelectContent>
            </Select>

            {/* Filter PIC Bendahara */}
            {picList.length > 0 && (
              <Select
                value={picFilter}
                onValueChange={(val) => setPicFilter(val || "ALL")}
                items={[
                  { label: "Semua PIC Bendahara", value: "ALL" },
                  ...picList.map((p) => ({ label: p, value: p })),
                ]}
              >
                <SelectTrigger size="sm" className="h-8 w-fit min-w-[170px] rounded-lg text-xs">
                  <SelectValue placeholder="Semua PIC" />
                </SelectTrigger>
                <SelectContent align="start" className="min-w-[240px]">
                  <SelectGroup>
                    <SelectItem value="ALL">Semua PIC Bendahara</SelectItem>
                    {picList.map((p) => (
                      <SelectItem key={p} value={p}>
                        {p}
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
                  setTypeFilter("ALL");
                  setPicFilter("ALL");
                }}
                className="h-8 px-2 text-xs text-muted-foreground hover:text-foreground gap-1 cursor-pointer"
              >
                <XCircleIcon className="size-3.5" />
                Reset
              </Button>
            )}
          </div>

          {/* Kolom Kanan: Tombol Tambah Rekening */}
          <div className="flex items-center gap-2 ml-auto">
            <CreateMethodDialog existingPics={picList} />
          </div>
        </div>
      </div>

      {/* 3. DAFTAR KARTU METODE PEMBAYARAN */}
      <div className="px-4 lg:px-6">
        {filteredMethods.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-xl border border-dashed p-10 text-center">
            <CreditCardIcon className="size-10 text-muted-foreground/60 mb-2" />
            <h3 className="text-sm font-semibold text-foreground">Tidak Ada Rekening Ditemukan</h3>
            <p className="text-xs text-muted-foreground mt-1 max-w-sm">
              {isFiltered
                ? "Tidak ada rekening pembayaran yang sesuai dengan filter Anda."
                : "Belum ada rekening atau QRIS PIC yang didaftarkan. Klik tombol di atas untuk menambahkan rekening baru."}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {filteredMethods.map((method) => {
              return (
                <Card
                  key={method.id}
                  className={`relative rounded-xl border transition-all duration-200 hover:shadow-md ${
                    method.isActive
                      ? "border-border/70 bg-card"
                      : "border-border/40 bg-muted/20 opacity-80"
                  }`}
                >
                  <div className="p-5 pb-4">
                    {/* Header Baris Atas: Icon Bank, Tipe, & Menu */}
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <div className="flex size-9 items-center justify-center rounded-lg border bg-muted/60 text-foreground">
                          {method.type === "QRIS" ? (
                            <QrCodeIcon className="size-5 text-primary" />
                          ) : method.type === "EWALLET" ? (
                            <DeviceMobileIcon className="size-5 text-primary" />
                          ) : (
                            <BankIcon className="size-5 text-primary" />
                          )}
                        </div>
                        <div>
                          <span className="font-semibold text-xs text-foreground block">
                            {method.bankName}
                          </span>
                          <span className="text-[10px] text-muted-foreground uppercase font-mono">
                            {method.type === "BANK_TRANSFER" ? "Bank Transfer" : method.type}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-1">
                        <Badge
                          variant={method.isActive ? "default" : "secondary"}
                          className={`text-[10px] px-1.5 py-0 ${
                            method.isActive
                              ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/20"
                              : "text-muted-foreground"
                          }`}
                        >
                          {method.isActive ? "Aktif" : "Non-Aktif"}
                        </Badge>

                        {/* Dropdown Menu */}
                        <DropdownMenu>
                          <DropdownMenuTrigger
                            render={
                              <Button
                                variant="ghost"
                                size="icon"
                                className="size-7 text-muted-foreground hover:bg-muted rounded-lg"
                              />
                            }
                          >
                            <DotsThreeVerticalIcon className="size-4" />
                            <span className="sr-only">Menu Rekening</span>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-48 text-xs">
                            <DropdownMenuItem
                              onClick={() => {
                                setEditingMethod(method);
                                setIsEditDialogOpen(true);
                              }}
                            >
                              <PencilSimpleIcon className="mr-2 size-3.5" />
                              Edit Rekening & PIC
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleToggleStatus(method)}>
                              <ArchiveIcon className="mr-2 size-3.5" />
                              {method.isActive ? "Non-Aktifkan Kanal" : "Aktifkan Kanal"}
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              onClick={() => router.push("/dashboard/verification")}
                            >
                              <ArrowSquareOutIcon className="mr-2 size-3.5" />
                              Cek di Verifikasi
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>

                    {/* Nama Kanal */}
                    <h3 className="text-sm font-semibold text-foreground mt-3 tracking-tight">
                      {method.name}
                    </h3>

                    {/* Nomor Rekening dengan Tombol Salin Cepat */}
                    <div className="mt-2 flex items-center justify-between rounded-lg bg-muted/40 p-2.5 border border-border/40">
                      <div>
                        <span className="text-[10px] text-muted-foreground block">
                          Nomor Rekening / Akun
                        </span>
                        <span className="font-mono text-sm font-bold tracking-wider text-foreground">
                          {method.accountNumber}
                        </span>
                      </div>
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => handleCopyNumber(method.accountNumber, method.name)}
                        className="size-7 text-muted-foreground hover:text-foreground cursor-pointer"
                        title="Salin Nomor Rekening"
                      >
                        <CopyIcon className="size-4" />
                      </Button>
                    </div>

                    {/* Atas Nama & PIC */}
                    <div className="mt-3 space-y-1 text-xs">
                      <div className="flex items-center justify-between">
                        <span className="text-muted-foreground text-[11px]">Atas Nama:</span>
                        <span className="font-semibold text-foreground text-[11px]">
                          {method.accountHolder}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-muted-foreground text-[11px]">PIC Bendahara:</span>
                        <span className="font-medium text-foreground text-[11px] truncate max-w-[160px]">
                          {method.picName}
                        </span>
                      </div>
                    </div>

                    {/* Petunjuk Transfer */}
                    {method.instructions && (
                      <p className="mt-2.5 text-[11px] text-muted-foreground italic rounded-md bg-muted/20 p-2 border border-border/30 line-clamp-2">
                        &ldquo;{method.instructions}&rdquo;
                      </p>
                    )}

                    {/* Tombol Khusus Lihat Barcode QRIS jika tipe QRIS */}
                    {method.type === "QRIS" && (
                      <div className="mt-3">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setPreviewQris(method)}
                          className="w-full h-8 text-xs gap-1.5 rounded-lg border-primary/30 text-primary hover:bg-primary/10 cursor-pointer"
                        >
                          <QrCodeIcon className="size-4" />
                          <span>Lihat Barcode QRIS</span>
                        </Button>
                      </div>
                    )}
                  </div>

                  {/* Card Footer: Statistik Kas Masuk & Pending */}
                  <CardFooter className="flex items-center justify-between border-t border-border/50 bg-muted/20 px-5 py-2.5 text-xs text-muted-foreground">
                    <div>
                      <span className="text-[10px] text-muted-foreground block">
                        Kas Diterima:
                      </span>
                      <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                        {formatRupiah(method.collectedAmount)}
                      </span>
                    </div>

                    <div>
                      {method.pendingTransactionsCount > 0 ? (
                        <Link
                          href="/dashboard/verification"
                          className="font-medium text-amber-600 hover:underline flex items-center gap-1 text-[11px]"
                        >
                          <ClockIcon className="size-3" />
                          {method.pendingTransactionsCount} Menunggu
                        </Link>
                      ) : (
                        <span className="text-[11px] text-muted-foreground">
                          {method.approvedTransactionsCount} Transaksi
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

      {/* Modal Dialog Edit Method */}
      <EditMethodDialog
        method={editingMethod}
        open={isEditDialogOpen}
        onOpenChange={(open) => {
          setIsEditDialogOpen(open);
          if (!open) setEditingMethod(null);
        }}
      />

      {/* Modal Dialog Preview QRIS Barcode */}
      {previewQris && (
        <Dialog open={!!previewQris} onOpenChange={(open) => !open && setPreviewQris(null)}>
          <DialogContent className="max-w-sm rounded-xl p-5 text-center">
            <DialogHeader>
              <DialogTitle className="text-base font-semibold">
                {previewQris.name}
              </DialogTitle>
              <DialogDescription className="text-xs">
                Scan QRIS berikut menggunakan mobile banking atau aplikasi e-wallet.
              </DialogDescription>
            </DialogHeader>

            <div className="flex flex-col items-center justify-center gap-3 py-3">
              <div className="relative aspect-square w-64 overflow-hidden rounded-xl border-2 border-border bg-white p-3 shadow-md flex items-center justify-center">
                {previewQris.qrisImageUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={previewQris.qrisImageUrl}
                    alt={`Barcode QRIS ${previewQris.name}`}
                    className="size-full object-contain"
                  />
                ) : (
                  <div className="flex flex-col items-center gap-2 text-muted-foreground">
                    <QrCodeIcon className="size-16" />
                    <span className="text-xs">Gambar QRIS belum diunggah</span>
                  </div>
                )}
              </div>

              <div className="rounded-lg bg-muted/30 p-2.5 text-xs w-full text-left space-y-1">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">NMID / Akun:</span>
                  <span className="font-mono font-medium">{previewQris.accountNumber}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Atas Nama:</span>
                  <span className="font-semibold">{previewQris.accountHolder}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">PIC:</span>
                  <span>{previewQris.picName}</span>
                </div>
              </div>
            </div>

            <DialogFooter className="gap-2 sm:justify-between">
              <Button
                variant="outline"
                size="sm"
                className="text-xs rounded-lg cursor-pointer"
                onClick={() => setPreviewQris(null)}
              >
                Tutup
              </Button>
              {previewQris.qrisImageUrl && (
                <Button
                  size="sm"
                  className="text-xs rounded-lg cursor-pointer"
                  onClick={() => {
                    window.open(previewQris.qrisImageUrl!, "_blank");
                  }}
                >
                  <EyeIcon className="mr-1.5 size-3.5" />
                  Buka Ukuran Penuh
                </Button>
              )}
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
