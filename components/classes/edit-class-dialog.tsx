"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { updateClassAction } from "@/actions/classes";
import type { ClassItem } from "@/lib/students-data";

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
import { PencilSimpleIcon } from "@phosphor-icons/react";

interface EditClassDialogProps {
  cls: ClassItem | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function EditClassDialog({ cls, open, onOpenChange }: EditClassDialogProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = React.useState(false);

  const [name, setName] = React.useState("");
  const [academicYear, setAcademicYear] = React.useState("");
  const [description, setDescription] = React.useState("");

  React.useEffect(() => {
    if (cls) {
      setName(cls.name);
      setAcademicYear(cls.academicYear);
      setDescription(cls.description || "");
    }
  }, [cls]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!cls) return;

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
      const res = await updateClassAction({
        id: cls.id,
        name: name.trim(),
        academicYear: academicYear.trim(),
        description: description.trim() || null,
      });

      if (res.success) {
        toast.success(res.message);
        onOpenChange(false);
        router.refresh();
      } else {
        toast.error(res.error || "Gagal memperbarui kelas");
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
      <DialogContent className="sm:max-w-[480px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <div className="flex items-center gap-2">
              <div className="flex size-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <PencilSimpleIcon className="size-5" />
              </div>
              <div>
                <DialogTitle>Edit Informasi Kelas</DialogTitle>
                <DialogDescription>
                  Ubah data identitas kelas {cls?.name}.
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="editClassName">
                Nama Kelas <span className="text-destructive">*</span>
              </Label>
              <Input
                id="editClassName"
                placeholder="Misal: TI-2023-A"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="editAcademicYear">
                Tahun Ajaran / Angkatan <span className="text-destructive">*</span>
              </Label>
              <Input
                id="editAcademicYear"
                placeholder="Misal: 2023/2024"
                value={academicYear}
                onChange={(e) => setAcademicYear(e.target.value)}
                required
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="editDescription">Catatan / Deskripsi (Opsional)</Label>
              <Textarea
                id="editDescription"
                placeholder="Keterangan tambahan..."
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
              onClick={() => onOpenChange(false)}
              disabled={isLoading}
            >
              Batal
            </Button>
            <Button type="submit" disabled={isLoading} className="cursor-pointer">
              {isLoading ? "Menyimpan..." : "Simpan Perubahan"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
