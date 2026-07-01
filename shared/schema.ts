import { pgTable, text, timestamp, uuid, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const profiles = pgTable("profiles", {
  id: uuid("id").primaryKey(), 
  email: text("email"),
  full_name: text("full_name"),
  avatar_url: text("avatar_url"),
  role: text("role", { enum: ["user", "admin"] }).default("user").notNull(),
  is_subscriber: boolean("is_subscriber").default(false).notNull(),
  stripe_customer_id: text("stripe_customer_id"),
  stripe_subscription_id: text("stripe_subscription_id"),
  subscription_status: text("subscription_status"),
  has_accepted_terms: boolean("has_accepted_terms").default(false).notNull(),
  last_active_at: timestamp("last_active_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
});

export const insertProfileSchema = createInsertSchema(profiles, {
  email: z.string().email(),
  full_name: z.string().min(2).max(100).optional(),
});

export const updateProfileSchema = insertProfileSchema.partial();

export type Profile = typeof profiles.$inferSelect;
export type InsertProfile = z.infer<typeof insertProfileSchema>;
export type UpdateProfileRequest = z.infer<typeof updateProfileSchema>;

// Leads table
export const leads = pgTable("leads", {
  id: uuid("id").primaryKey().defaultRandom(),
  user_id: uuid("user_id").notNull(),
  name: text("name").notNull(),
  email: text("email"),
  phone: text("phone"),
  vehicle: text("vehicle"),
  source: text("source"),
  status: text("status").default("En attente"),
  priority: text("priority").default("Moyenne"),
  type_demande: text("type_demande").default("acheteur"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
});

export const insertLeadSchema = createInsertSchema(leads).omit({ id: true, createdAt: true, updatedAt: true });
export type Lead = typeof leads.$inferSelect;
export type InsertLead = z.infer<typeof insertLeadSchema>;

// Clients table
export const clients = pgTable("clients", {
  id: uuid("id").primaryKey().defaultRandom(),
  user_id: uuid("user_id").notNull(),
  name: text("name").notNull(),
  first_name: text("first_name"),
  last_name: text("last_name"),
  email: text("email"),
  phone: text("phone"),
  vehicle: text("vehicle"),
  purchase_date: text("purchase_date"),
  client_type: text("client_type").default("Acheteur"),
  lastVisit: text("last_visit"),
  nextCT: text("next_ct"),
  nextService: text("next_service"),
  status: text("status").default("Actif"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
});

export const insertClientSchema = createInsertSchema(clients).omit({ id: true, createdAt: true, updatedAt: true });
export type Client = typeof clients.$inferSelect;
export type InsertClient = z.infer<typeof insertClientSchema>;

// Relances table
export const relances = pgTable("relances", {
  id: uuid("id").primaryKey().defaultRandom(),
  user_id: uuid("user_id").notNull(),
  client: text("client").notNull(),
  vehicle: text("vehicle"),
  type: text("type").notNull(),
  dueDate: text("due_date"),
  daysLeft: text("days_left"),
  status: text("status").default("En attente"),
  channel: text("channel").default("SMS"),
  sent: boolean("sent").default(false),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
});

export const insertRelanceSchema = createInsertSchema(relances).omit({ id: true, createdAt: true, updatedAt: true });
export type Relance = typeof relances.$inferSelect;
export type InsertRelance = z.infer<typeof insertRelanceSchema>;

// Reports table
export const reports = pgTable("reports", {
  id: uuid("id").primaryKey().defaultRandom(),
  user_id: uuid("user_id").notNull(),
  month: text("month").notNull(),
  leadsTotal: text("leads_total"),
  leadsQualified: text("leads_qualified"),
  relancesSent: text("relances_sent"),
  relancesReturned: text("relances_returned"),
  revenue: text("revenue"),
  status: text("status").default("Généré"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
});

export const insertReportSchema = createInsertSchema(reports).omit({ id: true, createdAt: true, updatedAt: true });
export type Report = typeof reports.$inferSelect;
export type InsertReport = z.infer<typeof insertReportSchema>;

// Concessions table
export const concessions = pgTable("concessions", {
  id: uuid("id").primaryKey().defaultRandom(),
  user_id: uuid("user_id").notNull().unique(),
  name: text("name").notNull(),
  address: text("address"),
  phone: text("phone"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
});

export const insertConcessionSchema = createInsertSchema(concessions).omit({ id: true, createdAt: true, updatedAt: true });
export type Concession = typeof concessions.$inferSelect;
export type InsertConcession = z.infer<typeof insertConcessionSchema>;
