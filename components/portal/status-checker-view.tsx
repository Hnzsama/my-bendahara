"use client";

import * as React from "react";
import Image from "next/image";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { formatRupiah, formatDateTime } from "@/lib/utils";
import { checkTransactionStatusAction } from "@/actions/student-portal";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

import {
  MagnifyingGlassIcon,
  CheckCircleIcon,
  ClockIcon,
  XCircleIcon,
  ReceiptIcon,
  CopyIcon,
  PrinterIcon,
  ArrowSquareOutIcon,
  CreditCardIcon,
  BankIcon,
  UserIcon,
  GraduationCapIcon,
  EyeIcon,
  ArrowRightIcon,
  ShieldCheckIcon,
} from "@phosphor-icons/react";

interface StatusTransactionItem {
  id: string;
  referenceCode: string;
  amountPaid: number;
  proofImageUrl: string;
  studentNotes: string | null;
  status: "PENDING" | "APPROVED" | "REJECTED";
  rejectionReason: string | null;
  createdAt: string;
  verifiedAt: string | null;
  verifierName: string | null;
  student: {
    id: string;
    nim: string | null;
    name: string;
    className: string;
  };
  bill: {
    id: string;
    title: string;
    amount: number;
  };
  paymentMethod: {
    id: string;
    name: string;
    bankName: string;
    accountNumber: string;
    accountHolder: string;
    picName: string;
  };
}

