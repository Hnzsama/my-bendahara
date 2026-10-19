"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { updateStudentAction } from "@/actions/students";
import type { StudentItem, ClassItem } from "@/lib/students-data";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import { PencilSimpleIcon } from "@phosphor-icons/react";

interface EditStudentDialogProps {
  student: StudentItem | null;
  classes: ClassItem[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function EditStudentDialog({
  student,
  classes,
  open,
  onOpenChange,
}: EditStudentDialogProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = React.useState(false);

  const [nim, setNim] = React.useState("");
  const [name, setName] = React.useState("");
  const [phone, setPhone] = React.useState("");
  const [classId, setClassId] = React.useState("");

  React.useEffect(() => {
    if (student) {
      setNim(student.nim || "");
      setName(student.name);
      setPhone(student.phone || "");
      setClassId(student.classId);
    }
  }, [student]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!student) return;

    if (!name.trim()) {
      toast.error("Nama mahasiswa wajib diisi");
      return;
    }

    if (!classId) {
      toast.error("Wajib memilih kelas");
      return;
    }

    setIsLoading(true);
    try {
      const res = await updateStudentAction({
        id: student.id,
        nim: nim.trim() || null,
        name: name.trim(),
        phone: phone.trim() || null,
        classId,
      });

      if (res.success) {
        toast.success(res.message);
        onOpenChange(false);
        router.refresh();
      } else {
        toast.error(res.error || "Gagal memperbarui data mahasiswa");
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
                <DialogTitle>Edit Data Mahasiswa</DialogTitle>
                <DialogDescription>
                  Ubah data profil atau pindahkan mahasiswa ke kelas lain.
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="editStudentNim">
                Nomor Induk Mahasiswa (NIM) <span className="text-muted-foreground text-xs font-normal">(Opsional)</span>
              </Label>
              <Input
                id="editStudentNim"
                placeholder="Misal: 250101015 (opsional)"
                value={nim}
                onChange={(e) => setNim(e.target.value)}
                className="font-mono"
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="editStudentName">
                Nama Lengkap <span className="text-destructive">*</span>
              </Label>
              <Input
                id="editStudentName"
                placeholder="Misal: Ahmad Fauzi Pratama"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="editStudentClass">
                Kelas / Rombel <span className="text-destructive">*</span>
              </Label>
              <Select
                value={classId}
                onValueChange={(val) => setClassId(val ?? "")}
                items={classes.map((cls) => ({
                  label: `${cls.name} (${cls.academicYear})`,
                  value: cls.id,
                }))}
              >
                <SelectTrigger id="editStudentClass" className="w-full">
                  <SelectValue placeholder="Pilih kelas...">
                    {(val: string | null) => {
                      const cls = classes.find((c) => c.id === val);
                      return cls ? `${cls.name} (${cls.academicYear})` : undefined;
                    }}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {classes.map((cls) => (
                    <SelectItem key={cls.id} value={cls.id}>
                      {cls.name} ({cls.academicYear})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="editStudentPhone">Nomor WhatsApp (Opsional)</Label>
              <Input
                id="editStudentPhone"
                placeholder="Misal: 081234567890"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
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
