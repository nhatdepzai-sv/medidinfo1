
import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import { migrate } from "drizzle-orm/better-sqlite3/migrator";
import { eq, like, or, sql } from "drizzle-orm";
import * as schema from "@shared/schema";
import { medicationsDatabase } from "./medications-database";

const sqlite = new Database("database.sqlite");
export const db = drizzle(sqlite, { schema });

// Enable WAL mode for better performance
sqlite.pragma('journal_mode = WAL');

// Initialize database and seed with medications
async function initializeDatabase() {
  try {
    // Run migrations if needed
    console.log("Initializing database...");

    // Check if medications table exists and has data
    const medicationCount = db.select({ count: sql<number>`count(*)` })
      .from(schema.medications)
      .get()?.count || 0;

    if (medicationCount === 0) {
      console.log("Seeding database with comprehensive medication data...");
      
      // Insert medications in batches for better performance
      const batchSize = 100;
      for (let i = 0; i < medicationsDatabase.length; i += batchSize) {
        const batch = medicationsDatabase.slice(i, i + batchSize);
        try {
          db.insert(schema.medications).values(batch).run();
          console.log(`Inserted batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(medicationsDatabase.length / batchSize)}`);
        } catch (error) {
          console.error(`Error inserting batch ${Math.floor(i / batchSize) + 1}:`, error);
        }
      }
      
      console.log(`Successfully seeded ${medicationsDatabase.length} medications`);
    } else {
      console.log(`Database already contains ${medicationCount} medications`);
    }
  } catch (error) {
    console.error("Database initialization error:", error);
  }
}

// Simple text similarity function
function calculateSimilarity(str1: string, str2: string): number {
  const longer = str1.length > str2.length ? str1 : str2;
  const shorter = str1.length > str2.length ? str2 : str1;
  
  if (longer.length === 0) return 1.0;
  
  const editDistance = levenshteinDistance(longer, shorter);
  return (longer.length - editDistance) / longer.length;
}

function levenshteinDistance(str1: string, str2: string): number {
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

export const storage = {
  // Initialize database
  async init() {
    await initializeDatabase();
  },

  // Medication operations
  async getMedication(id: string) {
    return db.select().from(schema.medications).where(eq(schema.medications.id, id)).get();
  },

  async getMedicationByName(name: string) {
    const searchTerm = name.toLowerCase().trim();
    
    // Try exact matches first
    const exactMatch = db.select()
      .from(schema.medications)
      .where(
        or(
          eq(sql`lower(${schema.medications.name})`, searchTerm),
          eq(sql`lower(${schema.medications.genericName})`, searchTerm),
          eq(sql`lower(${schema.medications.nameVi})`, searchTerm),
          eq(sql`lower(${schema.medications.genericNameVi})`, searchTerm)
        )
      )
      .get();

    if (exactMatch) return exactMatch;

    // Try partial matches
    return db.select()
      .from(schema.medications)
      .where(
        or(
          like(sql`lower(${schema.medications.name})`, `%${searchTerm}%`),
          like(sql`lower(${schema.medications.genericName})`, `%${searchTerm}%`),
          like(sql`lower(${schema.medications.nameVi})`, `%${searchTerm}%`),
          like(sql`lower(${schema.medications.genericNameVi})`, `%${searchTerm}%`)
        )
      )
      .get();
  },

  async getMedicationByPartialName(name: string) {
    const searchTerm = name.toLowerCase().trim();
    
    if (searchTerm.length < 3) return null;

    return db.select()
      .from(schema.medications)
      .where(
        or(
          like(sql`lower(${schema.medications.name})`, `%${searchTerm}%`),
          like(sql`lower(${schema.medications.genericName})`, `%${searchTerm}%`),
          like(sql`lower(${schema.medications.nameVi})`, `%${searchTerm}%`),
          like(sql`lower(${schema.medications.genericNameVi})`, `%${searchTerm}%`)
        )
      )
      .get();
  },

  async searchMedications(query: string) {
    const searchTerm = query.toLowerCase().trim();
    
    if (searchTerm.length < 2) return [];

    // Get all potential matches
    const allMedications = db.select().from(schema.medications).all();
    
    // Score and filter medications
    const scoredMedications = allMedications
      .map(med => {
        const names = [
          med.name,
          med.genericName,
          med.nameVi,
          med.genericNameVi
        ].filter(Boolean).map(n => n!.toLowerCase());

        let bestScore = 0;
        for (const name of names) {
          // Exact match gets highest score
          if (name === searchTerm) {
            bestScore = 1.0;
            break;
          }
          
          // Starts with search term gets high score
          if (name.startsWith(searchTerm)) {
            bestScore = Math.max(bestScore, 0.9);
            continue;
          }
          
          // Contains search term gets medium score
          if (name.includes(searchTerm)) {
            bestScore = Math.max(bestScore, 0.7);
            continue;
          }
          
          // Similarity score for fuzzy matching
          const similarity = calculateSimilarity(name, searchTerm);
          bestScore = Math.max(bestScore, similarity);
        }

        return { medication: med, score: bestScore };
      })
      .filter(item => item.score > 0.3) // Only keep reasonably similar matches
      .sort((a, b) => b.score - a.score) // Sort by score descending
      .slice(0, 10); // Limit to top 10 results

    return scoredMedications.map(item => item.medication);
  },

  async createMedication(medicationData: schema.InsertMedication) {
    const result = db.insert(schema.medications).values(medicationData).returning().get();
    return result;
  },

  // Search history operations
  async getSearchHistory(limit: number = 50) {
    return db.select()
      .from(schema.searchHistory)
      .orderBy(sql`${schema.searchHistory.createdAt} DESC`)
      .limit(limit)
      .all();
  },

  async createSearchHistory(historyData: schema.InsertSearchHistory) {
    const result = db.insert(schema.searchHistory).values(historyData).returning().get();
    return result;
  },

  // User operations (if needed)
  async createUser(userData: schema.InsertUser) {
    const result = db.insert(schema.users).values(userData).returning().get();
    return result;
  },

  async getUserByUsername(username: string) {
    return db.select().from(schema.users).where(eq(schema.users.username, username)).get();
  }
};

// Initialize on import
storage.init().catch(console.error);
