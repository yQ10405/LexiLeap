import { hash } from "bcryptjs";
import { sql } from "drizzle-orm";
import { NextResponse } from "next/server";

import { db } from "@/db";
import { adminUsers } from "@/db/schema";
import { createAdminSession } from "@/lib/auth";

export async function POST(request: Request) {
  const body = (await request.json()) as {
    name?: string;
    email?: string;
    password?: string;
  };
  const name = body.name?.trim();
  const email = body.email?.trim().toLowerCase();
  const password = body.password;

  if (!name || !email || !password || password.length < 8) {
    return NextResponse.json(
      { error: "请填写完整信息，密码长度至少为 8 位" },
      { status: 400 },
    );
  }

  try {
    const passwordHash = await hash(password, 12);
    const [admin] = await db.transaction(async (tx) => {
      await tx.execute(sql`select pg_advisory_xact_lock(734291)`);
      const [existing] = await tx
        .select({ id: adminUsers.id })
        .from(adminUsers)
        .limit(1);

      if (existing) {
        throw new Error("ADMIN_EXISTS");
      }

      return tx
        .insert(adminUsers)
        .values({
          name,
          email,
          passwordHash,
          role: "system_admin",
        })
        .returning({
          id: adminUsers.id,
          name: adminUsers.name,
          email: adminUsers.email,
          role: adminUsers.role,
        });
    });

    await createAdminSession(admin.id);
    return NextResponse.json({ user: admin }, { status: 201 });
  } catch (error) {
    if (error instanceof Error && error.message === "ADMIN_EXISTS") {
      return NextResponse.json(
        { error: "系统管理员已完成初始化" },
        { status: 409 },
      );
    }
    if (error instanceof Error && error.message.includes("unique")) {
      return NextResponse.json({ error: "该邮箱已被使用" }, { status: 409 });
    }
    throw error;
  }
}
