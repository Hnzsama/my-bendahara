"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { createClassAction } from "@/actions/classes";

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
import { PlusIcon, GraduationCapIcon } from "@phosphor-icons/react";

interface CreateClassDialogProps {
  trigger?: React.ReactNode;
}

export function CreateClassDialog({ trigger }: CreateClassDialogProps) {
  const router = useRouter();
  const [open, setOpen] = React.useState(false);
  const [isLoading, setIsLoading] = React.useState(false);

  const [name, setName] = React.useState("");
  const [academicYear, setAcademicYear] = React.useState("2023/2024");
  const [description, setDescription] = React.useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim()) {
      toast.error("Nama kelas wajib diisi");
      return;
    }

    if (!academicYear.trim()) {
      toast.error("Tahun ajaran/akademik wajib diisi");
      return;
    }

    setIsLoading(true);
    try {
      const res = await createClassAction({
        name: name.trim(),
        academicYear: academicYear.trim(),
        description: description.trim() || null,
      });

      if (res.success) {
        toast.success(res.message);
        setOpen(false);
        setName("");
        setDescription("");
        router.refresh();
      } else {
        toast.error(res.error || "Gagal membuat kelas");
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
          (trigger as React.ReactElement) || (
            <Button size="sm" className="gap-2 cursor-pointer">
              <PlusIcon className="size-4" />
              <span>Tambah Kelas</span>
            </Button>
          )
        }
      />
      <DialogContent className="sm:max-w-[480px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <div className="flex items-center gap-2">
              <div className="flex size-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <GraduationCapIcon className="size-5" />
              </div>
              <div>
                <DialogTitle>Tambah Kelas Baru</DialogTitle>
                <DialogDescription>
                  Daftarkan kelas atau rombongan belajar baru untuk angkatan.
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="className">
                Nama Kelas <span className="text-destructive">*</span>
              </Label>
              <Input
                id="className"
                placeholder="Misal: TI-2023-C, SI-2024-A"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
              <p className="text-xs text-muted-foreground">
                Nama kelas harus unik dan akan menjadi tab di Google Spreadsheet tagihan.
              </p>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="academicYear">
                Tahun Ajaran / Angkatan <span className="text-destructive">*</span>
              </Label>
              <Input
                id="academicYear"
                placeholder="Misal: 2023/2024"
                value={academicYear}
                onChange={(e) => setAcademicYear(e.target.value)}
                required
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="description">Catatan / Deskripsi (Opsional)</Label>
              <Textarea
                id="description"
                placeholder="Keterangan tambahan mengenai kelas ini..."
                rows={3}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={isLoading}
            >
              Batal
            </Button>
            <Button type="submit" disabled={isLoading} className="cursor-pointer">
              {isLoading ? "Menyimpan..." : "Simpan Kelas"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
