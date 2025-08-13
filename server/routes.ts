import type { Express, Request } from "express";
import { createServer, type Server } from "http";
import multer from "multer";
import { createWorker } from "tesseract.js";
import { storage } from "./storage";
import { drugSearchResponseSchema, insertMedicationSchema, insertSearchHistorySchema } from "@shared/schema";
import { z } from "zod";

interface MulterRequest extends Request {
  file?: Express.Multer.File;
}

const upload = multer({ storage: multer.memoryStorage() });

export async function registerRoutes(app: Express): Promise<Server> {

  // OCR and photo processing endpoint
  app.post("/api/identify-drug", upload.single("image"), async (req: MulterRequest, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: "No image file provided" });
      }

      // Initialize Tesseract worker with enhanced options
      const worker = await createWorker({
        logger: m => console.log(m)
      });

      // Configure Tesseract for better text recognition
      await worker.setParameters({
        tessedit_char_whitelist: 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789 .-',
        tessedit_pageseg_mode: 6, // Assume uniform block of text
        preserve_interword_spaces: 1
      });

      // Perform OCR on the uploaded image
      const { data: { text, confidence } } = await worker.recognize(req.file.buffer);
      await worker.terminate();

      console.log(`OCR confidence: ${confidence}%, extracted text: "${text}"`);

      if (!text.trim() || confidence < 30) {
        return res.status(400).json({
          message: "Could not extract clear text from image. Please ensure good lighting and focus on the medication label.",
          extractedText: text,
          confidence
        });
      }

      // Enhanced text processing and drug name extraction
      const cleanedText = text
        .replace(/\n/g, " ")
        .replace(/[^\w\s.-]/g, " ")
        .replace(/\s+/g, " ")
        .trim();

      // Extract potential drug names using multiple strategies
      const words = cleanedText.split(" ");
      const potentialDrugNames = [];

      // Strategy 1: Look for capitalized words (brand names)
      for (const word of words) {
        if (word.length > 3 && /^[A-Z][a-z]+/.test(word)) {
          potentialDrugNames.push(word);
        }
      }

      // Strategy 2: Look for common drug suffixes
      const drugSuffixes = ['ine', 'ole', 'ate', 'ide', 'ant', 'ase', 'cin', 'fen', 'pam', 'zam', 'tine', 'pine'];
      for (const word of words) {
        if (word.length > 4 && drugSuffixes.some(suffix => word.toLowerCase().endsWith(suffix))) {
          potentialDrugNames.push(word);
        }
      }

      // Strategy 3: Try the full text and common fragments
      potentialDrugNames.push(cleanedText);
      potentialDrugNames.push(...words.filter(w => w.length > 4));

      let medication = null;
      let matchedText = "";

      // Try each potential drug name
      for (const drugName of potentialDrugNames) {
        if (drugName.length < 3) continue;

        // Try exact match first
        medication = await storage.getMedicationByName(drugName);
        if (medication) {
          matchedText = drugName;
          break;
        }

        // Try partial match
        medication = await storage.getMedicationByPartialName(drugName);
        if (medication) {
          matchedText = drugName;
          break;
        }
      }

      if (!medication) {
        return res.status(404).json({
          message: "Could not identify this medication. Try focusing on the drug name or search manually.",
          extractedText: cleanedText,
          potentialNames: potentialDrugNames.slice(0, 5),
          confidence
        });
      }

      // Log search history
      await storage.createSearchHistory({
        medicationId: medication.id,
        searchQuery: text, // Use original extracted text for history
        searchMethod: "photo"
      });

      res.json(medication);

    } catch (error) {
      console.error("OCR processing error:", error);
      res.status(500).json({ message: "Failed to process image" });
    }
  });

  // Manual drug search endpoint
  app.post("/api/search-drug", async (req, res) => {
    try {
      const { query } = req.body;

      if (!query || typeof query !== "string") {
        return res.status(400).json({ message: "Search query is required" });
      }

      // Search in local storage first
      let medication = await storage.getMedicationByName(query);

      if (!medication) {
        // Search using OpenFDA API
        const drugInfo = await searchDrugInfo(query);
        if (drugInfo) {
          medication = await storage.createMedication(drugInfo);
        }
      }

      if (!medication) {
        return res.status(404).json({ message: "Medication not found" });
      }

      // Log search history
      await storage.createSearchHistory({
        medicationId: medication.id,
        searchQuery: query,
        searchMethod: "manual"
      });

      res.json(medication);

    } catch (error) {
      console.error("Drug search error:", error);
      res.status(500).json({ message: "Failed to search for medication" });
    }
  });

  // Get search history
  app.get("/api/search-history", async (req, res) => {
    try {
      const history = await storage.getSearchHistory();

      // Enrich history with medication details
      const enrichedHistory = await Promise.all(
        history.map(async (item) => {
          const medication = item.medicationId
            ? await storage.getMedication(item.medicationId)
            : null;

          return {
            ...item,
            medication
          };
        })
      );

      res.json(enrichedHistory);
    } catch (error) {
      console.error("History fetch error:", error);
      res.status(500).json({ message: "Failed to fetch search history" });
    }
  });

  // Translation endpoint
  app.post("/api/translate", async (req, res) => {
    try {
      const { text, from, to } = req.body;

      if (!text || !from || !to) {
        return res.json({ success: false, error: "Missing required parameters" });
      }

      // Simple translation mapping for common medical terms
      const translations = {
        'en-vi': {
          'medication': 'thuốc',
          'dosage': 'liều lượng',
          'adults': 'người lớn',
          'children': 'trẻ em',
          'take with food': 'uống cùng thức ăn',
          'before meals': 'trước bữa ăn',
          'after meals': 'sau bữa ăn',
          'daily': 'hàng ngày',
          'twice daily': 'hai lần mỗi ngày',
          'three times daily': 'ba lần mỗi ngày',
          'as needed': 'khi cần',
          'warning': 'cảnh báo',
          'side effects': 'tác dụng phụ',
          'consult doctor': 'tham khảo bác sĩ',
          'pregnancy': 'mang thai',
          'breastfeeding': 'cho con bú',
          'pain relief': 'giảm đau',
          'fever reducer': 'hạ sốt',
          'anti-inflammatory': 'chống viêm',
          'antibiotic': 'kháng sinh',
          'vitamin': 'vitamin',
          'supplement': 'thực phẩm bổ sung'
        },
        'vi-en': {
          'thuốc': 'medication',
          'liều lượng': 'dosage',
          'người lớn': 'adults',
          'trẻ em': 'children',
          'uống cùng thức ăn': 'take with food',
          'trước bữa ăn': 'before meals',
          'sau bữa ăn': 'after meals',
          'hàng ngày': 'daily',
          'hai lần mỗi ngày': 'twice daily',
          'ba lần mỗi ngày': 'three times daily',
          'khi cần': 'as needed',
          'cảnh báo': 'warning',
          'tác dụng phụ': 'side effects',
          'tham khảo bác sĩ': 'consult doctor',
          'mang thai': 'pregnancy',
          'cho con bú': 'breastfeeding',
          'giảm đau': 'pain relief',
          'hạ sốt': 'fever reducer',
          'chống viêm': 'anti-inflammatory',
          'kháng sinh': 'antibiotic',
          'vitamin': 'vitamin',
          'thực phẩm bổ sung': 'supplement'
        }
      };

      let translatedText = text;
      const translationMap = translations[`${from}-${to}`];

      if (translationMap) {
        Object.entries(translationMap).forEach(([original, translation]) => {
          const regex = new RegExp(original, 'gi');
          translatedText = translatedText.replace(regex, translation);
        });
      }

      // If no translation was found, return a message
      if (translatedText === text) {
        translatedText = `[Translation from ${from} to ${to}]: ${text}`;
      }

      res.json({
        success: true,
        translatedText,
        originalText: text,
        fromLanguage: from,
        toLanguage: to
      });
    } catch (error) {
      console.error("Translation error:", error);
      res.json({ success: false, error: "Translation failed" });
    }
  });

  // Medication identification endpoint with enhanced search
  app.post("/api/identify-medication", async (req, res) => {
    const { text, alternativeQueries = [], searchMethod = "photo", confidence = 0, allDetectedText } = req.body;

    try {
      console.log("🔍 Identifying medication with text:", text);
      console.log("Alternative queries:", alternativeQueries);
      console.log("Search method:", searchMethod);
      console.log("OCR confidence:", confidence);

      let medication = null;
      let bestMatch = null;
      const searchResults = [];

      // Store search history function
      const storeSearchHistory = async (query: string, method: string, medicationId?: number) => {
        try {
          const historyData = insertSearchHistorySchema.parse({
            searchQuery: query,
            searchMethod: method,
            medicationId: medicationId || null
          });
          return await storage.createSearchHistory(historyData);
        } catch (error) {
          console.error("Failed to store search history:", error);
          return null;
        }
      };

      // Enhanced search strategies
      const searchStrategies = [
        { name: "exact", fn: storage.getMedicationByName.bind(storage) },
        { name: "fuzzy", fn: findMedicationByFuzzyMatch },
        { name: "partial", fn: findMedicationByPartialMatch },
        { name: "contains", fn: (query: string) => storage.getMedicationByPartialName(query) }
      ];

      // 1. Try main text with all strategies
      console.log("Searching with main text:", text);
      for (const strategy of searchStrategies) {
        try {
          const result = await strategy.fn(text);
          searchResults.push({
            query: text,
            strategy: strategy.name,
            found: result ? result.name : null
          });
          if (result) {
            bestMatch = { medication: result, strategy: strategy.name, query: text };
            medication = result;
            break;
          }
        } catch (error) {
          console.error(`Strategy ${strategy.name} failed for "${text}":`, error);
        }
      }

      // 2. Try alternative queries with all strategies
      if (!medication && alternativeQueries.length > 0) {
        console.log("Trying alternative queries...");
        for (const query of alternativeQueries) {
          if (typeof query === "string" && query.length >= 3 && !medication) {
            for (const strategy of searchStrategies) {
              try {
                const result = await strategy.fn(query);
                searchResults.push({
                  query,
                  strategy: `${strategy.name}_alternative`,
                  found: result ? result.name : null
                });
                if (result) {
                  bestMatch = { medication: result, strategy: `${strategy.name}_alternative`, query };
                  medication = result;
                  break;
                }
              } catch (error) {
                console.error(`Strategy ${strategy.name} failed for "${query}":`, error);
              }
            }
            if (medication) break;
          }
        }
      }

      // 3. If still not found, try partial word matching on individual words from all detected text
      if (!medication && allDetectedText) {
        console.log("Trying partial matching on individual words from OCR text...");
        const wordsFromOcr = allDetectedText.split(" ");
        for (const word of wordsFromOcr) {
          if (typeof word === "string" && word.length >= 4 && !medication) {
            // Try to find medications that contain this word as part of their name or generic name
            // Prioritize exact match if the word itself is a medication name
            const exactMatchFromWord = await storage.getMedicationByName(word);
            if (exactMatchFromWord) {
              bestMatch = { medication: exactMatchFromWord, strategy: "exact_ocr_word", query: word };
              medication = exactMatchFromWord;
              searchResults.push({ query: word, strategy: "exact_ocr_word", found: exactMatchFromWord.name });
              break;
            }

            // Then try partial match
            const partialResult = await findMedicationByPartialMatch(word);
            if (partialResult) {
              bestMatch = { medication: partialResult, strategy: "partial_ocr_word", query: word };
              medication = partialResult;
              searchResults.push({ query: word, strategy: "partial_ocr_word", found: partialResult.name });
              break;
            }
          }
        }
      }

      // Store search history
      const historyEntry = await storeSearchHistory(text, searchMethod, medication?.id);

      if (medication) {
        console.log(`✅ Found medication: ${medication.name} using ${bestMatch?.strategy} with query: "${bestMatch?.query}"`);
        console.log("Search attempts:", searchResults);
      } else {
        console.log("❌ No medication found for any query");
        console.log("All search attempts:", searchResults);
      }

      if (medication) {
        res.json({
          medication,
          searchHistory: historyEntry,
          matchStrategy: bestMatch?.strategy,
          searchQuery: bestMatch?.query,
          searchAttempts: searchResults,
          totalQueriesTried: searchResults.length
        });
      } else {
        res.json({
          medication: null,
          message: `No medication found after trying ${searchResults.length} different queries`,
          searchHistory: historyEntry,
          extractedText: text,
          alternativeQueries,
          searchAttempts: searchResults,
          allDetectedText
        });
      }
    } catch (error) {
      console.error("Error identifying medication:", error);
      res.status(500).json({ error: "Failed to identify medication" });
    }
  });


  const httpServer = createServer(app);
  return httpServer;
}

