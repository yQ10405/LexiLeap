import "server-only";

import postgres from "postgres";
import { drizzle } from "drizzle-orm/postgres-js";

import * as schema from "@/db/schema";

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  throw new Error("DATABASE_URL 环境变量未配置");
}

const client = postgres(databaseUrl, {
  prepare: false,
});

export const db = drizzle({ client, schema });
