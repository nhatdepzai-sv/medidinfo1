
import type { Express, Request } from "express";
import { createServer, type Server } from "http";
import multer from "multer";
import { createWorker } from "tesseract.js";
import { storage } from "./storage";
import { drugSearchResponseSchema } from "@shared/schema";

interface MulterRequest extends Request {
  file?: Express.Multer.File;
}

const upload = multer({ 
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB limit
});

export async function registerRoutes(app: Express): Promise<Server> {

  // Enhanced OCR and photo processing endpoint
  app.post("/api/identify-drug", upload.single("image"), async (req: MulterRequest, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: "No image file provided" });
      }

      console.log(`Processing image: ${req.file.size} bytes, type: ${req.file.mimetype}`);

      // Initialize Tesseract worker with enhanced options
      const worker = await createWorker({
        logger: m => console.log('Tesseract:', m),
        errorHandler: err => console.error('Tesseract error:', err)
      });

      try {
        await worker.loadLanguage('eng');
        await worker.initialize('eng');

        // Configure Tesseract for better medication text recognition
        await worker.setParameters({
          tessedit_char_whitelist: 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789 .-()/',
          tessedit_pageseg_mode: 8, // Single word
          preserve_interword_spaces: 1,
          tessedit_do_invert: 0
        });

        // Multiple OCR attempts with different configurations
        const configs = [
          { tessedit_pageseg_mode: 8 }, // Single word
          { tessedit_pageseg_mode: 7 }, // Single text line  
          { tessedit_pageseg_mode: 6 }, // Single uniform block
          { tessedit_pageseg_mode: 13 }, // Raw line
        ];

        let bestResult = "";
        let bestConfidence = 0;

        for (const config of configs) {
          try {
            await worker.setParameters(config);
            const { data: { text, confidence } } = await worker.recognize(req.file.buffer);
            
            console.log(`OCR Config ${config.tessedit_pageseg_mode}: "${text.trim()}" (confidence: ${confidence})`);
            
            if (confidence > bestConfidence && text.trim().length > 0) {
              bestResult = text.trim();
              bestConfidence = confidence;
            }
          } catch (configError) {
            console.warn(`OCR config ${config.tessedit_pageseg_mode} failed:`, configError);
          }
        }

        console.log(`Best OCR result: "${bestResult}" (confidence: ${bestConfidence}%)`);

        if (!bestResult || bestResult.length < 2 || bestConfidence < 15) {
          return res.status(400).json({ 
            message: "Could not extract clear text from image. Please ensure good lighting and focus on the medication label.",
            extractedText: bestResult,
            confidence: bestConfidence
          });
        }

        // Enhanced text processing and drug name extraction
        const cleanedText = bestResult
          .replace(/[^\w\s.-]/g, " ")
          .replace(/\s+/g, " ")
          .replace(/\b\d+mg?\b/gi, '')
          .replace(/\b(tablet|capsule|pill|mg|mcg|ml|cap|tab|dose|daily)\b/gi, '')
          .trim();

        // Extract potential drug names using multiple strategies
        const words = cleanedText.split(" ")
          .filter(word => word.length >= 3)
          .filter(word => /^[A-Za-z]/.test(word))
          .filter(word => !/^\d+$/.test(word));

        const potentialDrugNames = [
          cleanedText,
          ...words,
          bestResult.trim()
        ].filter(name => name.length >= 3);

        console.log("Potential drug names:", potentialDrugNames);

        let medication = null;
        let matchedText = "";

        // Try each potential drug name
        for (const drugName of potentialDrugNames) {
          // Try exact match first
          medication = await storage.getMedicationByName(drugName);
          if (medication) {
            matchedText = drugName;
            console.log(`Found medication by exact match: ${medication.name}`);
            break;
          }

          // Try partial match
          medication = await storage.getMedicationByPartialName(drugName);
          if (medication) {
            matchedText = drugName;
            console.log(`Found medication by partial match: ${medication.name}`);
            break;
          }
        }

        // Try fuzzy search as last resort
        if (!medication && potentialDrugNames.length > 0) {
          const searchResults = await storage.searchMedications(potentialDrugNames[0]);
          if (searchResults.length > 0) {
            medication = searchResults[0];
            matchedText = potentialDrugNames[0];
            console.log(`Found medication by fuzzy search: ${medication.name}`);
          }
        }

        if (!medication) {
          return res.status(404).json({ 
            message: "Could not identify this medication. The text might not be clear enough or the medication might not be in our database.",
            extractedText: cleanedText,
            potentialNames: potentialDrugNames.slice(0, 5),
            confidence: bestConfidence
          });
        }

        // Log search history
        await storage.createSearchHistory({
          medicationId: medication.id,
          searchQuery: bestResult,
          searchMethod: "photo"
        });

        res.json({
          ...medication,
          matchedText,
          extractedText: bestResult,
          confidence: bestConfidence
        });

      } finally {
        await worker.terminate();
      }

    } catch (error) {
      console.error("OCR processing error:", error);
      res.status(500).json({ 
        message: "Failed to process image", 
        error: error instanceof Error ? error.message : "Unknown error"
      });
    }
  });

  // Enhanced manual drug search endpoint
  app.post("/api/search-drug", async (req, res) => {
    try {
      const { query } = req.body;

      if (!query || typeof query !== "string" || query.trim().length < 2) {
        return res.status(400).json({ message: "Search query must be at least 2 characters long" });
      }

      console.log(`Manual search for: "${query}"`);

      // Try exact match first
      let medication = await storage.getMedicationByName(query.trim());

      if (!medication) {
        // Try fuzzy search
        const searchResults = await storage.searchMedications(query.trim());
        if (searchResults.length > 0) {
          medication = searchResults[0];
          console.log(`Found medication by fuzzy search: ${medication.name}`);
        }
      } else {
        console.log(`Found medication by exact match: ${medication.name}`);
      }

      if (!medication) {
        // Try to fetch from external API as fallback
        const drugInfo = await searchDrugInfo(query);
        if (drugInfo) {
          medication = await storage.createMedication(drugInfo);
          console.log(`Created new medication from external API: ${medication.name}`);
        }
      }

      if (!medication) {
        return res.status(404).json({ 
          message: "Medication not found. Please check the spelling or try a different name." 
        });
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
      res.status(500).json({ 
        message: "Failed to search for medication",
        error: error instanceof Error ? error.message : "Unknown error"
      });
    }
  });

  // Get search history with enriched data
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
      res.status(500).json({ 
        message: "Failed to fetch search history",
        error: error instanceof Error ? error.message : "Unknown error"
      });
    }
  });

  // Enhanced translation endpoint
  app.post("/api/translate", async (req, res) => {
    try {
      const { text, from, to } = req.body;

      if (!text || !from || !to) {
        return res.json({ success: false, error: "Missing required parameters" });
      }

      // Comprehensive translation mapping for medical terms
      const translations = {
        'en-vi': {
          'medication': 'thuốc',
          'medicine': 'thuốc',
          'drug': 'thuốc',
          'dosage': 'liều lượng',
          'dose': 'liều',
          'adults': 'người lớn',
          'children': 'trẻ em',
          'take with food': 'uống cùng thức ăn',
          'before meals': 'trước bữa ăn',
          'after meals': 'sau bữa ăn',
          'with meals': 'cùng bữa ăn',
          'daily': 'hàng ngày',
          'twice daily': 'hai lần mỗi ngày',
          'three times daily': 'ba lần mỗi ngày',
          'four times daily': 'bốn lần mỗi ngày',
          'as needed': 'khi cần',
          'warning': 'cảnh báo',
          'warnings': 'cảnh báo',
          'side effects': 'tác dụng phụ',
          'consult doctor': 'tham khảo bác sĩ',
          'see doctor': 'gặp bác sĩ',
          'pregnancy': 'mang thai',
          'pregnant': 'mang thai',
          'breastfeeding': 'cho con bú',
          'nursing': 'cho con bú',
          'pain relief': 'giảm đau',
          'fever reducer': 'hạ sốt',
          'anti-inflammatory': 'chống viêm',
          'antibiotic': 'kháng sinh',
          'vitamin': 'vitamin',
          'supplement': 'thực phẩm bổ sung',
          'tablet': 'viên',
          'capsule': 'viên nang',
          'liquid': 'dạng lỏng',
          'injection': 'tiêm',
          'cream': 'kem',
          'ointment': 'mỡ',
          'drops': 'thuốc nhỏ',
          'inhaler': 'bình xịt',
          'ml': 'ml',
          'mg': 'mg',
          'grams': 'gram',
          'morning': 'buổi sáng',
          'evening': 'buổi tối',
          'night': 'ban đêm',
          'bedtime': 'trước khi ngủ'
        },
        'vi-en': {
          'thuốc': 'medication',
          'liều lượng': 'dosage',
          'liều': 'dose',
          'người lớn': 'adults',
          'trẻ em': 'children',
          'uống cùng thức ăn': 'take with food',
          'trước bữa ăn': 'before meals',
          'sau bữa ăn': 'after meals',
          'cùng bữa ăn': 'with meals',
          'hàng ngày': 'daily',
          'hai lần mỗi ngày': 'twice daily',
          'ba lần mỗi ngày': 'three times daily',
          'bốn lần mỗi ngày': 'four times daily',
          'khi cần': 'as needed',
          'cảnh báo': 'warning',
          'tác dụng phụ': 'side effects',
          'tham khảo bác sĩ': 'consult doctor',
          'gặp bác sĩ': 'see doctor',
          'mang thai': 'pregnancy',
          'cho con bú': 'breastfeeding',
          'giảm đau': 'pain relief',
          'hạ sốt': 'fever reducer',
          'chống viêm': 'anti-inflammatory',
          'kháng sinh': 'antibiotic',
          'vitamin': 'vitamin',
          'thực phẩm bổ sung': 'supplement',
          'viên': 'tablet',
          'viên nang': 'capsule',
          'dạng lỏng': 'liquid',
          'tiêm': 'injection',
          'kem': 'cream',
          'mỡ': 'ointment',
          'thuốc nhỏ': 'drops',
          'bình xịt': 'inhaler',
          'buổi sáng': 'morning',
          'buổi tối': 'evening',
          'ban đêm': 'night',
          'trước khi ngủ': 'bedtime'
        }
      };

      let translatedText = text;
      const translationMap = translations[`${from}-${to}` as keyof typeof translations];

      if (translationMap) {
        // Sort by length (longest first) to handle phrases before individual words
        const sortedEntries = Object.entries(translationMap).sort((a, b) => b[0].length - a[0].length);
        
        for (const [original, translation] of sortedEntries) {
          const regex = new RegExp(`\\b${original.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'gi');
          translatedText = translatedText.replace(regex, translation);
        }
      }

      // If no translation was found, return a message
      if (translatedText === text && translationMap) {
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
      res.json({ 
        success: false, 
        error: "Translation failed",
        details: error instanceof Error ? error.message : "Unknown error"
      });
    }
  });

  // Medication search suggestions endpoint
  app.get("/api/search-suggestions", async (req, res) => {
    try {
      const { q } = req.query;
      
      if (!q || typeof q !== "string" || q.length < 2) {
        return res.json([]);
      }

      const suggestions = await storage.searchMedications(q);
      
      // Return simplified suggestions for autocomplete
      const simplifiedSuggestions = suggestions.slice(0, 10).map(med => ({
        id: med.id,
        name: med.name,
        nameVi: med.nameVi,
        genericName: med.genericName,
        category: med.category
      }));

      res.json(simplifiedSuggestions);
    } catch (error) {
      console.error("Search suggestions error:", error);
      res.status(500).json({ error: "Failed to get search suggestions" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}

// Helper function to search drug information using OpenFDA API
async function searchDrugInfo(drugName: string) {
  try {
    const searchQuery = encodeURIComponent(drugName.toLowerCase());

    // Search in OpenFDA drug labeling database
    const response = await fetch(
      `https://api.fda.gov/drug/label.json?search=openfda.brand_name:"${searchQuery}"+openfda.generic_name:"${searchQuery}"&limit=1`,
      { timeout: 5000 }
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
      nameVi: openfda.brand_name?.[0] || drugName,
      genericName: openfda.generic_name?.[0] || undefined,
      genericNameVi: openfda.generic_name?.[0] || undefined,
      category: openfda.pharmacologic_class?.[0] || "Unknown",
      categoryVi: openfda.pharmacologic_class?.[0] || "Không rõ",
      primaryUse: result.indications_and_usage?.[0] || result.purpose?.[0] || "Medication purpose not available",
      primaryUseVi: "Thông tin về công dụng thuốc chưa có sẵn",
      adultDosage: result.dosage_and_administration?.[0] || undefined,
      adultDosageVi: undefined,
      maxDosage: undefined,
      maxDosageVi: undefined,
      warnings: result.warnings || result.boxed_warning || [],
      warningsVi: []
    };

    return drugSearchResponseSchema.parse(medicationInfo);

  } catch (error) {
    console.error("OpenFDA API error:", error);
    return null;
  }
}
