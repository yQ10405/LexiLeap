import { redirect } from "next/navigation";

import { getCurrentAdmin, hasAnyAdmin } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  if (!(await hasAnyAdmin())) redirect("/signup");
  redirect((await getCurrentAdmin()) ? "/books" : "/signin");
}
