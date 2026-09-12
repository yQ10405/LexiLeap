"use client";

import { useState, type FormEvent } from "react";
import { Loader2, Plus, Users } from "lucide-react";

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

export interface AdminListItem {
  id: string;
  name: string;
  email: string;
  role: "system_admin" | "admin";
  active: boolean;
  createdAt: string;
}

type AdminForm = {
  name: string;
  email: string;
  password: string;
  role: AdminListItem["role"];
};

const emptyForm: AdminForm = {
  name: "",
  email: "",
  password: "",
  role: "admin",
};

export function AdminUsersManager({
  initialUsers,
  currentUserId,
}: {
  initialUsers: AdminListItem[];
  currentUserId: string;
}) {
  const [users, setUsers] = useState(initialUsers);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<AdminForm>(emptyForm);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  function openCreate() {
    setForm(emptyForm);
    setError(null);
    setOpen(true);
  }

  async function handleCreate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    if (!form.name.trim() || !form.email.trim() || !form.password) {
      setError("请填写必填字段");
      return;
    }
    if (form.password.length < 8) {
      setError("密码长度至少为 8 位");
      return;
    }

    setSubmitting(true);
    try {
      const response = await fetch("/api/admin-users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const { user } = await readJson<{
        user: Omit<AdminListItem, "createdAt"> & { createdAt: string | Date };
      }>(response);
      setUsers((current) => [
        ...current,
        { ...user, createdAt: new Date(user.createdAt).toISOString() },
      ]);
      setOpen(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "创建失败");
    } finally {
      setSubmitting(false);
    }
  }

  async function toggleStatus(user: AdminListItem) {
    setUpdatingId(user.id);
    try {
      const response = await fetch(`/api/admin-users/${user.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ active: !user.active }),
      });
      const { user: updated } = await readJson<{
        user: Omit<AdminListItem, "createdAt"> & { createdAt: string | Date };
      }>(response);
      setUsers((current) =>
        current.map((item) =>
          item.id === updated.id
            ? {
                ...updated,
                createdAt: new Date(updated.createdAt).toISOString(),
              }
            : item,
        ),
      );
    } catch (err) {
      window.alert(err instanceof Error ? err.message : "状态修改失败");
    } finally {
      setUpdatingId(null);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">管理员管理</h1>
          <p className="text-muted-foreground text-sm">
            管理系统管理员账号与权限
          </p>
        </div>
        <Button onClick={openCreate}>
          <Plus />
          新建管理员
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Users className="size-4 text-primary" />
            管理员列表
          </CardTitle>
          <CardDescription>共 {users.length} 位管理员</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>姓名</TableHead>
                <TableHead>邮箱</TableHead>
                <TableHead>角色</TableHead>
                <TableHead>状态</TableHead>
                <TableHead>创建时间</TableHead>
                <TableHead className="text-right">操作</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.map((user) => {
                const isCurrentUser = user.id === currentUserId;
                return (
                  <TableRow key={user.id}>
                    <TableCell className="font-medium">
                      {user.name}
                      {isCurrentUser && (
                        <span className="text-muted-foreground ml-2 text-xs">
                          当前账号
                        </span>
                      )}
                    </TableCell>
                    <TableCell>{user.email}</TableCell>
                    <TableCell>
                      {user.role === "system_admin"
                        ? "系统管理员"
                        : "普通管理员"}
                    </TableCell>
                    <TableCell>
                      <Badge variant={user.active ? "success" : "secondary"}>
                        {user.active ? "启用" : "禁用"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {new Date(user.createdAt).toLocaleDateString("zh-CN")}
                    </TableCell>
                    <TableCell className="text-right">
                      {!isCurrentUser && (
                        <Button
                          variant="outline"
                          size="sm"
                          disabled={updatingId === user.id}
                          onClick={() => toggleStatus(user)}
                        >
                          {updatingId === user.id && (
                            <Loader2 className="animate-spin" />
                          )}
                          {user.active ? "禁用" : "启用"}
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>新建管理员</DialogTitle>
            <DialogDescription>
              创建账号并设置其初始管理员角色
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleCreate} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="admin-name">姓名</Label>
              <Input
                id="admin-name"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="admin-email">邮箱</Label>
              <Input
                id="admin-email"
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="admin-password">密码</Label>
              <Input
                id="admin-password"
                type="password"
                placeholder="至少 8 位"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="admin-role">角色</Label>
              <select
                id="admin-role"
                className="border-input bg-background h-9 w-full rounded-md border px-3 text-sm"
                value={form.role}
                onChange={(e) =>
                  setForm({
                    ...form,
                    role: e.target.value as AdminForm["role"],
                  })
                }
              >
                <option value="admin">普通管理员</option>
                <option value="system_admin">系统管理员</option>
              </select>
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
                创建
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
