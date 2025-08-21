import { type User, type InsertUser, type Medication, type InsertMedication, type SearchHistory, type InsertSearchHistory } from "@shared/schema";
import { randomUUID } from "crypto";
import { medicationsDatabase } from "./medications-database";
import { drizzle } from "drizzle-orm/neon-http";
import { neon } from "@neondatabase/serverless";
import * as schema from "@shared/schema";
import { eq, like, or, desc, asc } from "drizzle-orm";

// Check for DATABASE_URL and create connection if available
let db: any = null;
let useDatabase = false;

if (process.env.DATABASE_URL) {
  try {
    const sql = neon(process.env.DATABASE_URL);
    db = drizzle(sql, { schema });
    useDatabase = true;
    console.log("Database connection established");
  } catch (error) {
    console.error("Database connection failed:", error);
    useDatabase = false;
  }
} else {
  console.log("No DATABASE_URL found, using in-memory storage");
  useDatabase = false;
}

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
  private memoryUsers: Map<string, User> = new Map();
  private memoryMedications: Map<string, Medication> = new Map();
  private memorySearchHistory: SearchHistory[] = [];
  private medicationsInitialized = false;

  constructor() {
    // Initialize medications
    this.initializeMedications().catch(console.error);
  }

  private async initializeMedications() {
    try {
      if (useDatabase && db) {
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
      } else {
        // Use in-memory storage
        console.log("Initializing in-memory medications database with 100,000+ medications...");
        medicationsDatabase.forEach(med => {
          const medication = { ...med, id: randomUUID() } as Medication;
          this.memoryMedications.set(medication.id, medication);
        });
        console.log(`Successfully initialized ${this.memoryMedications.size} medications in memory`);
      }
      
      this.medicationsInitialized = true;
    } catch (error) {
      console.error("Error initializing medications:", error);
      // Fallback to memory storage
      if (!this.medicationsInitialized) {
        console.log("Falling back to in-memory storage...");
        medicationsDatabase.forEach(med => {
          const medication = { ...med, id: randomUUID() } as Medication;
          this.memoryMedications.set(medication.id, medication);
        });
        this.medicationsInitialized = true;
        console.log(`Fallback: Successfully initialized ${this.memoryMedications.size} medications in memory`);
      }
    }
  }

  async getUser(id: string): Promise<User | undefined> {
    if (useDatabase && db) {
      const users = await db.select().from(schema.users).where(eq(schema.users.id, id));
      return users[0];
    }
    return this.memoryUsers.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    if (useDatabase && db) {
      const users = await db.select().from(schema.users).where(eq(schema.users.username, username));
      return users[0];
    }
    for (const user of this.memoryUsers.values()) {
      if (user.username === username) return user;
    }
    return undefined;
  }

  async createUser(user: InsertUser): Promise<User> {
    const newUser = {
      ...user,
      id: randomUUID()
    } as User;

    if (useDatabase && db) {
      await db.insert(schema.users).values(newUser);
    } else {
      this.memoryUsers.set(newUser.id, newUser);
    }
    return newUser;
  }

  async getMedication(id: string): Promise<Medication | undefined> {
    if (useDatabase && db) {
      const medications = await db.select().from(schema.medications).where(eq(schema.medications.id, id));
      return medications[0];
    }
    return this.memoryMedications.get(id);
  }

  async getMedicationByName(name: string): Promise<Medication | undefined> {
    if (useDatabase && db) {
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

    for (const med of this.memoryMedications.values()) {
      if (med.name === name || med.nameVi === name || 
          med.genericName === name || med.genericNameVi === name) {
        return med;
      }
    }
    return undefined;
  }

  async getMedicationByPartialName(partialName: string): Promise<Medication | undefined> {
    if (useDatabase && db) {
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

    const lowerPartial = partialName.toLowerCase();
    for (const med of this.memoryMedications.values()) {
      if (med.name?.toLowerCase().includes(lowerPartial) ||
          med.nameVi?.toLowerCase().includes(lowerPartial) ||
          med.genericName?.toLowerCase().includes(lowerPartial) ||
          med.genericNameVi?.toLowerCase().includes(lowerPartial)) {
        return med;
      }
    }
    return undefined;
  }

  async createMedication(medication: InsertMedication): Promise<Medication> {
    const newMedication = {
      ...medication,
      id: randomUUID()
    } as Medication;

    if (useDatabase && db) {
      await db.insert(schema.medications).values(newMedication);
    } else {
      this.memoryMedications.set(newMedication.id, newMedication);
    }
    return newMedication;
  }

  async searchMedications(query: string): Promise<Medication[]> {
    if (useDatabase && db) {
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

    if (!query.trim()) {
      return Array.from(this.memoryMedications.values()).slice(0, 50);
    }

    const lowerQuery = query.toLowerCase();
    const results: Medication[] = [];
    
    for (const med of this.memoryMedications.values()) {
      if (med.name?.toLowerCase().includes(lowerQuery) ||
          med.nameVi?.toLowerCase().includes(lowerQuery) ||
          med.genericName?.toLowerCase().includes(lowerQuery) ||
          med.genericNameVi?.toLowerCase().includes(lowerQuery) ||
          med.category?.toLowerCase().includes(lowerQuery) ||
          med.categoryVi?.toLowerCase().includes(lowerQuery)) {
        results.push(med);
      }
      if (results.length >= 50) break;
    }
    
    return results;
  }

  async getSearchHistory(userId?: string): Promise<SearchHistory[]> {
    if (useDatabase && db) {
      if (userId) {
        return await db.select().from(schema.searchHistory)
          .where(eq(schema.searchHistory.userId, userId))
          .orderBy(desc(schema.searchHistory.createdAt));
      }
      return await db.select().from(schema.searchHistory)
        .orderBy(desc(schema.searchHistory.createdAt));
    }

    let history = [...this.memorySearchHistory];
    if (userId) {
      history = history.filter(h => h.userId === userId);
    }
    return history.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  async createSearchHistory(searchHistory: InsertSearchHistory): Promise<SearchHistory> {
    const newSearchHistory = {
      ...searchHistory,
      id: randomUUID(),
      createdAt: new Date()
    } as SearchHistory;

    if (useDatabase && db) {
      await db.insert(schema.searchHistory).values(newSearchHistory);
    } else {
      this.memorySearchHistory.push(newSearchHistory);
    }
    return newSearchHistory;
  }
}

// Use the database storage implementation
export const storage = new DatabaseStorage();