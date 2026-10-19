"use client";

import * as React from "react";
import { NavDocuments } from "@/components/nav-documents";
import { NavMain } from "@/components/nav-main";
import { NavSecondary } from "@/components/nav-secondary";
import { NavUser } from "@/components/nav-user";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import {
  SquaresFourIcon,
  CheckCircleIcon,
  ReceiptIcon,
  CreditCardIcon,
  UsersIcon,
  ChartLineIcon,
  GlobeIcon,
  QuestionIcon,
  BankIcon,
} from "@phosphor-icons/react";

const navigationData = {
  user: {
    name: "Siti Nurhaliza (Bendahara 1)",
    email: "bendahara1@kampus.ac.id",
    avatar: "/avatars/avatar-1.jpg",
  },
  navMain: [
    {
      title: "Ringkasan Keuangan",
      url: "/dashboard",
      icon: <SquaresFourIcon />,
    },
    {
      title: "Verifikasi 1-Klik",
      url: "/dashboard/verification",
      icon: <CheckCircleIcon />,
    },
    {
      title: "Tagihan & Iuran",
      url: "/dashboard/bills",
      icon: <ReceiptIcon />,
    },
    {
      title: "Metode & PIC Rekening",
      url: "/dashboard/methods",
      icon: <CreditCardIcon />,
    },
    {
      title: "Mahasiswa & Kelas",
      url: "/dashboard/students",
      icon: <UsersIcon />,
    },
  ],
  documents: [
    {
      name: "Portal Bayar Siswa",
      url: "/bayar",
      icon: <GlobeIcon />,
    },
    {
      name: "Transparansi Keuangan",
      url: "/transparansi",
      icon: <ChartLineIcon />,
    },
    {
      name: "Cek Status Transaksi",
      url: "/status",
      icon: <CheckCircleIcon />,
    },
  ],
  navSecondary: [
    {
      title: "Panduan Bendahara",
      url: "/docs",
      icon: <QuestionIcon />,
    },
  ],
};

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  return (
    <Sidebar collapsible="offcanvas" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              className="data-[slot=sidebar-menu-button]:p-1.5!"
              render={<a href="/dashboard" />}
            >
              <div className="flex size-7 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                <BankIcon className="size-4!" />
              </div>
              <div className="flex flex-col gap-0.5 leading-none">
                <span className="text-sm font-semibold tracking-tight">KeuanganAngkatan</span>
                <span className="text-[10px] text-muted-foreground">Admin & Bendahara</span>
              </div>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={navigationData.navMain} />
        <NavDocuments items={navigationData.documents} />
        <NavSecondary items={navigationData.navSecondary} className="mt-auto" />
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={navigationData.user} />
      </SidebarFooter>
    </Sidebar>
  );
}
