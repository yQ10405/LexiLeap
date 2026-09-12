import { hash } from "bcryptjs";
import { asc, eq } from "drizzle-orm";
import { NextResponse } from "next/server";

import { db } from "@/db";
import { adminUsers, type AdminRole } from "@/db/schema";
import { getCurrentAdmin } from "@/lib/auth";

async function requireSystemAdmin() {
  const current = await getCurrentAdmin();
  return current?.role === "system_admin" ? current : null;
}

export async function GET() {
  if (!(await requireSystemAdmin())) {
    return NextResponse.json({ error: "无权访问管理员管理" }, { status: 403 });
  }

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

  return NextResponse.json({ users });
}

export async function POST(request: Request) {
  if (!(await requireSystemAdmin())) {
    return NextResponse.json({ error: "无权创建管理员" }, { status: 403 });
  }

  const body = (await request.json()) as {
    name?: string;
    email?: string;
    password?: string;
    role?: AdminRole;
  };
  const name = body.name?.trim();
  const email = body.email?.trim().toLowerCase();
  const password = body.password;
  const role = body.role;

  if (
    !name ||
    !email ||
    !password ||
    password.length < 8 ||
    !role ||
    !["system_admin", "admin"].includes(role)
  ) {
    return NextResponse.json(
      { error: "请填写完整信息，密码长度至少为 8 位" },
      { status: 400 },
    );
  }

  const [existing] = await db
    .select({ id: adminUsers.id })
    .from(adminUsers)
    .where(eq(adminUsers.email, email))
    .limit(1);
  if (existing) {
    return NextResponse.json({ error: "该邮箱已被使用" }, { status: 409 });
  }

  const [user] = await db
    .insert(adminUsers)
    .values({ name, email, passwordHash: await hash(password, 12), role })
    .returning({
      id: adminUsers.id,
      name: adminUsers.name,
      email: adminUsers.email,
      role: adminUsers.role,
      active: adminUsers.active,
      createdAt: adminUsers.createdAt,
    });

  return NextResponse.json({ user }, { status: 201 });
}
