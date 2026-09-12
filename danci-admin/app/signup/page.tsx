import { redirect } from "next/navigation";

import { SignUpForm } from "@/components/sign-up-form";
import { hasAnyAdmin } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function SignUpPage() {
  if (await hasAnyAdmin()) redirect("/signin");
  return <SignUpForm />;
}