// Helper function to search drug information using OpenFDA API
async function searchDrugInfo(drugName: string) {
  try {
    const apiKey = process.env.OPENFDA_API_KEY || process.env.FDA_API_KEY || "";
    const searchQuery = encodeURIComponent(drugName.toLowerCase());

    // Search in OpenFDA drug labeling database
    const response = await fetch(
      `https://api.fda.gov/drug/label.json?search=openfda.brand_name:"${searchQuery}"+openfda.generic_name:"${searchQuery}"&limit=1${apiKey ? `&api_key=${apiKey}` : ''}`
    );

    if (!response.ok) {
      console.warn(`OpenFDA API returned ${response.status}`);
      return null;
    }

    const data = await response.json();

    if (!data.results || data.results.length === 0) {
      return null;
    }

    const result = data.results[0];
    const openfda = result.openFDA || {};

    // Extract medication information
    const medicationInfo = {
      name: openfda.brand_name?.[0] || drugName,
      genericName: openfda.generic_name?.[0] || undefined,
      category: openfda.pharmacologic_class?.[0] || undefined,
      primaryUse: result.indications_and_usage?.[0] || result.purpose?.[0] || "Medication purpose not available",
      adultDosage: result.dosage_and_administration?.[0] || undefined,
      maxDosage: undefined, // This would need to be parsed from dosage_and_administration
      warnings: result.warnings || result.boxed_warning || undefined,
    };

    return drugSearchResponseSchema.parse(medicationInfo);

  } catch (error) {
    console.error("OpenFDA API error:", error);
    return null;
  }
}

