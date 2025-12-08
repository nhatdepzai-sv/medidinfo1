import { type User, type InsertUser, type Medication, type InsertMedication, type SearchHistory, type InsertSearchHistory, type TrainingProgress, type InsertTrainingProgress, type AiStats, type InsertAiStats } from "@shared/schema";
import { randomUUID } from "crypto";
import { medicationsDatabase } from "./medications-database";
import { drizzle } from "drizzle-orm/neon-http";
import { neon } from "@neondatabase/serverless";
import * as schema from "@shared/schema";
import { eq, like, or, desc, asc, sql } from "drizzle-orm";

// Check for DATABASE_URL and create connection if available
let db: any = null;
let useDatabase = false;

async function initializeDatabase() {
  if (process.env.DATABASE_URL) {
    const maxRetries = 3;
    const retryDelay = 1000; // 1 second
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        console.log(`🔗 Attempting database connection (attempt ${attempt}/${maxRetries})...`);
        console.log("📍 DATABASE_URL found:", process.env.DATABASE_URL ? "Yes" : "No");
        
        const neonSql = neon(process.env.DATABASE_URL);
        db = drizzle(neonSql, { schema });
        
        // Test the connection with a simple query
        const result = await db.execute(sql`SELECT 1 as test`);
        
        if (result) {
          useDatabase = true;
          console.log("✅ Database connection established successfully");
          console.log("💾 User tracking, search history, and persistence enabled");
          return; // Success - exit early
        }
      } catch (error: any) {
        console.error(`❌ Database connection attempt ${attempt} failed:`, error.message);
        console.error("Error details:", error);
        
        if (attempt < maxRetries) {
          console.log(`⏳ Retrying in ${retryDelay}ms...`);
          await new Promise(resolve => setTimeout(resolve, retryDelay * attempt));
        } else {
          console.error("❌ All database connection attempts failed");
          console.warn("⚠️ Falling back to in-memory storage");
          console.warn("⚠️ User data will be lost on restart");
          useDatabase = false;
        }
      }
    }
  } else {
    console.warn("⚠️ No DATABASE_URL environment variable found");
    console.warn("⚠️ Using in-memory storage - data will not persist");
    console.warn("💡 Add DATABASE_URL to Secrets to enable persistent storage");
    useDatabase = false;
  }
}

// Initialize database connection
const dbInitPromise = initializeDatabase();

// Export for server startup synchronization
export function waitForDatabase() {
  return dbInitPromise;
}

// Helper function to safely execute database operations
// For user operations only - provides in-memory fallback for resilience
async function safeDbOperation<T>(operation: () => Promise<T>, fallback: () => T): Promise<T> {
  if (!useDatabase || !db) {
    console.log("Database is not available, using fallback memory operation.");
    return fallback();
  }

  try {
    return await operation();
  } catch (error: any) {
    console.error(`Database operation failed: ${error.message}. Falling back to memory.`);
    // Don't permanently disable database - let next request retry
    return fallback();
  }
}

// Helper function to generate a UUID (can be replaced with a more robust solution if needed)
function generateId(): string {
  return randomUUID();
}

export interface IStorage {
  getUser(id: string): Promise<(User & { role?: string }) | undefined>;
  getUserByUsername(username: string): Promise<(User & { role?: string }) | undefined>;
  getUserByEmail(email: string): Promise<(User & { role?: string }) | undefined>; // Added for email uniqueness check
  createUser(user: InsertUser & { role?: string }): Promise<User & { role?: string }>;

  getMedication(id: string): Promise<Medication | undefined>;
  getMedicationByName(name: string): Promise<Medication | undefined>;
  getMedicationByPartialName(partialName: string): Promise<Medication | undefined>;
  createMedication(medication: InsertMedication): Promise<Medication>;
  searchMedications(query: string): Promise<Medication[]>;
  fuzzySearchMedications(searchTerm: string): Promise<Medication[]>;