export function StatusCheckerView() {
  const searchParams = useSearchParams();
  const initialQuery =
    searchParams.get("ref") ||
    searchParams.get("code") ||
    searchParams.get("nim") ||
    "";

  const [searchQuery, setSearchQuery] = React.useState(initialQuery);
  const [isLoading, setIsLoading] = React.useState(false);
  const [results, setResults] = React.useState<StatusTransactionItem[] | null>(null);
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null);

  // Modal receipt & proof preview
  const [previewProof, setPreviewProof] = React.useState<string | null>(null);
  const [printingReceipt, setPrintingReceipt] = React.useState<StatusTransactionItem | null>(null);

  // Auto-search if query param exists
  React.useEffect(() => {
    if (initialQuery.trim()) {
      handleSearch(initialQuery.trim());
    }
  }, [initialQuery]);

  const handleSearch = async (queryToSearch: string) => {
    const q = queryToSearch.trim();
    if (!q) {
      toast.error("Masukkan Kode Referensi Transaksi atau NIM");
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);

    try {
      const res = await checkTransactionStatusAction(q);
      if (res.success && res.data) {
        setResults(res.data);
      } else {
        setResults([]);
        setErrorMessage(res.error || "Transaksi tidak ditemukan.");
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Terjadi kesalahan saat mencari status";
      setErrorMessage(msg);
      toast.error(msg);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopy = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`${label} (${text}) disalin ke clipboard!`);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 sm:py-12 space-y-8">
      {/* Header Banner */}
      <div className="text-center max-w-xl mx-auto">
        <Badge variant="outline" className="mb-2 px-3 py-1 text-xs bg-primary/10 text-primary border-primary/20 inline-flex items-center gap-1.5">
          <MagnifyingGlassIcon className="size-3.5 shrink-0" />
          <span>Pelacakan Status — Manajemen Informatika 2025</span>
        </Badge>
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
          Cek Status Pembayaran & Transaksi
        </h1>
        <p className="text-sm text-muted-foreground mt-2">
          Lacak status verifikasi pembayaran Anda menggunakan <strong>Kode Referensi (KAS-...)</strong> atau <strong>NIM Mahasiswa</strong>.
        </p>
      </div>

      {/* Search Input Box */}
      <Card className="p-4 sm:p-5 border rounded-2xl bg-card/70 backdrop-blur-xs shadow-sm max-w-2xl mx-auto">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSearch(searchQuery);
          }}
          className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2"
        >
          <div className="relative flex-1">
            <MagnifyingGlassIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
            <Input
              placeholder="Contoh: KAS-20261013-ABCD atau NIM 230101001"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 h-11 text-sm rounded-xl font-mono"
            />
          </div>

          <Button
            type="submit"
            disabled={isLoading || !searchQuery.trim()}
            className="h-11 px-6 rounded-xl font-semibold cursor-pointer gap-2 shrink-0 shadow-xs"
          >
            {isLoading ? (
              <>
                <div className="size-4 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin" />
                <span>Mencari...</span>
              </>
            ) : (
              <>
                <span>Cari Status</span>
                <ArrowRightIcon className="size-4" />
              </>
            )}
          </Button>
        </form>

        <div className="flex items-center justify-center gap-4 mt-3 text-[11px] text-muted-foreground">
          <span>Tip: Format kode diawali <code>KAS-YYYYMMDD-...</code></span>
        </div>
      </Card>

      {/* Results Area */}
      {errorMessage && (
        <div className="p-6 rounded-2xl border border-destructive/20 bg-destructive/5 text-center max-w-2xl mx-auto space-y-2">
          <XCircleIcon className="size-8 text-destructive mx-auto" />
          <p className="text-sm font-semibold text-destructive">{errorMessage}</p>
          <p className="text-xs text-muted-foreground">
            Pastikan kode referensi atau NIM yang Anda masukkan sudah sesuai.
          </p>
          <div className="pt-2">
            <Link href="/bayar">
              <Button variant="outline" size="sm" className="text-xs rounded-xl cursor-pointer">
                Belum Bayar? Masuk ke Portal Bayar
              </Button>
            </Link>
          </div>
        </div>
      )}

      {results && results.length > 0 && (
        <div className="space-y-4 max-w-2xl mx-auto">
          <div className="flex items-center justify-between text-xs text-muted-foreground px-1">
            <span>Ditemukan <strong>{results.length}</strong> riwayat pembayaran</span>
          </div>

          {results.map((tx) => {
            const isApproved = tx.status === "APPROVED";
            const isPending = tx.status === "PENDING";
            const isRejected = tx.status === "REJECTED";

            return (
              <Card
                key={tx.id}
                className={`p-5 sm:p-6 border rounded-2xl transition-all shadow-xs ${
                  isApproved
                    ? "border-emerald-500/30 bg-card hover:border-emerald-500/50"
                    : isPending
                    ? "border-amber-500/30 bg-card hover:border-amber-500/50"
                    : "border-destructive/30 bg-card hover:border-destructive/50"
                }`}
              >
                {/* Header Status & Code */}
                <div className="flex items-start justify-between gap-3 border-b pb-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-base text-foreground tracking-tight select-all">
                        {tx.referenceCode}
                      </span>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="size-6 cursor-pointer text-muted-foreground hover:text-foreground"
                        onClick={() => handleCopy(tx.referenceCode, "Kode Referensi")}
                        title="Salin kode"
                      >
                        <CopyIcon className="size-3" />
                      </Button>
                    </div>
                    <span className="text-xs text-muted-foreground block mt-0.5">
                      Diajukan pada: {formatDateTime(tx.createdAt)}
                    </span>
                  </div>

                  {/* Status Badge */}
                  <div>
                    {isApproved && (
                      <Badge className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30 gap-1.5 py-1 px-3 text-xs">
                        <CheckCircleIcon className="size-3.5" />
                        LUNAS & TERVERIFIKASI
                      </Badge>
                    )}
                    {isPending && (
                      <Badge className="bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30 gap-1.5 py-1 px-3 text-xs">
                        <ClockIcon className="size-3.5" />
                        MENUNGGU VERIFIKASI
                      </Badge>
                    )}
                    {isRejected && (
                      <Badge className="bg-destructive/10 text-destructive border-destructive/30 gap-1.5 py-1 px-3 text-xs">
                        <XCircleIcon className="size-3.5" />
                        PEMBAYARAN DITOLAK
                      </Badge>
                    )}
                  </div>
                </div>

                {/* Rejection Message if Rejected */}
                {isRejected && (
                  <div className="my-4 p-3 rounded-xl bg-destructive/10 border border-destructive/20 text-xs">
                    <span className="font-semibold text-destructive block">
                      Alasan Penolakan dari Bendahara:
                    </span>
                    <p className="text-foreground mt-0.5">
                      {tx.rejectionReason || "Bukti transfer tidak valid atau nominal tidak sesuai."}
                    </p>
                    <div className="mt-2 pt-2 border-t border-destructive/20 flex justify-end">
                      <Link href="/bayar">
                        <Button size="sm" variant="destructive" className="text-xs h-8 rounded-lg cursor-pointer">
                          Ajukan Ulang Pembayaran
                        </Button>
                      </Link>
                    </div>
                  </div>
                )}

                {/* Details Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 py-4 text-xs">
                  <div className="space-y-1">
                    <span className="text-muted-foreground block">Mahasiswa & Kelas</span>
                    <span className="font-semibold text-foreground block">
                      {tx.student.name} ({tx.student.className})
                    </span>
                    {tx.student.nim && (
                      <span className="font-mono text-muted-foreground block text-[11px]">
                        NIM: {tx.student.nim}
                      </span>
                    )}
                  </div>

                  <div className="space-y-1">
                    <span className="text-muted-foreground block">Tagihan / Kewajiban</span>
                    <span className="font-semibold text-foreground block">
                      {tx.bill.title}
                    </span>
                    <span className="font-bold text-sm text-emerald-600 dark:text-emerald-400 block font-mono">
                      {formatRupiah(tx.amountPaid)}
                    </span>
                  </div>

                  <div className="space-y-1">
                    <span className="text-muted-foreground block">Metode Pembayaran</span>
                    <span className="font-medium text-foreground block">
                      {tx.paymentMethod.name} ({tx.paymentMethod.bankName})
                    </span>
                    <span className="text-muted-foreground block text-[11px]">
                      Rekening: {tx.paymentMethod.accountNumber} a.n. {tx.paymentMethod.accountHolder}
                    </span>
                  </div>

                  <div className="space-y-1">
                    <span className="text-muted-foreground block">Verifikator Bendahara</span>
                    {tx.verifiedAt ? (
                      <div>
                        <span className="font-medium text-foreground block">
                          {tx.verifierName || "Bendahara Angkatan"}
                        </span>
                        <span className="text-muted-foreground text-[11px] block">
                          Disetujui: {formatDateTime(tx.verifiedAt)}
                        </span>
                      </div>
                    ) : (
                      <span className="italic text-muted-foreground">
                        Belum diverifikasi bendahara
                      </span>
                    )}
                  </div>
                </div>

                {/* Proof & Action Footer */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-4 border-t">
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPreviewProof(tx.proofImageUrl)}
                      className="text-xs h-8 rounded-lg cursor-pointer gap-1.5"
                    >
                      <EyeIcon className="size-3.5" />
                      <span>Lihat Struk Transfer</span>
                    </Button>

                    {tx.studentNotes && (
                      <span className="text-xs text-muted-foreground italic truncate max-w-xs" title={tx.studentNotes}>
                        Catatan: "{tx.studentNotes}"
                      </span>
                    )}
                  </div>

                  {isApproved && (
                    <Button
                      size="sm"
                      onClick={() => setPrintingReceipt(tx)}
                      className="text-xs h-8 rounded-lg cursor-pointer gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-medium shadow-xs"
                    >
                      <ReceiptIcon className="size-3.5" />
                      <span>Struk Digital</span>
                    </Button>
                  )}
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* Proof Preview Modal */}
      <Dialog open={!!previewProof} onOpenChange={(open) => !open && setPreviewProof(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-sm font-semibold">Bukti Pembayaran Mahasiswa</DialogTitle>
          </DialogHeader>
          {previewProof && (
            <div className="relative w-full h-80 rounded-xl overflow-hidden border bg-black/5">
              <Image
                src={previewProof}
                alt="Bukti Struk Pembayaran"
                fill
                className="object-contain"
                unoptimized
              />
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Digital Receipt Modal (Printable) */}
      <Dialog open={!!printingReceipt} onOpenChange={(open) => !open && setPrintingReceipt(null)}>
        <DialogContent className="sm:max-w-md print:m-0 print:p-0">
          <DialogHeader>
            <DialogTitle className="text-base font-bold flex items-center gap-2">
              <ReceiptIcon className="size-5 text-emerald-600" />
              <span>Tanda Terima Pembayaran Kas Digital</span>
            </DialogTitle>
            <DialogDescription className="text-xs">
              Kuitansi sah tanda lunas iuran kas mahasiswa angkatan.
            </DialogDescription>
          </DialogHeader>

          {printingReceipt && (
            <div className="space-y-4 py-3 border-y border-dashed">
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">KODE TRANSAKSI</span>
                <span className="font-mono font-bold text-foreground">
                  {printingReceipt.referenceCode}
                </span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">TANGGAL VERIFIKASI</span>
                <span className="font-semibold text-foreground">
                  {formatDateTime(printingReceipt.verifiedAt)}
                </span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">NAMA MAHASISWA</span>
                <span className="font-semibold text-foreground">
                  {printingReceipt.student.name}
                </span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">{printingReceipt.student.nim ? "NIM / KELAS" : "KELAS"}</span>
                <span className="font-mono text-foreground">
                  {printingReceipt.student.nim ? `${printingReceipt.student.nim} • ` : ""}{printingReceipt.student.className}
                </span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">PERUNTUKAN TAGIHAN</span>
                <span className="font-semibold text-foreground">
                  {printingReceipt.bill.title}
                </span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">METODE PEMBAYARAN</span>
                <span className="font-semibold text-foreground">
                  {printingReceipt.paymentMethod.name}
                </span>
              </div>

              <div className="pt-2 border-t flex items-center justify-between">
                <span className="font-bold text-sm">TOTAL DITERIMA</span>
                <span className="font-bold text-lg text-emerald-600 font-mono">
                  {formatRupiah(printingReceipt.amountPaid)}
                </span>
              </div>

              {/* Status Stamp */}
              <div className="p-2.5 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-center text-xs text-emerald-700 dark:text-emerald-300 font-semibold flex items-center justify-center gap-1.5">
                <ShieldCheckIcon className="size-4" />
                <span>SAH • DIVERIFIKASI OLEH {printingReceipt.verifierName || "BENDAHARA"}</span>
              </div>
            </div>
          )}

          <div className="flex items-center justify-between gap-2 pt-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPrintingReceipt(null)}
              className="w-full text-xs h-9 rounded-xl cursor-pointer"
            >
              Tutup
            </Button>
            <Button
              size="sm"
              onClick={handlePrint}
              className="w-full text-xs h-9 rounded-xl cursor-pointer gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white"
            >
              <PrinterIcon className="size-3.5" />
              <span>Cetak / PDF</span>
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
