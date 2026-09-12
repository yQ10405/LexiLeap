import type { ReactNode } from "react";

import { AppSidebar } from "@/components/app-sidebar";
import type { CurrentAdmin } from "@/lib/auth";

export function AppShell({
  children,
  user,
}: {
  children: ReactNode;
  user: CurrentAdmin;
}) {
  return (
    <div className="flex min-h-screen w-full">
      <AppSidebar user={user} />
      <main className="min-w-0 flex-1 overflow-y-auto bg-muted/30 p-6 md:p-8">
        {children}
      </main>
    </div>
  );
}
