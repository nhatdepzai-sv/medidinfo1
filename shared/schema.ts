import { sql } from "drizzle-orm";
import { pgTable, text, varchar, timestamp, jsonb, integer, boolean, real } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: text("username").notNull().unique(),
  email: text("email").notNull().unique(),
  password: text("password").notNull(),
  role: text("role").default("user"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const medications = pgTable("medications", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  nameVi: text("name_vi"),
  genericName: text("generic_name"),
  genericNameVi: text("generic_name_vi"),
  category: text("category"),
  categoryVi: text("category_vi"),
  primaryUse: text("primary_use"),
  primaryUseVi: text("primary_use_vi"),
  adultDosage: text("adult_dosage"),
  adultDosageVi: text("adult_dosage_vi"),
  maxDosage: text("max_dosage"),
  maxDosageVi: text("max_dosage_vi"),
  warnings: jsonb("warnings").$type<string[]>(),
  warningsVi: jsonb("warnings_vi").$type<string[]>(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const searchHistory = pgTable("search_history", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id"),
  medicationId: varchar("medication_id").references(() => medications.id),
  searchQuery: text("search_query"),
  searchMethod: text("search_method"), // 'photo' or 'manual'
  createdAt: timestamp("created_at").defaultNow(),
});

export const trainingProgress = pgTable("training_progress", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  processed: integer("processed").notNull().default(0),
  target: integer("target").notNull().default(1000000),
  isTraining: boolean("is_training").notNull().default(false),
  currentPhase: text("current_phase"),
  successRate: real("success_rate").default(0),
  lastUpdated: timestamp("last_updated").defaultNow(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const aiStats = pgTable("ai_stats", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  accuracy: real("accuracy").notNull().default(0),
  trainingPoints: integer("training_points").notNull().default(0),
  lastUpdated: timestamp("last_updated").defaultNow(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  email: true,
  password: true,
});

export const insertMedicationSchema = createInsertSchema(medications).omit({
  id: true,
  createdAt: true,
});

export const insertSearchHistorySchema = createInsertSchema(searchHistory).omit({
  id: true,
  createdAt: true,
});

export const insertTrainingProgressSchema = createInsertSchema(trainingProgress).omit({
  id: true,
  createdAt: true,
  lastUpdated: true,
});

export const insertAiStatsSchema = createInsertSchema(aiStats).omit({
  id: true,
  lastUpdated: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

export type InsertMedication = z.infer<typeof insertMedicationSchema>;
export type Medication = typeof medications.$inferSelect;

export type InsertSearchHistory = z.infer<typeof insertSearchHistorySchema>;
export type SearchHistory = typeof searchHistory.$inferSelect;

export type InsertTrainingProgress = z.infer<typeof insertTrainingProgressSchema>;
export type TrainingProgress = typeof trainingProgress.$inferSelect;

export type InsertAiStats = z.infer<typeof insertAiStatsSchema>;
export type AiStats = typeof aiStats.$inferSelect;

export const drugSearchResponseSchema = z.object({
  name: z.string(),
  genericName: z.string().optional(),
  category: z.string().optional(),
  primaryUse: z.string(),
  adultDosage: z.string().optional(),
  maxDosage: z.string().optional(),
  warnings: z.array(z.string()).optional(),
});

export type DrugSearchResponse = z.infer<typeof drugSearchResponseSchema>;
