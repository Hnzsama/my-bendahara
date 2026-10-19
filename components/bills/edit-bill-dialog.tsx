"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { updateBillAction } from "@/actions/bills";
import type { BillItem } from "@/lib/bills-data";
import { formatRupiah } from "@/lib/utils";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { CopyIcon, CheckIcon } from "@phosphor-icons/react";

interface EditBillDialogProps {
  bill: BillItem | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function EditBillDialog({ bill, open, onOpenChange }: EditBillDialogProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = React.useState(false);

  const [title, setTitle] = React.useState("");
  const [slug, setSlug] = React.useState("");
  const [amount, setAmount] = React.useState<number | "">("");
  const [academicTerm, setAcademicTerm] = React.useState("");
  const [dueDate, setDueDate] = React.useState("");
  const [description, setDescription] = React.useState("");
  const [isActive, setIsActive] = React.useState(true);
  const [googleSheetInput, setGoogleSheetInput] = React.useState("");
  const [copiedEmail, setCopiedEmail] = React.useState(false);

  const handleCopyEmail = () => {
    navigator.clipboard.writeText("my-bendahara@manminmun.iam.gserviceaccount.com");
    setCopiedEmail(true);
    toast.success("Email Service Account disalin ke clipboard!");
    setTimeout(() => setCopiedEmail(false), 2000);
  };

  React.useEffect(() => {
    if (bill) {
      setTitle(bill.title);
      setSlug(bill.slug || "");
      setAmount(bill.amount);
      setAcademicTerm(bill.academicTerm || "Ganjil 2026/2027");
      setDueDate(bill.dueDate ? bill.dueDate.split("T")[0] : "");
      setDescription(bill.description || "");
      setIsActive(bill.isActive);
      setGoogleSheetInput(bill.googleSheetUrl || bill.googleSheetId || "");
    }
  }, [bill]);

  if (!bill) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!title.trim()) {
      toast.error("Judul tagihan wajib diisi");
      return;
    }

    if (!amount || Number(amount) <= 0) {
      toast.error("Nominal tagihan harus lebih dari 0");
      return;
    }

