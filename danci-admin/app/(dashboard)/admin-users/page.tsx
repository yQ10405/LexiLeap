import { asc } from "drizzle-orm";
import { redirect } from "next/navigation";

import { AdminUsersManager } from "@/components/admin-users-manager";
import { db } from "@/db";
import { adminUsers } from "@/db/schema";
import { getCurrentAdmin } from "@/lib/auth";

export default async function AdminUsersPage() {
  const current = await getCurrentAdmin();
  if (current?.role !== "system_admin") redirect("/books");

  const users = await db
    .select({
      id: adminUsers.id,
      name: adminUsers.name,
      email: adminUsers.email,
      role: adminUsers.role,
      active: adminUsers.active,
      createdAt: adminUsers.createdAt,
    })
    .from(adminUsers)
    .orderBy(asc(adminUsers.createdAt));

  return (
    <AdminUsersManager
      currentUserId={current.id}
      initialUsers={users.map((user) => ({
        ...user,
        createdAt: user.createdAt.toISOString(),
      }))}
    />
  );
}
