import { type User, type InsertUser, type Medication, type InsertMedication, type SearchHistory, type InsertSearchHistory } from "@shared/schema";
import { randomUUID } from "crypto";
import { medicationsDatabase } from "./medications-database";
import { db } from "./db";
import { eq, desc, or, sql } from "drizzle-orm";

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

export class MemStorage implements IStorage {
  private users: Map<string, User>;
  private medications: Map<string, Medication>;
  private searchHistory: Map<string, SearchHistory>;

  constructor() {
    this.users = new Map();
    this.medications = new Map();
    this.searchHistory = new Map();
    // Initialize medications synchronously to ensure they're available immediately
    this.initializeMedications();
  }

  private initializeMedications() {
    // Populate the database with initial medications
    for (const med of medicationsDatabase) {
      const id = randomUUID();
      const medication: Medication = {
        id,
        name: med.name,
        nameVi: med.nameVi || null,
        genericName: med.genericName || null,
        genericNameVi: med.genericNameVi || null,
        category: med.category || null,
        categoryVi: med.categoryVi || null,
        primaryUse: med.primaryUse || null,
        primaryUseVi: med.primaryUseVi || null,
        adultDosage: med.adultDosage || null,
        adultDosageVi: med.adultDosageVi || null,
        maxDosage: med.maxDosage || null,
        maxDosageVi: med.maxDosageVi || null,
        warnings: med.warnings || null,
        warningsVi: med.warningsVi || null,
        createdAt: new Date(),
      };
      this.medications.set(id, medication);
    }
    console.log(`✅ Initialized ${this.medications.size} medications in storage`);
  }

  async getUser(id: string): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = randomUUID();
    const user: User = { ...insertUser, id };
    this.users.set(id, user);
    return user;
  }

  async getMedication(id: string): Promise<Medication | undefined> {
    return this.medications.get(id);
  }

  async getMedicationByName(name: string): Promise<Medication | undefined> {
    const lowerName = name.toLowerCase();
    return Array.from(this.medications.values()).find(
      (med) => 
        med.name.toLowerCase().includes(lowerName) ||
        (med.nameVi && med.nameVi.toLowerCase().includes(lowerName)) ||
        (med.genericName && med.genericName.toLowerCase().includes(lowerName)) ||
        (med.genericNameVi && med.genericNameVi.toLowerCase().includes(lowerName))
    );
  }

  async getMedicationByPartialName(partialName: string): Promise<Medication | undefined> {
    const searchTerm = `%${partialName.toLowerCase()}%`;
    const medications = Array.from(this.medications.values()).filter(
      (med) =>
        med.name.toLowerCase().includes(partialName.toLowerCase()) ||
        (med.nameVi && med.nameVi.toLowerCase().includes(partialName.toLowerCase())) ||
        (med.genericName && med.genericName.toLowerCase().includes(partialName.toLowerCase())) ||
        (med.genericNameVi && med.genericNameVi.toLowerCase().includes(partialName.toLowerCase()))
    );
    return medications[0] || undefined;
  }

  async createMedication(insertMedication: InsertMedication): Promise<Medication> {
    const id = randomUUID();
    const medication: Medication = {
      id,
      name: insertMedication.name,
      nameVi: insertMedication.nameVi || null,
      genericName: insertMedication.genericName || null,
      genericNameVi: insertMedication.genericNameVi || null,
      category: insertMedication.category || null,
      categoryVi: insertMedication.categoryVi || null,
      primaryUse: insertMedication.primaryUse || null,
      primaryUseVi: insertMedication.primaryUseVi || null,
      adultDosage: insertMedication.adultDosage || null,
      adultDosageVi: insertMedication.adultDosageVi || null,
      maxDosage: insertMedication.maxDosage || null,
      maxDosageVi: insertMedication.maxDosageVi || null,
      warnings: insertMedication.warnings || null,
      warningsVi: insertMedication.warningsVi || null,
      createdAt: new Date(),
    };
    this.medications.set(id, medication);
    return medication;
  }

  async searchMedications(query: string): Promise<Medication[]> {
    const lowerQuery = query.toLowerCase();
    return Array.from(this.medications.values()).filter(
      (med) =>
        med.name.toLowerCase().includes(lowerQuery) ||
        (med.nameVi && med.nameVi.toLowerCase().includes(lowerQuery)) ||
        (med.genericName && med.genericName.toLowerCase().includes(lowerQuery)) ||
        (med.genericNameVi && med.genericNameVi.toLowerCase().includes(lowerQuery)) ||
        (med.category && med.category.toLowerCase().includes(lowerQuery)) ||
        (med.categoryVi && med.categoryVi.toLowerCase().includes(lowerQuery)) ||
        (med.primaryUse && med.primaryUse.toLowerCase().includes(lowerQuery)) ||
        (med.primaryUseVi && med.primaryUseVi.toLowerCase().includes(lowerQuery))
    );
  }

  async getSearchHistory(userId?: string): Promise<SearchHistory[]> {
    let history = Array.from(this.searchHistory.values());
    if (userId) {
      history = history.filter(h => h.userId === userId);
    }
    return history.sort((a, b) => 
      new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime()
    );
  }

  async createSearchHistory(insertSearchHistory: InsertSearchHistory): Promise<SearchHistory> {
    const id = randomUUID();
    const searchHistory: SearchHistory = {
      id,
      userId: insertSearchHistory.userId || null,
      medicationId: insertSearchHistory.medicationId || null,
      searchQuery: insertSearchHistory.searchQuery || null,
      searchMethod: insertSearchHistory.searchMethod || null,
      createdAt: new Date(),
    };
    this.searchHistory.set(id, searchHistory);
    return searchHistory;
  }
}

export const storage = new MemStorage();