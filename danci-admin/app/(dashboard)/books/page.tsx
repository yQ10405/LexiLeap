import { asc, count, eq } from "drizzle-orm";
import { redirect } from "next/navigation";

import { BooksManager } from "@/components/books-manager";
import { db } from "@/db";
import { books, words } from "@/db/schema";
import { getCurrentAdmin } from "@/lib/auth";

export default async function BooksPage() {
  const current = await getCurrentAdmin();
  if (!current) redirect("/signin");

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

  return (
    <BooksManager
      initialBooks={list.map((book) => ({
        ...book,
        createdAt: book.createdAt.toISOString(),
      }))}
    />
  );
}
