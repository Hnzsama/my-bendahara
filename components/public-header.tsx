"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTheme } from "next-themes";
import { Button } from "@/components/ui/button";
import {
  BankIcon,
  GlobeIcon,
  ChartLineIcon,
  CheckCircleIcon,
  SunIcon,
  MoonIcon,
  LockKeyIcon,
} from "@phosphor-icons/react";

export function PublicHeader() {
  const pathname = usePathname();
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  const navLinks = [
    {
      name: "Portal Bayar",
      href: "/bayar",
      icon: <GlobeIcon className="size-4" />,
    },
    {
      name: "Transparansi Keuangan",
      href: "/transparansi",
      icon: <ChartLineIcon className="size-4" />,
    },
    {
      name: "Cek Status",
      href: "/status",
      icon: <CheckCircleIcon className="size-4" />,
    },
  ];

  return (
    <header className="sticky top-0 z-40 w-full border-b bg-background/80 backdrop-blur-md transition-all">
      <div className="max-w-7xl mx-auto flex h-16 items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Brand Logo */}
        <Link
          href="/bayar"
          className="flex items-center gap-2.5 transition-opacity hover:opacity-90"
        >
          <div className="flex size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground shadow-xs">
            <BankIcon className="size-4.5" />
          </div>
          <div className="flex flex-col leading-none">
            <span className="text-base font-bold tracking-tight">KeuanganAngkatan</span>
            <span className="text-[10px] text-muted-foreground font-medium">
              Manajemen Informatika 2025
            </span>
          </div>
        </Link>

        {/* Center Nav Links */}
        <nav className="hidden md:flex items-center gap-1 bg-muted/50 p-1 rounded-xl border border-border/60">
          {navLinks.map((link) => {
            const isActive = pathname === link.href || pathname.startsWith(link.href + "/");
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all ${
                  isActive
                    ? "bg-background text-foreground shadow-xs font-semibold"
                    : "text-muted-foreground hover:text-foreground hover:bg-background/50"
                }`}
              >
                {link.icon}
                <span>{link.name}</span>
              </Link>
            );
          })}
        </nav>

        {/* Right Actions */}
        <div className="flex items-center gap-2">
          {/* Theme Switcher */}
          {mounted && (
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
              className="size-9 rounded-lg text-muted-foreground hover:text-foreground cursor-pointer"
              title="Ganti Tema"
            >
              {theme === "dark" ? (
                <SunIcon className="size-4.5" />
              ) : (
                <MoonIcon className="size-4.5" />
              )}
            </Button>
          )}

          {/* Admin Dashboard / Login */}
          <Link href="/dashboard">
            <Button
              variant="outline"
              size="sm"
              className="gap-2 text-xs rounded-lg cursor-pointer border-border/70 hover:bg-muted font-medium"
            >
              <LockKeyIcon className="size-3.5" />
              <span className="hidden sm:inline">Area Bendahara</span>
              <span className="sm:hidden">Login</span>
            </Button>
          </Link>
        </div>
      </div>

      {/* Mobile Nav Bar */}
      <div className="md:hidden flex items-center justify-around border-t py-2 bg-background/95 px-2">
        {navLinks.map((link) => {
          const isActive = pathname === link.href;
          return (
            <Link
              key={link.href}
              href={link.href}
              className={`flex flex-col items-center gap-1 text-[11px] font-medium py-1 px-3 rounded-lg transition-colors ${
                isActive ? "text-primary font-semibold" : "text-muted-foreground"
              }`}
            >
              {link.icon}
              <span>{link.name}</span>
            </Link>
          );
        })}
      </div>
    </header>
  );
}
