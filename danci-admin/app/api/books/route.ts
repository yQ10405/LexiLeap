import { asc, count, eq } from "drizzle-orm";
import { NextResponse } from "next/server";

import { db } from "@/db";
import { books, words } from "@/db/schema";
import { getCurrentAdmin } from "@/lib/auth";

async function requireLogin() {
  const current = await getCurrentAdmin();
  return current ?? null;
}

function parseBookInput(body: Record<string, unknown>) {
  const title = typeof body.title === "string" ? body.title.trim() : "";
  const bookId = typeof body.bookId === "string" ? body.bookId.trim() : "";
  const wordCount =
    typeof body.wordCount === "number" && Number.isFinite(body.wordCount)
      ? Math.max(0, Math.floor(body.wordCount))
      : 0;
  const coverUrl =
    typeof body.coverUrl === "string" ? body.coverUrl.trim() : null;
  const tags = typeof body.tags === "string" ? body.tags.trim() : null;

  if (!title || !bookId) {
    return { error: "请填写书名和 bookId" };
  }
  return { title, bookId, wordCount, coverUrl: coverUrl || null, tags: tags || null };
}

export async function GET() {
  if (!(await requireLogin())) {
    return NextResponse.json({ error: "未登录" }, { status: 401 });
  }

  const list = await db
    .select({
      id: books.id,
      title: books.title,
      wordCount: books.wordCount,
      actualWordCount: count(words.id),
      coverUrl: books.coverUrl,
      bookId: books.bookId,
      tags: books.tags,
      createdAt: books.createdAt,
    })
    .from(books)
    .leftJoin(words, eq(books.bookId, words.bookId))
    .groupBy(books.id)
    .orderBy(asc(books.createdAt));

  return NextResponse.json({ books: list });
}

export async function POST(request: Request) {
  if (!(await requireLogin())) {
    return NextResponse.json({ error: "未登录" }, { status: 401 });
  }

  const input = parseBookInput((await request.json()) as Record<string, unknown>);
  if ("error" in input) {
    return NextResponse.json({ error: input.error }, { status: 400 });
  }

  const [book] = await db
    .insert(books)
    .values(input)
    .returning({
      id: books.id,
      title: books.title,
      wordCount: books.wordCount,
      coverUrl: books.coverUrl,
      bookId: books.bookId,
      tags: books.tags,
      createdAt: books.createdAt,
    });

  return NextResponse.json({ book }, { status: 201 });
}