// Placeholder for findMedicationByText function - replace with actual implementation
async function findMedicationByText(text: string): Promise<any | null> {
  // This is a mock implementation. In a real scenario, this would query the database.
  console.log(`Mock DB Search: "${text}"`);
  // Example: If text is "Aspirin", return a mock medication object
  if (text.toLowerCase().includes("aspirin")) {
    return {
      id: "med-123",
      name: "Aspirin",
      genericName: "Acetylsalicylic Acid",
      category: "NSAID",
      primaryUse: "Pain relief, fever reduction, anti-inflammatory",
      adultDosage: "325-650 mg every 4 hours as needed",
      warnings: ["May cause stomach upset.", "Avoid alcohol."],
    };
  }
  if (text.toLowerCase().includes("paracetamol") || text.toLowerCase().includes("acetaminophen")) {
    return {
      id: "med-456",
      name: "Paracetamol",
      genericName: "Acetaminophen",
      category: "Analgesic, Antipyretic",
      primaryUse: "Pain relief, fever reduction",
      adultDosage: "500-1000 mg every 4-6 hours as needed",
      warnings: ["May cause liver damage in high doses."],
    };
  }
  if (text.toLowerCase().includes("mobic")) {
    return {
      id: "med-789",
      name: "Mobic",
      genericName: "Meloxicam",
      category: "NSAID",
      primaryUse: "Pain and inflammation due to arthritis",
      adultDosage: "7.5-15 mg once daily",
      warnings: ["May cause stomach bleeding."],
    };
  }
  if (text.toLowerCase().includes("meloxicam")) {
    return {
      id: "med-789", // Same ID as Mobic, as Meloxicam is the generic name
      name: "Mobic",
      genericName: "Meloxicam",
      category: "NSAID",
      primaryUse: "Pain and inflammation due to arthritis",
      adultDosage: "7.5-15 mg once daily",
      warnings: ["May cause stomach bleeding."],
    };
  }
  return null;
}

