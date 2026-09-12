import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";

import { db } from "@/db";
import { books, words } from "@/db/schema";
import { getCurrentAdmin } from "@/lib/auth";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  if (!(await getCurrentAdmin())) {
    return NextResponse.json({ error: "未登录" }, { status: 401 });
  }

  const { id } = await params;
  const bookIdNum = Number(id);
  if (!Number.isInteger(bookIdNum) || bookIdNum <= 0) {
    return NextResponse.json({ error: "参数无效" }, { status: 400 });
  }

  const body = (await request.json()) as Record<string, unknown>;
  const updates: Record<string, unknown> = {};

  if (typeof body.title === "string") {
    const title = body.title.trim();
    if (!title) {
      return NextResponse.json({ error: "书名不能为空" }, { status: 400 });
    }
    updates.title = title;
  }
  if (typeof body.bookId === "string") {
    const bookId = body.bookId.trim();
    if (!bookId) {
      return NextResponse.json({ error: "bookId 不能为空" }, { status: 400 });
    }
    updates.bookId = bookId;
  }
  if (typeof body.wordCount === "number" && Number.isFinite(body.wordCount)) {
    updates.wordCount = Math.max(0, Math.floor(body.wordCount));
  }
  if (typeof body.coverUrl === "string") {
    updates.coverUrl = body.coverUrl.trim() || null;
  }
  if (typeof body.tags === "string") {
    updates.tags = body.tags.trim() || null;
  }

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: "没有需要更新的内容" }, { status: 400 });
  }
  updates.updatedAt = new Date();

  const [book] = await db
    .update(books)
    .set(updates)
    .where(eq(books.id, bookIdNum))
    .returning({
      id: books.id,
      title: books.title,
      wordCount: books.wordCount,
      coverUrl: books.coverUrl,
      bookId: books.bookId,
      tags: books.tags,
      createdAt: books.createdAt,
    });

  if (!book) {
    return NextResponse.json({ error: "单词书不存在" }, { status: 404 });
  }

  return NextResponse.json({ book });
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  if (!(await getCurrentAdmin())) {
    return NextResponse.json({ error: "未登录" }, { status: 401 });
  }

  const { id } = await params;
  const bookIdNum = Number(id);
  if (!Number.isInteger(bookIdNum) || bookIdNum <= 0) {
    return NextResponse.json({ error: "参数无效" }, { status: 400 });
  }

  const [book] = await db
    .select({ id: books.id, bookId: books.bookId })
    .from(books)
    .where(eq(books.id, bookIdNum))
    .limit(1);

  if (!book) {
    return NextResponse.json({ error: "单词书不存在" }, { status: 404 });
  }

  // 事务中先删除 words 表中相同 bookId 的所有数据，再删除该单词书记录
  await db.transaction(async (tx) => {
    await tx.delete(words).where(eq(words.bookId, book.bookId));
    await tx.delete(books).where(eq(books.id, bookIdNum));
  });

  return NextResponse.json({ success: true });
}
