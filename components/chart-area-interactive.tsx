"use client";

import * as React from "react";
import { Area, AreaChart, CartesianGrid, XAxis } from "recharts";
import { useIsMobile } from "@/hooks/use-mobile";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  ToggleGroup,
  ToggleGroupItem,
} from "@/components/ui/toggle-group";
import { formatRupiah } from "@/lib/utils";

export interface ChartPoint {
  date: string;
  terverifikasi: number;
  pending: number;
}

const defaultChartData: ChartPoint[] = [
  { date: "2026-10-01", terverifikasi: 40000, pending: 20000 },
  { date: "2026-10-02", terverifikasi: 20000, pending: 0 },
  { date: "2026-10-03", terverifikasi: 0, pending: 50000 },
  { date: "2026-10-04", terverifikasi: 50000, pending: 0 },
  { date: "2026-10-05", terverifikasi: 20000, pending: 20000 },
  { date: "2026-10-06", terverifikasi: 20000, pending: 0 },
  { date: "2026-10-07", terverifikasi: 0, pending: 0 },
  { date: "2026-10-08", terverifikasi: 50000, pending: 20000 },
  { date: "2026-10-09", terverifikasi: 20000, pending: 0 },
  { date: "2026-10-10", terverifikasi: 20000, pending: 50000 },
  { date: "2026-10-11", terverifikasi: 50000, pending: 20000 },
  { date: "2026-10-12", terverifikasi: 40000, pending: 90000 },
];

const chartConfig = {
  terverifikasi: {
    label: "Dana Disetujui",
    color: "var(--color-primary)",
  },
  pending: {
    label: "Dana Pending",
    color: "var(--color-chart-2)",
  },
} satisfies ChartConfig;

export function ChartAreaInteractive({
  data: customData,
}: {
  data?: ChartPoint[];
}) {
  const isMobile = useIsMobile();
  const [selectedTimeRange, setTimeRange] = React.useState<string | null>(null);
  const timeRange = selectedTimeRange ?? (isMobile ? "7d" : "30d");

  const rawData = customData && customData.length > 0 ? customData : defaultChartData;

  const filteredData = React.useMemo(() => {
    let daysToInclude = 30;
    if (timeRange === "7d") daysToInclude = 7;
    if (timeRange === "90d") daysToInclude = 90;

    return rawData.slice(-daysToInclude);
  }, [rawData, timeRange]);

  return (
    <Card className="@container/card">
      <CardHeader>
        <CardTitle>Arus Pembayaran Mahasiswa</CardTitle>
        <CardDescription>
          Tren nominal dana masuk terverifikasi vs transaksi yang menunggu verifikasi PIC
        </CardDescription>
        <CardAction>
          <ToggleGroup
            value={[timeRange]}
            onValueChange={(val: string[] | string) => {
              const selected = Array.isArray(val) ? val[0] : val;
              if (selected) setTimeRange(selected);
            }}
            variant="outline"
            className="hidden @[767px]/card:flex"
          >
            <ToggleGroupItem value="90d">3 Bulan Terakhir</ToggleGroupItem>
            <ToggleGroupItem value="30d">30 Hari Terakhir</ToggleGroupItem>
            <ToggleGroupItem value="7d">7 Hari Terakhir</ToggleGroupItem>
          </ToggleGroup>
          <Select
            value={timeRange}
            onValueChange={(val) => setTimeRange(val)}
            items={[
              { label: "3 Bulan Terakhir", value: "90d" },
              { label: "30 Hari Terakhir", value: "30d" },
              { label: "7 Hari Terakhir", value: "7d" },
            ]}
          >
            <SelectTrigger
              className="flex w-40 @[767px]/card:hidden"
              size="sm"
            >
              <SelectValue placeholder="Pilih rentang" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="90d">3 Bulan Terakhir</SelectItem>
              <SelectItem value="30d">30 Hari Terakhir</SelectItem>
              <SelectItem value="7d">7 Hari Terakhir</SelectItem>
            </SelectContent>
          </Select>
        </CardAction>
      </CardHeader>
      <CardContent className="px-2 pt-4 sm:px-6 sm:pt-6">
        <ChartContainer
          config={chartConfig}
          className="aspect-auto h-[250px] w-full"
        >
          <AreaChart data={filteredData}>
            <defs>
              <linearGradient id="fillTerverifikasi" x1="0" y1="0" x2="0" y2="1">
                <stop
                  offset="5%"
                  stopColor="var(--color-primary)"
                  stopOpacity={0.8}
                />
                <stop
                  offset="95%"
                  stopColor="var(--color-primary)"
                  stopOpacity={0.1}
                />
              </linearGradient>
              <linearGradient id="fillPending" x1="0" y1="0" x2="0" y2="1">
                <stop
                  offset="5%"
                  stopColor="var(--color-chart-2)"
                  stopOpacity={0.8}
                />
                <stop
                  offset="95%"
                  stopColor="var(--color-chart-2)"
                  stopOpacity={0.1}
                />
              </linearGradient>
            </defs>
            <CartesianGrid vertical={false} />
            <XAxis
              dataKey="date"
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              minTickGap={32}
              tickFormatter={(value) => {
                const date = new Date(value);
                return date.toLocaleDateString("id-ID", {
                  month: "short",
                  day: "numeric",
                });
              }}
            />
            <ChartTooltip
              cursor={false}
              content={
                <ChartTooltipContent
                  labelFormatter={(value) => {
                    return new Date(value).toLocaleDateString("id-ID", {
                      weekday: "short",
                      day: "numeric",
                      month: "long",
                      year: "numeric",
                    });
                  }}
                  formatter={(value) => formatRupiah(Number(value))}
                  indicator="dot"
                />
              }
            />
            <Area
              dataKey="pending"
              type="natural"
              fill="url(#fillPending)"
              stroke="var(--color-chart-2)"
              stackId="a"
            />
            <Area
              dataKey="terverifikasi"
              type="natural"
              fill="url(#fillTerverifikasi)"
              stroke="var(--color-primary)"
              stackId="a"
            />
          </AreaChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