// Enhanced fuzzy matching function with Levenshtein distance and pattern matching
async function findMedicationByFuzzyMatch(searchText: string): Promise<any | null> {
  console.log(`Enhanced Fuzzy Search: "${searchText}"`);

  // Get all medications from storage
  const allMedications = await storage.searchMedications(""); // Get all

  const normalizedSearch = searchText.toLowerCase().trim();
  if (normalizedSearch.length < 3) return null;

  let bestMatch = null;
  let bestScore = 0;
  const minScore = 0.6; // Minimum similarity threshold

  for (const med of allMedications) {
    const candidates = [
      med.name,
      med.genericName,
      med.nameVi,
      med.genericNameVi
    ].filter(Boolean);

    for (const candidate of candidates) {
      const normalizedCandidate = candidate.toLowerCase();

      // Exact substring match gets highest priority
      if (normalizedCandidate.includes(normalizedSearch) || normalizedSearch.includes(normalizedCandidate)) {
        return med;
      }

      // Calculate similarity score
      const similarity = calculateSimilarity(normalizedSearch, normalizedCandidate);

      if (similarity > minScore && similarity > bestScore) {
        bestMatch = med;
        bestScore = similarity;
      }
    }
  }

  console.log(`Best fuzzy match: ${bestMatch?.name} with score: ${bestScore}`);
  return bestMatch;
}

