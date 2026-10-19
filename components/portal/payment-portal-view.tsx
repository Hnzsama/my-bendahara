"use client";

import * as React from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { formatRupiah, formatDateTime } from "@/lib/utils";
import type {
  PaymentPortalData,
  PortalClassOption,
  PortalBillOption,
  PortalPaymentMethodOption,
  PortalStudentTransaction,
} from "@/lib/portal-data";
import {
  submitStudentPaymentAction,
  getStudentBillStatusAction,
} from "@/actions/student-portal";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
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
  BankIcon,
  CreditCardIcon,
  QrCodeIcon,
  DeviceMobileIcon,
  CheckCircleIcon,
  CheckIcon,
  UploadSimpleIcon,
  CopyIcon,
  ArrowRightIcon,
  WarningCircleIcon,
  ReceiptIcon,
  ClockIcon,
  ShieldCheckIcon,
  InfoIcon,
  SparkleIcon,
  LightbulbIcon,
  LockKeyIcon,
  MagnifyingGlassPlusIcon,
  DownloadSimpleIcon,
  TableIcon,
  ArrowSquareOutIcon,
  WhatsappLogoIcon,
} from "@phosphor-icons/react";

interface PaymentPortalViewProps {
  data: PaymentPortalData;
  preselectedBillSlug?: string;
}

