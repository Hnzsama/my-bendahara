"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { updatePaymentMethodAction } from "@/actions/payment-methods";
import type { PaymentMethodItem } from "@/lib/methods-data";

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
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  QrCodeIcon,
  UploadSimpleIcon,
  TrashIcon,
  CheckCircleIcon,
} from "@phosphor-icons/react";

interface EditMethodDialogProps {
  method: PaymentMethodItem | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function EditMethodDialog({ method, open, onOpenChange }: EditMethodDialogProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = React.useState(false);
  const [isUploading, setIsUploading] = React.useState(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const [name, setName] = React.useState("");
  const [type, setType] = React.useState<"BANK_TRANSFER" | "QRIS" | "EWALLET">("BANK_TRANSFER");
  const [bankName, setBankName] = React.useState("");
  const [accountNumber, setAccountNumber] = React.useState("");
  const [accountHolder, setAccountHolder] = React.useState("");
  const [picName, setPicName] = React.useState("");
  const [instructions, setInstructions] = React.useState("");
  const [qrisImageUrl, setQrisImageUrl] = React.useState("");
  const [isActive, setIsActive] = React.useState(true);

  React.useEffect(() => {
    if (method) {
      setName(method.name);
      setType(method.type);
      setBankName(method.bankName);
      setAccountNumber(method.accountNumber);
      setAccountHolder(method.accountHolder);
      setPicName(method.picName);
      setInstructions(method.instructions || "");
      setQrisImageUrl(method.qrisImageUrl || "");
      setIsActive(method.isActive);
    }
  }, [method]);

  if (!method) return null;

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
      // Reset input value agar dapat memilih file yang sama jika diperlukan
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
      const res = await updatePaymentMethodAction({
        id: method.id,
        name: name.trim(),
        type,
        bankName: bankName.trim(),
        accountNumber: accountNumber.trim(),
        accountHolder: accountHolder.trim().toUpperCase(),
        picName: picName.trim(),
        instructions: instructions.trim() || null,
        qrisImageUrl: qrisImageUrl.trim() || null,
        isActive,
      });

      if (res.success) {
        toast.success(res.message || "Rekening / PIC berhasil diperbarui!");
        onOpenChange(false);
        router.refresh();
      } else {
        toast.error(res.error || "Gagal memperbarui rekening");
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
      <DialogContent className="max-w-md rounded-xl p-5 max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-base font-semibold">
            Edit Rekening / PIC Bendahara
          </DialogTitle>
          <DialogDescription className="text-xs">
            Perbarui data nomor rekening, atas nama, barcode QRIS, atau PIC pengelola.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4 py-2">
          {/* Tipe Pembayaran & Bank */}
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="edit-method-type" className="text-xs font-medium">
                Tipe Kanal <span className="text-destructive">*</span>
              </Label>
              <Select
                value={type}
                onValueChange={(val) => setType(val as "BANK_TRANSFER" | "QRIS" | "EWALLET")}
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
              <Label htmlFor="edit-method-bank" className="text-xs font-medium">
                Nama Bank / E-Wallet <span className="text-destructive">*</span>
              </Label>
              <Input
                id="edit-method-bank"
                value={bankName}
                onChange={(e) => setBankName(e.target.value)}
                className="text-xs h-9 rounded-lg"
                required
              />
            </div>
          </div>

          {/* Nama Label Metode */}
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="edit-method-name" className="text-xs font-medium">
              Nama Tampilan Kanal <span className="text-destructive">*</span>
            </Label>
            <Input
              id="edit-method-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="text-xs h-9 rounded-lg"
              required
            />
          </div>

          {/* Nomor Rekening & Atas Nama */}
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="edit-method-number" className="text-xs font-medium">
                Nomor Rekening / HP <span className="text-destructive">*</span>
              </Label>
              <Input
                id="edit-method-number"
                value={accountNumber}
                onChange={(e) => setAccountNumber(e.target.value)}
                className="text-xs h-9 rounded-lg font-mono"
                required
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="edit-method-holder" className="text-xs font-medium">
                Atas Nama (A.N.) <span className="text-destructive">*</span>
              </Label>
              <Input
                id="edit-method-holder"
                value={accountHolder}
                onChange={(e) => setAccountHolder(e.target.value)}
                className="text-xs h-9 rounded-lg"
                required
              />
            </div>
          </div>

          {/* Nama PIC Bendahara */}
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="edit-method-pic" className="text-xs font-medium">
              Nama PIC Bendahara Pemilik <span className="text-destructive">*</span>
            </Label>
            <Input
              id="edit-method-pic"
              value={picName}
              onChange={(e) => setPicName(e.target.value)}
              className="text-xs h-9 rounded-lg"
              required
            />
          </div>

          {/* Bagian Khusus Upload Gambar Barcode QRIS */}
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

          {/* Status Aktif */}
          <div className="flex items-center justify-between rounded-lg border p-3">
            <div>
              <p className="text-xs font-medium">Status Rekening</p>
              <p className="text-[11px] text-muted-foreground">
                {isActive ? "Aktif (Tampil di formulir mahasiswa)" : "Non-Aktif (Disembunyikan)"}
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

          {/* Petunjuk Transfer */}
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="edit-method-instructions" className="text-xs font-medium">
              Petunjuk Transfer
            </Label>
            <Textarea
              id="edit-method-instructions"
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
              onClick={() => onOpenChange(false)}
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
              {isLoading ? "Menyimpan..." : "Simpan Perubahan"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