  getSearchHistory(userId?: string): Promise<SearchHistory[]>;
  createSearchHistory(searchHistory: InsertSearchHistory): Promise<SearchHistory>;

  getTrainingProgress(): Promise<TrainingProgress | undefined>;
  updateTrainingProgress(progress: Partial<InsertTrainingProgress>): Promise<TrainingProgress>;
  createTrainingProgress(progress: InsertTrainingProgress): Promise<TrainingProgress>;

  getAiStats(): Promise<AiStats | undefined>;
  updateAiStats(stats: Partial<InsertAiStats>): Promise<AiStats>;
  createAiStats(stats: InsertAiStats): Promise<AiStats>;

  // Admin methods
  getAllUsers(): Promise<(User & { role?: string })[]>;
  deleteUser(userId: string): Promise<void>;
  getAllSearchHistory(): Promise<SearchHistory[]>;
}

export class DatabaseStorage implements IStorage {
  private memoryUsers: Map<string, User & { role?: string }> = new Map();
  private memorySearchHistory: SearchHistory[] = [];

  constructor() {
    // User authentication is ready immediately
    // Medications are already in the database (populated via db:push or seed script)
    console.log("✅ Storage initialized - authentication ready");
  }

  async getUser(id: string): Promise<(User & { role?: string }) | undefined> {
    return await safeDbOperation(
      async () => {
        const users = await db.select().from(schema.users).where(eq(schema.users.id, id));
        return users[0] as (User & { role?: string });
      },
      () => this.memoryUsers.get(id) as (User & { role?: string })
    );
  }

  async getUserByUsername(username: string): Promise<(User & { role?: string }) | undefined> {
    return await safeDbOperation(
      async () => {
        const users = await db.select().from(schema.users).where(eq(schema.users.username, username));
        return users[0] as (User & { role?: string });
      },
      () => {
        for (const user of Array.from(this.memoryUsers.values())) {
          if (user.username === username) {
            return user as (User & { role?: string });
          }
        }
        return undefined;
      }
    );
  }

  async getUserByEmail(email: string): Promise<(User & { role?: string }) | undefined> {
    return await safeDbOperation(
      async () => {
        const users = await db.select().from(schema.users).where(eq(schema.users.email, email));
        return users[0] as (User & { role?: string });
      },
      () => {
        // Search through memory users by email
        for (const user of Array.from(this.memoryUsers.values())) {
          if (user.email === email) {
            return user as (User & { role?: string });
          }
        }
        return undefined;
      }
    );
  }

  async createUser(userData: InsertUser & { role?: string }): Promise<User & { role?: string }> {
    // Check if email already exists
    const existingUserByEmail = await this.getUserByEmail(userData.email);
    if (existingUserByEmail) {
      throw new Error("Email address is already in use.");
    }

    // Check if username already exists
    const existingUserByUsername = await this.getUserByUsername(userData.username);
    if (existingUserByUsername) {
      throw new Error("Username is already in use.");
    }


    const newUser: User & { role?: string } = {
      id: generateId(),
      username: userData.username,
      password: userData.password,
      email: userData.email,
      role: userData.role || 'user', // Default to 'user' role
      createdAt: new Date(),
    };

    await safeDbOperation(
      async () => {
        await db.insert(schema.users).values(newUser);
        return newUser;
      },
      () => {
        this.memoryUsers.set(newUser.id, newUser);
        return newUser;
      }
    );

    return newUser;
  }

  async getMedication(id: string): Promise<Medication | undefined> {
    if (!useDatabase || !db) {
      console.warn("Medication query attempted without database connection");
      return undefined;
    }
    try {
      const medications = await db.select().from(schema.medications).where(eq(schema.medications.id, id));
      return medications[0];
    } catch (error: any) {
      console.error("Medication query failed:", error.message);
      return undefined;
    }
  }