    setIsLoading(true);
    try {
      const res = await updateBillAction({
        id: bill.id,
        title: title.trim(),
        slug: slug.trim() || null,
        amount: Number(amount),
        academicTerm: academicTerm.trim(),
        dueDate: dueDate ? new Date(dueDate).toISOString() : null,
        description: description.trim() || null,
        isActive,
        googleSheetInput: googleSheetInput.trim() || "",
      });

      if (res.success) {
        toast.success(res.message || "Tagihan berhasil diperbarui!");
        onOpenChange(false);
        router.refresh();
      } else {
        toast.error(res.error || "Gagal memperbarui tagihan");
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Terjadi kesalahan";
      toast.error(msg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md rounded-xl p-5">
        <DialogHeader>
          <DialogTitle className="text-base font-semibold">
            Edit Tagihan Kas
          </DialogTitle>
          <DialogDescription className="text-xs">
            Perbarui informasi tagihan iuran kas angkatan.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4 py-2">
          {/* Judul Tagihan */}
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="edit-bill-title" className="text-xs font-medium">
              Judul Tagihan <span className="text-destructive">*</span>
            </Label>
            <Input
              id="edit-bill-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="text-xs h-9 rounded-lg"
              required
            />
          </div>

          {/* Slug URL Tagihan */}
          <div className="flex flex-col gap-1.5">
            <div className="flex items-center justify-between">
              <Label htmlFor="edit-bill-slug" className="text-xs font-medium">
                Slug Tautan Pembayaran (Opsional)
              </Label>
              <span className="text-[10px] text-muted-foreground font-mono">
                /bayar/{slug || "slug-otomatis"}
              </span>
            </div>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-mono text-muted-foreground select-none">
                /bayar/
              </span>
              <Input
                id="edit-bill-slug"
                placeholder="kas-angkatan-mi-2025"
                value={slug}
                onChange={(e) => setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "-"))}
                className="pl-16 text-xs h-9 rounded-lg font-mono"
              />
            </div>
            <p className="text-[10px] text-muted-foreground">
              Tautan khusus yang dapat langsung dibagikan ke grup WhatsApp/Telegram.
            </p>
          </div>

          {/* Nominal per Mahasiswa */}
          <div className="flex flex-col gap-1.5">
            <div className="flex items-center justify-between">
              <Label htmlFor="edit-bill-amount" className="text-xs font-medium">
                Nominal per Mahasiswa <span className="text-destructive">*</span>
              </Label>
              {amount !== "" && Number(amount) > 0 && (
                <span className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">
                  {formatRupiah(Number(amount))}
                </span>
              )}
            </div>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-medium text-muted-foreground">
                Rp
              </span>
              <Input
                id="edit-bill-amount"
                type="number"
                min={1000}
                step={500}
                value={amount}
                onChange={(e) => setAmount(e.target.value === "" ? "" : Number(e.target.value))}
                className="pl-9 text-xs h-9 rounded-lg"
                required
              />
            </div>
          </div>

          {/* Baris Dua Kolom: Tahun Ajaran & Batas Waktu */}
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="edit-bill-term" className="text-xs font-medium">
                Tahun Ajaran <span className="text-destructive">*</span>
              </Label>
              <Input
                id="edit-bill-term"
                value={academicTerm}
                onChange={(e) => setAcademicTerm(e.target.value)}
                className="text-xs h-9 rounded-lg"
                required
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="edit-bill-due-date" className="text-xs font-medium">
                Jatuh Tempo
              </Label>
              <Input
                id="edit-bill-due-date"
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="text-xs h-9 rounded-lg"
              />
            </div>
          </div>

          {/* Status Tagihan */}
          <div className="flex items-center justify-between rounded-lg border p-3">
            <div>
              <p className="text-xs font-medium">Status Tagihan</p>
              <p className="text-[11px] text-muted-foreground">
                {isActive ? "Aktif (Tampil di portal mahasiswa)" : "Diarsipkan / Non-Aktif"}
              </p>
            </div>
            <Button
              type="button"
              variant={isActive ? "default" : "outline"}
              size="sm"
              onClick={() => setIsActive(!isActive)}
              className="text-xs h-7 rounded-md cursor-pointer"
            >
              {isActive ? "Aktif" : "Non-Aktif"}
            </Button>
          </div>

          {/* Deskripsi Keperluan */}
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="edit-bill-desc" className="text-xs font-medium">
              Deskripsi & Keperluan Kas
            </Label>
            <Textarea
              id="edit-bill-desc"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="text-xs min-h-[70px] rounded-lg"
            />
          </div>

          {/* Integrasi Google Spreadsheet Khusus Tagihan Ini */}
          <div className="flex flex-col gap-2 rounded-xl border border-border/70 bg-muted/20 p-3.5 text-xs">
            <div className="flex items-center justify-between">
              <Label htmlFor="edit-bill-sheet" className="font-semibold text-foreground text-xs">
                Google Spreadsheet (Opsional)
              </Label>
              <span className="text-[10px] font-mono text-muted-foreground bg-muted px-1.5 py-0.5 rounded">
                Per-Tagihan
              </span>
            </div>

            <Input
              id="edit-bill-sheet"
              placeholder="Tempel link Google Sheet (https://docs.google.com/spreadsheets/d/...)"
              value={googleSheetInput}
              onChange={(e) => setGoogleSheetInput(e.target.value)}
              className="text-xs h-9 rounded-lg bg-background"
            />

            <div className="flex items-center justify-between gap-2 pt-1.5 border-t border-border/50 text-[11px]">
              <span className="text-muted-foreground shrink-0">Bagikan Editor ke:</span>
              <button
                type="button"
                onClick={handleCopyEmail}
                title="Klik untuk salin email Service Account"
                className="inline-flex items-center gap-1.5 text-[11px] font-mono text-foreground hover:text-primary transition-colors bg-background hover:bg-muted px-2 py-1 rounded-md border border-border/60 cursor-pointer max-w-[230px] truncate"
              >
                {copiedEmail ? (
                  <CheckIcon className="size-3.5 text-emerald-500 shrink-0" />
                ) : (
                  <CopyIcon className="size-3.5 text-muted-foreground shrink-0" />
                )}
                <span className="truncate">my-bendahara@manminmun...</span>
              </button>
            </div>
          </div>

          <DialogFooter className="gap-2 sm:justify-end pt-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="text-xs rounded-lg cursor-pointer"
              onClick={() => onOpenChange(false)}
              disabled={isLoading}
            >
              Batal
            </Button>
            <Button
              type="submit"
              size="sm"
              className="text-xs rounded-lg cursor-pointer bg-primary text-primary-foreground font-medium"
              disabled={isLoading}
            >
              {isLoading ? "Menyimpan..." : "Simpan Perubahan"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
