"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { bulkCreateStudentsAction } from "@/actions/students";
import type { ClassItem } from "@/lib/students-data";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
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
import {
  FileCsvIcon,
  CheckCircleIcon,
  InfoIcon,
} from "@phosphor-icons/react";

interface BulkImportDialogProps {
  classes: ClassItem[];
  defaultClassId?: string;
  trigger?: React.ReactNode;
}

interface ParsedStudent {
  nim: string | null;
  name: string;
  phone: string | null;
}

export function BulkImportDialog({
  classes,
  defaultClassId,
  trigger,
}: BulkImportDialogProps) {
  const router = useRouter();
  const [open, setOpen] = React.useState(false);
  const [isLoading, setIsLoading] = React.useState(false);

  const [rawText, setRawText] = React.useState("");
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

  // Parser otomatis: mengenali Tab (\t), Koma (,), Titik-koma (;), atau Dash (-)
  const parsedStudents: ParsedStudent[] = React.useMemo(() => {
    if (!rawText.trim()) return [];

    const lines = rawText.split("\n");
    const result: ParsedStudent[] = [];

    for (const rawLine of lines) {
      const line = rawLine.trim();
      if (!line) continue;

      // Cek delimiter
      let parts: string[] = [];
      if (line.includes("\t")) {
        parts = line.split("\t");
      } else if (line.includes(";")) {
        parts = line.split(";");
      } else if (line.includes(",")) {
        parts = line.split(",");
      } else if (line.includes(" - ")) {
        parts = line.split(" - ");
      } else {
        // Fallback: kata pertama sebagai NIM, sisanya sebagai nama
        const spaceIdx = line.indexOf(" ");
        if (spaceIdx > 0) {
          parts = [line.slice(0, spaceIdx), line.slice(spaceIdx + 1)];
        } else {
          parts = [line];
        }
      }

      const cleanedParts = parts.map((p) => p.trim()).filter(Boolean);
      if (cleanedParts.length >= 2) {
        // Cek jika kolom pertama terlihat seperti NIM (digit) atau nama
        const isFirstColNim = /^[0-9]+$/.test(cleanedParts[0]);
        if (isFirstColNim) {
          result.push({
            nim: cleanedParts[0],
            name: cleanedParts[1],
            phone: cleanedParts[2] || null,
          });
        } else {
          result.push({
            nim: null,
            name: cleanedParts[0],
            phone: cleanedParts[1] || null,
          });
        }
      } else if (cleanedParts.length === 1 && cleanedParts[0].length >= 2) {
        result.push({
          nim: null,
          name: cleanedParts[0],
          phone: null,
        });
      }
    }

    return result;
  }, [rawText]);

  const handleInsertSample = () => {
    const sample = `230101011\tAhmad Rayhan Alfarizi\t081234567891\n230101012\tBintang Maharani Putri\t081234567892\n230101013\tChandra Eka Prasetya\t081234567893\n230101014\tDewi Lestari Kusuma\t081234567894`;
    setRawText(sample);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!classId) {
      toast.error("Wajib memilih kelas tujuan terlebih dahulu.");
      return;
    }

    if (parsedStudents.length === 0) {
      toast.error("Belum ada data mahasiswa valid yang terdeteksi.");
      return;
    }

    setIsLoading(true);
    try {
      const res = await bulkCreateStudentsAction({
        classId,
        students: parsedStudents,
      });

      if (res.success) {
        toast.success(res.message);
        setOpen(false);
        setRawText("");
        router.refresh();
      } else {
        toast.error(res.error || "Gagal menyimpan daftar mahasiswa");
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
            <Button variant="outline" size="sm" className="gap-2 cursor-pointer">
              <FileCsvIcon className="size-4" />
              <span>Import Cepat / Paste</span>
            </Button>
          )
        }
      />
      <DialogContent className="sm:max-w-[620px] max-h-[90vh] overflow-y-auto">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <div className="flex items-center gap-2">
              <div className="flex size-9 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                <FileCsvIcon className="size-5" />
              </div>
              <div>
                <DialogTitle>Import Cepat Mahasiswa</DialogTitle>
                <DialogDescription>
                  Salin dan tempel daftar mahasiswa langsung dari Excel, Google Sheets, atau teks.
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="bulkClass">
                Kelas Tujuan <span className="text-destructive">*</span>
              </Label>
              <Select
                value={classId}
                onValueChange={(val) => setClassId(val ?? "")}
                items={classes.map((cls) => ({
                  label: cls.name,
                  value: cls.id,
                }))}
              >
                <SelectTrigger id="bulkClass" className="w-full">
                  <SelectValue placeholder="Pilih kelas tujuan...">
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

            <div className="grid gap-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="bulkInput">
                  Teks Daftar Mahasiswa <span className="text-destructive">*</span>
                </Label>
                <button
                  type="button"
                  onClick={handleInsertSample}
                  className="text-xs text-primary hover:underline cursor-pointer"
                >
                  Isi contoh format
                </button>
              </div>
              <Textarea
                id="bulkInput"
                placeholder={`Format baris: NIM [Tab/Koma] Nama [Tab/Koma] WhatsApp (opsional)\nContoh:\n230101011\tAhmad Rayhan\t081234567891\n230101012\tBintang Maharani\t081234567892`}
                rows={6}
                value={rawText}
                onChange={(e) => setRawText(e.target.value)}
                className="font-mono text-xs leading-relaxed"
              />
              <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
                <InfoIcon className="size-3.5 shrink-0" />
                <span>
                  Tip: Anda bisa langsung memblok dan meng-copy 2 atau 3 kolom dari Excel/Sheets lalu paste di sini.
                </span>
              </div>
            </div>

            {/* Live Parser Preview */}
            <div className="rounded-lg border bg-muted/40 p-3">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                  <CheckCircleIcon className="size-4 text-emerald-500" />
                  Pratinjau Hasil Parsing
                </span>
                <Badge variant={parsedStudents.length > 0 ? "default" : "secondary"} className="text-[11px]">
                  {parsedStudents.length} Mahasiswa Terdeteksi
                </Badge>
              </div>

              {parsedStudents.length === 0 ? (
                <p className="text-xs text-muted-foreground italic text-center py-4">
                  Tempelkan teks di atas untuk melihat pratinjau daftar mahasiswa.
                </p>
              ) : (
                <div className="space-y-1.5 max-h-40 overflow-y-auto pr-1">
                  {parsedStudents.slice(0, 5).map((st, i) => (
                    <div
                      key={i}
                      className="flex items-center justify-between text-xs bg-background p-2 rounded border"
                    >
                      <div className="flex items-center gap-2">
                        {st.nim && (
                          <span className="font-mono font-semibold text-primary">{st.nim}</span>
                        )}
                        <span className="text-foreground">{st.name}</span>
                      </div>
                      <span className="text-muted-foreground text-[11px]">
                        {st.phone ? st.phone : "Tanpa WA"}
                      </span>
                    </div>
                  ))}
                  {parsedStudents.length > 5 && (
                    <p className="text-center text-[11px] text-muted-foreground pt-1">
                      + {parsedStudents.length - 5} mahasiswa lainnya siap diimport
                    </p>
                  )}
                </div>
              )}
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
            <Button
              type="submit"
              disabled={isLoading || parsedStudents.length === 0}
              className="cursor-pointer"
            >
              {isLoading
                ? "Menyimpan Data..."
                : `Simpan ${parsedStudents.length} Mahasiswa`}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
