"use client";

import { useState, type FormEvent } from "react";
import { BookOpen, Loader2, Pencil, Plus, Trash2 } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { readJson } from "@/lib/api";

export interface BookItem {
  id: number;
  title: string;
  wordCount: number;
  actualWordCount?: number;
  coverUrl: string | null;
  bookId: string;
  tags: string | null;
  createdAt: string;
}

type BookForm = {
  title: string;
  wordCount: string;
  coverUrl: string;
  bookId: string;
  tags: string;
};

const emptyForm: BookForm = {
  title: "",
  wordCount: "0",
  coverUrl: "",
  bookId: "",
  tags: "",
};

export function BooksManager({ initialBooks }: { initialBooks: BookItem[] }) {
  const [books, setBooks] = useState(initialBooks);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<BookItem | null>(null);
  const [form, setForm] = useState<BookForm>(emptyForm);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  function openCreate() {
    setEditing(null);
    setForm(emptyForm);
    setError(null);
    setOpen(true);
  }

  function openEdit(book: BookItem) {
    setEditing(book);
    setForm({
      title: book.title,
      wordCount: String(book.wordCount),
      coverUrl: book.coverUrl ?? "",
      bookId: book.bookId,
      tags: book.tags ?? "",
    });
    setError(null);
    setOpen(true);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    const wordCount = Number(form.wordCount);
    if (!form.title.trim() || !form.bookId.trim()) {
      setError("请填写书名和 bookId");
      return;
    }
    if (!Number.isInteger(wordCount) || wordCount < 0) {
      setError("单词数量必须是非负整数");
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        title: form.title.trim(),
        wordCount,
        coverUrl: form.coverUrl.trim(),
        bookId: form.bookId.trim(),
        tags: form.tags.trim(),
      };

      if (editing) {
        const response = await fetch(`/api/books/${editing.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        const { book } = await readJson<{ book: BookItem }>(response);
        setBooks((current) =>
          current.map((item) =>
            item.id === book.id ? { ...item, ...book } : item,
          ),
        );
      } else {
        const response = await fetch("/api/books", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        const { book } = await readJson<{ book: BookItem }>(response);
        setBooks((current) => [...current, book]);
      }
      setOpen(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "保存失败");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete(book: BookItem) {
    if (!window.confirm(`确定删除单词书「${book.title}」吗？`)) return;
    setDeletingId(book.id);
    try {
      const response = await fetch(`/api/books/${book.id}`, {
        method: "DELETE",
      });
      await readJson<{ success: boolean }>(response);
      setBooks((current) => current.filter((item) => item.id !== book.id));
    } catch (err) {
      window.alert(err instanceof Error ? err.message : "删除失败");
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">单词书管理</h1>
          <p className="text-muted-foreground text-sm">
            管理平台内的单词书及其内容
          </p>
        </div>
        <Button onClick={openCreate}>
          <Plus />
          新增单词书
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <BookOpen className="size-4 text-primary" />
            单词书列表
          </CardTitle>
          <CardDescription>共 {books.length} 本单词书</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>封面</TableHead>
                <TableHead>标题</TableHead>
                <TableHead>单词数量</TableHead>
                <TableHead>实际单词数</TableHead>
                <TableHead>bookId</TableHead>
                <TableHead>标签</TableHead>
                <TableHead className="text-right">操作</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {books.map((book) => {
                const tags = book.tags
                  ?.split(",")
                  .map((tag) => tag.trim())
                  .filter(Boolean);
                return (
                  <TableRow key={book.id}>
                    <TableCell>
                      {book.coverUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={book.coverUrl}
                          alt={book.title}
                          className="bg-muted h-12 w-9 rounded object-cover"
                        />
                      ) : (
                        <div className="bg-muted flex h-12 w-9 items-center justify-center rounded">
                          <BookOpen className="text-muted-foreground size-4" />
                        </div>
                      )}
                    </TableCell>
                    <TableCell className="font-medium">{book.title}</TableCell>
                    <TableCell>{book.wordCount.toLocaleString()}</TableCell>
                    <TableCell className="text-muted-foreground">
                      {book.actualWordCount?.toLocaleString() ?? "—"}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {book.bookId}
                    </TableCell>
                    <TableCell>
                      {tags && tags.length > 0 ? (
                        <div className="flex flex-wrap gap-1">
                          {tags.map((tag) => (
                            <Badge key={tag} variant="secondary">
                              {tag}
                            </Badge>
                          ))}
                        </div>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => openEdit(book)}
                          aria-label={`编辑 ${book.title}`}
                        >
                          <Pencil className="size-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          disabled={deletingId === book.id}
                          onClick={() => handleDelete(book)}
                          aria-label={`删除 ${book.title}`}
                        >
                          {deletingId === book.id ? (
                            <Loader2 className="size-4 animate-spin" />
                          ) : (
                            <Trash2 className="text-destructive size-4" />
                          )}
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
              {books.length === 0 && (
                <TableRow>
                  <TableCell
                    colSpan={7}
                    className="text-muted-foreground text-center"
                  >
                    暂无单词书
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editing ? "编辑单词书" : "新增单词书"}
            </DialogTitle>
            <DialogDescription>
              {editing
                ? "修改单词书的基本信息"
                : "填写单词书的基本信息并创建"}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="book-title">标题</Label>
              <Input
                id="book-title"
                placeholder="请输入标题"
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="book-word-count">单词数量</Label>
              <Input
                id="book-word-count"
                type="number"
                min={0}
                placeholder="请输入单词数量"
                value={form.wordCount}
                onChange={(e) =>
                  setForm({ ...form, wordCount: e.target.value })
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="book-cover-url">封面 URL</Label>
              <Input
                id="book-cover-url"
                type="url"
                placeholder="https://example.com/cover.jpg"
                value={form.coverUrl}
                onChange={(e) =>
                  setForm({ ...form, coverUrl: e.target.value })
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="book-id">bookId</Label>
              <Input
                id="book-id"
                placeholder="例如 PEPXiaoXue3_1"
                value={form.bookId}
                onChange={(e) => setForm({ ...form, bookId: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="book-tags">标签（逗号分隔）</Label>
              <Input
                id="book-tags"
                placeholder="例如 小学,人教版,三年级"
                value={form.tags}
                onChange={(e) => setForm({ ...form, tags: e.target.value })}
              />
            </div>
            {error && <p className="text-sm text-destructive">{error}</p>}
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setOpen(false)}
              >
                取消
              </Button>
              <Button type="submit" disabled={submitting}>
                {submitting && <Loader2 className="animate-spin" />}
                {editing ? "保存" : "创建"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
