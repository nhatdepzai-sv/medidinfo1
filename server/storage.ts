import { type User, type InsertUser, type Medication, type InsertMedication, type SearchHistory, type InsertSearchHistory } from "@shared/schema";
import { randomUUID } from "crypto";
import { medicationsDatabase } from "./medications-database";
import { drizzle } from "drizzle-orm/neon-http";
import { neon } from "@neondatabase/serverless";
import * as schema from "@shared/schema";
import { eq, like, or, desc, asc, sql } from "drizzle-orm";

// Check for DATABASE_URL and create connection if available
let db: any = null;
let useDatabase = false;

if (process.env.DATABASE_URL) {
  try {
    const neonSql = neon(process.env.DATABASE_URL);
    db = drizzle(neonSql, { schema });
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
  fuzzySearchMedications(searchTerm: string): Promise<Medication[]>;

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

  async fuzzySearchMedications(searchTerm: string): Promise<Medication[]> {
    if (useDatabase && db) {
      // Database fuzzy search with enhanced patterns
      const query = `%${searchTerm.toLowerCase()}%`;
      const results = await db
        .select()
        .from(schema.medications)
        .where(
          or(
            sql`LOWER(${schema.medications.name}) LIKE ${query}`,
            sql`LOWER(${schema.medications.genericName}) LIKE ${query}`,
            sql`LOWER(${schema.medications.nameVi}) LIKE ${query}`,
            sql`LOWER(${schema.medications.genericNameVi}) LIKE ${query}`,
            sql`LOWER(${schema.medications.category}) LIKE ${query}`,
            sql`LOWER(${schema.medications.categoryVi}) LIKE ${query}`
          )
        )
        .limit(20);
      return results;
    } else {
      // Enhanced memory fuzzy search with multiple algorithms
      const searchLower = searchTerm.toLowerCase().trim();
      const results: { medication: Medication; score: number }[] = [];

      for (const med of this.memoryMedications.values()) {
        let maxScore = 0;

        // Check all searchable fields
        const fields = [
          med.name.toLowerCase(),
          med.genericName?.toLowerCase() || '',
          med.nameVi?.toLowerCase() || '',
          med.genericNameVi?.toLowerCase() || '',
          med.category?.toLowerCase() || '',
          med.categoryVi?.toLowerCase() || ''
        ].filter(field => field.length > 0);

        for (const field of fields) {
          // Exact substring match gets highest score
          if (field.includes(searchLower) || searchLower.includes(field)) {
            maxScore = Math.max(maxScore, 1.0);
            continue;
          }

          // Levenshtein distance-based similarity
          const levenScore = this.calculateLevenshteinSimilarity(searchLower, field);
          maxScore = Math.max(maxScore, levenScore);

          // Jaro-Winkler similarity
          const jaroScore = this.calculateJaroWinklerSimilarity(searchLower, field);
          maxScore = Math.max(maxScore, jaroScore);

          // Word-based matching
          const wordScore = this.calculateWordSimilarity(searchLower, field);
          maxScore = Math.max(maxScore, wordScore);
        }

        if (maxScore > 0.5) { // 50% similarity threshold
          results.push({ medication: med, score: maxScore });
        }
      }

      // Sort by score and return top 20
      return results
        .sort((a, b) => b.score - a.score)
        .slice(0, 20)
        .map(result => result.medication);
    }
  }

  private calculateLevenshteinSimilarity(str1: string, str2: string): number {
    const maxLength = Math.max(str1.length, str2.length);
    if (maxLength === 0) return 1.0;
    const distance = this.levenshteinDistance(str1, str2);
    return 1 - (distance / maxLength);
  }

  private calculateJaroWinklerSimilarity(str1: string, str2: string): number {
    if (str1 === str2) return 1.0;

    const jaro = this.jaroSimilarity(str1, str2);
    const prefixLength = Math.min(4, this.commonPrefixLength(str1, str2));

    return jaro + (0.1 * prefixLength * (1 - jaro));
  }

  private calculateWordSimilarity(search: string, target: string): number {
    const searchWords = search.split(/\s+/);
    const targetWords = target.split(/\s+/);

    let matches = 0;
    for (const searchWord of searchWords) {
      for (const targetWord of targetWords) {
        if (targetWord.includes(searchWord) || searchWord.includes(targetWord)) {
          matches++;
          break;
        }
      }
    }

    return matches / searchWords.length;
  }

  private levenshteinDistance(str1: string, str2: string): number {
    const matrix = Array(str2.length + 1).fill(null).map(() => Array(str1.length + 1).fill(null));

    for (let i = 0; i <= str1.length; i++) matrix[0][i] = i;
    for (let j = 0; j <= str2.length; j++) matrix[j][0] = j;

    for (let j = 1; j <= str2.length; j++) {
      for (let i = 1; i <= str1.length; i++) {
        const indicator = str1[i - 1] === str2[j - 1] ? 0 : 1;
        matrix[j][i] = Math.min(
          matrix[j][i - 1] + 1,
          matrix[j - 1][i] + 1,
          matrix[j - 1][i - 1] + indicator
        );
      }
    }

    return matrix[str2.length][str1.length];
  }

  private jaroSimilarity(str1: string, str2: string): number {
    const len1 = str1.length;
    const len2 = str2.length;

    if (len1 === 0 || len2 === 0) return 0;

    const matchDistance = Math.floor(Math.max(len1, len2) / 2) - 1;
    const matches1 = new Array(len1).fill(false);
    const matches2 = new Array(len2).fill(false);

    let matches = 0;
    for (let i = 0; i < len1; i++) {
      const start = Math.max(0, i - matchDistance);
      const end = Math.min(len2 - 1, i + matchDistance);

      for (let j = start; j <= end; j++) {
        if (!matches2[j] && str1[i] === str2[j]) {
          matches1[i] = true;
          matches2[j] = true;
          matches++;
          break;
        }
      }
    }

    if (matches === 0) return 0;

    let transpositions = 0;
    let k = 0;
    for (let i = 0; i < len1; i++) {
      if (matches1[i]) {
        while (!matches2[k]) k++;
        if (str1[i] !== str2[k]) transpositions++;
        k++;
      }
    }

    return (matches / len1 + matches / len2 + (matches - transpositions / 2) / matches) / 3;
  }

  private commonPrefixLength(str1: string, str2: string): number {
    let length = 0;
    const maxLength = Math.min(str1.length, str2.length);

    for (let i = 0; i < maxLength; i++) {
      if (str1[i] === str2[i]) {
        length++;
      } else {
        break;
      }
    }

    return length;
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