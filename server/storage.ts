import { type User, type InsertUser, type Medication, type InsertMedication, type SearchHistory, type InsertSearchHistory } from "@shared/schema";
import { randomUUID } from "crypto";
import { medicationsDatabase } from "./medications-database";
import { drizzle } from "drizzle-orm/neon-http";
import { neon } from "@neondatabase/serverless";
import * as schema from "@shared/schema";
import { eq, like, or, desc, asc } from "drizzle-orm";

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL environment variable is required");
}

// Create the database connection
const sql = neon(process.env.DATABASE_URL);
const db = drizzle(sql, { schema });

export interface IStorage {
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;

  getMedication(id: string): Promise<Medication | undefined>;
  getMedicationByName(name: string): Promise<Medication | undefined>;
  getMedicationByPartialName(partialName: string): Promise<Medication | undefined>;
  createMedication(medication: InsertMedication): Promise<Medication>;
  searchMedications(query: string): Promise<Medication[]>;

  getSearchHistory(userId?: string): Promise<SearchHistory[]>;
  createSearchHistory(searchHistory: InsertSearchHistory): Promise<SearchHistory>;
}

export class DatabaseStorage implements IStorage {
  constructor() {
    // Initialize medications from the database
    this.initializeMedications().catch(console.error);
  }

  private async initializeMedications() {
    try {
      const existingMedications = await db.select().from(schema.medications).limit(1);

      if (existingMedications.length === 0) {
        console.log("Initializing medications database with 100,000+ medications...");
        const medications = medicationsDatabase.map(med => ({
          ...med,
          id: randomUUID()
        }));

        console.log(`Preparing to insert ${medications.length} medications...`);
        
        // Insert in batches to avoid memory issues
        const batchSize = 1000;
        for (let i = 0; i < medications.length; i += batchSize) {
          const batch = medications.slice(i, i + batchSize);
          await db.insert(schema.medications).values(batch);
          console.log(`Inserted batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(medications.length / batchSize)}`);
        }
        
        console.log(`Successfully inserted ${medications.length} medications into database`);
      } else {
        console.log("Medications database already initialized");
      }
    } catch (error) {
      console.error("Error initializing medications:", error);
      throw error;
    }
  }

  async getUser(id: string): Promise<User | undefined> {
    const users = await db.select().from(schema.users).where(eq(schema.users.id, id));
    return users[0];
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const users = await db.select().from(schema.users).where(eq(schema.users.username, username));
    return users[0];
  }

  async createUser(user: InsertUser): Promise<User> {
    const newUser = {
      ...user,
      id: randomUUID()
    };
    await db.insert(schema.users).values(newUser);
    return newUser as User;
  }

  async getMedication(id: string): Promise<Medication | undefined> {
    const medications = await db.select().from(schema.medications).where(eq(schema.medications.id, id));
    return medications[0];
  }

  async getMedicationByName(name: string): Promise<Medication | undefined> {
    const medications = await db.select().from(schema.medications).where(
      or(
        eq(schema.medications.name, name),
        eq(schema.medications.nameVi, name),
        eq(schema.medications.genericName, name),
        eq(schema.medications.genericNameVi, name)
      )
    );
    return medications[0];
  }

  async getMedicationByPartialName(partialName: string): Promise<Medication | undefined> {
    const medications = await db.select().from(schema.medications).where(
      or(
        like(schema.medications.name, `%${partialName}%`),
        like(schema.medications.nameVi, `%${partialName}%`),
        like(schema.medications.genericName, `%${partialName}%`),
        like(schema.medications.genericNameVi, `%${partialName}%`)
      )
    );
    return medications[0];
  }

  async createMedication(medication: InsertMedication): Promise<Medication> {
    const newMedication = {
      ...medication,
      id: randomUUID()
    };
    await db.insert(schema.medications).values(newMedication);
    return newMedication as Medication;
  }

  async searchMedications(query: string): Promise<Medication[]> {
    if (!query.trim()) {
      return await db.select().from(schema.medications).limit(50);
    }

    const medications = await db.select().from(schema.medications).where(
      or(
        like(schema.medications.name, `%${query}%`),
        like(schema.medications.nameVi, `%${query}%`),
        like(schema.medications.genericName, `%${query}%`),
        like(schema.medications.genericNameVi, `%${query}%`),
        like(schema.medications.category, `%${query}%`),
        like(schema.medications.categoryVi, `%${query}%`)
      )
    );
    return medications;
  }

  async getSearchHistory(userId?: string): Promise<SearchHistory[]> {
    if (userId) {
      return await db.select().from(schema.searchHistory)
        .where(eq(schema.searchHistory.userId, userId))
        .orderBy(desc(schema.searchHistory.createdAt));
    }
    return await db.select().from(schema.searchHistory)
      .orderBy(desc(schema.searchHistory.createdAt));
  }

  async createSearchHistory(searchHistory: InsertSearchHistory): Promise<SearchHistory> {
    const newSearchHistory = {
      ...searchHistory,
      id: randomUUID()
    };
    await db.insert(schema.searchHistory).values(newSearchHistory);
    return newSearchHistory as SearchHistory;
  }
}

// Use the database storage implementation
export const storage = new DatabaseStorage();