import { redirect } from "next/navigation";

import { AppShell } from "@/components/app-shell";
import { getCurrentAdmin } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentAdmin();
  if (!user) redirect("/signin");

  return <AppShell user={user}>{children}</AppShell>;
}