function calculateSimilarity(str1: string, str2: string): number {
  // Levenshtein distance
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

  const distance = matrix[str2.length][str1.length];
  const maxLength = Math.max(str1.length, str2.length);
  return 1 - (distance / maxLength);
}

// Enhanced partial matching function with comprehensive scoring
async function findMedicationByPartialMatch(searchText: string): Promise<any | null> {
  console.log(`Enhanced Partial Match Search: "${searchText}"`);

  const allMedications = await storage.searchMedications(""); // Get all
  const normalizedSearch = searchText.toLowerCase().trim();

  if (normalizedSearch.length < 3) return null;

  // Score all medications based on how well they match
  const scoredMedications = allMedications.map(med => {
    const candidates = [
      { text: med.name, weight: 1.0 },
      { text: med.genericName || '', weight: 0.9 },
      { text: med.nameVi || '', weight: 0.8 },
      { text: med.genericNameVi || '', weight: 0.7 }
    ].filter(c => c.text.length > 0);

    let bestScore = 0;

    for (const candidate of candidates) {
      const normalizedCandidate = candidate.text.toLowerCase();
      let score = 0;

      // Exact match
      if (normalizedCandidate === normalizedSearch) {
        score = 1.0 * candidate.weight;
      }
      // Exact substring match
      else if (normalizedCandidate.includes(normalizedSearch)) {
        score = 0.9 * candidate.weight;
      }
      // Search term contains medication name
      else if (normalizedSearch.includes(normalizedCandidate)) {
        score = 0.8 * candidate.weight;
      }
      // Starts with search term
      else if (normalizedCandidate.startsWith(normalizedSearch)) {
        score = 0.7 * candidate.weight;
      }
      // Word boundary match
      else if (new RegExp(`\\b${escapeRegex(normalizedSearch)}`, 'i').test(normalizedCandidate)) {
        score = 0.6 * candidate.weight;
      }
      // Contains as substring with position bonus
      else {
        const index = normalizedCandidate.indexOf(normalizedSearch);
        if (index !== -1) {
          // Earlier position gets higher score
          const positionBonus = 1 - (index / normalizedCandidate.length);
          score = (0.4 + positionBonus * 0.2) * candidate.weight;
        }
      }

      bestScore = Math.max(bestScore, score);
    }

    return { medication: med, score: bestScore };
  });

  // Return the highest scoring medication if it meets minimum threshold
  const sorted = scoredMedications
    .filter(item => item.score > 0.3)
    .sort((a, b) => b.score - a.score);

  const result = sorted.length > 0 ? sorted[0].medication : null;
  if (result) {
    console.log(`Best partial match: ${result.name} with score: ${sorted[0].score}`);
  }

  return result;
}

function escapeRegex(string: string): string {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}