"use client";
/* eslint-disable @typescript-eslint/no-explicit-any */

import * as React from "react";
import { useRouter } from "next/navigation";
import {
  closestCenter,
  DndContext,
  KeyboardSensor,
  MouseSensor,
  TouchSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import { restrictToVerticalAxis } from "@dnd-kit/modifiers";
import {
  arrayMove,
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  columnFilteringFeature,
  columnVisibilityFeature,
  createColumnHelper,
  createFilteredRowModel,
  createPaginatedRowModel,
  createSortedRowModel,
  FlexRender,
  rowPaginationFeature,
  rowSelectionFeature,
  rowSortingFeature,
  tableFeatures,
  useTable,
  type ColumnFiltersState,
  type ColumnVisibilityState,
  type SortingState,
} from "@tanstack/react-table";
import { toast } from "sonner";
import { z } from "zod";

import { useIsMobile } from "@/hooks/use-mobile";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  DotsSixVerticalIcon,
  CheckCircleIcon,
  DotsThreeVerticalIcon,
  ColumnsIcon,
  PlusIcon,
  CaretDoubleLeftIcon,
  CaretLeftIcon,
  CaretRightIcon,
  CaretDoubleRightIcon,
  XCircleIcon,
  ClockIcon,
  ReceiptIcon,
  EyeIcon,
  ArrowsClockwiseIcon,
  GoogleLogoIcon,
} from "@phosphor-icons/react";
import { formatRupiah, formatDateTime } from "@/lib/utils";
import {
  approveTransactionAction,
  rejectTransactionAction,
  retrySheetSyncAction,
  testGoogleSheetsAction,
} from "@/actions/transactions";

async function handleApproveTransaction(id: string, ref: string) {
  toast.promise(
    approveTransactionAction(id).then((res) => {
      if (!res.success) throw new Error(res.error);
      return res;
    }),
    {
      loading: `Menyetujui & menyinkronkan ${ref}...`,
      success: (res) => res.message || `Transaksi ${ref} disetujui!`,
      error: (err) => err.message || "Gagal menyetujui transaksi",
    }
  );
}

async function handleRejectTransaction(id: string, ref: string) {
  toast.promise(
    rejectTransactionAction(id).then((res) => {
      if (!res.success) throw new Error(res.error);
      return res;
    }),
    {
      loading: `Memproses penolakan ${ref}...`,
      success: (res) => res.message || `Transaksi ${ref} telah ditolak.`,
      error: (err) => err.message || "Gagal menolak transaksi",
    }
  );
}

async function handleRetrySheetSync(id: string, ref: string) {
  toast.promise(
    retrySheetSyncAction(id).then((res) => {
      if (!res.success) throw new Error(res.error);
      return res;
    }),
    {
      loading: `Menyinkronkan ulang ${ref} ke Google Sheets...`,
      success: (res) => res.message || `Berhasil disinkronkan ke Google Sheets!`,
      error: (err) => err.message || "Gagal sinkronisasi ulang",
    }
  );
}

// ------------------------------------------------------------------
// Schema Data Transaksi Nyata dari Database
// ------------------------------------------------------------------
export const transactionSchema = z.object({
  id: z.string(),
  referenceCode: z.string(),
  studentName: z.string(),
  nim: z.string().nullable().optional(),
  className: z.string(),
  billTitle: z.string(),
  amountPaid: z.number(),
  paymentMethodName: z.string(),
  picName: z.string(),
  accountNumber: z.string(),
  status: z.enum(["PENDING", "APPROVED", "REJECTED"]),
  rejectionReason: z.string().nullable().optional(),
  proofImageUrl: z.string(),
  studentNotes: z.string().nullable().optional(),
  sheetSyncStatus: z.string(),
  verifiedByName: z.string().nullable().optional(),
  createdAt: z.string(),
});

export type TransactionItem = z.infer<typeof transactionSchema>;

const features = tableFeatures({
  columnFilteringFeature,
  columnVisibilityFeature,
  rowPaginationFeature,
  rowSelectionFeature,
  rowSortingFeature,
  filteredRowModel: createFilteredRowModel(),
  paginatedRowModel: createPaginatedRowModel(),
  sortedRowModel: createSortedRowModel(),
});

const columnHelper = createColumnHelper<
  typeof features,
  TransactionItem
>();

