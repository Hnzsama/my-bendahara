"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { createPaymentMethodAction } from "@/actions/payment-methods";

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
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  PlusIcon,
  QrCodeIcon,
  UploadSimpleIcon,
  TrashIcon,
  CheckCircleIcon,
} from "@phosphor-icons/react";

interface CreateMethodDialogProps {
  existingPics?: string[];
}

export function CreateMethodDialog({ existingPics = [] }: CreateMethodDialogProps) {
  const router = useRouter();
  const [open, setOpen] = React.useState(false);
  const [isLoading, setIsLoading] = React.useState(false);
  const [isUploading, setIsUploading] = React.useState(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const [name, setName] = React.useState("");
  const [type, setType] = React.useState<"BANK_TRANSFER" | "QRIS" | "EWALLET">("BANK_TRANSFER");
  const [bankName, setBankName] = React.useState("BCA");
  const [accountNumber, setAccountNumber] = React.useState("");
  const [accountHolder, setAccountHolder] = React.useState("");
  const [picName, setPicName] = React.useState(existingPics[0] || "Siti Nurhaliza (Bendahara 1)");
  const [instructions, setInstructions] = React.useState("");
  const [qrisImageUrl, setQrisImageUrl] = React.useState("");

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append("file", file);
    formData.append("folder", "methods");

    setIsUploading(true);
    try {
      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      if (data.success && data.url) {
        setQrisImageUrl(data.url);
        toast.success("Gambar barcode QRIS berhasil diunggah!");
      } else {
        toast.error(data.error || "Gagal mengunggah berkas QRIS");
      }
    } catch {
      toast.error("Terjadi galat saat mengunggah gambar QRIS");
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim()) {
      toast.error("Nama metode pembayaran wajib diisi");
      return;
    }

    if (!accountNumber.trim()) {
      toast.error("Nomor rekening / telepon wajib diisi");
      return;
    }

    if (!accountHolder.trim()) {
      toast.error("Nama pemilik rekening wajib diisi");
      return;
    }

    if (!picName.trim()) {
      toast.error("Nama PIC Bendahara wajib diisi");
      return;
    }

    setIsLoading(true);
    try {
      const res = await createPaymentMethodAction({
        name: name.trim(),
        type,
        bankName: bankName.trim(),
        accountNumber: accountNumber.trim(),
        accountHolder: accountHolder.trim().toUpperCase(),
        picName: picName.trim(),
        instructions: instructions.trim() || null,
        qrisImageUrl: qrisImageUrl.trim() || null,
      });

      if (res.success) {
        toast.success(res.message || "Rekening / PIC berhasil ditambahkan!");
        setOpen(false);
        // Reset form
        setName("");
        setAccountNumber("");
        setAccountHolder("");
        setInstructions("");
        setQrisImageUrl("");
        router.refresh();
      } else {
        toast.error(res.error || "Gagal menambahkan rekening");
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
            <span>Tambah Rekening / PIC</span>
          </Button>
        }
      />
      <DialogContent className="max-w-md rounded-xl p-5 max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-base font-semibold">
            Tambah Kanal Pembayaran / PIC
          </DialogTitle>
          <DialogDescription className="text-xs">
            Daftarkan rekening bank, barcode QRIS, atau e-wallet yang dipegang oleh PIC Bendahara.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4 py-2">
          {/* Tipe Pembayaran & Bank */}
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="method-type" className="text-xs font-medium">
                Tipe Kanal <span className="text-destructive">*</span>
              </Label>
              <Select
                value={type}
                onValueChange={(val) => {
                  const newType = val as "BANK_TRANSFER" | "QRIS" | "EWALLET";
                  setType(newType);
                  if (newType === "QRIS") {
                    setBankName("QRIS");
                  }
                }}
                items={[
                  { label: "Transfer Bank", value: "BANK_TRANSFER" },
                  { label: "QRIS Kas", value: "QRIS" },
                  { label: "E-Wallet", value: "EWALLET" },
                ]}
              >
                <SelectTrigger size="sm" className="h-9 text-xs rounded-lg w-full">
                  <SelectValue placeholder="Pilih tipe" />
                </SelectTrigger>
                <SelectContent align="start">
                  <SelectGroup>
                    <SelectItem value="BANK_TRANSFER">Transfer Bank</SelectItem>
                    <SelectItem value="QRIS">QRIS Kas</SelectItem>
                    <SelectItem value="EWALLET">E-Wallet</SelectItem>
                  </SelectGroup>
                </SelectContent>
              </Select>
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="method-bank" className="text-xs font-medium">
                Nama Bank / E-Wallet <span className="text-destructive">*</span>
              </Label>
              <Input
                id="method-bank"
                placeholder="BCA, Mandiri, QRIS, GoPay"
                value={bankName}
                onChange={(e) => setBankName(e.target.value)}
                className="text-xs h-9 rounded-lg"
                required
              />
            </div>
          </div>

          {/* Nama Label Metode */}
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="method-name" className="text-xs font-medium">
              Nama Tampilan Kanal <span className="text-destructive">*</span>
            </Label>
            <Input
              id="method-name"
              placeholder="Contoh: BCA Kas Angkatan - Siti"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="text-xs h-9 rounded-lg"
              required
            />
          </div>

          {/* Nomor Rekening & Atas Nama */}
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="method-number" className="text-xs font-medium">
                Nomor Rekening / HP <span className="text-destructive">*</span>
              </Label>
              <Input
                id="method-number"
                placeholder="8735019284"
                value={accountNumber}
                onChange={(e) => setAccountNumber(e.target.value)}
                className="text-xs h-9 rounded-lg font-mono"
                required
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="method-holder" className="text-xs font-medium">
                Atas Nama (A.N.) <span className="text-destructive">*</span>
              </Label>
              <Input
                id="method-holder"
                placeholder="SITI NURHALIZA"
                value={accountHolder}
                onChange={(e) => setAccountHolder(e.target.value)}
                className="text-xs h-9 rounded-lg"
                required
              />
            </div>
          </div>

          {/* Nama PIC Bendahara */}
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="method-pic" className="text-xs font-medium">
              Nama PIC Bendahara Pemilik <span className="text-destructive">*</span>
            </Label>
            <Input
              id="method-pic"
              placeholder="Contoh: Siti Nurhaliza (Bendahara 1)"
              value={picName}
              onChange={(e) => setPicName(e.target.value)}
              className="text-xs h-9 rounded-lg"
              required
            />
          </div>

          {/* Upload Gambar Barcode QRIS */}
          {type === "QRIS" && (
            <div className="flex flex-col gap-2 rounded-xl border border-border/70 bg-muted/20 p-3.5">
              <div className="flex items-center justify-between">
                <Label className="text-xs font-semibold text-foreground">
                  Upload Barcode QRIS
                </Label>
                {qrisImageUrl && (
                  <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-medium inline-flex items-center gap-1">
                    <CheckCircleIcon className="size-3 shrink-0" />
                    <span>Barcode Terpasang</span>
                  </span>
                )}
              </div>

              <div className="flex items-center gap-3.5 pt-1">
                {/* Preview Thumbnail */}
                <div className="relative size-20 shrink-0 overflow-hidden rounded-lg border border-border/80 bg-white p-1 shadow-2xs flex items-center justify-center">
                  {qrisImageUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={qrisImageUrl}
                      alt="Preview Barcode QRIS"
                      className="size-full object-contain"
                    />
                  ) : (
                    <div className="flex flex-col items-center justify-center text-muted-foreground p-1 text-center">
                      <QrCodeIcon className="size-8 text-muted-foreground/60" />
                      <span className="text-[8px] mt-0.5 text-muted-foreground">Belum ada</span>
                    </div>
                  )}
                </div>

                {/* Tombol Unggah File & Deskripsi */}
                <div className="flex flex-1 flex-col gap-1.5">
                  <input
                    type="file"
                    ref={fileInputRef}
                    accept="image/png,image/jpeg,image/webp,image/svg+xml"
                    className="hidden"
                    onChange={handleFileUpload}
                  />

                  <div className="flex flex-wrap gap-2">
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      disabled={isUploading}
                      onClick={() => fileInputRef.current?.click()}
                      className="h-8 text-xs rounded-lg gap-1.5 cursor-pointer shadow-xs"
                    >
                      <UploadSimpleIcon className="size-3.5" />
                      <span>{isUploading ? "Mengunggah..." : qrisImageUrl ? "Ganti Gambar" : "Unggah QRIS"}</span>
                    </Button>

                    {qrisImageUrl && (
                      <Button
                        type="button"
                        size="sm"
                        variant="ghost"
                        onClick={() => setQrisImageUrl("")}
                        className="h-8 text-xs text-rose-600 hover:text-rose-700 hover:bg-rose-500/10 rounded-lg cursor-pointer gap-1 px-2"
                      >
                        <TrashIcon className="size-3.5" />
                        <span>Hapus</span>
                      </Button>
                    )}
                  </div>
                  <p className="text-[10px] text-muted-foreground">
                    Unggah gambar barcode QRIS (PNG, JPG, SVG). Mahasiswa dapat memindai atau mengunduh QRIS ini.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Petunjuk Transfer */}
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="method-instructions" className="text-xs font-medium">
              Petunjuk Transfer (Opsional)
            </Label>
            <Textarea
              id="method-instructions"
              placeholder="Contoh: Scan QRIS menggunakan mobile banking atau e-wallet (GoPay, OVO, Dana). Simpan bukti transfer..."
              value={instructions}
              onChange={(e) => setInstructions(e.target.value)}
              className="text-xs min-h-[60px] rounded-lg"
            />
          </div>

          <DialogFooter className="gap-2 sm:justify-end pt-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="text-xs rounded-lg cursor-pointer"
              onClick={() => setOpen(false)}
              disabled={isLoading || isUploading}
            >
              Batal
            </Button>
            <Button
              type="submit"
              size="sm"
              className="text-xs rounded-lg cursor-pointer bg-primary text-primary-foreground font-medium"
              disabled={isLoading || isUploading}
            >
              {isLoading ? "Menyimpan..." : "Simpan Rekening"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
