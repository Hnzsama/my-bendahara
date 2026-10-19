"use client";

import * as React from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { formatRupiah } from "@/lib/utils";
import type { StudentsPageData, StudentItem, ClassItem } from "@/lib/students-data";
import { deleteStudentAction } from "@/actions/students";
import { deleteClassAction } from "@/actions/classes";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";

import { CreateStudentDialog } from "./create-student-dialog";
import { EditStudentDialog } from "./edit-student-dialog";
import { BulkImportDialog } from "./bulk-import-dialog";
import { CreateClassDialog } from "@/components/classes/create-class-dialog";
import { EditClassDialog } from "@/components/classes/edit-class-dialog";

import {
  UsersIcon,
  GraduationCapIcon,
  WhatsappLogoIcon,
  CoinsIcon,
  MagnifyingGlassIcon,
  DotsThreeVerticalIcon,
  PencilSimpleIcon,
  TrashIcon,
  CopyIcon,
  ArrowSquareOutIcon,
  UserPlusIcon,
  XCircleIcon,
  CheckCircleIcon,
  ReceiptIcon,
  WarningCircleIcon,
} from "@phosphor-icons/react";

interface StudentsViewProps {
  data: StudentsPageData;
  initialTab?: "students" | "classes";
}

export function StudentsView({ data, initialTab = "students" }: StudentsViewProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const tabFromQuery = searchParams.get("tab");

  const { stats, students: initialStudents, classes: initialClasses } = data;

  const [activeTab, setActiveTab] = React.useState<string>(
    tabFromQuery === "classes" || initialTab === "classes" ? "classes" : "students"
  );

  const [students, setStudents] = React.useState<StudentItem[]>(initialStudents);
  const [classes, setClasses] = React.useState<ClassItem[]>(initialClasses);

  // Filters for Students
  const [studentSearch, setStudentSearch] = React.useState("");
  const [selectedClassFilter, setSelectedClassFilter] = React.useState<string>("ALL");

  // Filters for Classes
  const [classSearch, setClassSearch] = React.useState("");

  // Edit State
  const [editingStudent, setEditingStudent] = React.useState<StudentItem | null>(null);
  const [isEditStudentOpen, setIsEditStudentOpen] = React.useState(false);

  const [editingClass, setEditingClass] = React.useState<ClassItem | null>(null);
  const [isEditClassOpen, setIsEditClassOpen] = React.useState(false);

  // Delete Confirmation State
  const [deletingStudent, setDeletingStudent] = React.useState<StudentItem | null>(null);
  const [isDeletingStudentOpen, setIsDeletingStudentOpen] = React.useState(false);
  const [isDeletingStudentLoading, setIsDeletingStudentLoading] = React.useState(false);

  const [deletingClass, setDeletingClass] = React.useState<ClassItem | null>(null);
  const [isDeletingClassOpen, setIsDeletingClassOpen] = React.useState(false);
  const [isDeletingClassLoading, setIsDeletingClassLoading] = React.useState(false);

  React.useEffect(() => {
    setStudents(initialStudents);
    setClasses(initialClasses);
  }, [initialStudents, initialClasses]);

  // Filtered Students
  const filteredStudents = React.useMemo(() => {
    return students.filter((s) => {
      // 1. Filter Kelas
      if (selectedClassFilter !== "ALL" && s.classId !== selectedClassFilter) {
        return false;
      }

      // 2. Search Query (NIM / Nama / Phone)
      if (studentSearch.trim()) {
        const q = studentSearch.toLowerCase();
        const matchName = s.name.toLowerCase().includes(q);
        const matchNim = s.nim ? s.nim.toLowerCase().includes(q) : false;
        const matchPhone = s.phone ? s.phone.toLowerCase().includes(q) : false;
        if (!matchName && !matchNim && !matchPhone) return false;
      }

      return true;
    });
  }, [students, selectedClassFilter, studentSearch]);

  // Filtered Classes
  const filteredClasses = React.useMemo(() => {
    return classes.filter((cls) => {
      if (classSearch.trim()) {
        const q = classSearch.toLowerCase();
        const matchName = cls.name.toLowerCase().includes(q);
        const matchYear = cls.academicYear.toLowerCase().includes(q);
        const matchDesc = cls.description ? cls.description.toLowerCase().includes(q) : false;
        if (!matchName && !matchYear && !matchDesc) return false;
      }
      return true;
    });
  }, [classes, classSearch]);

  // Handler: Hapus Mahasiswa
  const handleConfirmDeleteStudent = async () => {
    if (!deletingStudent) return;
    setIsDeletingStudentLoading(true);
    try {
      const res = await deleteStudentAction(deletingStudent.id);
      if (res.success) {
        toast.success(res.message);
        setIsDeletingStudentOpen(false);
        setDeletingStudent(null);
        router.refresh();
      } else {
        toast.error(res.error || "Gagal menghapus mahasiswa");
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Terjadi kesalahan";
      toast.error(msg);
    } finally {
      setIsDeletingStudentLoading(false);
    }
  };

  // Handler: Hapus Kelas
  const handleConfirmDeleteClass = async () => {
    if (!deletingClass) return;
    setIsDeletingClassLoading(true);
    try {
      const res = await deleteClassAction(deletingClass.id);
      if (res.success) {
        toast.success(res.message);
        setIsDeletingClassOpen(false);
        setDeletingClass(null);
        router.refresh();
      } else {
        toast.error(res.error || "Gagal menghapus kelas");
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Terjadi kesalahan";
      toast.error(msg);
    } finally {
      setIsDeletingClassLoading(false);
    }
  };

  // Quick Action: Filter to specific class
  const handleFilterToClass = (classId: string) => {
    setSelectedClassFilter(classId);
    setActiveTab("students");
  };

  // Copy helper
  const handleCopy = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`${label} (${text}) disalin ke clipboard!`);
  };

  // WhatsApp link helper
  const getWhatsAppUrl = (phone: string | null) => {
    if (!phone) return null;
    let cleaned = phone.replace(/[^0-9]/g, "");
    if (cleaned.startsWith("0")) {
      cleaned = "62" + cleaned.slice(1);
    }
    return `https://wa.me/${cleaned}`;
  };

  return (
    <div className="flex flex-col gap-6 p-4 lg:p-6 max-w-7xl mx-auto w-full">
      {/* 1. TOP STATS OVERVIEW CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Total Mahasiswa */}
        <Card className="p-4 flex flex-col justify-between border bg-card/60 backdrop-blur-xs shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground">Total Mahasiswa</span>
            <div className="flex size-8 items-center justify-center rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400">
              <UsersIcon className="size-4.5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-bold tracking-tight">{stats.totalStudents}</div>
            <p className="text-xs text-muted-foreground mt-0.5">
              Tersebar di {stats.totalClasses} kelas/rombel
            </p>
          </div>
        </Card>

        {/* Card 2: Total Kelas */}
        <Card className="p-4 flex flex-col justify-between border bg-card/60 backdrop-blur-xs shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground">Rombongan Belajar</span>
            <div className="flex size-8 items-center justify-center rounded-lg bg-violet-500/10 text-violet-600 dark:text-violet-400">
              <GraduationCapIcon className="size-4.5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-bold tracking-tight">{stats.totalClasses} Kelas</div>
            <p className="text-xs text-muted-foreground mt-0.5">
              Tiap kelas tersinkron ke tab Spreadsheet
            </p>
          </div>
        </Card>

        {/* Card 3: WhatsApp Terdata */}
        <Card className="p-4 flex flex-col justify-between border bg-card/60 backdrop-blur-xs shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground">Kontak WhatsApp</span>
            <div className="flex size-8 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
              <WhatsappLogoIcon className="size-4.5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold tracking-tight">
                {stats.studentsWithPhoneCount}
              </span>
              <Badge variant="secondary" className="text-[11px] font-normal">
                {stats.studentsWithPhonePercentage}%
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">
              Siap menerima broadcast & konfirmasi
            </p>
          </div>
        </Card>

        {/* Card 4: Total Kas Terkumpul */}
        <Card className="p-4 flex flex-col justify-between border bg-card/60 backdrop-blur-xs shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground">Total Kas Terkumpul</span>
            <div className="flex size-8 items-center justify-center rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400">
              <CoinsIcon className="size-4.5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-bold tracking-tight text-emerald-600 dark:text-emerald-400">
              {formatRupiah(stats.totalCollectedAllClasses)}
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">
              Dari {stats.totalTransactionsCount} pembayaran disetujui
            </p>
          </div>
        </Card>
      </div>

      {/* 2. TAB NAVIGATION & CONTENT */}
      <Tabs value={activeTab} onValueChange={(val) => setActiveTab(val as string)} className="w-full">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b pb-3">
          <TabsList className="bg-muted/70 p-1 rounded-lg">
            <TabsTrigger value="students" className="gap-2 cursor-pointer px-3.5 py-1.5">
              <UsersIcon className="size-4" />
              <span>Daftar Mahasiswa</span>
              <Badge variant="secondary" className="ml-1 px-1.5 py-0 text-[10px]">
                {students.length}
              </Badge>
            </TabsTrigger>
            <TabsTrigger value="classes" className="gap-2 cursor-pointer px-3.5 py-1.5">
              <GraduationCapIcon className="size-4" />
              <span>Kelola Kelas</span>
              <Badge variant="secondary" className="ml-1 px-1.5 py-0 text-[10px]">
                {classes.length}
              </Badge>
            </TabsTrigger>
          </TabsList>

          {/* Quick Action Buttons on right */}
          <div className="flex items-center gap-2">
            {activeTab === "students" ? (
              <>
                <BulkImportDialog classes={classes} defaultClassId={selectedClassFilter !== "ALL" ? selectedClassFilter : undefined} />
                <CreateStudentDialog classes={classes} defaultClassId={selectedClassFilter !== "ALL" ? selectedClassFilter : undefined} />
              </>
            ) : (
              <CreateClassDialog />
            )}
          </div>
        </div>

        {/* ------------------------------------------------------------- */}
        {/* TAB 1: DAFTAR MAHASISWA */}
        {/* ------------------------------------------------------------- */}
        <TabsContent value="students" className="space-y-4 pt-4">
          {/* Filter Bar */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            {/* Search Input */}
            <div className="relative flex-1">
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
              <Input
                placeholder="Cari mahasiswa berdasarkan nama, NIM, atau nomor WhatsApp..."
                value={studentSearch}
                onChange={(e) => setStudentSearch(e.target.value)}
                className="pl-9 text-sm"
              />
              {studentSearch && (
                <button
                  type="button"
                  onClick={() => setStudentSearch("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  <XCircleIcon className="size-4" />
                </button>
              )}
            </div>

            {/* Class Filter Dropdown */}
            <div className="w-full sm:w-[220px]">
              <Select
                value={selectedClassFilter}
                onValueChange={(val) => setSelectedClassFilter(val ?? "ALL")}
                items={[
                  { label: `Semua Kelas (${students.length})`, value: "ALL" },
                  ...classes.map((cls) => ({
                    label: `${cls.name} (${cls.studentsCount})`,
                    value: cls.id,
                  })),
                ]}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Pilih Kelas...">
                    {(val: string | null) => {
                      if (!val || val === "ALL") return `Semua Kelas (${students.length})`;
                      const cls = classes.find((c) => c.id === val);
                      return cls ? `${cls.name} (${cls.studentsCount})` : undefined;
                    }}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">Semua Kelas ({students.length})</SelectItem>
                  {classes.map((cls) => (
                    <SelectItem key={cls.id} value={cls.id}>
                      {cls.name} ({cls.studentsCount})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Reset Button */}
            {(studentSearch || selectedClassFilter !== "ALL") && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setStudentSearch("");
                  setSelectedClassFilter("ALL");
                }}
                className="text-xs text-muted-foreground hover:text-foreground h-9"
              >
                Reset Filter
              </Button>
            )}
          </div>

          {/* Table Container */}
          <div className="rounded-xl border bg-card shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm border-collapse">
                <thead>
                  <tr className="border-b bg-muted/40 text-[12px] font-medium text-muted-foreground">
                    <th className="py-3 px-4 w-12 text-center">#</th>
                    <th className="py-3 px-4">Mahasiswa</th>
                    <th className="py-3 px-4">NIM</th>
                    <th className="py-3 px-4">Kelas</th>
                    <th className="py-3 px-4">Kontak WhatsApp</th>
                    <th className="py-3 px-4">Kas Terbayar</th>
                    <th className="py-3 px-4 text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {filteredStudents.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-12 text-center">
                        <div className="flex flex-col items-center justify-center gap-2 text-muted-foreground">
                          <UsersIcon className="size-8 stroke-[1.5]" />
                          <p className="text-sm font-medium">Tidak ada data mahasiswa ditemukan</p>
                          <p className="text-xs">
                            Coba ubah kata kunci pencarian atau tambah mahasiswa baru.
                          </p>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    filteredStudents.map((st, idx) => {
                      const waUrl = getWhatsAppUrl(st.phone);
                      const initials = st.name
                        .split(" ")
                        .map((n) => n[0])
                        .slice(0, 2)
                        .join("")
                        .toUpperCase();

                      return (
                        <tr
                          key={st.id}
                          className="hover:bg-muted/30 transition-colors group"
                        >
                          {/* Row # */}
                          <td className="py-3 px-4 text-center text-xs text-muted-foreground font-mono">
                            {idx + 1}
                          </td>

                          {/* Mahasiswa Info */}
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-3">
                              <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary text-xs font-semibold">
                                {initials}
                              </div>
                              <div className="flex flex-col min-w-0">
                                <span className="font-medium text-foreground truncate">
                                  {st.name}
                                </span>
                                {st.nim && (
                                  <span className="text-[11px] text-muted-foreground sm:hidden font-mono">
                                    {st.nim}
                                  </span>
                                )}
                              </div>
                            </div>
                          </td>

                          {/* NIM */}
                          <td className="py-3 px-4">
                            {st.nim ? (
                              <span className="font-mono text-xs bg-muted/80 text-foreground px-2 py-0.5 rounded border border-border/50">
                                {st.nim}
                              </span>
                            ) : (
                              <span className="text-muted-foreground text-xs italic">-</span>
                            )}
                          </td>

                          {/* Kelas */}
                          <td className="py-3 px-4">
                            <Badge
                              variant="outline"
                              className="font-normal text-xs bg-muted/40 cursor-pointer hover:bg-muted"
                              onClick={() => setSelectedClassFilter(st.classId)}
                            >
                              {st.className}
                            </Badge>
                          </td>

                          {/* WhatsApp */}
                          <td className="py-3 px-4">
                            {st.phone ? (
                              <div className="flex items-center gap-1.5">
                                <a
                                  href={waUrl || "#"}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="inline-flex items-center gap-1.5 text-xs text-emerald-600 dark:text-emerald-400 hover:underline font-mono bg-emerald-500/10 px-2 py-1 rounded"
                                >
                                  <WhatsappLogoIcon className="size-3.5 shrink-0" />
                                  <span>{st.phone}</span>
                                  <ArrowSquareOutIcon className="size-3 opacity-60" />
                                </a>
                              </div>
                            ) : (
                              <span className="text-xs text-muted-foreground/60 italic">
                                Belum ada nomor
                              </span>
                            )}
                          </td>

                          {/* Kas Terbayar */}
                          <td className="py-3 px-4">
                            {st.approvedTransactionsCount > 0 ? (
                              <div className="flex flex-col">
                                <span className="font-semibold text-xs text-emerald-600 dark:text-emerald-400">
                                  {formatRupiah(st.totalPaidAmount)}
                                </span>
                                <span className="text-[10px] text-muted-foreground">
                                  {st.approvedTransactionsCount}x pembayaran lunas
                                </span>
                              </div>
                            ) : st.pendingTransactionsCount > 0 ? (
                              <Badge variant="secondary" className="text-[10px] text-amber-600 dark:text-amber-400 bg-amber-500/10 border-amber-500/20">
                                Menunggu Verifikasi ({st.pendingTransactionsCount})
                              </Badge>
                            ) : (
                              <span className="text-xs text-muted-foreground/70">
                                Belum ada riwayat
                              </span>
                            )}
                          </td>

                          {/* Action Dropdown */}
                          <td className="py-3 px-4 text-right">
                            <DropdownMenu>
                              <DropdownMenuTrigger
                                render={
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="size-8 cursor-pointer text-muted-foreground hover:text-foreground"
                                  />
                                }
                              >
                                <DotsThreeVerticalIcon className="size-4" />
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end" className="w-48">
                                <DropdownMenuItem
                                  onClick={() => {
                                    setEditingStudent(st);
                                    setIsEditStudentOpen(true);
                                  }}
                                  className="cursor-pointer gap-2"
                                >
                                  <PencilSimpleIcon className="size-4 text-muted-foreground" />
                                  <span>Edit Mahasiswa</span>
                                </DropdownMenuItem>

                                {st.nim && (
                                  <DropdownMenuItem
                                    onClick={() => handleCopy(st.nim || "", "NIM")}
                                    className="cursor-pointer gap-2"
                                  >
                                    <CopyIcon className="size-4 text-muted-foreground" />
                                    <span>Salin NIM</span>
                                  </DropdownMenuItem>
                                )}

                                {st.phone && (
                                  <DropdownMenuItem
                                    onClick={() => window.open(waUrl!, "_blank", "noopener,noreferrer")}
                                    className="cursor-pointer gap-2"
                                  >
                                    <WhatsappLogoIcon className="size-4 text-emerald-500" />
                                    <span>Kirim Pesan WhatsApp</span>
                                  </DropdownMenuItem>
                                )}

                                <DropdownMenuSeparator />

                                <DropdownMenuItem
                                  onClick={() => {
                                    setDeletingStudent(st);
                                    setIsDeletingStudentOpen(true);
                                  }}
                                  className="cursor-pointer gap-2 text-destructive focus:text-destructive focus:bg-destructive/10"
                                >
                                  <TrashIcon className="size-4" />
                                  <span>Hapus Mahasiswa</span>
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {/* Table Footer Summary */}
            <div className="flex items-center justify-between px-4 py-3 border-t bg-muted/20 text-xs text-muted-foreground">
              <span>
                Menampilkan <strong>{filteredStudents.length}</strong> dari{" "}
                <strong>{students.length}</strong> mahasiswa
              </span>
              {selectedClassFilter !== "ALL" && (
                <button
                  type="button"
                  onClick={() => setSelectedClassFilter("ALL")}
                  className="text-primary hover:underline cursor-pointer"
                >
                  Tampilkan Semua Kelas
                </button>
              )}
            </div>
          </div>
        </TabsContent>

        {/* ------------------------------------------------------------- */}
        {/* TAB 2: KELOLA KELAS */}
        {/* ------------------------------------------------------------- */}
        <TabsContent value="classes" className="space-y-4 pt-4">
          {/* Class Search Bar */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            <div className="relative flex-1 max-w-md">
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
              <Input
                placeholder="Cari nama kelas atau tahun ajaran..."
                value={classSearch}
                onChange={(e) => setClassSearch(e.target.value)}
                className="pl-9 text-sm"
              />
              {classSearch && (
                <button
                  type="button"
                  onClick={() => setClassSearch("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  <XCircleIcon className="size-4" />
                </button>
              )}
            </div>
          </div>

          {/* Class Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredClasses.length === 0 ? (
              <div className="col-span-full py-12 text-center border rounded-xl bg-card">
                <div className="flex flex-col items-center justify-center gap-2 text-muted-foreground">
                  <GraduationCapIcon className="size-8 stroke-[1.5]" />
                  <p className="text-sm font-medium">Tidak ada kelas yang ditemukan</p>
                  <p className="text-xs">
                    Klik tombol "Tambah Kelas" untuk mendaftarkan kelas baru.
                  </p>
                </div>
              </div>
            ) : (
              filteredClasses.map((cls) => (
                <Card
                  key={cls.id}
                  className="flex flex-col justify-between p-5 border rounded-xl bg-card/60 backdrop-blur-xs hover:border-primary/40 transition-all shadow-xs group"
                >
                  <div>
                    {/* Header: Icon + Name + Academic Year + 3-dots Dropdown */}
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-violet-500/10 text-violet-600 dark:text-violet-400">
                          <GraduationCapIcon className="size-5" />
                        </div>
                        <div className="flex flex-col min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-bold text-base text-foreground tracking-tight truncate">
                              {cls.name}
                            </span>
                            <Badge variant="outline" className="text-[11px] font-normal bg-muted/50 border-border/60">
                              {cls.academicYear}
                            </Badge>
                          </div>
                          {cls.description ? (
                            <p className="text-xs text-muted-foreground line-clamp-1 mt-0.5">
                              {cls.description}
                            </p>
                          ) : (
                            <p className="text-[11px] text-muted-foreground/60 mt-0.5">
                              Belum ada catatan kelas
                            </p>
                          )}
                        </div>
                      </div>

                      <DropdownMenu>
                        <DropdownMenuTrigger
                          render={
                            <Button
                              variant="ghost"
                              size="icon"
                              className="size-8 -mr-1.5 -mt-1 cursor-pointer text-muted-foreground hover:text-foreground shrink-0 rounded-lg"
                            />
                          }
                        >
                          <DotsThreeVerticalIcon className="size-4" />
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-44">
                          <DropdownMenuItem
                            onClick={() => {
                              setEditingClass(cls);
                              setIsEditClassOpen(true);
                            }}
                            className="cursor-pointer gap-2"
                          >
                            <PencilSimpleIcon className="size-4 text-muted-foreground" />
                            <span>Edit Kelas</span>
                          </DropdownMenuItem>

                          <DropdownMenuItem
                            onClick={() => handleFilterToClass(cls.id)}
                            className="cursor-pointer gap-2"
                          >
                            <UsersIcon className="size-4 text-muted-foreground" />
                            <span>Lihat Mahasiswa</span>
                          </DropdownMenuItem>

                          <DropdownMenuSeparator />

                          <DropdownMenuItem
                            onClick={() => {
                              setDeletingClass(cls);
                              setIsDeletingClassOpen(true);
                            }}
                            className="cursor-pointer gap-2 text-destructive focus:text-destructive focus:bg-destructive/10"
                          >
                            <TrashIcon className="size-4" />
                            <span>Hapus Kelas</span>
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>

                    {/* Class Stats Summary */}
                    <div className="grid grid-cols-2 gap-2 mt-4 p-3 rounded-lg bg-muted/40 border border-border/50">
                      <div>
                        <span className="text-[11px] text-muted-foreground block font-medium">
                          Total Mahasiswa
                        </span>
                        <span className="text-sm font-bold text-foreground flex items-center gap-1.5 mt-0.5">
                          <UsersIcon className="size-3.5 text-primary" />
                          {cls.studentsCount} Mahasiswa
                        </span>
                      </div>
                      <div>
                        <span className="text-[11px] text-muted-foreground block font-medium">
                          Kas Terkumpul
                        </span>
                        <span className="text-sm font-bold text-emerald-600 dark:text-emerald-400 mt-0.5 block truncate">
                          {formatRupiah(cls.totalCollected)}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Card Actions */}
                  <div className="flex items-center gap-2 mt-4 pt-3 border-t border-border/50">
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1 h-9 text-xs gap-1.5 cursor-pointer hover:bg-muted font-medium justify-center"
                      onClick={() => handleFilterToClass(cls.id)}
                    >
                      <UsersIcon className="size-3.5 text-primary" />
                      <span>Lihat {cls.studentsCount} Mahasiswa</span>
                    </Button>
                    <CreateStudentDialog
                      classes={classes}
                      defaultClassId={cls.id}
                      trigger={
                        <Button
                          variant="secondary"
                          size="sm"
                          className="shrink-0 h-9 px-3 gap-1.5 text-xs font-medium cursor-pointer"
                          title={`Tambah mahasiswa ke kelas ${cls.name}`}
                        >
                          <UserPlusIcon className="size-4" />
                          <span>+ Mhs</span>
                        </Button>
                      }
                    />
                  </div>
                </Card>
              ))
            )}
          </div>
        </TabsContent>
      </Tabs>

      {/* 3. MODALS & DIALOGS */}
      {/* Edit Student Modal */}
      <EditStudentDialog
        student={editingStudent}
        classes={classes}
        open={isEditStudentOpen}
        onOpenChange={setIsEditStudentOpen}
      />

      {/* Edit Class Modal */}
      <EditClassDialog
        cls={editingClass}
        open={isEditClassOpen}
        onOpenChange={setIsEditClassOpen}
      />

      {/* Delete Student Confirm Dialog */}
      <Dialog open={isDeletingStudentOpen} onOpenChange={setIsDeletingStudentOpen}>
        <DialogContent className="sm:max-w-[420px]">
          <DialogHeader>
            <DialogTitle className="text-destructive flex items-center gap-2">
              <TrashIcon className="size-5" />
              <span>Hapus Mahasiswa?</span>
            </DialogTitle>
            <DialogDescription>
              Apakah Anda yakin ingin menghapus mahasiswa{" "}
              <strong>{deletingStudent?.name}</strong>
              {deletingStudent?.nim ? (
                <>
                  {" "}(NIM: <span className="font-mono">{deletingStudent.nim}</span>)
                </>
              ) : null}
              ? Tindakan ini tidak dapat dibatalkan.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="outline"
              onClick={() => setIsDeletingStudentOpen(false)}
              disabled={isDeletingStudentLoading}
            >
              Batal
            </Button>
            <Button
              variant="destructive"
              onClick={handleConfirmDeleteStudent}
              disabled={isDeletingStudentLoading}
              className="cursor-pointer"
            >
              {isDeletingStudentLoading ? "Menghapus..." : "Ya, Hapus Mahasiswa"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Class Confirm Dialog */}
      <Dialog open={isDeletingClassOpen} onOpenChange={setIsDeletingClassOpen}>
        <DialogContent className="sm:max-w-[420px]">
          <DialogHeader>
            <DialogTitle className="text-destructive flex items-center gap-2">
              <TrashIcon className="size-5" />
              <span>Hapus Kelas?</span>
            </DialogTitle>
            <DialogDescription>
              Apakah Anda yakin ingin menghapus kelas{" "}
              <strong>{deletingClass?.name}</strong>?
              {deletingClass && deletingClass.studentsCount > 0 && (
                <span className="mt-2 text-destructive font-semibold flex items-start gap-1.5">
                  <WarningCircleIcon className="size-4 shrink-0 mt-0.5" />
                  <span>
                    Peringatan: Kelas ini masih menampung {deletingClass.studentsCount}{" "}
                    mahasiswa. Anda harus memindahkan atau menghapus mahasiswa tersebut terlebih
                    dahulu.
                  </span>
                </span>
              )}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="outline"
              onClick={() => setIsDeletingClassOpen(false)}
              disabled={isDeletingClassLoading}
            >
              Batal
            </Button>
            <Button
              variant="destructive"
              onClick={handleConfirmDeleteClass}
              disabled={
                isDeletingClassLoading ||
                (deletingClass ? deletingClass.studentsCount > 0 : false)
              }
              className="cursor-pointer"
            >
              {isDeletingClassLoading ? "Menghapus..." : "Ya, Hapus Kelas"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
