import {
  bigint,
  boolean,
  index,
  integer,
  json,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";

export const adminUsers = pgTable(
  "admin-users",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    name: varchar("name", { length: 100 }).notNull(),
    email: varchar("email", { length: 255 }).notNull(),
    passwordHash: varchar("password_hash", { length: 255 }).notNull(),
    role: varchar("role", {
      length: 32,
      enum: ["system_admin", "admin"],
    })
      .notNull()
      .default("admin"),
    active: boolean("active").notNull().default(true),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [uniqueIndex("admin_users_email_unique").on(table.email)],
);

export const adminSessions = pgTable(
  "admin-session",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    adminUserId: uuid("admin_user_id")
      .notNull()
      .references(() => adminUsers.id, { onDelete: "cascade" }),
    tokenHash: varchar("token_hash", { length: 64 }).notNull(),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    uniqueIndex("admin_session_token_hash_unique").on(table.tokenHash),
    index("admin_session_user_id_idx").on(table.adminUserId),
    index("admin_session_expires_at_idx").on(table.expiresAt),
  ],
);

export const words = pgTable("words", {
  id: bigint("id", { mode: "number" }).primaryKey().generatedByDefaultAsIdentity(),
  wordRank: integer("wordRank"),
  headWord: text("headWord"),
  content: json("content").$type<Record<string, unknown>>(),
  bookId: text("bookId"),
});

export const books = pgTable(
  "books",
  {
    id: bigint("id", { mode: "number" }).primaryKey().generatedByDefaultAsIdentity(),
    title: text("title").notNull(),
    wordCount: integer("word_count").notNull().default(0),
    coverUrl: text("cover_url"),
    bookId: text("book_id").notNull(),
    tags: text("tags"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [index("books_book_id_idx").on(table.bookId)],
);

export type AdminRole = (typeof adminUsers.$inferSelect)["role"];
export type AdminUser = typeof adminUsers.$inferSelect;
