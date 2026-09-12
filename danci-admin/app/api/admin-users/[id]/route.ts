import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";

import { db } from "@/db";
import { adminSessions, adminUsers } from "@/db/schema";
import { getCurrentAdmin } from "@/lib/auth";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const current = await getCurrentAdmin();
  if (current?.role !== "system_admin") {
    return NextResponse.json({ error: "无权修改管理员状态" }, { status: 403 });
  }

  const { id } = await params;
  if (id === current.id) {
    return NextResponse.json(
      { error: "不能修改自己的账号状态" },
      { status: 400 },
    );
  }

  const body = (await request.json()) as { active?: boolean };
  if (typeof body.active !== "boolean") {
    return NextResponse.json({ error: "账号状态无效" }, { status: 400 });
  }

  const [user] = await db
    .update(adminUsers)
    .set({ active: body.active, updatedAt: new Date() })
    .where(eq(adminUsers.id, id))
    .returning({
      id: adminUsers.id,
      name: adminUsers.name,
      email: adminUsers.email,
      role: adminUsers.role,
      active: adminUsers.active,
      createdAt: adminUsers.createdAt,
    });

  if (!user) {
    return NextResponse.json({ error: "管理员不存在" }, { status: 404 });
  }

  if (!body.active) {
    await db.delete(adminSessions).where(eq(adminSessions.adminUserId, id));
  }

  return NextResponse.json({ user });
}
