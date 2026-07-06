import {
  pgTable,
  serial,
  text,
  integer,
  timestamp,
  boolean,
  unique,
} from "drizzle-orm/pg-core";

// Library items — one row per uploaded file (video, image, audio, PDF, PPT, flash).
// Files are stored on disk under uploads/library/ with a UUID filename; the DB
// holds the metadata + the relative path. When an admin/teacher uploads, every
// authenticated user with library access can list, watch, listen, and download.
export const libraryItems = pgTable("library_items", {
  id: serial("id").primaryKey(),
  roomId: text("room_id").notNull(),
  title: text("title").notNull(),
  description: text("description"),
  type: text("type").notNull(), // mp4 | jpg | mp3 | pdf | ppt | flash
  mimeType: text("mime_type"),
  size: integer("size").notNull().default(0),
  filePath: text("file_path").notNull(), // relative path under uploads/library/
  fileName: text("file_name"), // original filename for download
  uploadedBy: text("uploaded_by"),
  downloads: integer("downloads").notNull().default(0),
  active: boolean("active").notNull().default(true),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Per-user library access (allow/ban). Default is allow (no row = allowed).
export const libraryPermissions = pgTable(
  "library_permissions",
  {
    id: serial("id").primaryKey(),
    userId: integer("user_id").notNull(),
    access: text("access").$type<"allow" | "ban">().notNull().default("allow"),
    setBy: text("set_by"),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (t) => [unique("uq_library_perm_user").on(t.userId)],
);

export type LibraryItem = typeof libraryItems.$inferSelect;
export type LibraryPermission = typeof libraryPermissions.$inferSelect;
