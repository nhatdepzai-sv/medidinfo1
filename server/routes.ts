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

  // Enhanced medication identification endpoint
  app.post("/api/identify-medication", async (req, res) => {
    try {
      const { text, alternativeQueries = [], searchMethod = "manual", confidence = 0, allDetectedText = "" } = req.body;

      if (!text || typeof text !== "string") {
        return res.status(400).json({ error: "Text is required" });
      }

      console.log("Identifying medication from text:", text);
      console.log("Alternative queries:", alternativeQueries);
      console.log("Original OCR text:", allDetectedText);

      let medication = null;
      let bestMatch = null;
      const searchResults = [];

      // Create comprehensive search function
      const searchWithStrategy = async (query: string, strategy: string) => {
        if (!query || query.length < 3) return null;

        console.log(`Trying ${strategy} search for: "${query}"`);

        // Try exact match first
        let result = await findMedicationByText(query);
        if (result) {
          searchResults.push({ query, strategy: `exact_${strategy}`, found: result.name });
          return { medication: result, strategy: `exact_${strategy}`, query };
        }

        // Try fuzzy match
        result = await findMedicationByFuzzyMatch(query);
        if (result) {
          searchResults.push({ query, strategy: `fuzzy_${strategy}`, found: result.name });
          return { medication: result, strategy: `fuzzy_${strategy}`, query };
        }

        searchResults.push({ query, strategy, found: null });
        return null;
      };

      // 1. Try original text first
      bestMatch = await searchWithStrategy(text, "original");
      if (bestMatch) medication = bestMatch.medication;

      // 2. If not found, systematically try ALL alternative queries
      if (!medication && alternativeQueries.length > 0) {
        for (let i = 0; i < alternativeQueries.length; i++) {
          const query = alternativeQueries[i];
          if (typeof query === "string" && query.length >= 3) {
            const result = await searchWithStrategy(query, `alt_${i}`);
            if (result) {
              bestMatch = result;
              medication = result.medication;
              break; // Found it! Stop searching
            }
          }
        }
      }

      // 3. If still not found, try partial word matching on individual words from all detected text
      if (!medication && allDetectedText) {
        console.log("Trying partial matching on individual words from OCR text...");
        const wordsFromOcr = allDetectedText.split(" ");
        for (const word of wordsFromOcr) {
          if (typeof word === "string" && word.length >= 4) {
            // Try to find medications that contain this word as part of their name or generic name
            const partialResult = await findMedicationByPartialMatch(word); // Assuming this function checks for partial matches in DB
            if (partialResult) {
              bestMatch = { medication: partialResult, strategy: "partial_ocr", query: word };
              medication = partialResult;
              searchResults.push({ query: word, strategy: "partial_ocr", found: partialResult.name });
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

// Placeholder for findMedicationByFuzzyMatch function - replace with actual implementation
async function findMedicationByFuzzyMatch(text: string): Promise<any | null> {
  // This is a mock implementation. In a real scenario, this would use fuzzy search.
  console.log(`Mock Fuzzy Search: "${text}"`);
  // Example: If text is "asprn", it might still find "Aspirin"
  if (text.toLowerCase().includes("asprn")) {
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
  if (text.toLowerCase().includes("melox")) {
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
  return null;
}

// Placeholder for findMedicationByPartialMatch function - replace with actual implementation
async function findMedicationByPartialMatch(text: string): Promise<any | null> {
  // This is a mock implementation. In a real scenario, this would query the database for partial matches.
  console.log(`Mock Partial Match Search: "${text}"`);
  // Example: If text is "Mobic" or "Meloxicam", it should return the correct medication
  if (text.toLowerCase() === "mobic") {
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
  if (text.toLowerCase() === "meloxicam") {
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
  return null;
}

// Placeholder for storeSearchHistory function - replace with actual implementation
async function storeSearchHistory(query: string, searchMethod: string, medicationId?: string | null): Promise<any> {
  // This is a mock implementation. In a real scenario, this would save to a database.
  console.log(`Mock History Store: Query="${query}", Method="${searchMethod}", MedId="${medicationId}"`);
  return {
    id: `hist-${Math.random().toString(36).substring(7)}`,
    query,
    searchMethod,
    medicationId,
    timestamp: new Date().toISOString(),
  };
}