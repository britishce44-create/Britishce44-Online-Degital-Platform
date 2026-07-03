import { pgTable, serial, text, integer, jsonb, timestamp } from "drizzle-orm/pg-core";

export const contactGroups = pgTable("contact_groups", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  color: text("color").notNull().default("#3b82f6"),
  userId: integer("user_id"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const contacts = pgTable("contacts", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  phone: text("phone").default(""),
  email: text("email").default(""),
  groupIds: jsonb("group_ids").$type<number[]>().notNull().default([]),
  classification: text("classification").default(""),
  notes: text("notes").default(""),
  userId: integer("user_id"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const contactMessages = pgTable("contact_messages", {
  id: serial("id").primaryKey(),
  contactId: integer("contact_id").notNull(),
  channel: text("channel").$type<"whatsapp" | "sms" | "email" | "messenger" | "call">().notNull(),
  direction: text("direction").$type<"sent" | "received">().notNull().default("sent"),
  content: text("content").notNull(),
  status: text("status").$type<"sent" | "delivered" | "failed" | "pending">().notNull().default("pending"),
  senderInfo: text("sender_info").default(""),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export type ContactGroup = typeof contactGroups.$inferSelect;
export type Contact = typeof contacts.$inferSelect;
export type ContactMessage = typeof contactMessages.$inferSelect;