function DragHandle({ id }: { id: string }) {
  const { attributes, listeners } = useSortable({
    id,
  });
  return (
    <Button
      {...attributes}
      {...listeners}
      variant="ghost"
      size="icon"
      className="size-7 text-muted-foreground hover:bg-transparent"
    >
      <DotsSixVerticalIcon className="size-3 text-muted-foreground" />
      <span className="sr-only">Drag to reorder</span>
    </Button>
  );
}

const columns = columnHelper.columns([
  columnHelper.display({
    id: "drag",
    header: () => null,
    cell: ({ row }) => <DragHandle id={row.original.id} />,
  }),
  columnHelper.display({
    id: "select",
    header: ({ table }: { table: any }) => (
      <div className="flex items-center justify-center">
        <Checkbox
          checked={table.getIsAllPageRowsSelected()}
          indeterminate={
            table.getIsSomePageRowsSelected() &&
            !table.getIsAllPageRowsSelected()
          }
          onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
          aria-label="Select all"
        />
      </div>
    ),
    cell: ({ row }) => (
      <div className="flex items-center justify-center">
        <Checkbox
          checked={row.getIsSelected()}
          onCheckedChange={(value) => row.toggleSelected(!!value)}
          aria-label="Select row"
        />
      </div>
    ),
    enableSorting: false,
    enableHiding: false,
  }),
  columnHelper.accessor("referenceCode", {
    header: "Kode Transaksi",
    cell: ({ row }) => {
      return <TableCellViewer item={row.original} />;
    },
    enableHiding: false,
  }),
  columnHelper.accessor("studentName", {
    header: "Mahasiswa",
    cell: ({ row }) => (
      <div className="flex flex-col">
        <span className="font-medium text-foreground">{row.original.studentName}</span>
        <span className="text-xs text-muted-foreground">{row.original.nim}</span>
      </div>
    ),
  }),
  columnHelper.accessor("className", {
    header: "Kelas",
    cell: ({ row }) => (
      <Badge variant="outline" className="px-1.5 font-mono text-xs">
        {row.original.className}
      </Badge>
    ),
  }),
  columnHelper.accessor("billTitle", {
    header: "Tagihan",
    cell: ({ row }) => (
      <div className="max-w-[180px] truncate font-medium text-xs">
        {row.original.billTitle}
      </div>
    ),
  }),
  columnHelper.accessor("amountPaid", {
    header: () => <div className="text-right">Nominal</div>,
    cell: ({ row }) => (
      <div className="text-right font-semibold tabular-nums">
        {formatRupiah(row.original.amountPaid)}
      </div>
    ),
  }),
  columnHelper.accessor("paymentMethodName", {
    header: "Metode / PIC",
    cell: ({ row }) => (
      <div className="flex flex-col text-xs">
        <span className="font-medium">{row.original.paymentMethodName}</span>
        <span className="text-[10px] text-muted-foreground truncate">{row.original.picName}</span>
      </div>
    ),
  }),
  columnHelper.accessor("status", {
    header: "Status",
    cell: ({ row }) => {
      const status = row.original.status;
      if (status === "APPROVED") {
        return (
          <Badge variant="outline" className="border-emerald-500/30 text-emerald-600 dark:text-emerald-400 gap-1 font-medium">
            <CheckCircleIcon className="size-3.5 fill-emerald-500" />
            Disetujui
          </Badge>
        );
      }
      if (status === "REJECTED") {
        return (
          <Badge variant="outline" className="border-rose-500/30 text-rose-600 dark:text-rose-400 gap-1 font-medium">
            <XCircleIcon className="size-3.5 fill-rose-500" />
            Ditolak
          </Badge>
        );
      }
      return (
        <Badge variant="outline" className="border-amber-500/30 text-amber-600 dark:text-amber-400 gap-1 font-medium">
          <ClockIcon className="size-3.5 text-amber-500" />
          Pending
        </Badge>
      );
    },
  }),
  columnHelper.accessor("sheetSyncStatus", {
    header: "Spreadsheet",
    cell: ({ row }) => {
      const sync = row.original.sheetSyncStatus;
      if (sync === "SYNCED") {
        return (
          <Badge variant="secondary" className="text-[10px] bg-emerald-500/10 text-emerald-600">
            Synced
          </Badge>
        );
      }
      if (sync === "FAILED") {
        return (
          <Badge variant="destructive" className="text-[10px]">
            Failed
          </Badge>
        );
      }
      return (
        <span className="text-[10px] text-muted-foreground">-</span>
      );
    },
  }),
  columnHelper.display({
    id: "actions",
    cell: ({ row }) => (
      <DropdownMenu>
        <DropdownMenuTrigger
          render={
            <Button
              variant="ghost"
              className="flex size-8 text-muted-foreground data-open:bg-muted"
              size="icon"
            />
          }
        >
          <DotsThreeVerticalIcon className="size-4" />
          <span className="sr-only">Open menu</span>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-44">
          <DropdownMenuItem
            onClick={() => {
              toast.info(`Kode: ${row.original.referenceCode} - ${row.original.studentName}`);
            }}
          >
            <EyeIcon className="mr-2 size-4" />
            Lihat Struk
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          {row.original.status === "PENDING" && (
            <>
              <DropdownMenuItem
                className="text-emerald-600 focus:text-emerald-600 cursor-pointer"
                onClick={() => {
                  handleApproveTransaction(row.original.id, row.original.referenceCode);
                }}
              >
                <CheckCircleIcon className="mr-2 size-4" />
                Approve & Sync Sheet
              </DropdownMenuItem>
              <DropdownMenuItem
                className="text-rose-600 focus:text-rose-600 cursor-pointer"
                onClick={() => {
                  handleRejectTransaction(row.original.id, row.original.referenceCode);
                }}
              >
                <XCircleIcon className="mr-2 size-4" />
                Reject
              </DropdownMenuItem>
            </>
          )}
          {row.original.status === "APPROVED" && row.original.sheetSyncStatus === "FAILED" && (
            <DropdownMenuItem
              className="text-amber-600 focus:text-amber-600 cursor-pointer"
              onClick={() => {
                handleRetrySheetSync(row.original.id, row.original.referenceCode);
              }}
            >
              <ArrowsClockwiseIcon className="mr-2 size-4" />
              Sync Ulang Sheet
            </DropdownMenuItem>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
    ),
  }),
]);

function DraggableRow({
  row,
}: {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  row: any;
}) {
  const { transform, transition, setNodeRef, isDragging } = useSortable({
    id: row.original.id,
  });
  return (
    <TableRow
      data-state={row.getIsSelected() && "selected"}
      data-dragging={isDragging}
      ref={setNodeRef}
      className="relative z-0 data-[dragging=true]:z-10 data-[dragging=true]:opacity-80"
      style={{
        transform: CSS.Transform.toString(transform),
        transition: transition,
      }}
    >
      {row.getVisibleCells().map((cell: any) => (
        <TableCell key={cell.id}>
          <FlexRender cell={cell} />
        </TableCell>
      ))}
    </TableRow>
  );
}

export function DataTable({
  data: initialData,
}: {
  data: TransactionItem[];
}) {
  const router = useRouter();
  const [data, setData] = React.useState(() => initialData);
  const [isTestingSheet, setIsTestingSheet] = React.useState(false);

  React.useEffect(() => {
    setData(initialData);
  }, [initialData]);

  const [activeTab, setActiveTab] = React.useState("all");
  const [rowSelection, setRowSelection] = React.useState({});
  const [columnVisibility, setColumnVisibility] =
    React.useState<ColumnVisibilityState>({});
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([]);
  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [pagination, setPagination] = React.useState({
    pageIndex: 0,
    pageSize: 10,
  });

  const sortableId = React.useId();
  const sensors = useSensors(
    useSensor(MouseSensor, {}),
    useSensor(TouchSensor, {}),
    useSensor(KeyboardSensor, {})
  );

  // Filter data sesuai activeTab
  const filteredTabData = React.useMemo(() => {
    if (activeTab === "pending") return data.filter((d) => d.status === "PENDING");
    if (activeTab === "approved") return data.filter((d) => d.status === "APPROVED");
    if (activeTab === "rejected") return data.filter((d) => d.status === "REJECTED");
    return data;
  }, [data, activeTab]);

  const dataIds = React.useMemo(() => filteredTabData.map((d) => d.id), [filteredTabData]);

  const pendingCount = React.useMemo(
    () => data.filter((d) => d.status === "PENDING").length,
    [data]
  );
  const approvedCount = React.useMemo(
    () => data.filter((d) => d.status === "APPROVED").length,
    [data]
  );
  const rejectedCount = React.useMemo(
    () => data.filter((d) => d.status === "REJECTED").length,
    [data]
  );

  const table = useTable({
    features,
    _features: features,
    data: filteredTabData,
    columns: columns as any,
    state: {
      sorting,
      columnVisibility,
      rowSelection,
      columnFilters,
      pagination,
    },
    getRowId: (row: any) => row.id,
    enableRowSelection: true,
    onRowSelectionChange: setRowSelection,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onColumnVisibilityChange: setColumnVisibility,
    onPaginationChange: setPagination,
  } as any);

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (active && over && active.id !== over.id) {
      setData((prevData) => {
        const oldIndex = prevData.findIndex((item) => item.id === active.id);
        const newIndex = prevData.findIndex((item) => item.id === over.id);
        return arrayMove(prevData, oldIndex, newIndex);
      });
    }
  }

  return (
    <Tabs
      value={activeTab}
      onValueChange={setActiveTab}
      className="w-full flex-col justify-start gap-6"
    >
      <div className="flex items-center justify-between px-4 lg:px-6">
        <Label htmlFor="view-selector" className="sr-only">
          Filter Transaksi
        </Label>
        <Select
          value={activeTab}
          onValueChange={(val) => {
            if (val) setActiveTab(val);
          }}
          items={[
            { label: "Semua Transaksi", value: "all" },
            { label: `Menunggu (${pendingCount})`, value: "pending" },
            { label: `Disetujui (${approvedCount})`, value: "approved" },
            { label: `Ditolak (${rejectedCount})`, value: "rejected" },
          ]}
        >
          <SelectTrigger
            className="flex w-fit @4xl/main:hidden"
            size="sm"
            id="view-selector"
          >
            <SelectValue placeholder="Pilih status" />
          </SelectTrigger>
          <SelectContent>
            <SelectGroup>
              <SelectItem value="all">Semua Transaksi</SelectItem>
              <SelectItem value="pending">Menunggu ({pendingCount})</SelectItem>
              <SelectItem value="approved">Disetujui ({approvedCount})</SelectItem>
              <SelectItem value="rejected">Ditolak ({rejectedCount})</SelectItem>
            </SelectGroup>
          </SelectContent>
        </Select>
        <TabsList className="hidden **:data-[slot=badge]:size-5 **:data-[slot=badge]:rounded-full **:data-[slot=badge]:bg-muted-foreground/30 **:data-[slot=badge]:px-1 @4xl/main:flex">
          <TabsTrigger value="all">
            Semua Transaksi <Badge variant="secondary">{data.length}</Badge>
          </TabsTrigger>
          <TabsTrigger value="pending">
            Menunggu Verifikasi <Badge variant="secondary">{pendingCount}</Badge>
          </TabsTrigger>
          <TabsTrigger value="approved">
            Disetujui <Badge variant="secondary">{approvedCount}</Badge>
          </TabsTrigger>
          <TabsTrigger value="rejected">
            Ditolak <Badge variant="secondary">{rejectedCount}</Badge>
          </TabsTrigger>
        </TabsList>
        <div className="flex items-center gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger
              render={
                <Button variant="outline" size="sm">
                  <ColumnsIcon />
                  <span className="hidden lg:inline">Columns</span>
                </Button>
              }
            />
            <DropdownMenuContent align="end" className="w-56">
              {table
                .getAllColumns()
                .filter(
                  (column: any) =>
                    typeof column.accessorFn !== "undefined" &&
                    (typeof column.getCanHide === "function"
                      ? column.getCanHide()
                      : column.columnDef?.enableHiding !== false)
                )
                .map((column: any) => {
                  const isVisible =
                    typeof column.getIsVisible === "function"
                      ? column.getIsVisible()
                      : (columnVisibility as Record<string, boolean>)[column.id] !== false;

                  return (
                    <DropdownMenuCheckboxItem
                      key={column.id}
                      className="capitalize"
                      checked={isVisible}
                      onCheckedChange={(value) => {
                        if (typeof column.toggleVisibility === "function") {
                          column.toggleVisibility(!!value);
                        } else {
                          setColumnVisibility((prev) => ({
                            ...prev,
                            [column.id]: !!value,
                          }));
                        }
                      }}
                    >
                      {column.id}
                    </DropdownMenuCheckboxItem>
                  );
                })}
            </DropdownMenuContent>
          </DropdownMenu>
          <Button
            variant="outline"
            size="sm"
            disabled={isTestingSheet}
            onClick={async () => {
              setIsTestingSheet(true);
              try {
                const res = await testGoogleSheetsAction();
                if (res.success) {
                  toast.success(res.message);
                } else {
                  toast.error(res.error || "Koneksi Google Sheets gagal.");
                }
              } catch (err: any) {
                toast.error(err?.message || "Terjadi kesalahan koneksi");
              } finally {
                setIsTestingSheet(false);
              }
            }}
          >
            <GoogleLogoIcon className={isTestingSheet ? "animate-spin" : ""} />
            <span className="hidden sm:inline">
              {isTestingSheet ? "Menguji..." : "Tes Google Sheets"}
            </span>
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => router.push("/dashboard/bills")}
          >
            <PlusIcon />
            <span className="hidden lg:inline">Buat Tagihan Baru</span>
          </Button>
        </div>
      </div>

      <TabsContent
        value={activeTab}
        className="relative flex flex-col gap-4 overflow-auto px-4 lg:px-6"
      >
        <div className="overflow-hidden rounded-lg border">
          <DndContext
            collisionDetection={closestCenter}
            modifiers={[restrictToVerticalAxis]}
            onDragEnd={handleDragEnd}
            sensors={sensors}
            id={sortableId}
          >
            <Table>
              <TableHeader className="sticky top-0 z-10 bg-muted">
                {table.getHeaderGroups().map((headerGroup: any) => (
                  <TableRow key={headerGroup.id}>
                    {headerGroup.headers.map((header: any) => {
                      return (
                        <TableHead key={header.id} colSpan={header.colSpan}>
                          {header.isPlaceholder ? null : (
                            <FlexRender header={header} />
                          )}
                        </TableHead>
                      );
                    })}
                  </TableRow>
                ))}
              </TableHeader>
              <TableBody className="**:data-[slot=table-cell]:first:w-8">
                {table.getRowModel().rows?.length ? (
                  <SortableContext
                    items={dataIds}
                    strategy={verticalListSortingStrategy}
                  >
                    {table.getRowModel().rows.map((row: any) => (
                      <DraggableRow key={row.id} row={row} />
                    ))}
                  </SortableContext>
                ) : (
                  <TableRow>
                    <TableCell
                      colSpan={columns.length}
                      className="h-28 text-center text-muted-foreground"
                    >
                      Tidak ada transaksi pada kategori ini.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </DndContext>
        </div>

        {/* Pagination & Row Controls */}
        <div className="flex items-center justify-between px-4">
          <div className="hidden flex-1 text-sm text-muted-foreground lg:flex">
            {table.getFilteredSelectedRowModel().rows.length} dari{" "}
            {table.getFilteredRowModel().rows.length} transaksi dipilih.
          </div>
          <div className="flex w-full items-center gap-8 lg:w-fit">
            <div className="hidden items-center gap-2 lg:flex">
              <Label htmlFor="rows-per-page" className="text-sm font-medium">
                Baris per halaman
              </Label>
              <Select
                value={`${pagination.pageSize}`}
                onValueChange={(value) => {
                  if (value) {
                    const newSize = Number(value);
                    setPagination((prev) => ({ ...prev, pageSize: newSize }));
                    table.setPageSize(newSize);
                  }
                }}
                items={[10, 20, 30, 40, 50].map((pageSize) => ({
                  label: `${pageSize}`,
                  value: `${pageSize}`,
                }))}
              >
                <SelectTrigger size="sm" className="w-20" id="rows-per-page">
                  <SelectValue placeholder={pagination.pageSize} />
                </SelectTrigger>
                <SelectContent side="top">
                  <SelectGroup>
                    {[10, 20, 30, 40, 50].map((pageSize) => (
                      <SelectItem key={pageSize} value={`${pageSize}`}>
                        {pageSize}
                      </SelectItem>
                    ))}
                  </SelectGroup>
                </SelectContent>
              </Select>
            </div>
            <div className="flex w-fit items-center justify-center text-sm font-medium">
              Halaman {pagination.pageIndex + 1} dari{" "}
              {table.getPageCount() || 1}
            </div>
            <div className="ml-auto flex items-center gap-2 lg:ml-0">
              <Button
                variant="outline"
                className="hidden h-8 w-8 p-0 lg:flex"
                onClick={() => table.setPageIndex(0)}
                disabled={!table.getCanPreviousPage()}
              >
                <span className="sr-only">Halaman pertama</span>
                <CaretDoubleLeftIcon />
              </Button>
              <Button
                variant="outline"
                className="size-8"
                size="icon"
                onClick={() => table.previousPage()}
                disabled={!table.getCanPreviousPage()}
              >
                <span className="sr-only">Halaman sebelumnya</span>
                <CaretLeftIcon />
              </Button>
              <Button
                variant="outline"
                className="size-8"
                size="icon"
                onClick={() => table.nextPage()}
                disabled={!table.getCanNextPage()}
              >
                <span className="sr-only">Halaman selanjutnya</span>
                <CaretRightIcon />
              </Button>
              <Button
                variant="outline"
                className="hidden h-8 w-8 p-0 lg:flex"
                onClick={() => table.setPageIndex(table.getPageCount() - 1)}
                disabled={!table.getCanNextPage()}
              >
                <span className="sr-only">Halaman terakhir</span>
                <CaretDoubleRightIcon />
              </Button>
            </div>
          </div>
        </div>
      </TabsContent>
    </Tabs>
  );
}

// ------------------------------------------------------------------
// Drawer Detail Transaksi Pembayaran Mahasiswa
// ------------------------------------------------------------------
function TableCellViewer({ item }: { item: TransactionItem }) {
  const isMobile = useIsMobile();
  return (
    <Drawer swipeDirection={isMobile ? "down" : "right"}>
      <DrawerTrigger
        render={
          <Button
            variant="link"
            className="w-fit px-0 text-left font-mono font-medium text-foreground hover:underline"
          />
        }
      >
        {item.referenceCode}
      </DrawerTrigger>
      <DrawerContent>
        <DrawerHeader className="gap-1 border-b pb-4">
          <div className="flex items-center gap-2">
            <DrawerTitle className="font-mono text-lg">{item.referenceCode}</DrawerTitle>
            <Badge
              variant="outline"
              className={
                item.status === "APPROVED"
                  ? "border-emerald-500/30 text-emerald-600"
                  : item.status === "REJECTED"
                  ? "border-rose-500/30 text-rose-600"
                  : "border-amber-500/30 text-amber-600"
              }
            >
              {item.status}
            </Badge>
          </div>
          <DrawerDescription>
            Detail Bukti Pembayaran Keuangan Mahasiswa
          </DrawerDescription>
        </DrawerHeader>

        <div className="flex flex-col gap-5 overflow-y-auto p-4 text-sm">
          {/* Ringkasan Mahasiswa */}
          <div className="grid grid-cols-2 gap-4 rounded-lg border bg-muted/30 p-3">
            <div>
              <span className="text-xs text-muted-foreground">Mahasiswa:</span>
              <p className="font-semibold">{item.studentName}</p>
              <p className="text-xs text-muted-foreground">{item.nim} • {item.className}</p>
            </div>
            <div>
              <span className="text-xs text-muted-foreground">Tagihan:</span>
              <p className="font-semibold">{item.billTitle}</p>
              <p className="text-base font-bold text-primary">{formatRupiah(item.amountPaid)}</p>
            </div>
          </div>

          {/* Rekening Tujuan PIC */}
          <div className="space-y-1 rounded-lg border p-3">
            <span className="text-xs text-muted-foreground">Rekening Tujuan / PIC Bendahara:</span>
            <p className="font-medium">{item.paymentMethodName} ({item.accountNumber})</p>
            <p className="text-xs text-muted-foreground">PIC: {item.picName}</p>
          </div>

          {/* Catatan / Alasan */}
          {item.studentNotes && (
            <div className="space-y-1">
              <span className="text-xs text-muted-foreground">Catatan Mahasiswa:</span>
              <p className="rounded-md bg-muted/40 p-2 text-xs italic">&ldquo;{item.studentNotes}&rdquo;</p>
            </div>
          )}

          {item.rejectionReason && (
            <div className="space-y-1 rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-destructive">
              <span className="text-xs font-semibold">Alasan Penolakan:</span>
              <p className="text-xs">{item.rejectionReason}</p>
            </div>
          )}

          {/* Foto Bukti Transfer */}
          <div className="space-y-2">
            <span className="text-xs font-semibold text-muted-foreground">Bukti Struk Transfer:</span>
            <div className="relative flex aspect-video w-full items-center justify-center overflow-hidden rounded-lg border bg-black/5 dark:bg-white/5">
              <div className="flex flex-col items-center gap-2 p-4 text-center text-muted-foreground">
                <ReceiptIcon className="size-10 text-primary/60" />
                <span className="text-xs font-mono">{item.proofImageUrl}</span>
                <span className="text-[10px]">Struk terverifikasi pada {formatDateTime(item.createdAt)}</span>
              </div>
            </div>
          </div>
        </div>

        <DrawerFooter className="border-t pt-4">
          <DrawerClose
            render={
              <Button variant="outline" className="w-full">
                Tutup Detail
              </Button>
            }
          />
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
}
