import { redirect } from "next/navigation";

import { SignInForm } from "@/components/sign-in-form";
import { getCurrentAdmin, hasAnyAdmin } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function SignInPage() {
  if (!(await hasAnyAdmin())) redirect("/signup");
  if (await getCurrentAdmin()) redirect("/books");
  return <SignInForm />;
}