export function PaymentPortalView({ data, preselectedBillSlug }: PaymentPortalViewProps) {
  const router = useRouter();
  const { classes, bills, methods } = data;

  // Cari tagihan yang cocok dengan slug jika dibuka dari tautan grup
  const matchedInitialBill = React.useMemo(() => {
    if (!preselectedBillSlug) return bills.length > 0 ? bills[0] : null;
    return (
      bills.find(
        (b) =>
          (b.slug && b.slug.toLowerCase() === preselectedBillSlug.toLowerCase()) ||
          b.id === preselectedBillSlug
      ) || (bills.length > 0 ? bills[0] : null)
    );
  }, [bills, preselectedBillSlug]);

  // Form states
  const [selectedClassId, setSelectedClassId] = React.useState<string>(
    classes.length > 0 ? classes[0].id : ""
  );
  const [selectedStudentId, setSelectedStudentId] = React.useState<string>("");
  const [selectedBillId, setSelectedBillId] = React.useState<string>(
    matchedInitialBill?.id || (bills.length > 0 ? bills[0].id : "")
  );
  const [selectedMethodId, setSelectedMethodId] = React.useState<string>(
    methods.length > 0 ? methods[0].id : ""
  );

  const [studentNotes, setStudentNotes] = React.useState<string>("");

  // Riwayat transaksi mahasiswa (untuk cek PENDING & APPROVED)
  const [studentTransactions, setStudentTransactions] = React.useState<PortalStudentTransaction[]>(
    data.studentTransactions || []
  );

  // Upload state
  const [proofImageUrl, setProofImageUrl] = React.useState<string>("");
  const [isUploading, setIsUploading] = React.useState<boolean>(false);
  const [uploadError, setUploadError] = React.useState<string | null>(null);

  // Submit & Result state
  const [isSubmitting, setIsSubmitting] = React.useState<boolean>(false);
  const [successResult, setSuccessResult] = React.useState<{
    referenceCode: string;
    studentName: string;
    className: string;
    billTitle: string;
    amountPaid: number;
    googleSheetUrl?: string | null;
  } | null>(null);

  // Available students for the currently selected class
  const currentClass = React.useMemo(
    () => classes.find((c) => c.id === selectedClassId),
    [classes, selectedClassId]
  );

  const currentStudents = React.useMemo(
    () => currentClass?.students || [],
    [currentClass]
  );

  const selectedStudent = React.useMemo(
    () => currentStudents.find((s) => s.id === selectedStudentId),
    [currentStudents, selectedStudentId]
  );

  // Ambil status transaksi terbaru saat mahasiswa dipilih
  React.useEffect(() => {
    if (!selectedStudentId) return;
    getStudentBillStatusAction(selectedStudentId).then((res) => {
      if (res.success && res.data) {
        setStudentTransactions((prev) => {
          const filtered = prev.filter((t) => t.studentId !== selectedStudentId);
          const mapped: PortalStudentTransaction[] = res.data.map((d) => ({
            studentId: selectedStudentId,
            billId: d.billId,
            status: d.status,
            referenceCode: d.referenceCode,
          }));
          return [...filtered, ...mapped];
        });
      }
    });
  }, [selectedStudentId]);

  // Klasifikasi tagihan untuk mahasiswa yang dipilih:
  // 1. Tagihan APPROVED (LUNAS) -> Dihilangkan dari pilihan bayar
  // 2. Tagihan PENDING (Menunggu Verifikasi) -> Dinonaktifkan (disabled)
  // 3. Tagihan BELUM DIBAYAR -> Dapat dipilih secara normal
  const { payableBills, approvedBills, allBillsCompleted } = React.useMemo(() => {
    if (!selectedStudentId) {
      return {
        payableBills: bills.map((b) => ({
          ...b,
          studentStatus: null as null | "PENDING" | "APPROVED",
          refCode: null as string | null,
        })),
        approvedBills: [] as PortalBillOption[],
        allBillsCompleted: false,
      };
    }

    const approved: PortalBillOption[] = [];
    const payable: Array<PortalBillOption & { studentStatus: null | "PENDING" | "APPROVED"; refCode: string | null }> = [];

    bills.forEach((bill) => {
      const match = studentTransactions.find(
        (t) => t.studentId === selectedStudentId && t.billId === bill.id
      );

      if (match?.status === "APPROVED") {
        approved.push(bill);
      } else {
        payable.push({
          ...bill,
          studentStatus: match?.status === "PENDING" ? "PENDING" : null,
          refCode: match?.referenceCode || null,
        });
      }
    });

    const allCompleted = bills.length > 0 && approved.length === bills.length;

    return {
      payableBills: payable,
      approvedBills: approved,
      allBillsCompleted: allCompleted,
    };
  }, [bills, selectedStudentId, studentTransactions]);

  // Cek apakah seluruh tagihan yang belum lunas berstatus PENDING
  const allPayablePending = React.useMemo(() => {
    return (
      Boolean(selectedStudentId) &&
      payableBills.length > 0 &&
      payableBills.every((b) => b.studentStatus === "PENDING")
    );
  }, [selectedStudentId, payableBills]);

  // Pastikan selectedBillId selalu menunjuk ke tagihan yang valid (belum dibayar & tidak pending)
  React.useEffect(() => {
    if (!selectedStudentId) return;
    const currentPayable = payableBills.find(
      (b) => b.id === selectedBillId && b.studentStatus === null
    );

    if (!currentPayable) {
      const firstAvailable = payableBills.find((b) => b.studentStatus === null);
      setSelectedBillId(firstAvailable ? firstAvailable.id : "");
    }
  }, [selectedStudentId, payableBills, selectedBillId]);

  const selectedBill = React.useMemo(
    () => bills.find((b) => b.id === selectedBillId),
    [bills, selectedBillId]
  );

  const selectedBillStatus = React.useMemo(() => {
    if (!selectedStudentId || !selectedBillId) return null;
    const match = payableBills.find((b) => b.id === selectedBillId);
    return match?.studentStatus || null;
  }, [selectedStudentId, selectedBillId, payableBills]);

  const selectedMethod = React.useMemo(
    () => methods.find((m) => m.id === selectedMethodId),
    [methods, selectedMethodId]
  );

  // Reset student selection when class changes
  React.useEffect(() => {
    setSelectedStudentId("");
  }, [selectedClassId]);

  // Handle proof image upload
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Format berkas harus berupa gambar (JPG, PNG, WEBP)");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error("Ukuran gambar maksimal 5 MB");
      return;
    }

    setIsUploading(true);
    setUploadError(null);

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("folder", "proofs");

      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      const json = await res.json();
      if (json.success && json.url) {
        setProofImageUrl(json.url);
        toast.success("Bukti transfer berhasil diunggah!");
      } else {
        setUploadError(json.error || "Gagal mengunggah gambar");
        toast.error(json.error || "Gagal mengunggah gambar");
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Terjadi kesalahan upload";
      setUploadError(msg);
      toast.error(msg);
    } finally {
      setIsUploading(false);
    }
  };

  const [copiedText, setCopiedText] = React.useState<string | null>(null);
  const [isQrisZoomOpen, setIsQrisZoomOpen] = React.useState<boolean>(false);

  const handleCopy = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedText(text);
    toast.success(`${label} (${text}) berhasil disalin!`);
    setTimeout(() => setCopiedText(null), 2500);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedClassId) {
      toast.error("Silakan pilih kelas Anda.");
      return;
    }

    if (!selectedStudentId) {
      toast.error("Silakan pilih identitas nama / NIM Anda.");
      return;
    }

    if (!selectedBillId || !selectedBill) {
      toast.error("Silakan pilih tagihan kas yang ingin dibayar.");
      return;
    }

    if (selectedBillStatus === "PENDING") {
      toast.error("Tagihan ini sedang dalam proses verifikasi bendahara.");
      return;
    }

    if (!selectedMethodId || !selectedMethod) {
      toast.error("Silakan pilih rekening atau kanal transfer.");
      return;
    }

    if (!proofImageUrl) {
      toast.error("Unggah foto/struk bukti transfer Anda terlebih dahulu.");
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await submitStudentPaymentAction({
        studentId: selectedStudentId,
        billId: selectedBillId,
        paymentMethodId: selectedMethodId,
        amountPaid: selectedBill.amount,
        proofImageUrl,
        studentNotes: studentNotes.trim() || null,
      });

      if (res.success && res.data) {
        setSuccessResult({
          ...res.data,
          googleSheetUrl: res.data.googleSheetUrl || selectedBill.googleSheetUrl || null,
        });
        setStudentTransactions((prev) => [
          ...prev,
          {
            studentId: selectedStudentId,
            billId: selectedBillId,
            status: "PENDING",
            referenceCode: res.data!.referenceCode,
          },
        ]);
        toast.success(res.message);
      } else {
        toast.error(res.error || "Gagal mengirimkan bukti pembayaran");
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Terjadi kesalahan";
      toast.error(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResetForm = () => {
    setSuccessResult(null);
    setSelectedStudentId("");
    setProofImageUrl("");
    setStudentNotes("");
  };

  const handleShareSuccessToWA = () => {
    if (!successResult) return;
    const origin = typeof window !== "undefined" ? window.location.origin : "";
    const statusLink = `${origin}/status?ref=${successResult.referenceCode}`;
    const sheetText = successResult.googleSheetUrl
      ? `\n📊 Link Spreadsheet Kas: ${successResult.googleSheetUrl}`
      : "";
    const text = `Halo Bendahara! 👋\nSaya telah melakukan pembayaran kas:\n\n👤 Mahasiswa: *${successResult.studentName}* (${successResult.className})\n📌 Tagihan: *${successResult.billTitle}*\n💰 Nominal: *${formatRupiah(successResult.amountPaid)}*\n🔖 Kode Referensi: *${successResult.referenceCode}*\n🔗 Cek Status: ${statusLink}${sheetText}\n\nMohon dicek & diverifikasi. Terima kasih! 🙏`;
    const url = `https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`;
    window.open(url, "_blank", "noopener,noreferrer");
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 sm:py-12">
      {/* Banner Title */}
      <div className="text-center mb-8">
        <Badge variant="outline" className="mb-2 px-3 py-1 text-xs bg-primary/10 text-primary border-primary/20 inline-flex items-center gap-1.5">
          <SparkleIcon className="size-3.5 shrink-0" />
          <span>Portal Resmi Manajemen Informatika 2025</span>
        </Badge>
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
          Pembayaran & Iuran Manajemen Informatika 2025
        </h1>
        <p className="text-sm text-muted-foreground mt-2 max-w-lg mx-auto">
          Pilih nama Anda, tagihan atau iuran yang ingin dibayarkan, transfer ke rekening bendahara, dan unggah bukti transfer.
        </p>
      </div>

      {matchedInitialBill && (
        <div className="mb-6 p-3.5 rounded-2xl bg-primary/10 border border-primary/20 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
          <div className="flex items-center gap-2.5">
            <ReceiptIcon className="size-5 text-primary shrink-0" />
            <div>
              <span className="text-xs text-muted-foreground block">Tautan Khusus Tagihan</span>
              <span className="text-sm font-semibold text-foreground">{matchedInitialBill.title}</span>
            </div>
          </div>
          <Badge className="bg-primary text-primary-foreground font-mono text-xs">
            {formatRupiah(matchedInitialBill.amount)}
          </Badge>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* ========================================================= */}
        {/* LANGKAH 1: IDENTITAS MAHASISWA */}
        {/* ========================================================= */}
        <Card className="p-5 sm:p-6 border bg-card/70 backdrop-blur-xs shadow-xs rounded-2xl">
          <div className="flex items-center gap-3 mb-5 border-b pb-4">
            <div className="flex size-8 items-center justify-center rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400 font-bold text-sm">
              1
            </div>
            <div>
              <h2 className="text-base font-semibold text-foreground">Identitas Mahasiswa</h2>
              <p className="text-xs text-muted-foreground">Pilih rombongan kelas dan nama Anda</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Pilih Kelas */}
            <div className="space-y-2">
              <Label htmlFor="portalClass" className="text-xs font-medium">
                Kelas / Rombel <span className="text-destructive">*</span>
              </Label>
              <Select
                value={selectedClassId}
                onValueChange={(val) => setSelectedClassId(val ?? "")}
                items={classes.map((cls) => ({
                  label: cls.name,
                  value: cls.id,
                }))}
              >
                <SelectTrigger id="portalClass" className="w-full h-10 rounded-xl">
                  <SelectValue placeholder="Pilih kelas Anda...">
                    {(val: string | null) => {
                      const cls = classes.find((c) => c.id === val);
                      return cls ? cls.name : undefined;
                    }}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {classes.map((cls) => (
                    <SelectItem key={cls.id} value={cls.id}>
                      {cls.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Pilih Mahasiswa */}
            <div className="space-y-2">
              <Label htmlFor="portalStudent" className="text-xs font-medium">
                Nama Mahasiswa <span className="text-destructive">*</span>
              </Label>
              <Select
                value={selectedStudentId}
                onValueChange={(val) => setSelectedStudentId(val ?? "")}
                items={currentStudents.map((st) => ({
                  label: st.nim ? `${st.name} — ${st.nim}` : st.name,
                  value: st.id,
                }))}
              >
                <SelectTrigger id="portalStudent" className="w-full h-10 rounded-xl">
                  <SelectValue placeholder="Cari nama Anda...">
                    {(val: string | null) => {
                      const st = currentStudents.find((s) => s.id === val);
                      return st ? (st.nim ? `${st.name} (${st.nim})` : st.name) : undefined;
                    }}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {currentStudents.map((st) => (
                    <SelectItem key={st.id} value={st.id}>
                      <span className="font-medium">{st.name}</span>
                      {st.nim && (
                        <span className="text-muted-foreground ml-1.5 font-mono text-[11px]">
                          ({st.nim})
                        </span>
                      )}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {selectedStudent && (
            <div className="mt-4 p-3 rounded-xl bg-primary/5 border border-primary/20 flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <CheckCircleIcon className="size-4 text-primary" />
                <span>
                  Mahasiswa terkonfirmasi: <strong>{selectedStudent.name}</strong>
                  {selectedStudent.nim && (
                    <>
                      {" "}(NIM: <span className="font-mono">{selectedStudent.nim}</span>)
                    </>
                  )}
                </span>
              </div>
              <Badge variant="secondary" className="text-[10px]">
                {currentClass?.name}
              </Badge>
            </div>
          )}
        </Card>

        {/* ========================================================= */}
        {/* LANGKAH 2: PILIH TAGIHAN / IURAN */}
        {/* ========================================================= */}
        <Card className="p-5 sm:p-6 border bg-card/70 backdrop-blur-xs shadow-xs rounded-2xl">
          <div className="flex items-center gap-3 mb-5 border-b pb-4">
            <div className="flex size-8 items-center justify-center rounded-lg bg-violet-500/10 text-violet-600 dark:text-violet-400 font-bold text-sm">
              2
            </div>
            <div>
              <h2 className="text-base font-semibold text-foreground">Pilih Tagihan / Iuran</h2>
              <p className="text-xs text-muted-foreground">Pilih iuran atau tagihan yang ingin Anda bayar</p>
            </div>
          </div>

          {bills.length === 0 ? (
            <p className="text-xs text-muted-foreground italic py-4 text-center">
              Belum ada tagihan kas aktif saat ini.
            </p>
          ) : allBillsCompleted ? (
            /* TAMPILAN SEMUA TAGIHAN SUDAH LUNAS */
            <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/10 dark:bg-emerald-950/20 p-5 sm:p-6 text-center sm:text-left flex flex-col sm:flex-row items-center gap-5">
              <div className="flex size-14 shrink-0 items-center justify-center rounded-2xl bg-emerald-500 text-white shadow-md ring-4 ring-emerald-500/20">
                <CheckCircleIcon className="size-8" weight="fill" />
              </div>
              <div className="flex-1 space-y-2">
                <div className="flex items-center gap-2 justify-center sm:justify-start">
                  <h3 className="font-bold text-base sm:text-lg text-foreground">
                    Semua Tagihan Sudah Lunas! 🎉
                  </h3>
                  <Badge className="bg-emerald-600 text-white text-[11px]">Lunas</Badge>
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Terima kasih <strong>{selectedStudent?.name}</strong>! Seluruh kewajiban tagihan kas angkatan Anda telah berstatus lunas. Anda tidak memiliki tagihan yang perlu dibayar lagi saat ini.
                </p>
                <div className="pt-1 flex flex-wrap gap-2 justify-center sm:justify-start">
                  {approvedBills.map((b) => (
                    <span
                      key={b.id}
                      className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-background/80 border border-emerald-500/20 text-xs font-medium text-emerald-700 dark:text-emerald-300 shadow-2xs"
                    >
                      <CheckIcon className="size-3.5 text-emerald-600" weight="bold" />
                      <span>{b.title}</span>
                      <span className="text-[11px] font-mono opacity-80">({formatRupiah(b.amount)})</span>
                    </span>
                  ))}
                </div>
              </div>
              <div className="shrink-0">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => router.push("/transparansi")}
                  className="text-xs gap-1.5 rounded-xl cursor-pointer bg-background"
                >
                  <span>Transparansi Kas</span>
                  <ArrowSquareOutIcon className="size-3.5" />
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Info tagihan yang sudah Lunas (otomatis dihilangkan dari opsi bayar) */}
              {approvedBills.length > 0 && (
                <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 text-xs">
                  <div className="flex items-center gap-2">
                    <CheckCircleIcon className="size-4 text-emerald-600 shrink-0" weight="fill" />
                    <span className="text-muted-foreground">
                      Tagihan yang sudah lunas:{" "}
                      <strong className="text-foreground">
                        {approvedBills.map((b) => b.title).join(", ")}
                      </strong>
                    </span>
                  </div>
                  <Badge variant="outline" className="border-emerald-500/30 text-emerald-600 dark:text-emerald-400 text-[10px] self-start sm:self-auto shrink-0 bg-background/50">
                    Otomatis dihilangkan
                  </Badge>
                </div>
              )}

              {/* Daftar Tagihan */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {payableBills.map((bill) => {
                  const isPending = bill.studentStatus === "PENDING";
                  const isSelected = selectedBillId === bill.id && !isPending;

                  if (isPending) {
                    return (
                      <div
                        key={bill.id}
                        className="p-4 rounded-xl border border-amber-500/40 bg-amber-500/5 dark:bg-amber-950/20 flex flex-col justify-between relative overflow-hidden select-none opacity-90 cursor-not-allowed shadow-2xs"
                      >
                        <div>
                          <div className="flex items-start justify-between gap-2">
                            <span className="font-semibold text-sm text-foreground">
                              {bill.title}
                            </span>
                            <Badge
                              variant="outline"
                              className="text-[10px] shrink-0 border-amber-500/40 bg-amber-500/15 text-amber-700 dark:text-amber-400 font-medium inline-flex items-center gap-1"
                            >
                              <ClockIcon className="size-3 shrink-0" weight="bold" />
                              <span>Menunggu Verifikasi</span>
                            </Badge>
                          </div>
                          {bill.description && (
                            <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                              {bill.description}
                            </p>
                          )}

                          <div className="mt-3 p-2.5 rounded-lg bg-background/80 border border-amber-500/20 space-y-1">
                            <div className="flex items-center justify-between gap-2 text-[11px]">
                              <span className="text-muted-foreground">Kode Referensi:</span>
                              <span className="font-mono font-semibold text-foreground">
                                {bill.refCode || "-"}
                              </span>
                            </div>
                            <p className="text-[10px] text-amber-600 dark:text-amber-400">
                              Pembayaran Anda sedang dalam antrean verifikasi bendahara.
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center justify-between mt-4 pt-3 border-t border-border/50">
                          <span className="text-xs text-muted-foreground font-medium">
                            {formatRupiah(bill.amount)}
                          </span>
                          {bill.refCode && (
                            <Link
                              href={`/status?ref=${bill.refCode}`}
                              className="text-[11px] text-primary hover:underline font-medium inline-flex items-center gap-1 cursor-pointer"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <span>Cek Status</span>
                              <ArrowSquareOutIcon className="size-3" />
                            </Link>
                          )}
                        </div>
                      </div>
                    );
                  }

                  return (
                    <div
                      key={bill.id}
                      onClick={() => setSelectedBillId(bill.id)}
                      className={`p-4 rounded-xl border transition-all cursor-pointer flex flex-col justify-between ${
                        isSelected
                          ? "border-primary bg-primary/5 ring-1 ring-primary shadow-xs"
                          : "border-border/70 hover:border-border hover:bg-muted/40"
                      }`}
                    >
                      <div>
                        <div className="flex items-start justify-between gap-2">
                          <span className="font-semibold text-sm text-foreground">
                            {bill.title}
                          </span>
                          {bill.academicTerm && (
                            <Badge variant="outline" className="text-[10px] shrink-0">
                              {bill.academicTerm}
                            </Badge>
                          )}
                        </div>
                        {bill.description && (
                          <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                            {bill.description}
                          </p>
                        )}
                      </div>

                      <div className="flex items-baseline justify-between mt-4 pt-3 border-t border-border/50">
                        <span className="text-xs text-muted-foreground">Nominal Tagihan:</span>
                        <span className="text-base font-bold text-emerald-600 dark:text-emerald-400 font-mono">
                          {formatRupiah(bill.amount)}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </Card>

        {allBillsCompleted ? (
          <Card className="p-6 sm:p-8 border bg-emerald-500/5 border-emerald-500/20 text-center rounded-2xl space-y-3">
            <div className="flex size-14 mx-auto items-center justify-center rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 ring-4 ring-emerald-500/10">
              <CheckCircleIcon className="size-8" weight="fill" />
            </div>
            <div>
              <h3 className="font-semibold text-base sm:text-lg text-foreground">
                Seluruh Tagihan Kas Sudah Selesai
              </h3>
              <p className="text-xs text-muted-foreground mt-1 max-w-md mx-auto leading-relaxed">
                Keren! Anda tidak memiliki tagihan aktif yang perlu dibayar. Seluruh pembayaran kas atas nama{" "}
                <strong className="text-foreground">{selectedStudent?.name}</strong> telah tercatat lunas.
              </p>
            </div>
            <div className="pt-2 flex justify-center gap-3">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => router.push("/transparansi")}
                className="text-xs rounded-xl cursor-pointer gap-1.5 bg-background shadow-2xs"
              >
                <span>Lihat Transparansi Kas</span>
                <ArrowSquareOutIcon className="size-3.5" />
              </Button>
            </div>
          </Card>
        ) : allPayablePending ? (
          <Card className="p-6 sm:p-8 border bg-amber-500/10 border-amber-500/25 text-center rounded-2xl space-y-3">
            <div className="flex size-14 mx-auto items-center justify-center rounded-2xl bg-amber-500/15 text-amber-600 dark:text-amber-400 ring-4 ring-amber-500/10">
              <ClockIcon className="size-8" weight="fill" />
            </div>
            <div>
              <h3 className="font-semibold text-base sm:text-lg text-foreground">
                Pembayaran Sedang Dalam Antrean Verifikasi
              </h3>
              <p className="text-xs text-muted-foreground mt-1 max-w-md mx-auto leading-relaxed">
                Seluruh tagihan Anda saat ini sudah memiliki transaksi yang menunggu verifikasi oleh bendahara. Anda tidak perlu mengulang transfer atau mengunggah ulang bukti pembayaran.
              </p>
            </div>
            <div className="pt-2 flex justify-center gap-3">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => router.push("/status")}
                className="text-xs rounded-xl cursor-pointer gap-1.5 bg-background shadow-2xs"
              >
                <span>Cek Status Transaksi</span>
                <ArrowSquareOutIcon className="size-3.5" />
              </Button>
            </div>
          </Card>
        ) : (
          <>
            {/* ========================================================= */}
            {/* LANGKAH 3: PILIH REKENING / METODE PEMBAYARAN */}
            {/* ========================================================= */}
        <Card className="p-5 sm:p-6 border bg-card/70 backdrop-blur-xs shadow-xs rounded-2xl">
          <div className="flex items-center gap-3 mb-5 border-b pb-4">
            <div className="flex size-8 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-bold text-sm">
              3
            </div>
            <div>
              <h2 className="text-base font-semibold text-foreground">Metode Pembayaran & Rekening PIC</h2>
              <p className="text-xs text-muted-foreground">Pilih salah satu metode pembayaran resmi di bawah ini</p>
            </div>
          </div>

          {/* 1. Selector Tab/Card Metode Pembayaran (Simetris & Seragam) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
            {methods.map((method) => {
              const isSelected = selectedMethodId === method.id;
              return (
                <button
                  key={method.id}
                  type="button"
                  onClick={() => setSelectedMethodId(method.id)}
                  className={`relative p-3.5 rounded-xl border text-left transition-all cursor-pointer flex items-center justify-between gap-3 ${
                    isSelected
                      ? "border-primary bg-primary/5 ring-2 ring-primary/25 shadow-xs"
                      : "border-border/70 hover:border-border hover:bg-muted/40 bg-card"
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className={`flex size-10 shrink-0 items-center justify-center rounded-xl transition-colors ${
                        isSelected
                          ? "bg-primary text-primary-foreground shadow-xs"
                          : "bg-muted text-muted-foreground"
                      }`}
                    >
                      {method.type === "QRIS" ? (
                        <QrCodeIcon className="size-5" />
                      ) : method.type === "EWALLET" ? (
                        <DeviceMobileIcon className="size-5" />
                      ) : (
                        <CreditCardIcon className="size-5" />
                      )}
                    </div>

                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="font-semibold text-sm text-foreground truncate">
                          {method.name}
                        </span>
                        <Badge variant="outline" className="text-[10px] px-1.5 py-0 shrink-0 font-mono">
                          {method.bankName}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground truncate mt-0.5">
                        a.n. <span className="font-medium text-foreground">{method.accountHolder}</span>
                      </p>
                    </div>
                  </div>

                  <div
                    className={`flex size-5 shrink-0 items-center justify-center rounded-full border transition-all ${
                      isSelected
                        ? "border-primary bg-primary text-primary-foreground"
                        : "border-muted-foreground/30 bg-transparent"
                    }`}
                  >
                    {isSelected && <CheckIcon className="size-3" weight="bold" />}
                  </div>
                </button>
              );
            })}
          </div>

          {/* 2. Showcase Detail Khusus Metode yang Dipilih */}
          {selectedMethod && (
            <div className="rounded-xl border border-border/80 bg-muted/20 p-4 sm:p-5">
              {selectedMethod.type === "QRIS" ? (
                /* ================= QRIS SHOWCASE ================= */
                <div className="flex flex-col sm:flex-row gap-5 items-center sm:items-start">
                  {/* Wadah Kode QRIS */}
                  <div className="flex flex-col items-center shrink-0">
                    <div
                      onClick={() => setIsQrisZoomOpen(true)}
                      className="group relative w-fit max-w-[200px] rounded-2xl overflow-hidden border-2 border-border/80 bg-white shadow-sm cursor-pointer hover:border-primary/60 transition-all flex items-center justify-center"
                      title="Klik untuk memperbesar QRIS"
                    >
                      {selectedMethod.qrisImageUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={selectedMethod.qrisImageUrl}
                          alt="QRIS Kas Angkatan"
                          className="max-h-48 w-auto object-contain block"
                        />
                      ) : (
                        <div className="flex size-44 items-center justify-center text-xs text-muted-foreground">
                          QRIS tidak tersedia
                        </div>
                      )}
                      {/* Overlay hint saat di-hover */}
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center text-white text-xs font-medium gap-1">
                        <MagnifyingGlassPlusIcon className="size-6" />
                        <span>Klik Perbesar</span>
                      </div>
                    </div>

                    {/* Tombol Aksi QRIS */}
                    <div className="flex items-center gap-2 mt-2.5">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => setIsQrisZoomOpen(true)}
                        className="h-7 text-xs gap-1.5 rounded-lg cursor-pointer bg-background"
                      >
                        <MagnifyingGlassPlusIcon className="size-3.5" />
                        <span>Perbesar</span>
                      </Button>
                      {selectedMethod.qrisImageUrl && (
                        <a
                          href={selectedMethod.qrisImageUrl}
                          download="QRIS-Kas-Angkatan-MI2025.jpeg"
                          className="inline-flex items-center gap-1.5 text-xs h-7 px-2.5 rounded-lg border border-border bg-background hover:bg-muted font-medium transition-colors"
                        >
                          <DownloadSimpleIcon className="size-3.5" />
                          <span>Unduh QR</span>
                        </a>
                      )}
                    </div>
                  </div>

                  {/* Informasi & Detail QRIS */}
                  <div className="flex-1 space-y-3 w-full">
                    <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-border/50">
                      <div>
                        <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider block">
                          Merchant Resmi QRIS
                        </span>
                        <span className="font-bold text-sm text-foreground">
                          {selectedMethod.accountHolder}
                        </span>
                      </div>
                      <div className="text-right">
                        <span className="text-[10px] font-medium text-muted-foreground block">
                          PIC Penerima
                        </span>
                        <span className="text-xs font-semibold text-primary">
                          {selectedMethod.picName}
                        </span>
                      </div>
                    </div>

                    {/* Kotak NMID / No. Referensi */}
                    <div className="p-3 rounded-xl bg-background border flex items-center justify-between gap-3 shadow-2xs">
                      <div className="min-w-0">
                        <span className="text-[10px] text-muted-foreground block font-medium">
                          NMID / No. Referensi QRIS:
                        </span>
                        <span className="font-mono font-bold text-sm text-foreground select-all truncate block">
                          {selectedMethod.accountNumber}
                        </span>
                      </div>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="h-8 gap-1.5 text-xs rounded-lg cursor-pointer shrink-0"
                        onClick={() => handleCopy(selectedMethod.accountNumber, "NMID")}
                      >
                        {copiedText === selectedMethod.accountNumber ? (
                          <>
                            <CheckIcon className="size-3.5 text-emerald-500" />
                            <span className="text-emerald-500 font-medium">Tersalin</span>
                          </>
                        ) : (
                          <>
                            <CopyIcon className="size-3.5" />
                            <span>Salin</span>
                          </>
                        )}
                      </Button>
                    </div>

                    {/* Pengingat Nominal Bayar */}
                    {selectedBill && (
                      <div className="flex items-center justify-between p-2.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-xs">
                        <span className="text-emerald-700 dark:text-emerald-300 font-medium">
                          Nominal yang harus dimasukkan:
                        </span>
                        <span className="font-mono font-bold text-emerald-700 dark:text-emerald-300">
                          {formatRupiah(selectedBill.amount)}
                        </span>
                      </div>
                    )}

                    {/* Daftar Aplikasi yang Didukung */}
                    <div className="pt-0.5">
                      <span className="text-[11px] text-muted-foreground block mb-1">
                        Mendukung semua aplikasi pembayaran berlogo QRIS:
                      </span>
                      <div className="flex flex-wrap gap-1">
                        {["BCA", "Mandiri", "BRI", "BNI", "GoPay", "OVO", "DANA", "ShopeePay"].map(
                          (app) => (
                            <span
                              key={app}
                              className="text-[10px] font-medium px-2 py-0.5 rounded-md bg-background border border-border/70 text-muted-foreground"
                            >
                              {app}
                            </span>
                          )
                        )}
                      </div>
                    </div>

                    {selectedMethod.instructions && (
                      <div className="text-xs text-muted-foreground bg-muted/40 p-2.5 rounded-lg flex items-start gap-2 border border-border/40">
                        <LightbulbIcon className="size-4 text-amber-500 shrink-0 mt-0.5" />
                        <span className="leading-relaxed">{selectedMethod.instructions}</span>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                /* ================= BANK TRANSFER / BCA SHOWCASE ================= */
                <div className="space-y-3.5">
                  {/* Kartu Finansial Elegan */}
                  <div className="relative overflow-hidden rounded-2xl border border-border/80 bg-gradient-to-br from-background via-muted/20 to-muted/40 p-5 shadow-xs">
                    <div className="flex items-start justify-between gap-3 mb-4">
                      <div className="flex items-center gap-2.5">
                        <div className="flex size-9 items-center justify-center rounded-xl bg-primary/10 text-primary font-bold">
                          <BankIcon className="size-5" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-sm text-foreground">
                              {selectedMethod.bankName}
                            </span>
                            <Badge variant="outline" className="text-[10px] px-1.5 py-0 bg-background font-mono">
                              Transfer Bank
                            </Badge>
                          </div>
                          <span className="text-[11px] text-muted-foreground">
                            Rekening Kas Resmi Angkatan
                          </span>
                        </div>
                      </div>

                      <div className="text-right">
                        <span className="text-[10px] text-muted-foreground block">PIC Bendahara</span>
                        <span className="text-xs font-semibold text-primary">{selectedMethod.picName}</span>
                      </div>
                    </div>

                    {/* Kotak Nomor Rekening Besar & Tombol Salin */}
                    <div className="p-3.5 rounded-xl bg-background border flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs">
                      <div>
                        <span className="text-[10px] text-muted-foreground block font-medium">
                          Nomor Rekening {selectedMethod.bankName}:
                        </span>
                        <span className="font-mono font-bold text-xl sm:text-2xl text-foreground tracking-wider select-all block mt-0.5">
                          {selectedMethod.accountNumber}
                        </span>
                      </div>

                      <Button
                        type="button"
                        size="sm"
                        className="h-9 gap-1.5 text-xs rounded-lg cursor-pointer bg-primary text-primary-foreground font-medium shrink-0 shadow-xs"
                        onClick={() => handleCopy(selectedMethod.accountNumber, `No. Rekening ${selectedMethod.bankName}`)}
                      >
                        {copiedText === selectedMethod.accountNumber ? (
                          <>
                            <CheckIcon className="size-4" weight="bold" />
                            <span>Berhasil Disalin!</span>
                          </>
                        ) : (
                          <>
                            <CopyIcon className="size-4" />
                            <span>Salin No. Rekening</span>
                          </>
                        )}
                      </Button>
                    </div>

                    {/* Penerima & Nominal Transfer */}
                    <div className="flex flex-wrap items-center justify-between gap-3 mt-3 pt-3 border-t border-border/50 text-xs">
                      <div>
                        <span className="text-muted-foreground text-[11px] block">Atas Nama Rekening:</span>
                        <span className="font-semibold text-foreground text-sm">
                          {selectedMethod.accountHolder}
                        </span>
                      </div>

                      {selectedBill && (
                        <div className="text-right">
                          <span className="text-muted-foreground text-[11px] block">Nominal Transfer:</span>
                          <span className="font-bold text-emerald-600 dark:text-emerald-400 font-mono text-sm">
                            {formatRupiah(selectedBill.amount)}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Panduan Ringkas Cara Transfer */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs text-muted-foreground">
                    <div className="p-2.5 rounded-lg bg-background border">
                      <strong className="text-foreground block text-[11px] mb-0.5">BCA Mobile / myBCA</strong>
                      <span>m-Transfer &gt; Antar Rekening BCA &gt; Tempel no. rek kas.</span>
                    </div>
                    <div className="p-2.5 rounded-lg bg-background border">
                      <strong className="text-foreground block text-[11px] mb-0.5">ATM BCA</strong>
                      <span>Transaksi Lainnya &gt; Transfer &gt; Ke Rekening BCA.</span>
                    </div>
                    <div className="p-2.5 rounded-lg bg-background border">
                      <strong className="text-foreground block text-[11px] mb-0.5">Bank Lain (BI-Fast)</strong>
                      <span>Pilih Bank BCA &gt; Masukkan no. rek (biaya Rp 2.500).</span>
                    </div>
                  </div>

                  {selectedMethod.instructions && (
                    <div className="text-xs text-muted-foreground bg-muted/40 p-2.5 rounded-lg flex items-start gap-2 border border-border/40">
                      <LightbulbIcon className="size-4 text-amber-500 shrink-0 mt-0.5" />
                      <span className="leading-relaxed">{selectedMethod.instructions}</span>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </Card>

        {/* Dialog Perbesar QRIS */}
        <Dialog open={isQrisZoomOpen} onOpenChange={setIsQrisZoomOpen}>
          <DialogContent className="max-w-sm rounded-2xl p-5 text-center">
            <DialogHeader>
              <DialogTitle className="text-base font-semibold">
                QRIS Kas Angkatan
              </DialogTitle>
              <DialogDescription className="text-xs">
                a.n. {selectedMethod?.accountHolder} (PIC: {selectedMethod?.picName})
              </DialogDescription>
            </DialogHeader>

            {selectedMethod?.qrisImageUrl && (
              <div className="flex justify-center my-2">
                <div className="relative max-h-[380px] sm:max-h-[420px] w-fit overflow-hidden rounded-xl border border-border/80 bg-white shadow-sm">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={selectedMethod.qrisImageUrl}
                    alt="QRIS Kas"
                    className="max-h-[360px] sm:max-h-[400px] w-auto max-w-full object-contain block mx-auto"
                  />
                </div>
              </div>
            )}

            <div className="p-2.5 rounded-xl bg-muted/50 border text-xs flex items-center justify-between">
              <span className="font-mono font-semibold text-foreground truncate max-w-[200px]">
                {selectedMethod?.accountNumber}
              </span>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-7 text-xs gap-1 cursor-pointer"
                onClick={() => selectedMethod && handleCopy(selectedMethod.accountNumber, "NMID")}
              >
                <CopyIcon className="size-3.5" />
                <span>Salin NMID</span>
              </Button>
            </div>

            <DialogFooter className="gap-2 sm:justify-between pt-2">
              {selectedMethod?.qrisImageUrl && (
                <a
                  href={selectedMethod.qrisImageUrl}
                  download="QRIS-Kas-Angkatan-MI2025.jpeg"
                  className="inline-flex items-center gap-1.5 text-xs h-9 px-3 rounded-lg border border-border bg-background hover:bg-muted font-medium transition-colors"
                >
                  <DownloadSimpleIcon className="size-4" />
                  <span>Unduh Gambar</span>
                </a>
              )}
              <Button
                type="button"
                size="sm"
                className="text-xs rounded-lg cursor-pointer"
                onClick={() => setIsQrisZoomOpen(false)}
              >
                Tutup
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* ========================================================= */}
        {/* LANGKAH 4: UNGGAH BUKTI TRANSFER & CATATAN */}
        {/* ========================================================= */}
        <Card className="p-5 sm:p-6 border bg-card/70 backdrop-blur-xs shadow-xs rounded-2xl">
          <div className="flex items-center gap-3 mb-5 border-b pb-4">
            <div className="flex size-8 items-center justify-center rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400 font-bold text-sm">
              4
            </div>
            <div>
              <h2 className="text-base font-semibold text-foreground">Bukti Pembayaran</h2>
              <p className="text-xs text-muted-foreground">Unggah foto struk transfer atau tangkapan layar pembayaran</p>
            </div>
          </div>

          <div className="space-y-4">
            {/* Nominal Ringkasan */}
            {selectedBill && (
              <div className="p-3 rounded-xl bg-muted/50 border flex items-center justify-between text-xs">
                <span>Nominal yang harus dibayarkan:</span>
                <span className="font-bold text-base text-emerald-600 dark:text-emerald-400 font-mono">
                  {formatRupiah(selectedBill.amount)}
                </span>
              </div>
            )}

            {/* File Upload Box */}
            <div className="space-y-2">
              <Label htmlFor="proofFile" className="text-xs font-medium">
                Foto Bukti Transfer (JPG/PNG) <span className="text-destructive">*</span>
              </Label>

              <div className="border-2 border-dashed border-border rounded-xl p-5 text-center hover:bg-muted/30 transition-colors relative">
                <input
                  id="proofFile"
                  type="file"
                  accept="image/png, image/jpeg, image/webp"
                  onChange={handleFileUpload}
                  disabled={isUploading}
                  className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                />

                {isUploading ? (
                  <div className="py-6 flex flex-col items-center gap-2">
                    <div className="size-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                    <span className="text-xs font-medium text-foreground">Mengunggah gambar...</span>
                  </div>
                ) : proofImageUrl ? (
                  <div className="py-2 flex flex-col items-center gap-3">
                    <div className="relative size-32 rounded-lg overflow-hidden border shadow-xs bg-muted">
                      <Image
                        src={proofImageUrl}
                        alt="Bukti Transfer"
                        fill
                        className="object-cover"
                        unoptimized
                      />
                    </div>
                    <div className="flex items-center gap-1.5 text-xs text-emerald-600 dark:text-emerald-400 font-medium">
                      <CheckCircleIcon className="size-4" />
                      <span>Bukti transfer siap dikirim! Klik untuk mengganti.</span>
                    </div>
                  </div>
                ) : (
                  <div className="py-6 flex flex-col items-center gap-2">
                    <div className="flex size-10 items-center justify-center rounded-full bg-primary/10 text-primary">
                      <UploadSimpleIcon className="size-5" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-foreground">
                        Pilih foto atau tarik struk pembayaran ke sini
                      </p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        Format JPG, PNG, atau WEBP (maksimal 5 MB)
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {uploadError && (
                <p className="text-xs text-destructive mt-1">{uploadError}</p>
              )}
            </div>

            {/* Catatan Tambahan */}
            <div className="space-y-2">
              <Label htmlFor="notes" className="text-xs font-medium">
                Catatan Tambahan (Opsional)
              </Label>
              <Textarea
                id="notes"
                placeholder="Contoh: Transfer via rekening orang tua a.n. Bapak Sugiono"
                rows={2}
                value={studentNotes}
                onChange={(e) => setStudentNotes(e.target.value)}
                className="text-xs"
              />
            </div>
          </div>
        </Card>

            {/* Submit Button */}
            <div className="pt-2">
              <Button
                type="submit"
                size="lg"
                disabled={
                  isSubmitting ||
                  isUploading ||
                  !proofImageUrl ||
                  !selectedBillId ||
                  selectedBillStatus === "PENDING"
                }
                className="w-full h-12 text-sm font-semibold rounded-xl cursor-pointer gap-2 shadow-md"
              >
                {isSubmitting ? (
                  <>
                    <div className="size-4 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin" />
                    <span>Memproses Bukti Pembayaran...</span>
                  </>
                ) : (
                  <>
                    <span>Kirim Bukti Pembayaran</span>
                    <ArrowRightIcon className="size-4" />
                  </>
                )}
              </Button>

              <p className="text-[11px] text-muted-foreground text-center mt-3 flex items-center justify-center gap-1.5">
                <LockKeyIcon className="size-3.5 text-muted-foreground shrink-0" />
                <span>Pembayaran Anda aman & langsung tercatat di sistem bendahara dengan kode referensi unik.</span>
              </p>
            </div>
          </>
        )}
      </form>

      {/* ========================================================= */}
      {/* MODAL SUKSES PEMBAYARAN */}
      {/* ========================================================= */}
      <Dialog open={!!successResult} onOpenChange={(open) => !open && handleResetForm()}>
        <DialogContent className="sm:max-w-[460px] rounded-2xl p-5 sm:p-6">
          <DialogHeader className="text-center sm:text-center items-center">
            <div className="flex size-14 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 mb-2 ring-8 ring-emerald-500/5">
              <CheckCircleIcon className="size-8" />
            </div>
            <DialogTitle className="text-lg font-bold text-foreground">
              Pembayaran Berhasil Dikirim!
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground max-w-xs mx-auto">
              Bukti transfer Anda telah tersimpan dan siap diverifikasi oleh bendahara.
            </DialogDescription>
          </DialogHeader>

          {successResult && (
            <div className="py-2 space-y-3">
              {/* Reference Code Box */}
              <div className="p-3.5 rounded-xl bg-muted/50 border text-center">
                <span className="text-[10px] text-muted-foreground block font-medium uppercase tracking-wider">
                  KODE REFERENSI TRANSAKSI
                </span>
                <div className="flex items-center justify-center gap-2 mt-1">
                  <span className="font-mono text-lg font-bold text-foreground select-all">
                    {successResult.referenceCode}
                  </span>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="size-7 cursor-pointer hover:bg-muted"
                    onClick={() => handleCopy(successResult.referenceCode, "Kode Referensi")}
                    title="Salin kode referensi"
                  >
                    {copiedText === successResult.referenceCode ? (
                      <CheckIcon className="size-3.5 text-emerald-500" />
                    ) : (
                      <CopyIcon className="size-3.5" />
                    )}
                  </Button>
                </div>
                <p className="text-[10px] text-muted-foreground mt-0.5">
                  Simpan kode ini untuk melacak status verifikasi pembayaran Anda.
                </p>
              </div>

              {/* Rincian Ringkas Transaksi */}
              <div className="rounded-xl border p-3.5 text-xs space-y-2 bg-card/60">
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Mahasiswa:</span>
                  <span className="font-semibold text-foreground">{successResult.studentName}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Kelas:</span>
                  <span className="font-semibold text-foreground">{successResult.className}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Tagihan:</span>
                  <span className="font-semibold text-foreground text-right">{successResult.billTitle}</span>
                </div>
                <div className="flex justify-between items-center pt-1 border-t border-border/50">
                  <span className="text-muted-foreground">Nominal:</span>
                  <span className="font-bold text-emerald-600 dark:text-emerald-400 font-mono text-sm">
                    {formatRupiah(successResult.amountPaid)}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Status:</span>
                  <Badge variant="secondary" className="text-[10px] bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20 inline-flex items-center gap-1 font-medium">
                    <ClockIcon className="size-3 shrink-0" />
                    <span>Menunggu Verifikasi</span>
                  </Badge>
                </div>
              </div>

              {/* Tautan Spreadsheet Kas Langsung (Jika Tersedia) */}
              {successResult.googleSheetUrl && (
                <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-3.5 space-y-2.5">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <div className="flex size-7 items-center justify-center rounded-lg bg-emerald-600 text-white font-bold shrink-0 shadow-2xs">
                        <TableIcon className="size-4" />
                      </div>
                      <div className="min-w-0">
                        <span className="font-semibold text-xs text-foreground block truncate">
                          Live Google Spreadsheet Kas
                        </span>
                        <span className="text-[10px] text-muted-foreground block truncate">
                          Cek rekap dan pencatatan transparansi kas
                        </span>
                      </div>
                    </div>
                    <Badge variant="outline" className="border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-[10px] font-mono px-1.5 py-0 shrink-0">
                      Resmi
                    </Badge>
                  </div>

                  <div className="flex items-center gap-2 pt-1 border-t border-emerald-500/20">
                    <Button
                      type="button"
                      size="sm"
                      className="h-8 flex-1 text-xs gap-1.5 rounded-lg cursor-pointer bg-emerald-600 hover:bg-emerald-700 text-white font-medium shadow-xs"
                      onClick={() => window.open(successResult.googleSheetUrl!, "_blank", "noopener,noreferrer")}
                    >
                      <TableIcon className="size-3.5" />
                      <span>Buka Google Sheet</span>
                      <ArrowSquareOutIcon className="size-3" />
                    </Button>

                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="h-8 text-xs gap-1.5 rounded-lg cursor-pointer bg-background hover:bg-muted border-emerald-500/30 text-foreground"
                      onClick={() => handleCopy(successResult.googleSheetUrl!, "Tautan Spreadsheet")}
                      title="Salin tautan Google Sheet"
                    >
                      {copiedText === successResult.googleSheetUrl ? (
                        <>
                          <CheckIcon className="size-3.5 text-emerald-500" />
                          <span className="text-emerald-500">Tersalin</span>
                        </>
                      ) : (
                        <>
                          <CopyIcon className="size-3.5" />
                          <span>Salin Link</span>
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              )}

              {/* Tombol Bagikan Konfirmasi ke WhatsApp */}
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleShareSuccessToWA}
                className="w-full h-8.5 text-xs gap-1.5 rounded-xl cursor-pointer text-emerald-600 dark:text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/10 font-medium"
              >
                <WhatsappLogoIcon className="size-4" />
                <span>Kirim Konfirmasi ke WhatsApp Bendahara</span>
              </Button>
            </div>
          )}

          {/* Tombol Aksi Bawah */}
          <div className="flex flex-col sm:flex-row gap-2 pt-2 border-t border-border/50">
            <Button
              type="button"
              className="w-full sm:flex-1 h-9 text-xs font-semibold rounded-xl cursor-pointer bg-primary text-primary-foreground shadow-xs"
              onClick={() => {
                if (successResult) {
                  router.push(`/status?ref=${successResult.referenceCode}`);
                }
              }}
            >
              Cek Status Transaksi Sekarang
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={handleResetForm}
              className="w-full sm:w-auto h-9 text-xs rounded-xl cursor-pointer"
            >
              Bayar Tagihan Lain
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
