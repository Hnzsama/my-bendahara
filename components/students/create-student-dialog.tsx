"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { createStudentAction } from "@/actions/students";
import type { ClassItem } from "@/lib/students-data";

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
  DialogTrigger,
} from "@/components/ui/dialog";
import { UserPlusIcon } from "@phosphor-icons/react";

interface CreateStudentDialogProps {
  classes: ClassItem[];
  defaultClassId?: string;
  trigger?: React.ReactNode;
}

export function CreateStudentDialog({
  classes,
  defaultClassId,
  trigger,
}: CreateStudentDialogProps) {
  const router = useRouter();
  const [open, setOpen] = React.useState(false);
  const [isLoading, setIsLoading] = React.useState(false);

  const [nim, setNim] = React.useState("");
  const [name, setName] = React.useState("");
  const [phone, setPhone] = React.useState("");
  const [classId, setClassId] = React.useState(
    defaultClassId || (classes.length > 0 ? classes[0].id : "")
  );

  React.useEffect(() => {
    if (defaultClassId) {
      setClassId(defaultClassId);
    } else if (classes.length > 0 && !classId) {
      setClassId(classes[0].id);
    }
  }, [defaultClassId, classes, classId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim()) {
      toast.error("Nama mahasiswa wajib diisi");
      return;
    }

    if (!classId) {
      toast.error("Wajib memilih kelas untuk mahasiswa ini");
      return;
    }

    setIsLoading(true);
    try {
      const res = await createStudentAction({
        nim: nim.trim() || null,
        name: name.trim(),
        phone: phone.trim() || null,
        classId,
      });

      if (res.success) {
        toast.success(res.message);
        setOpen(false);
        setNim("");
        setName("");
        setPhone("");
        router.refresh();
      } else {
        toast.error(res.error || "Gagal menambahkan mahasiswa");
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
              <UserPlusIcon className="size-4" />
              <span>Tambah Mahasiswa</span>
            </Button>
          )
        }
      />
      <DialogContent className="sm:max-w-[480px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <div className="flex items-center gap-2">
              <div className="flex size-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <UserPlusIcon className="size-5" />
              </div>
              <div>
                <DialogTitle>Tambah Mahasiswa Baru</DialogTitle>
                <DialogDescription>
                  Daftarkan mahasiswa ke dalam kelas angkatan.
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="studentNim">
                Nomor Induk Mahasiswa (NIM) <span className="text-muted-foreground text-xs font-normal">(Opsional)</span>
              </Label>
              <Input
                id="studentNim"
                placeholder="Misal: 250101015 (opsional)"
                value={nim}
                onChange={(e) => setNim(e.target.value)}
                className="font-mono"
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="studentName">
                Nama Lengkap <span className="text-destructive">*</span>
              </Label>
              <Input
                id="studentName"
                placeholder="Misal: Ahmad Fauzi Pratama"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="studentClass">
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
                <SelectTrigger id="studentClass" className="w-full">
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
              <Label htmlFor="studentPhone">Nomor WhatsApp (Opsional)</Label>
              <Input
                id="studentPhone"
                placeholder="Misal: 081234567890"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                Digunakan untuk broadcast penagihan iuran kas & konfirmasi via WA.
              </p>
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
              {isLoading ? "Menyimpan..." : "Simpan Mahasiswa"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
