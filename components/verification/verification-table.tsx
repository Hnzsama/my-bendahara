"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { formatRupiah, formatDateTime } from "@/lib/utils";
import {
  approveTransactionAction,
  rejectTransactionAction,
  retrySheetSyncAction,
} from "@/actions/transactions";
import type { VerificationData } from "@/lib/verification-data";
import type { TransactionItem } from "@/components/data-table";

import { useIsMobile } from "@/hooks/use-mobile";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
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
import {
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon,
  EyeIcon,
  MagnifyingGlassIcon,
  ArrowsClockwiseIcon,
  CreditCardIcon,
  UserIcon,
  ReceiptIcon,
  DotsThreeVerticalIcon,
  CaretLeftIcon,
  CaretRightIcon,
  CaretDoubleLeftIcon,
  CaretDoubleRightIcon,
  CopyIcon,
  WarningCircleIcon,
} from "@phosphor-icons/react";

interface VerificationTableProps {
  data: VerificationData;
}

export function VerificationTable({ data: initialData }: VerificationTableProps) {
  const router = useRouter();
  const isMobile = useIsMobile();
  const { stats, transactions: initialTransactions, paymentMethods, classes } = initialData;

  const [transactions, setTransactions] = React.useState<TransactionItem[]>(initialTransactions);
  const [activeTab, setActiveTab] = React.useState("pending");
  const [searchQuery, setSearchQuery] = React.useState("");
  const [selectedMethod, setSelectedMethod] = React.useState("ALL");
  const [selectedClass, setSelectedClass] = React.useState("ALL");

  // Pagination state
  const [pageIndex, setPageIndex] = React.useState(0);
  const [pageSize, setPageSize] = React.useState(10);

  // Drawer & Modal State
  const [viewingItem, setViewingItem] = React.useState<TransactionItem | null>(null);
  const [rejectingItem, setRejectingItem] = React.useState<TransactionItem | null>(null);
  const [rejectionReason, setRejectionReason] = React.useState("");
  const [isSubmittingReject, setIsSubmittingReject] = React.useState(false);

  // Loading state per item ID
  const [processingId, setProcessingId] = React.useState<string | null>(null);

  React.useEffect(() => {
    setTransactions(initialTransactions);
  }, [initialTransactions]);

  // Tab counts
  const pendingCount = React.useMemo(
    () => transactions.filter((t) => t.status === "PENDING").length,
    [transactions]
  );
  const approvedCount = React.useMemo(
    () => transactions.filter((t) => t.status === "APPROVED").length,
    [transactions]
  );
  const rejectedCount = React.useMemo(
    () => transactions.filter((t) => t.status === "REJECTED").length,
    [transactions]
  );

  // 1-Klik Approve Action
  const handleQuickApprove = async (item: TransactionItem) => {
    setProcessingId(item.id);

    // Optimistic UI update
    setTransactions((prev) =>
      prev.map((t) =>
        t.id === item.id
          ? { ...t, status: "APPROVED", sheetSyncStatus: "SYNCED" }
          : t
      )
    );

    // If currently viewed in drawer, update viewing item as well
    if (viewingItem?.id === item.id) {
      setViewingItem((prev) => (prev ? { ...prev, status: "APPROVED", sheetSyncStatus: "SYNCED" } : null));
    }

    try {
      const res = await approveTransactionAction(item.id);
      if (res.success) {
        toast.success(res.message || `Transaksi ${item.referenceCode} berhasil disetujui!`);
        router.refresh();
      } else {
        toast.error(res.error || "Gagal menyetujui transaksi");
        setTransactions(initialTransactions);
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Terjadi kesalahan saat memproses approval";
      toast.error(message);
      setTransactions(initialTransactions);
    } finally {
      setProcessingId(null);
    }
  };

  // Reject Action
  const handleConfirmReject = async () => {
    if (!rejectingItem) return;
    if (!rejectionReason.trim()) {
      toast.error("Alasan penolakan wajib diisi");
      return;
    }

    setIsSubmittingReject(true);
    try {
      const res = await rejectTransactionAction(rejectingItem.id, rejectionReason.trim());
      if (res.success) {
        toast.success(`Transaksi ${rejectingItem.referenceCode} telah ditolak.`);
        setTransactions((prev) =>
          prev.map((t) =>
            t.id === rejectingItem.id
              ? { ...t, status: "REJECTED", rejectionReason: rejectionReason.trim() }
              : t
          )
        );
        if (viewingItem?.id === rejectingItem.id) {
          setViewingItem((prev) =>
            prev ? { ...prev, status: "REJECTED", rejectionReason: rejectionReason.trim() } : null
          );
        }
        setRejectingItem(null);
        setRejectionReason("");
        router.refresh();
      } else {
        toast.error(res.error || "Gagal menolak transaksi");
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Terjadi kesalahan saat memproses penolakan";
      toast.error(message);
    } finally {
      setIsSubmittingReject(false);
    }
  };

  // Retry Google Sheet Sync
  const handleRetrySync = async (item: TransactionItem) => {
    setProcessingId(item.id);
    try {
      const res = await retrySheetSyncAction(item.id);
      if (res.success) {
        toast.success(res.message || "Berhasil disinkronkan ke Google Sheets!");
        setTransactions((prev) =>
          prev.map((t) => (t.id === item.id ? { ...t, sheetSyncStatus: "SYNCED" } : t))
        );
        router.refresh();
      } else {
        toast.error(res.error || "Gagal menyinkronkan ulang");
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Terjadi kesalahan saat sync";
      toast.error(message);
    } finally {
      setProcessingId(null);
    }
  };

  // Filter Data
  const filteredData = React.useMemo(() => {
    return transactions.filter((t) => {
      // 1. Status tab
      if (activeTab === "pending" && t.status !== "PENDING") return false;
      if (activeTab === "approved" && t.status !== "APPROVED") return false;
      if (activeTab === "rejected" && t.status !== "REJECTED") return false;

      // 2. Filter rekening PIC
      if (selectedMethod !== "ALL") {
        const matchesMethod =
          t.paymentMethodName.toLowerCase().includes(selectedMethod.toLowerCase()) ||
          t.picName.toLowerCase().includes(selectedMethod.toLowerCase());
        if (!matchesMethod) return false;
      }

      // 3. Filter kelas
      if (selectedClass !== "ALL" && t.className !== selectedClass) return false;

      // 4. Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesQuery =
          t.referenceCode.toLowerCase().includes(q) ||
          t.studentName.toLowerCase().includes(q) ||
          (t.nim ? t.nim.toLowerCase().includes(q) : false);
        if (!matchesQuery) return false;
      }

      return true;
    });
  }, [transactions, activeTab, selectedMethod, selectedClass, searchQuery]);

  // Reset page index saat filter berubah
  React.useEffect(() => {
    setPageIndex(0);
  }, [activeTab, searchQuery, selectedMethod, selectedClass]);

  const totalPages = Math.ceil(filteredData.length / pageSize);
  const paginatedData = React.useMemo(() => {
    const start = pageIndex * pageSize;
    return filteredData.slice(start, start + pageSize);
  }, [filteredData, pageIndex, pageSize]);

  const isFiltered = searchQuery !== "" || selectedMethod !== "ALL" || selectedClass !== "ALL";

  return (
    <Tabs
      value={activeTab}
      onValueChange={setActiveTab}
      className="w-full flex-col justify-start gap-4"
    >
      {/* 1. HEADER TOOLBAR: TABS & FILTER INTEGRASI */}
      <div className="flex flex-col gap-3 px-4 lg:px-6">
        {/* Baris Atas: Tabs (Desktop TabsList, Mobile Select) */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <Label htmlFor="verification-tab-selector" className="sr-only">
            Filter Status Antrean
          </Label>

          {/* Mobile Select */}
          <Select
            value={activeTab}
            onValueChange={(val) => {
              if (val) setActiveTab(val);
            }}
            items={[
              { label: `Menunggu Verifikasi (${pendingCount})`, value: "pending" },
              { label: `Semua Transaksi (${transactions.length})`, value: "all" },
              { label: `Disetujui (${approvedCount})`, value: "approved" },
              { label: `Ditolak (${rejectedCount})`, value: "rejected" },
            ]}
          >
            <SelectTrigger
              className="flex w-fit @4xl/main:hidden"
              size="sm"
              id="verification-tab-selector"
            >
              <SelectValue placeholder="Pilih status" />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                <SelectItem value="pending">Menunggu Verifikasi ({pendingCount})</SelectItem>
                <SelectItem value="all">Semua Transaksi ({transactions.length})</SelectItem>
                <SelectItem value="approved">Disetujui ({approvedCount})</SelectItem>
                <SelectItem value="rejected">Ditolak ({rejectedCount})</SelectItem>
              </SelectGroup>
            </SelectContent>
          </Select>

          {/* Desktop TabsList (Identik dengan Dashboard DataTable) */}
          <TabsList className="hidden **:data-[slot=badge]:size-5 **:data-[slot=badge]:rounded-full **:data-[slot=badge]:bg-muted-foreground/30 **:data-[slot=badge]:px-1 @4xl/main:flex">
            <TabsTrigger value="pending">
              Menunggu Verifikasi <Badge variant="secondary">{pendingCount}</Badge>
            </TabsTrigger>
            <TabsTrigger value="all">
              Semua Transaksi <Badge variant="secondary">{transactions.length}</Badge>
            </TabsTrigger>
            <TabsTrigger value="approved">
              Disetujui <Badge variant="secondary">{approvedCount}</Badge>
            </TabsTrigger>
            <TabsTrigger value="rejected">
              Ditolak <Badge variant="secondary">{rejectedCount}</Badge>
            </TabsTrigger>
          </TabsList>

          {/* Status info di kanan atas */}
          <div className="text-xs text-muted-foreground">
            Menampilkan <span className="font-semibold text-foreground">{filteredData.length}</span> transaksi
          </div>
        </div>

        {/* Baris Bawah: Filter Search & Kategori (Sleek Inline Toolbar) */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Search Box */}
          <div className="relative flex-1 min-w-[200px] max-w-sm">
            <MagnifyingGlassIcon className="absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Cari NIM, nama mahasiswa, kode..."
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

          {/* Filter Rekening PIC Bendahara */}
          <Select
            value={selectedMethod}
            onValueChange={(val) => setSelectedMethod(val || "ALL")}
            items={[
              { label: "Semua Rekening & PIC", value: "ALL" },
              ...paymentMethods.map((pm) => ({
                label: `${pm.name} (${pm.picName})`,
                value: pm.name,
              })),
            ]}
          >
            <SelectTrigger size="sm" className="h-8 w-fit min-w-[170px] rounded-lg text-xs">
              <CreditCardIcon className="mr-1.5 size-3.5 text-muted-foreground" />
              <SelectValue placeholder="Semua Rekening & PIC" />
            </SelectTrigger>
            <SelectContent align="start" className="min-w-[280px]">
              <SelectGroup>
                <SelectItem value="ALL">Semua Rekening & PIC</SelectItem>
                {paymentMethods.map((pm) => (
                  <SelectItem key={pm.id} value={pm.name}>
                    {pm.name} ({pm.picName})
                  </SelectItem>
                ))}
              </SelectGroup>
            </SelectContent>
          </Select>

          {/* Filter Kelas */}
          <Select
            value={selectedClass}
            onValueChange={(val) => setSelectedClass(val || "ALL")}
            items={[
              { label: "Semua Kelas", value: "ALL" },
              ...classes.map((c) => ({
                label: `Kelas ${c.name}`,
                value: c.name,
              })),
            ]}
          >
            <SelectTrigger size="sm" className="h-8 w-fit min-w-[130px] rounded-lg text-xs">
              <UserIcon className="mr-1.5 size-3.5 text-muted-foreground" />
              <SelectValue placeholder="Semua Kelas" />
            </SelectTrigger>
            <SelectContent align="start">
              <SelectGroup>
                <SelectItem value="ALL">Semua Kelas</SelectItem>
                {classes.map((c) => (
                  <SelectItem key={c.id} value={c.name}>
                    Kelas {c.name}
                  </SelectItem>
                ))}
              </SelectGroup>
            </SelectContent>
          </Select>

          {/* Tombol Reset jika filter aktif */}
          {isFiltered && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setSearchQuery("");
                setSelectedMethod("ALL");
                setSelectedClass("ALL");
              }}
              className="h-8 px-2 text-xs text-muted-foreground hover:text-foreground gap-1 cursor-pointer"
            >
              <XCircleIcon className="size-3.5" />
              Reset Filter
            </Button>
          )}
        </div>
      </div>

      {/* 2. TABEL TRANSAKSI (AESTHETIC DASHBOARD STYLE) */}
      <TabsContent
        value={activeTab}
        className="relative flex flex-col gap-4 overflow-auto px-4 lg:px-6 mt-0"
      >
        <div className="overflow-hidden rounded-lg border bg-card">
          <Table>
            <TableHeader className="sticky top-0 z-10 bg-muted">
              <TableRow>
                <TableHead className="w-36 text-xs">Kode Transaksi</TableHead>
                <TableHead className="text-xs">Mahasiswa</TableHead>
                <TableHead className="w-24 text-xs">Kelas</TableHead>
                <TableHead className="text-xs">Tagihan</TableHead>
                <TableHead className="text-right text-xs">Nominal</TableHead>
                <TableHead className="text-xs">Metode / PIC</TableHead>
                <TableHead className="w-20 text-center text-xs">Bukti</TableHead>
                <TableHead className="w-28 text-xs">Status</TableHead>
                <TableHead className="text-right text-xs">Aksi Cepat</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedData.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={9}
                    className="h-32 text-center text-muted-foreground text-xs"
                  >
                    Tidak ada transaksi pada kategori ini.
                  </TableCell>
                </TableRow>
              ) : (
                paginatedData.map((item) => {
                  const isProcessing = processingId === item.id;

                  return (
                    <TableRow key={item.id} className="hover:bg-muted/50 transition-colors">
                      {/* Kode Transaksi (Clickable Link to Drawer) */}
                      <TableCell className="font-mono text-xs">
                        <Button
                          variant="link"
                          onClick={() => setViewingItem(item)}
                          className="h-auto p-0 font-mono text-xs font-semibold text-foreground hover:underline"
                        >
                          {item.referenceCode}
                        </Button>
                        <div className="text-[10px] text-muted-foreground font-sans">
                          {formatDateTime(item.createdAt)}
                        </div>
                      </TableCell>

                      {/* Mahasiswa */}
                      <TableCell>
                        <div className="flex flex-col">
                          <span className="font-medium text-xs text-foreground">
                            {item.studentName}
                          </span>
                          {item.nim && (
                            <span className="text-[11px] text-muted-foreground">
                              {item.nim}
                            </span>
                          )}
                        </div>
                      </TableCell>

                      {/* Kelas */}
                      <TableCell>
                        <Badge variant="outline" className="px-1.5 font-mono text-xs">
                          {item.className}
                        </Badge>
                      </TableCell>

                      {/* Tagihan */}
                      <TableCell className="text-xs">
                        <div className="max-w-[180px] truncate font-medium text-foreground">
                          {item.billTitle}
                        </div>
                        {item.studentNotes && (
                          <div className="max-w-[180px] truncate text-[10px] text-muted-foreground italic">
                            &ldquo;{item.studentNotes}&rdquo;
                          </div>
                        )}
                      </TableCell>

                      {/* Nominal */}
                      <TableCell className="text-right">
                        <span className="font-semibold tabular-nums text-xs text-foreground">
                          {formatRupiah(item.amountPaid)}
                        </span>
                      </TableCell>

                      {/* Metode / PIC */}
                      <TableCell className="text-xs">
                        <div className="flex flex-col">
                          <span className="font-medium text-foreground">
                            {item.paymentMethodName}
                          </span>
                          <span className="text-[10px] text-muted-foreground truncate">
                            PIC: {item.picName}
                          </span>
                        </div>
                      </TableCell>

                      {/* Bukti Bayar */}
                      <TableCell className="text-center">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setViewingItem(item)}
                          className="h-7 px-2 text-xs gap-1 text-muted-foreground hover:text-foreground cursor-pointer"
                        >
                          <ReceiptIcon className="size-3.5" />
                          <span>Struk</span>
                        </Button>
                      </TableCell>

                      {/* Status */}
                      <TableCell>
                        <div className="flex flex-col gap-1 items-start">
                          {item.status === "APPROVED" && (
                            <Badge
                              variant="outline"
                              className="border-emerald-500/30 text-emerald-600 dark:text-emerald-400 gap-1 font-medium text-[11px]"
                            >
                              <CheckCircleIcon className="size-3.5 fill-emerald-500" />
                              Disetujui
                            </Badge>
                          )}
                          {item.status === "PENDING" && (
                            <Badge
                              variant="outline"
                              className="border-amber-500/30 text-amber-600 dark:text-amber-400 gap-1 font-medium text-[11px]"
                            >
                              <ClockIcon className="size-3.5 text-amber-500" />
                              Pending
                            </Badge>
                          )}
                          {item.status === "REJECTED" && (
                            <Badge
                              variant="outline"
                              className="border-rose-500/30 text-rose-600 dark:text-rose-400 gap-1 font-medium text-[11px]"
                            >
                              <XCircleIcon className="size-3.5 fill-rose-500" />
                              Ditolak
                            </Badge>
                          )}

                          {/* Spreadsheet Sync Indicator */}
                          {item.status === "APPROVED" && item.sheetSyncStatus === "SYNCED" && (
                            <span className="text-[10px] text-emerald-600 font-medium inline-flex items-center gap-1">
                              <CheckCircleIcon className="size-3 shrink-0" />
                              <span>Sheets Synced</span>
                            </span>
                          )}
                          {item.status === "APPROVED" && item.sheetSyncStatus === "FAILED" && (
                            <span className="text-[10px] text-rose-600 font-medium inline-flex items-center gap-1">
                              <WarningCircleIcon className="size-3 shrink-0" />
                              <span>Sheets Gagal</span>
                            </span>
                          )}
                        </div>
                      </TableCell>

                      {/* Aksi Cepat (Refined & Compact) */}
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {item.status === "PENDING" ? (
                            <>
                              {/* Compact Approve Button */}
                              <Button
                                size="sm"
                                disabled={isProcessing}
                                onClick={() => handleQuickApprove(item)}
                                className="h-7 px-2.5 text-xs bg-emerald-600 hover:bg-emerald-700 text-white font-medium rounded-md gap-1 shadow-xs cursor-pointer"
                              >
                                <CheckCircleIcon className="size-3.5" />
                                <span>{isProcessing ? "..." : "Approve"}</span>
                              </Button>

                              {/* Compact Tolak Button */}
                              <Button
                                size="sm"
                                variant="outline"
                                disabled={isProcessing}
                                onClick={() => {
                                  setRejectingItem(item);
                                  setRejectionReason("Mutasi rekening belum masuk");
                                }}
                                className="h-7 px-2 text-xs text-rose-600 hover:text-rose-700 hover:bg-rose-500/10 border-rose-500/30 rounded-md cursor-pointer"
                              >
                                <XCircleIcon className="size-3.5" />
                                <span>Tolak</span>
                              </Button>

                              {/* More Dropdown */}
                              <DropdownMenu>
                                <DropdownMenuTrigger
                                  render={
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      className="size-7 text-muted-foreground hover:bg-muted"
                                    />
                                  }
                                >
                                  <DotsThreeVerticalIcon className="size-4" />
                                  <span className="sr-only">Menu</span>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" className="w-40 text-xs">
                                  <DropdownMenuItem onClick={() => setViewingItem(item)}>
                                    <EyeIcon className="mr-2 size-3.5" />
                                    Lihat Detail Struk
                                  </DropdownMenuItem>
                                  <DropdownMenuItem
                                    onClick={() => {
                                      navigator.clipboard.writeText(item.referenceCode);
                                      toast.success("Kode transaksi disalin!");
                                    }}
                                  >
                                    <CopyIcon className="mr-2 size-3.5" />
                                    Salin Kode
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </>
                          ) : item.status === "APPROVED" && item.sheetSyncStatus === "FAILED" ? (
                            <Button
                              size="sm"
                              variant="outline"
                              disabled={isProcessing}
                              onClick={() => handleRetrySync(item)}
                              className="h-7 px-2 text-xs text-amber-600 border-amber-500/30 hover:bg-amber-500/10 rounded-md gap-1 cursor-pointer"
                            >
                              <ArrowsClockwiseIcon
                                className={`size-3.5 ${isProcessing ? "animate-spin" : ""}`}
                              />
                              <span>Retry Sync</span>
                            </Button>
                          ) : (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setViewingItem(item)}
                              className="h-7 px-2 text-xs text-muted-foreground hover:text-foreground cursor-pointer"
                            >
                              Detail
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>

        {/* 3. PAGINATION FOOTER (IDENTIK DENGAN DASHBOARD DATA-TABLE) */}
        <div className="flex items-center justify-between px-4 py-2">
          <div className="hidden flex-1 text-sm text-muted-foreground lg:flex">
            Menampilkan {paginatedData.length} dari {filteredData.length} transaksi.
          </div>
          <div className="flex w-full items-center gap-6 lg:w-fit">
            <div className="hidden items-center gap-2 lg:flex">
              <Label htmlFor="verification-rows-per-page" className="text-sm font-medium">
                Baris per halaman
              </Label>
              <Select
                value={`${pageSize}`}
                onValueChange={(value) => {
                  if (value) {
                    const newSize = Number(value);
                    setPageSize(newSize);
                    setPageIndex(0);
                  }
                }}
                items={[10, 20, 30, 50].map((s) => ({
                  label: `${s}`,
                  value: `${s}`,
                }))}
              >
                <SelectTrigger size="sm" className="w-20" id="verification-rows-per-page">
                  <SelectValue placeholder={pageSize} />
                </SelectTrigger>
                <SelectContent side="top">
                  <SelectGroup>
                    {[10, 20, 30, 50].map((s) => (
                      <SelectItem key={s} value={`${s}`}>
                        {s}
                      </SelectItem>
                    ))}
                  </SelectGroup>
                </SelectContent>
              </Select>
            </div>
            <div className="flex w-fit items-center justify-center text-sm font-medium">
              Halaman {pageIndex + 1} dari {totalPages || 1}
            </div>
            <div className="ml-auto flex items-center gap-1 lg:ml-0">
              <Button
                variant="outline"
                className="hidden size-8 p-0 lg:flex"
                onClick={() => setPageIndex(0)}
                disabled={pageIndex === 0}
              >
                <span className="sr-only">Halaman pertama</span>
                <CaretDoubleLeftIcon className="size-4" />
              </Button>
              <Button
                variant="outline"
                className="size-8 p-0"
                onClick={() => setPageIndex((p) => Math.max(0, p - 1))}
                disabled={pageIndex === 0}
              >
                <span className="sr-only">Halaman sebelumnya</span>
                <CaretLeftIcon className="size-4" />
              </Button>
              <Button
                variant="outline"
                className="size-8 p-0"
                onClick={() => setPageIndex((p) => Math.min(totalPages - 1, p + 1))}
                disabled={pageIndex >= totalPages - 1}
              >
                <span className="sr-only">Halaman selanjutnya</span>
                <CaretRightIcon className="size-4" />
              </Button>
              <Button
                variant="outline"
                className="hidden size-8 p-0 lg:flex"
                onClick={() => setPageIndex(totalPages - 1)}
                disabled={pageIndex >= totalPages - 1}
              >
                <span className="sr-only">Halaman terakhir</span>
                <CaretDoubleRightIcon className="size-4" />
              </Button>
            </div>
          </div>
        </div>
      </TabsContent>

      {/* 4. DRAWER DETAIL & PREVIEW STRUK */}
      {viewingItem && (
        <Drawer
          open={!!viewingItem}
          onOpenChange={(open) => !open && setViewingItem(null)}
          swipeDirection={isMobile ? "down" : "right"}
        >
          <DrawerContent>
            <DrawerHeader className="gap-1 border-b pb-4">
              <div className="flex items-center gap-2">
                <DrawerTitle className="font-mono text-lg">{viewingItem.referenceCode}</DrawerTitle>
                <Badge
                  variant="outline"
                  className={
                    viewingItem.status === "APPROVED"
                      ? "border-emerald-500/30 text-emerald-600"
                      : viewingItem.status === "REJECTED"
                      ? "border-rose-500/30 text-rose-600"
                      : "border-amber-500/30 text-amber-600"
                  }
                >
                  {viewingItem.status}
                </Badge>
              </div>
              <DrawerDescription>
                Detail Bukti Transfer Keuangan Mahasiswa
              </DrawerDescription>
            </DrawerHeader>

            <div className="flex flex-col gap-5 overflow-y-auto p-4 text-sm max-h-[75vh]">
              {/* Ringkasan Mahasiswa */}
              <div className="grid grid-cols-2 gap-4 rounded-lg border bg-muted/30 p-3">
                <div>
                  <span className="text-xs text-muted-foreground">Mahasiswa:</span>
                  <p className="font-semibold">{viewingItem.studentName}</p>
                  <p className="text-xs text-muted-foreground">
                    {viewingItem.nim ? `${viewingItem.nim} • ` : ""}{viewingItem.className}
                  </p>
                </div>
                <div>
                  <span className="text-xs text-muted-foreground">Tagihan:</span>
                  <p className="font-semibold">{viewingItem.billTitle}</p>
                  <p className="text-base font-bold text-emerald-600 dark:text-emerald-400">
                    {formatRupiah(viewingItem.amountPaid)}
                  </p>
                </div>
              </div>

              {/* Rekening Tujuan PIC */}
              <div className="space-y-1 rounded-lg border p-3">
                <span className="text-xs text-muted-foreground">
                  Rekening Tujuan / PIC Bendahara:
                </span>
                <p className="font-medium">
                  {viewingItem.paymentMethodName} ({viewingItem.accountNumber})
                </p>
                <p className="text-xs text-muted-foreground">PIC: {viewingItem.picName}</p>
              </div>

              {/* Catatan / Alasan */}
              {viewingItem.studentNotes && (
                <div className="space-y-1">
                  <span className="text-xs text-muted-foreground">Catatan Mahasiswa:</span>
                  <p className="rounded-md bg-muted/40 p-2 text-xs italic">
                    &ldquo;{viewingItem.studentNotes}&rdquo;
                  </p>
                </div>
              )}

              {viewingItem.rejectionReason && (
                <div className="space-y-1 rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-destructive">
                  <span className="text-xs font-semibold">Alasan Penolakan:</span>
                  <p className="text-xs">{viewingItem.rejectionReason}</p>
                </div>
              )}

              {/* Foto Bukti Transfer Nyata */}
              <div className="space-y-2">
                <span className="text-xs font-semibold text-muted-foreground">
                  Bukti Struk Transfer:
                </span>
                <div className="relative aspect-3/4 max-h-[320px] w-full overflow-hidden rounded-lg border border-border bg-black/5 dark:bg-white/5 flex items-center justify-center">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={viewingItem.proofImageUrl}
                    alt={`Bukti transfer ${viewingItem.referenceCode}`}
                    className="h-full w-full object-contain"
                    onError={(e) => {
                      // Fallback icon jika gambar lokal belum ada
                      e.currentTarget.style.display = "none";
                    }}
                  />
                  <div className="flex flex-col items-center gap-2 p-4 text-center text-muted-foreground">
                    <ReceiptIcon className="size-10 text-primary/60" />
                    <span className="text-xs font-mono">{viewingItem.proofImageUrl}</span>
                    <span className="text-[10px]">
                      Diajukan pada {formatDateTime(viewingItem.createdAt)}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <DrawerFooter className="border-t pt-4 gap-2">
              {viewingItem.status === "PENDING" ? (
                <div className="flex w-full gap-2">
                  <Button
                    variant="outline"
                    className="flex-1 text-rose-600 border-rose-500/30 hover:bg-rose-500/10 cursor-pointer"
                    onClick={() => {
                      const item = viewingItem;
                      setViewingItem(null);
                      setRejectingItem(item);
                      setRejectionReason("Mutasi rekening belum masuk");
                    }}
                  >
                    Tolak Transaksi
                  </Button>
                  <Button
                    className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white cursor-pointer"
                    disabled={processingId === viewingItem.id}
                    onClick={() => {
                      const item = viewingItem;
                      handleQuickApprove(item);
                    }}
                  >
                    {processingId === viewingItem.id ? "Menyimpan..." : "Approve 1-Klik"}
                  </Button>
                </div>
              ) : (
                <DrawerClose
                  render={
                    <Button variant="outline" className="w-full">
                      Tutup Detail
                    </Button>
                  }
                />
              )}
            </DrawerFooter>
          </DrawerContent>
        </Drawer>
      )}

      {/* 5. MODAL ALASAN PENOLAKAN TRANSAKSI */}
      {rejectingItem && (
        <Dialog open={!!rejectingItem} onOpenChange={(open) => !open && setRejectingItem(null)}>
          <DialogContent className="max-w-md rounded-xl p-5">
            <DialogHeader>
              <DialogTitle className="text-sm font-semibold text-rose-600 flex items-center gap-1.5">
                <XCircleIcon className="size-4" />
                <span>Tolak Transaksi {rejectingItem.referenceCode}</span>
              </DialogTitle>
              <DialogDescription className="text-xs">
                Sertakan alasan penolakan agar mahasiswa dapat memperbaiki pembayaran.
              </DialogDescription>
            </DialogHeader>

            <div className="flex flex-col gap-3 py-2">
              <div className="flex flex-wrap gap-1.5">
                {[
                  "Mutasi rekening belum masuk",
                  "Nominal transfer tidak sesuai",
                  "Bukti transfer tidak jelas/terbaca",
                  "Rekening tujuan salah",
                ].map((preset) => (
                  <Button
                    key={preset}
                    type="button"
                    size="sm"
                    variant="outline"
                    className="text-[11px] h-7 rounded-md cursor-pointer"
                    onClick={() => setRejectionReason(preset)}
                  >
                    {preset}
                  </Button>
                ))}
              </div>

              <Textarea
                placeholder="Tuliskan catatan alasan penolakan..."
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                className="text-xs min-h-[80px] rounded-lg"
              />
            </div>

            <DialogFooter className="gap-2 sm:justify-end">
              <Button
                variant="outline"
                size="sm"
                className="text-xs rounded-lg cursor-pointer"
                onClick={() => setRejectingItem(null)}
                disabled={isSubmittingReject}
              >
                Batal
              </Button>
              <Button
                size="sm"
                variant="destructive"
                className="text-xs rounded-lg cursor-pointer"
                onClick={handleConfirmReject}
                disabled={isSubmittingReject}
              >
                {isSubmittingReject ? "Menyimpan..." : "Konfirmasi Tolak"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </Tabs>
  );
}
