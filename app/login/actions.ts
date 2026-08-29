"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { env } from "@/config/env";
import { prisma } from "@/db/prisma";
import { logger } from "@/lib/logger";
import { createSession, hashSessionToken } from "@/modules/identity/session";
import { verifyPassword } from "@/modules/identity/password";

const cookieName = "deliveryreg_session";

async function setSessionCookie(token: string, expiresAt: Date) {
  (await cookies()).set(cookieName, token, {
    httpOnly: true,
    secure: env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    expires: expiresAt
  });
}

export type LoginState = {
  message?: string;
};

export async function loginAction(_state: LoginState, formData: FormData): Promise<LoginState> {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");

  if (!email || !password) {
    logger.warn("Falha de login: credenciais incompletas", { email });
    return { message: "Informe e-mail e senha." };
  }

  const user = await prisma.user.findFirst({
    where: {
      email
    }
  });

  if (!user || !user.isActive || !(await verifyPassword(password, user.passwordHash))) {
    logger.warn("Falha de login: credenciais inválidas ou usuário inativo", { email });
    return { message: "E-mail ou senha inválidos." };
  }

  const session = await createSession({
    prisma,
    userId: user.id
  });
  await setSessionCookie(session.token, session.expiresAt);
  if (user.role === "DELIVERY") {
    redirect("/entregas");
  }

  if (user.role === "ATTENDANT") {
    redirect("/operacao");
  }

  redirect("/painel");
}

export async function logoutAction() {
  const cookieStore = await cookies();
  const token = cookieStore.get(cookieName)?.value;

  if (token) {
    await prisma.session.updateMany({
      where: {
        tokenHash: hashSessionToken(token),
        revokedAt: null
      },
      data: {
        revokedAt: new Date()
      }
    });
  }

  cookieStore.set(cookieName, "", {
    httpOnly: true,
    secure: env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    expires: new Date(0)
  });
  redirect("/login");
}