  async getMedicationByName(name: string): Promise<Medication | undefined> {
    if (!useDatabase || !db) {
      console.warn("Medication query attempted without database connection");
      return undefined;
    }
    try {
      const medications = await db.select().from(schema.medications).where(
        or(
          eq(schema.medications.name, name),
          eq(schema.medications.nameVi, name),
          eq(schema.medications.genericName, name),
          eq(schema.medications.genericNameVi, name)
        )
      );
      return medications[0];
    } catch (error: any) {
      console.error("Medication query failed:", error.message);
      return undefined;
    }
  }

  async getMedicationByPartialName(partialName: string): Promise<Medication | undefined> {
    if (!useDatabase || !db) {
      console.warn("Medication query attempted without database connection");
      return undefined;
    }
    try {
      const medications = await db.select().from(schema.medications).where(
        or(
          like(schema.medications.name, `%${partialName}%`),
          like(schema.medications.nameVi, `%${partialName}%`),
          like(schema.medications.genericName, `%${partialName}%`),
          like(schema.medications.genericNameVi, `%${partialName}%`)
        )
      );
      return medications[0];
    } catch (error: any) {
      console.error("Medication query failed:", error.message);
      return undefined;
    }
  }

  async createMedication(medication: InsertMedication): Promise<Medication> {
    if (!useDatabase || !db) {
      throw new Error("Database connection required for medication creation");
    }
    try {
      const newMedication = {
        ...medication,
        id: randomUUID()
      } as Medication;

      await db.insert(schema.medications).values(newMedication);
      return newMedication;
    } catch (error: any) {
      console.error("Failed to create medication:", error.message);
      throw error; // Re-throw for create operations
    }
  }

  async searchMedications(query: string): Promise<Medication[]> {
    if (!useDatabase || !db) {
      console.warn("Medication search attempted without database connection");
      return [];
    }
    
    try {
      const searchTerm = `%${query.toLowerCase()}%`;

      // First, try direct database search
      const directResults = await db.select().from(schema.medications).where(
        or(
          sql`LOWER(${schema.medications.name}) LIKE ${searchTerm}`,
          sql`LOWER(${schema.medications.nameVi}) LIKE ${searchTerm}`,
          sql`LOWER(${schema.medications.genericName}) LIKE ${searchTerm}`,
          sql`LOWER(${schema.medications.genericNameVi}) LIKE ${searchTerm}`
        )
      ).limit(20);

    // If we found results, return them
    if (directResults.length > 0) {
      return directResults;
    }

    // If no direct results, try alias-based search
    try {
      const { drugAliasService } = await import('./drug-alias-service');
      const aliases = await drugAliasService.getAllAliases(query);

      // Search using all aliases
      const aliasResults = await Promise.all(
        aliases.map(async (alias) => {
          const aliasSearchTerm = `%${alias.toLowerCase()}%`;
          return await db.select().from(schema.medications).where(
            or(
              sql`LOWER(${schema.medications.name}) LIKE ${aliasSearchTerm}`,
              sql`LOWER(${schema.medications.nameVi}) LIKE ${aliasSearchTerm}`,
              sql`LOWER(${schema.medications.genericName}) LIKE ${aliasSearchTerm}`,
              sql`LOWER(${schema.medications.genericNameVi}) LIKE ${aliasSearchTerm}`
            )
          ).limit(5);
        })
      );

      // Flatten and deduplicate results
      const allAliasResults = aliasResults.flat();
      const uniqueResults = allAliasResults.filter((med, index, arr) =>
        arr.findIndex(m => m.id === med.id) === index
      );

      return uniqueResults.slice(0, 20);

    } catch (error) {
      console.error('Alias search failed:', error);
      return directResults; // Fall back to direct results (empty array)
    }
    } catch (error: any) {
      console.error("Medication search failed:", error.message);
      return []; // Return empty array on error
    }
  }

