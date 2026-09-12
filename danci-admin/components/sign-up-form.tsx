"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, Library, Loader2, Lock, Mail, User } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { readJson } from "@/lib/api";

export function SignUpForm() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    if (!name.trim() || !email.trim() || !password || !confirmPassword) {
      setError("请填写所有字段");
      return;
    }
    if (password !== confirmPassword) {
      setError("两次输入的密码不一致");
      return;
    }
    if (password.length < 8) {
      setError("密码长度至少为 8 位");
      return;
    }

    setSubmitting(true);
    try {
      const response = await fetch("/api/auth/bootstrap", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password }),
      });
      await readJson(response);
      router.replace("/books");
      router.refresh();
    } catch (err) {
      if (err instanceof Error && err.message === "系统管理员已完成初始化") {
        router.replace("/signin");
        return;
      }
      setError(err instanceof Error ? err.message : "注册失败");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/30 p-4">
      <Card className="w-full max-w-sm">
        <CardHeader className="text-center">
          <div className="mx-auto flex size-10 items-center justify-center rounded-full bg-primary/10">
            <Library className="size-5 text-primary" />
          </div>
          <CardTitle className="text-xl">注册系统管理员</CardTitle>
          <CardDescription>初始化首个系统管理员账号</CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            <div className="space-y-2"><Label htmlFor="name">姓名</Label><div className="relative"><User className="text-muted-foreground pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2" /><Input id="name" placeholder="请输入姓名" autoComplete="name" className="pl-9" value={name} onChange={(e) => setName(e.target.value)} /></div></div>
            <div className="space-y-2"><Label htmlFor="email">邮箱</Label><div className="relative"><Mail className="text-muted-foreground pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2" /><Input id="email" type="email" placeholder="you@example.com" autoComplete="email" className="pl-9" value={email} onChange={(e) => setEmail(e.target.value)} /></div></div>
            <div className="space-y-2"><Label htmlFor="password">密码</Label><div className="relative"><Lock className="text-muted-foreground pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2" /><Input id="password" type={showPassword ? "text" : "password"} placeholder="至少 8 位" autoComplete="new-password" className="px-9" value={password} onChange={(e) => setPassword(e.target.value)} /><button type="button" onClick={() => setShowPassword((v) => !v)} className="text-muted-foreground hover:text-foreground absolute top-1/2 right-3 -translate-y-1/2" aria-label={showPassword ? "隐藏密码" : "显示密码"}>{showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}</button></div></div>
            <div className="space-y-2"><Label htmlFor="confirmPassword">确认密码</Label><div className="relative"><Lock className="text-muted-foreground pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2" /><Input id="confirmPassword" type={showPassword ? "text" : "password"} placeholder="再次输入密码" autoComplete="new-password" className="pl-9" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} /></div></div>
            {error && <p className="text-sm text-destructive">{error}</p>}
          </CardContent>
          <CardFooter><Button type="submit" className="mt-4 w-full" disabled={submitting}>{submitting && <Loader2 className="animate-spin" />}注册</Button></CardFooter>
        </form>
      </Card>
    </div>
  );
}
