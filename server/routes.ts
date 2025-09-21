import type { Express, Request } from "express";
import { createServer, type Server } from "http";
import multer from "multer";
import { createWorker } from "tesseract.js";
import { storage } from "./storage";
import { drugSearchResponseSchema, insertMedicationSchema, insertSearchHistorySchema } from "@shared/schema";
import { z } from "zod";
import { fullComprehensiveDrugsDatabase } from './comprehensive-drugs-database';
import { globalMedicationsDatabase } from './global-medications-database';
import { medicationsDatabase } from "./medications-database";

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

      // Preprocess text for better OCR results and easier parsing
      const preprocessedText = text
        .replace(/[^a-zA-Z0-9\s.-]/g, ' ') // Remove special characters except common ones
        .replace(/\n/g, ' ') // Replace newlines with spaces
        .replace(/\s+/g, ' ') // Replace multiple spaces with a single space
        .trim();

      if (!preprocessedText || confidence < 30) {
        return res.status(400).json({
          message: "Could not extract clear text from image. Please ensure good lighting and focus on the medication label.",
          extractedText: preprocessedText,
          confidence
        });
      }

      // Clean and process the extracted text
      const cleanedText = preprocessedText.toLowerCase().trim();

      // Enhanced drug name extraction with better patterns
      const drugNamePatterns = [
        // Brand names (often capitalized, 3+ letters)
        /\b([A-Z][a-z]{2,}(?:\s+[A-Z][a-z]{2,})?)\b/g,
        // Generic names (lowercase, medical terms)
        /\b([a-z]{4,}(?:ine|ol|al|ic|ate|ide|ium|phen|mycin|cillin))\b/gi,
        // Common pharmaceutical suffixes
        /\b([a-z]{3,}(?:pine|pril|sartan|statin|zole|tide|mab|nib))\b/gi,
        // General drug patterns (3-15 characters)
        /\b([a-z]{3,15})\b/gi
      ];

      let potentialDrugNames: string[] = [];

      for (const pattern of drugNamePatterns) {
        const matches = preprocessedText.match(pattern) || cleanedText.match(pattern);
        if (matches) {
          potentialDrugNames.push(...matches.map(match =>
            match.replace(/\d+(?:\.\d+)?\s*(?:mg|g|ml|mcg|iu|units?|tablets?|capsules?)/gi, '').trim()
          ));
        }
      }

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

  // Enhanced medication search with AI learning
  app.get("/api/search-medications", async (req, res) => {
    try {
      const query = req.query.query as string;

      if (!query || query.trim().length < 2) {
        return res.json({
          success: false,
          message: "Query must be at least 2 characters long",
          medications: []
        });
      }

      // Get AI predictions first
      const { enhancedAITrainer } = await import('./enhanced-ai-training');
      const aiPredictions = enhancedAITrainer.predictMedication(query);

      // Combine all databases for comprehensive search
      const allDatabases = [
        ...fullComprehensiveDrugsDatabase,
        ...globalMedicationsDatabase,
        ...medicationsDatabase
      ];

      // Advanced scoring system for better search results
      const scoredResults = allDatabases.map(drug => {
        let score = 0;
        const maxScore = 100;

        // Exact match gets highest score
        if (drug.name.toLowerCase() === searchTerm) score += 100;
        else if (drug.nameVi?.toLowerCase() === searchTerm) score += 95;
        else if (drug.genericName?.toLowerCase() === searchTerm) score += 90;
        else if (drug.genericNameVi?.toLowerCase() === searchTerm) score += 85;

        // Starts with search term
        if (drug.name.toLowerCase().startsWith(searchTerm)) score += 80;
        else if (drug.nameVi?.toLowerCase().startsWith(searchTerm)) score += 75;
        else if (drug.genericName?.toLowerCase().startsWith(searchTerm)) score += 70;
        else if (drug.genericNameVi?.toLowerCase().startsWith(searchTerm)) score += 65;

        // Contains search term
        if (drug.name.toLowerCase().includes(searchTerm)) score += 60;
        else if (drug.nameVi?.toLowerCase().includes(searchTerm)) score += 55;
        else if (drug.genericName?.toLowerCase().includes(searchTerm)) score += 50;
        else if (drug.genericNameVi?.toLowerCase().includes(searchTerm)) score += 45;

        // Brand name matching
        const brandNames = (drug as any).brandNames || [];
        const brandNamesVi = (drug as any).brandNamesVi || [];

        brandNames.forEach((brand: string) => {
          if (brand.toLowerCase() === searchTerm) score += 85;
          else if (brand.toLowerCase().startsWith(searchTerm)) score += 65;
          else if (brand.toLowerCase().includes(searchTerm)) score += 40;
        });

        brandNamesVi.forEach((brand: string) => {
          if (brand.toLowerCase() === searchTerm) score += 80;
          else if (brand.toLowerCase().startsWith(searchTerm)) score += 60;
          else if (brand.toLowerCase().includes(searchTerm)) score += 35;
        });

        // Category matching (lower priority)
        if (drug.category?.toLowerCase().includes(searchTerm)) score += 20;
        if (drug.categoryVi?.toLowerCase().includes(searchTerm)) score += 15;

        // Word boundary matching
        const nameWords = drug.name.toLowerCase().split(/[\s\-_]+/);
        const genericWords = drug.genericName?.toLowerCase().split(/[\s\-_]+/) || [];

        nameWords.forEach(word => {
          if (word === searchTerm) score += 75;
          else if (word.startsWith(searchTerm)) score += 35;
        });

        genericWords.forEach(word => {
          if (word === searchTerm) score += 70;
          else if (word.startsWith(searchTerm)) score += 30;
        });

        // Fuzzy matching for close spellings
        if (score === 0 && searchTerm.length > 3) {
          const fuzzyScore = calculateFuzzyScore(searchTerm, drug.name.toLowerCase());
          if (fuzzyScore > 0.7) score += Math.floor(fuzzyScore * 25);

          if (drug.genericName) {
            const genericFuzzyScore = calculateFuzzyScore(searchTerm, drug.genericName.toLowerCase());
            if (genericFuzzyScore > 0.7) score += Math.floor(genericFuzzyScore * 20);
          }
        }

        // Length penalty for very long names (prefer shorter, more specific matches)
        if (drug.name.length > 20) score -= 5;

        return { drug, score };
      })
      .filter(result => result.score > 0)
      .sort((a, b) => {
        // Primary sort by score
        if (a.score !== b.score) return b.score - a.score;

        // Secondary sort by name length (shorter preferred)
        return a.drug.name.length - b.drug.name.length;
      })
      .slice(0, 50) // Increase limit for better results
      .map(result => result.drug);

      console.log(`Enhanced search completed: found ${scoredResults.length} results for "${searchTerm}"`);

      // Combine database results with AI predictions
      const combinedResults = [...scoredResults];

      // Add high-confidence AI predictions that aren't already in results
      aiPredictions.forEach(prediction => {
        if (prediction.confidence > 0.7 && 
            !scoredResults.some(r => r.name.toLowerCase() === prediction.medication.toLowerCase())) {
          combinedResults.push({
            id: `ai-${prediction.medication}`,
            name: prediction.medication,
            category: 'AI Predicted',
            primaryUse: 'AI suggested medication',
            confidence: prediction.confidence
          });
        }
      });

      res.json({
        success: combinedResults.length > 0,
        medications: combinedResults,
        aiPredictions: aiPredictions.slice(0, 3), // Top 3 AI predictions
        message: combinedResults.length > 0 
          ? `Found ${combinedResults.length} medication(s) matching "${query}"`
          : `No medications found for "${query}"`
      });
    } catch (error) {
      console.error("Search error:", error);
      res.status(500).json({
        success: false,
        message: "Search failed",
        medications: []
      });
    }
  });

  // AI Training feedback endpoint
  app.post("/api/ai-feedback", async (req, res) => {
    try {
      const { searchQuery, selectedResult, rejectedResults, userRating } = req.body;

      if (!searchQuery || !selectedResult) {
        return res.status(400).json({
          success: false,
          message: "Missing required fields"
        });
      }

      const { enhancedAITrainer } = await import('./enhanced-ai-training');

      // Learn from user behavior
      enhancedAITrainer.learnFromUserBehavior(
        searchQuery,
        selectedResult,
        rejectedResults || []
      );

      // If user provided OCR training data
      if (req.body.imageData && req.body.expectedText) {
        await enhancedAITrainer.trainAdvancedOCR(
          req.body.imageData,
          req.body.expectedText
        );
      }

      res.json({
        success: true,
        message: "Feedback received and processed"
      });
    } catch (error) {
      console.error("AI feedback error:", error);
      res.status(500).json({
        success: false,
        message: "Failed to process feedback"
      });
    }
  });

  // Get AI training statistics
  app.get("/api/ai-stats", async (req, res) => {
    try {
      const { enhancedAITrainer } = await import('./enhanced-ai-training');
      const stats = enhancedAITrainer.getPerformanceMetrics();

      res.json({
        success: true,
        stats: {
          accuracy: Math.round(stats.accuracy * 100),
          trainingPoints: stats.trainingDataPoints,
          lastUpdated: new Date().toISOString()
        }
      });
    } catch (error) {
      console.error("AI stats error:", error);
      res.status(500).json({
        success: false,
        message: "Failed to get AI statistics"
      });
    }
  });

  // Manual drug search endpoint (legacy support)
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

  // Manual drug search endpoint (improved)
  app.post("/api/search-medication", async (req, res) => {
    try {
      const { text } = req.body;

      if (!text) {
        return res.status(400).json({ error: "No text provided" });
      }

      console.log("Searching for medication with text:", text);

      // Enhanced medication detection logic
      const medication = detectMedication(text);

      if (medication) {
        // Store search in history
        storage.addSearchHistory(text, medication.name);

        console.log("Medication found:", medication.name);
        res.json(medication);
      } else {
        console.log("No medication found for text:", text);
        res.status(404).json({ error: "Medication not found" });
      }
    } catch (error) {
      console.error("Error searching medication:", error);
      res.status(500).json({ error: "Internal server error" });
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

// Helper function to search drug information using global medications database
async function searchGlobalMedicationDatabase(drugName: string): Promise<any | null> {
  const normalizedSearch = drugName.toLowerCase().trim();
  if (normalizedSearch.length < 2) return null;

  let bestMatch = null;
  let highestScore = 0;

  for (const med of globalMedicationsDatabase) {
    const candidates = [
      { text: med.name, weight: 1.0 },
      { text: med.genericName, weight: 0.9 },
      { text: med.nameVi, weight: 0.8 },
      { text: med.genericNameVi, weight: 0.7 },
      { text: med.description, weight: 0.5 }
    ].filter(c => c.text && c.text.length > 0);

    for (const candidate of candidates) {
      const normalizedCandidate = candidate.text.toLowerCase();
      let score = 0;

      // Exact match
      if (normalizedCandidate === normalizedSearch) {
        score = 1.0 * candidate.weight;
      }
      // Substring match
      else if (normalizedCandidate.includes(normalizedSearch)) {
        score = 0.9 * candidate.weight;
      }
      // Search term includes candidate
      else if (normalizedSearch.includes(normalizedCandidate)) {
        score = 0.8 * candidate.weight;
      }
      // Starts with match
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
          const positionBonus = 1 - (index / normalizedCandidate.length);
          score = (0.4 + positionBonus * 0.2) * candidate.weight;
        }
      }

      if (score > highestScore) {
        highestScore = score;
        bestMatch = med;
      }
    }
  }

  // Return best match if score is above a threshold
  if (highestScore > 0.3) {
    console.log(`Global DB Best Match: ${bestMatch?.name} with score ${highestScore}`);
    return bestMatch;
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
      {text: med.name, weight: 1.0},
      {text: med.genericName, weight: 0.9},
      {text: med.nameVi, weight: 0.8},
      {text: med.genericNameVi, weight: 0.7}
    ].filter(Boolean);

    for (const candidate of candidates) {
      const normalizedCandidate = candidate.text.toLowerCase();

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
      { text: med.genericName, weight: 0.9 },
      { text: med.nameVi, weight: 0.8 },
      { text: med.genericNameVi, weight: 0.7 }
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

// Enhanced fuzzy matching using Levenshtein distance
function calculateFuzzyScore(str1: string, str2: string): number {
  const maxLength = Math.max(str1.length, str2.length);
  if (maxLength === 0) return 1.0;

  const distance = levenshteinDistance(str1, str2);
  return 1 - (distance / maxLength);
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

function detectMedication(text: string) {
  // Enhanced keyword matching with better text processing
  const lowerText = text.toLowerCase()
    .replace(/[^\w\s]/g, ' ') // Remove special characters
    .replace(/\s+/g, ' ') // Normalize whitespace
    .trim();

  const words = lowerText.split(' ');

  // Check for ibuprofen variants
  const ibuprofenKeywords = ['ibuprofen', 'advil', 'motrin', 'brufen'];
  if (ibuprofenKeywords.some(keyword =>
    words.some(word => word.includes(keyword) || keyword.includes(word))
  )) {
    return {
      id: "med-123",
      name: "Ibuprofen",
      genericName: "Ibuprofen",
      category: "NSAID",
      primaryUse: "Pain relief and inflammation reduction",
      adultDosage: "200-400mg every 4-6 hours",
      maxDosage: "1200mg per day",
      warnings: ["Do not exceed recommended dose.", "May cause stomach irritation."],
    };
  }

  // Check for acetaminophen variants
  const acetaminophenKeywords = ['acetaminophen', 'tylenol', 'paracetamol', 'panadol'];
  if (acetaminophenKeywords.some(keyword =>
    words.some(word => word.includes(keyword) || keyword.includes(word))
  )) {
    return {
      id: "med-456",
      name: "Acetaminophen",
      genericName: "Acetaminophen",
      category: "Analgesic",
      primaryUse: "Pain relief and fever reduction",
      adultDosage: "325-650mg every 4-6 hours",
      maxDosage: "3000mg per day",
      warnings: ["Do not exceed recommended dose.", "May cause liver damage if overused."],
    };
  }

  // Check for aspirin variants
  const aspirinKeywords = ['aspirin', 'bayer', 'bufferin'];
  if (aspirinKeywords.some(keyword =>
    words.some(word => word.includes(keyword) || keyword.includes(word))
  )) {
    return {
      id: "med-789",
      name: "Aspirin",
      genericName: "Aspirin",
      category: "NSAID",
      primaryUse: "Pain relief, inflammation reduction, and blood thinning",
      adultDosage: "81-325mg daily for heart protection, 325-650mg every 4 hours for pain",
      maxDosage: "4000mg per day for pain relief",
      warnings: ["May cause stomach bleeding.", "Consult doctor before use if on blood thinners."],
    };
  }

  // Check for meloxicam
  if (words.some(word => word.includes('meloxicam') || word.includes('mobic'))) {
    return {
      id: "med-101",
      name: "Meloxicam",
      genericName: "Meloxicam",
      category: "NSAID",
      primaryUse: "Pain and inflammation relief for arthritis",
      adultDosage: "7.5-15mg once daily",
      maxDosage: "15mg per day",
      warnings: ["May cause stomach bleeding.", "Monitor kidney function."],
    };
  }

  // Add more drug detection logic here, including for cancer and gout medications.
  // Example for Ginkgo Biloba (often used for cognitive function, not strictly a "drug" in all contexts, but included for comprehensiveness)
  if (words.some(word => word.includes('ginkgo') || word.includes('biloba'))) {
    return {
      id: "med-202",
      name: "Ginkgo Biloba",
      genericName: "Ginkgo Biloba Extract",
      category: "Herbal Supplement",
      primaryUse: "Improve cognitive function, circulation",
      adultDosage: "40-80 mg two to three times daily",
      maxDosage: "240mg per day",
      warnings: ["May increase bleeding risk.", "Interactions with blood thinners."],
    };
  }

  // Example for a Gout medication (e.g., Allopurinol)
  if (words.some(word => word.includes('allopurinol') || word.includes('zyloprim'))) {
    return {
      id: "med-303",
      name: "Allopurinol",
      genericName: "Allopurinol",
      category: "Xanthine Oxidase Inhibitor",
      primaryUse: "Treat gout and hyperuricemia",
      adultDosage: "100-300 mg once daily",
      maxDosage: "800mg per day",
      warnings: ["May cause skin rash.", "Stay hydrated."],
    };
  }

  // Example for a Cancer medication (e.g., Tamoxifen)
  if (words.some(word => word.includes('tamoxifen') || word.includes('nolvadex'))) {
    return {
      id: "med-404",
      name: "Tamoxifen",
      genericName: "Tamoxifen Citrate",
      category: "Selective Estrogen Receptor Modulator (SERM)",
      primaryUse: "Treat breast cancer",
      adultDosage: "20 mg once daily",
      maxDosage: "40mg per day",
      warnings: ["Increased risk of blood clots.", "Can affect menstrual cycle."],
    };
  }

  return null;
}

// Enhanced medication search function with fuzzy matching
async function searchMedications(searchTerm: string): Promise<Medication[]> {
  const results = await storage.searchMedications(searchTerm);

  // If no exact results, try partial matches
  if (results.length === 0) {
    return await storage.searchMedicationsPartial(searchTerm);
  }

  return results;
}

// Fuzzy search for medications with advanced matching
async function fuzzySearchMedications(searchTerm: string): Promise<Medication[]> {
  return await storage.fuzzySearchMedications(searchTerm);
}

// Get search suggestions for failed searches
async function getSearchSuggestions(searchTerm: string): Promise<string[]> {
  const commonMedications = [
    "Aspirin", "Meloxicam", "Ginkgo Biloba", "Ibuprofen", "Acetaminophen",
    "Amoxicillin", "Lisinopril", "Metformin", "Allopurinol", "Colchicine",
    "Tamoxifen", "Cisplatin", "Doxorubicin", "Warfarin", "Insulin"
  ];

  return commonMedications
    .filter(med => med.toLowerCase().includes(searchTerm.toLowerCase().substring(0, 3)))
    .slice(0, 5);
}