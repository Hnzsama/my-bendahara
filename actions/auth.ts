"use server";

import { signIn, signOut } from "@/lib/auth";
import { z } from "zod";
import { AuthError } from "next-auth";

const LoginSchema = z.object({
  usernameOrEmail: z.string().min(1, "Username atau Email wajib diisi"),
  password: z.string().min(1, "Password wajib diisi"),
});

export type ActionResponse<T = undefined> = {
  success: boolean;
  message?: string;
  data?: T;
  error?: string;
  fieldErrors?: Record<string, string[]>;
};

export async function loginAdminAction(
  data: z.infer<typeof LoginSchema>
): Promise<ActionResponse<{ redirectUrl: string }>> {
  const validated = LoginSchema.safeParse(data);
  if (!validated.success) {
    return {
      success: false,
      error: "Data yang dimasukkan tidak valid",
      fieldErrors: validated.error.flatten().fieldErrors,
    };
  }

  try {
    await signIn("credentials", {
      usernameOrEmail: validated.data.usernameOrEmail,
      password: validated.data.password,
      redirect: false,
    });

    return {
      success: true,
      message: "Login berhasil",
      data: { redirectUrl: "/dashboard" },
    };
  } catch (error) {
    if (error instanceof AuthError) {
      switch (error.type) {
        case "CredentialsSignin":
          return {
            success: false,
            error: "Username/Email atau password salah",
          };
        default:
          return {
            success: false,
            error: "Terjadi kesalahan saat otentikasi",
          };
      }
    }
    // Re-throw redirect if needed, or return generic error
    return {
      success: false,
      error: "Gagal memproses login. Silakan periksa kredensial Anda.",
    };
  }
}

export async function logoutAdminAction() {
  await signOut({ redirectTo: "/login" });
}