  async fuzzySearchMedications(searchTerm: string): Promise<Medication[]> {
    if (!useDatabase || !db) {
      console.warn("Fuzzy medication search attempted without database connection");
      return [];
    }
    
    try {
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
    } catch (error: any) {
      console.error("Fuzzy medication search failed:", error.message);
      return []; // Return empty array on error
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
    return history.sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
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

  async getTrainingProgress(): Promise<TrainingProgress | undefined> {
    if (useDatabase && db) {
      const [progress] = await db.select().from(schema.trainingProgress)
        .orderBy(desc(schema.trainingProgress.lastUpdated))
        .limit(1);
      return progress || undefined;
    }
    return undefined;
  }

  async createTrainingProgress(progress: InsertTrainingProgress): Promise<TrainingProgress> {
    const newProgress = {
      ...progress,
      id: randomUUID(),
      createdAt: new Date(),
      lastUpdated: new Date()
    } as TrainingProgress;

    if (useDatabase && db) {
      const [created] = await db.insert(schema.trainingProgress).values(newProgress).returning();
      return created;
    }
    return newProgress;
  }

  async updateTrainingProgress(progressUpdate: Partial<InsertTrainingProgress>): Promise<TrainingProgress> {
    if (useDatabase && db) {
      // Get existing progress or create new one
      let existing = await this.getTrainingProgress();
      if (!existing) {
        return await this.createTrainingProgress({
          processed: progressUpdate.processed || 0,
          target: progressUpdate.target || 1000000,
          isTraining: progressUpdate.isTraining || false,
          currentPhase: progressUpdate.currentPhase || "Phase 1",
          successRate: progressUpdate.successRate || 0
        });
      }

      const [updated] = await db.update(schema.trainingProgress)
        .set({ ...progressUpdate, lastUpdated: new Date() })
        .where(eq(schema.trainingProgress.id, existing.id))
        .returning();
      return updated;
    }
    throw new Error("Database not available");
  }

  async getAiStats(): Promise<AiStats | undefined> {
    if (useDatabase && db) {
      const [stats] = await db.select().from(schema.aiStats)
        .orderBy(desc(schema.aiStats.lastUpdated))
        .limit(1);
      return stats || undefined;
    }
    return undefined;
  }

  async createAiStats(stats: InsertAiStats): Promise<AiStats> {
    const newStats = {
      ...stats,
      id: randomUUID(),
      lastUpdated: new Date()
    } as AiStats;

    if (useDatabase && db) {
      const [created] = await db.insert(schema.aiStats).values(newStats).returning();
      return created;
    }
    return newStats;
  }

  async updateAiStats(statsUpdate: Partial<InsertAiStats>): Promise<AiStats> {
    if (useDatabase && db) {
      // Get existing stats or create new one
      let existing = await this.getAiStats();
      if (!existing) {
        return await this.createAiStats({
          accuracy: statsUpdate.accuracy || 0,
          trainingPoints: statsUpdate.trainingPoints || 0
        });
      }

      const [updated] = await db.update(schema.aiStats)
        .set({ ...statsUpdate, lastUpdated: new Date() })
        .where(eq(schema.aiStats.id, existing.id))
        .returning();
      return updated;
    }
    throw new Error("Database not available");
  }

  // Admin methods
  async getAllUsers(): Promise<(User & { role?: string })[]> {
    if (useDatabase && db) {
      const result = await db.select().from(schema.users);
      return result as (User & { role?: string })[];
    }
    return Array.from(this.memoryUsers.values());
  }

  async deleteUser(userId: string): Promise<void> {
    if (useDatabase && db) {
      await db.delete(schema.users).where(eq(schema.users.id, userId));
    } else {
      this.memoryUsers.delete(userId);
    }
  }

  async getAllSearchHistory(): Promise<SearchHistory[]> {
    if (useDatabase && db) {
      const result = await db.select().from(schema.searchHistory);
      return result;
    }
    return this.memorySearchHistory;
  }
}

// Use the database storage implementation
export const storage = new DatabaseStorage();