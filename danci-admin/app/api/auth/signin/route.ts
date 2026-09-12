import { compare } from "bcryptjs";
import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";

import { db } from "@/db";
import { adminUsers } from "@/db/schema";
import { createAdminSession, hasAnyAdmin } from "@/lib/auth";

export async function POST(request: Request) {
  if (!(await hasAnyAdmin())) {
    return NextResponse.json(
      { error: "请先注册首位系统管理员", code: "SETUP_REQUIRED" },
      { status: 409 },
    );
  }

  const body = (await request.json()) as { email?: string; password?: string };
  const email = body.email?.trim().toLowerCase();
  const password = body.password;

  if (!email || !password) {
    return NextResponse.json({ error: "请输入邮箱和密码" }, { status: 400 });
  }

  const [admin] = await db
    .select()
    .from(adminUsers)
    .where(eq(adminUsers.email, email))
    .limit(1);

  if (!admin || !(await compare(password, admin.passwordHash))) {
    return NextResponse.json({ error: "邮箱或密码错误" }, { status: 401 });
  }
  if (!admin.active) {
    return NextResponse.json({ error: "该管理员账号已被禁用" }, { status: 403 });
  }

  await createAdminSession(admin.id);
  return NextResponse.json({
    user: {
      id: admin.id,
      name: admin.name,
      email: admin.email,
      role: admin.role,
    },
  });
}
