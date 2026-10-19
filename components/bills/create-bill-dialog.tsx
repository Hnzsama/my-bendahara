"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { createBillAction } from "@/actions/bills";
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
  DialogTrigger,
} from "@/components/ui/dialog";
import { PlusIcon, CopyIcon, CheckIcon } from "@phosphor-icons/react";

interface CreateBillDialogProps {
  defaultAcademicTerm?: string;
}

export function CreateBillDialog({ defaultAcademicTerm = "Ganjil 2026/2027" }: CreateBillDialogProps) {
  const router = useRouter();
  const [open, setOpen] = React.useState(false);
  const [isLoading, setIsLoading] = React.useState(false);

  const [title, setTitle] = React.useState("");
  const [slug, setSlug] = React.useState("");
  const [isSlugTouched, setIsSlugTouched] = React.useState(false);
  const [amount, setAmount] = React.useState<number | "">("");
  const [academicTerm, setAcademicTerm] = React.useState(defaultAcademicTerm);
  const [dueDate, setDueDate] = React.useState("");
  const [description, setDescription] = React.useState("");
  const [googleSheetInput, setGoogleSheetInput] = React.useState("");
  const [copiedEmail, setCopiedEmail] = React.useState(false);

  const handleCopyEmail = () => {
    navigator.clipboard.writeText("my-bendahara@manminmun.iam.gserviceaccount.com");
    setCopiedEmail(true);
    toast.success("Email Service Account disalin ke clipboard!");
    setTimeout(() => setCopiedEmail(false), 2000);
  };

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setTitle(val);
    if (!isSlugTouched) {
      const generated = val
        .toLowerCase()
        .trim()
        .replace(/[^\w\s-]/g, "")
        .replace(/[\s_-]+/g, "-")
        .replace(/^-+|-+$/g, "");
      setSlug(generated);
    }
  };

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

    if (!academicTerm.trim()) {
      toast.error("Tahun ajaran wajib diisi");
      return;
    }

    setIsLoading(true);
    try {
      const res = await createBillAction({
        title: title.trim(),
        slug: slug.trim() || null,
        amount: Number(amount),
        academicTerm: academicTerm.trim(),
        dueDate: dueDate ? new Date(dueDate).toISOString() : null,
        description: description.trim() || null,
        googleSheetInput: googleSheetInput.trim() || null,
      });

      if (res.success) {
        toast.success(res.message || "Tagihan berhasil dibuat!");
        setOpen(false);
        // Reset form
        setTitle("");
        setSlug("");
        setIsSlugTouched(false);
        setAmount("");
        setDueDate("");
        setDescription("");
        setGoogleSheetInput("");
        router.refresh();
      } else {
        toast.error(res.error || "Gagal membuat tagihan");
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Terjadi kesalahan";
      toast.error(msg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          <Button size="sm" className="h-8 gap-1.5 text-xs rounded-lg cursor-pointer bg-primary text-primary-foreground font-medium shadow-xs">
            <PlusIcon className="size-4" />
            <span>Buat Tagihan Baru</span>
          </Button>
        }
      />
      <DialogContent className="max-w-md rounded-xl p-5">
        <DialogHeader>
          <DialogTitle className="text-base font-semibold">
            Buat Tagihan Kas Baru
          </DialogTitle>
          <DialogDescription className="text-xs">
            Tagihan ini akan otomatis muncul pada portal mahasiswa untuk pembayaran kas.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4 py-2">
          {/* Judul Tagihan */}
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="bill-title" className="text-xs font-medium">
              Judul Tagihan <span className="text-destructive">*</span>
            </Label>
            <Input
              id="bill-title"
              placeholder="Contoh: Iuran Kas Bulan November 2026"
              value={title}
              onChange={handleTitleChange}
              className="text-xs h-9 rounded-lg"
              required
            />
          </div>

          {/* Slug URL Tagihan */}
          <div className="flex flex-col gap-1.5">
            <div className="flex items-center justify-between">
              <Label htmlFor="bill-slug" className="text-xs font-medium">
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
                id="bill-slug"
                placeholder="iuran-kas-november-2026"
                value={slug}
                onChange={(e) => {
                  setIsSlugTouched(true);
                  setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "-"));
                }}
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
              <Label htmlFor="bill-amount" className="text-xs font-medium">
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
                id="bill-amount"
                type="number"
                min={1000}
                step={500}
                placeholder="20000"
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
              <Label htmlFor="bill-term" className="text-xs font-medium">
                Tahun Ajaran / Semester <span className="text-destructive">*</span>
              </Label>
              <Input
                id="bill-term"
                placeholder="Ganjil 2026/2027"
                value={academicTerm}
                onChange={(e) => setAcademicTerm(e.target.value)}
                className="text-xs h-9 rounded-lg"
                required
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="bill-due-date" className="text-xs font-medium">
                Jatuh Tempo (Opsional)
              </Label>
              <Input
                id="bill-due-date"
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="text-xs h-9 rounded-lg"
              />
            </div>
          </div>

          {/* Deskripsi Keperluan */}
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="bill-desc" className="text-xs font-medium">
              Deskripsi & Keperluan Kas (Opsional)
            </Label>
            <Textarea
              id="bill-desc"
              placeholder="Jelaskan peruntukan kas ini (misal: konsumsi tentir, sewa proyektor, makrab angkatan)..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="text-xs min-h-[70px] rounded-lg"
            />
          </div>

          {/* Integrasi Google Spreadsheet Khusus Tagihan Ini */}
          <div className="flex flex-col gap-2 rounded-xl border border-border/70 bg-muted/20 p-3.5 text-xs">
            <div className="flex items-center justify-between">
              <Label htmlFor="bill-sheet" className="font-semibold text-foreground text-xs">
                Google Spreadsheet (Opsional)
              </Label>
              <span className="text-[10px] font-mono text-muted-foreground bg-muted px-1.5 py-0.5 rounded">
                Per-Tagihan
              </span>
            </div>

            <Input
              id="bill-sheet"
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
              onClick={() => setOpen(false)}
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
              {isLoading ? "Menyimpan..." : "Simpan Tagihan"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
