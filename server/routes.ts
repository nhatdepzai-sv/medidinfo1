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

      // Initialize Tesseract worker
      const worker = await createWorker();

      // Perform OCR on the uploaded image
      const { data: { text } } = await worker.recognize(req.file.buffer);
      await worker.terminate();

      if (!text.trim()) {
        return res.status(400).json({ message: "No text could be extracted from the image" });
      }

      // Extract potential drug names from OCR text
      const extractedText = text.replace(/\n/g, " ").trim();
      
      // Try to find medication in local storage first
      let medication = await storage.getMedicationByName(extractedText);

      if (!medication) {
        // Search using OpenFDA API
        const drugInfo = await searchDrugInfo(extractedText);
        if (drugInfo) {
          // Store the found medication
          medication = await storage.createMedication(drugInfo);
        }
      }

      if (!medication) {
        return res.status(404).json({ 
          message: "Could not identify this medication",
          extractedText 
        });
      }

      // Log search history
      await storage.createSearchHistory({
        medicationId: medication.id,
        searchQuery: extractedText,
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
    const openfda = result.openfda || {};

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
        'breastfeeding': 'cho con bú'
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
        'cho con bú': 'breastfeeding'
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
