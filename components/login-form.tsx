"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { loginAdminAction } from "@/actions/auth";
import { BankIcon, SpinnerIcon } from "@phosphor-icons/react";

export function LoginForm({
  className,
  ...props
}: React.ComponentProps<"div">) {
  const router = useRouter();
  const [usernameOrEmail, setUsernameOrEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!usernameOrEmail || !password) {
      toast.error("Harap isi username/email dan password");
      return;
    }

    setIsLoading(true);
    try {
      const res = await loginAdminAction({ usernameOrEmail, password });
      if (res.success) {
        toast.success("Login berhasil! Mengalihkan ke dashboard...");
        router.push(res.data?.redirectUrl || "/dashboard");
        router.refresh();
      } else {
        toast.error(res.error || "Gagal masuk. Periksa username dan password Anda.");
      }
    } catch {
      toast.error("Terjadi kesalahan pada sistem.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <form onSubmit={handleSubmit}>
        <FieldGroup>
          <div className="flex flex-col items-center gap-2 text-center">
            <div className="flex size-11 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-sm">
              <BankIcon className="size-6" />
            </div>
            <h1 className="text-xl font-bold tracking-tight">KeuanganAngkatan</h1>
            <p className="text-xs text-muted-foreground">
              Portal Khusus Tim Bendahara & Keuangan Angkatan Mahasiswa
            </p>
          </div>

          <Field>
            <FieldLabel htmlFor="usernameOrEmail">Username atau Email</FieldLabel>
            <Input
              id="usernameOrEmail"
              type="text"
              placeholder="bendahara1 / bendahara1@kampus.ac.id"
              value={usernameOrEmail}
              onChange={(e) => setUsernameOrEmail(e.target.value)}
              disabled={isLoading}
              required
              autoComplete="username"
            />
          </Field>

          <Field>
            <div className="flex items-center justify-between">
              <FieldLabel htmlFor="password">Kata Sandi (Password)</FieldLabel>
            </div>
            <Input
              id="password"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={isLoading}
              required
              autoComplete="current-password"
            />
          </Field>

          <Field>
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? (
                <>
                  <SpinnerIcon className="mr-2 size-4 animate-spin" />
                  Memverifikasi...
                </>
              ) : (
                "Masuk ke Portal Bendahara"
              )}
            </Button>
          </Field>
        </FieldGroup>
      </form>

      <FieldDescription className="px-6 text-center text-xs">
        Bagi mahasiswa pembayar iuran/tagihan, Anda <strong>tidak perlu login</strong>. Silakan kembali ke{" "}
        <a href="/bayar" className="font-semibold text-primary underline underline-offset-4">
          Halaman Pembayaran Mahasiswa
        </a>
        .
      </FieldDescription>
    </div>
  );
}
