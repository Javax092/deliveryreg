import { redirect } from "next/navigation";

import { AdminShell } from "@/components/admin/AdminShell";
import { getCurrentUserContext } from "@/modules/shared/auth/permissions";
import { AppError } from "@/modules/shared/errors/app-error";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  let context;

  try {
    context = await getCurrentUserContext();
  } catch (error) {
    if (error instanceof AppError && error.code === "AUTHENTICATION_ERROR") {
      redirect("/login");
    }

    throw error;
  }

  return <AdminShell context={context}>{children}</AdminShell>;
}
