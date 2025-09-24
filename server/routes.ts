
import express from "express";
import { z } from "zod";
import { enhancedAITrainer } from "./enhanced-ai-training";
import { fullComprehensiveDrugsDatabase } from "./comprehensive-drugs-database";
import { globalMedicationsDatabase } from "./global-medications-database";
import { medicationsDatabase } from "./medications-database";
import { drugAliasService } from "./drug-alias-service";
import { storage } from "./storage";
import { AuthService, registerSchema, loginSchema, authenticateToken } from "./auth";

export function setupRoutes(app: express.Application) {
  console.log("🔧 Setting up API routes...");

  // Health check endpoint
  app.get("/api/health", (req, res) => {
    res.json({
      status: "ok",
      timestamp: new Date().toISOString(),
      version: "1.0.0"
    });
  });

  // Authentication endpoints
  app.post("/api/auth/register", async (req, res) => {
    try {
      const userData = registerSchema.parse(req.body);
      const result = await AuthService.register(userData);
      
      res.json({
        success: true,
        user: result.user,
        token: result.token,
        message: "Registration successful"
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        message: error.message || "Registration failed"
      });
    }
  });

  app.post("/api/auth/login", async (req, res) => {
    try {
      const loginData = loginSchema.parse(req.body);
      const result = await AuthService.login(loginData);
      
      res.json({
        success: true,
        user: result.user,
        token: result.token,
        message: "Login successful"
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        message: error.message || "Login failed"
      });
    }
  });

  app.get("/api/auth/verify", authenticateToken, (req: any, res) => {
    res.json({
      success: true,
      user: req.user,
      message: "Token valid"
    });
  });

  app.post("/api/auth/logout", (req, res) => {
    res.json({
      success: true,
      message: "Logout successful"
    });
  });

  // Enhanced medication search with fuzzy matching and alias support
  app.get("/api/search-medications", async (req, res) => {
    try {
      const { query } = req.query;

      if (!query || typeof query !== "string" || query.trim().length === 0) {
        return res.status(400).json({
          success: false,
          message: "Search query is required"
        });
      }

      const searchTerm = query.trim().toLowerCase();
      console.log(`🔍 Searching medications for: "${searchTerm}"`);

      // Combine all medication databases
      const allMedications = [
        ...fullComprehensiveDrugsDatabase,
        ...globalMedicationsDatabase,
        ...medicationsDatabase
      ];

      // Remove duplicates based on name
      const uniqueMedications = new Map();
      allMedications.forEach(med => {
        const key = (med.name || med.genericName || '').toLowerCase();
        if (key && !uniqueMedications.has(key)) {
          uniqueMedications.set(key, med);
        }
      });

      const medications = Array.from(uniqueMedications.values());

      // Enhanced search with multiple matching strategies
      const searchResults = medications.filter(med => {
        const name = (med.name || '').toLowerCase();
        const genericName = (med.genericName || '').toLowerCase();
        const nameVi = (med.nameVi || '').toLowerCase();
        const category = (med.category || '').toLowerCase();
        const categoryVi = (med.categoryVi || '').toLowerCase();

        // Direct matches
        if (name.includes(searchTerm) || 
            genericName.includes(searchTerm) || 
            nameVi.includes(searchTerm) ||
            category.includes(searchTerm) ||
            categoryVi.includes(searchTerm)) {
          return true;
        }

        // Alias matching using drug alias service
        const aliases = drugAliasService.getAliases(name || genericName);
        if (aliases.some(alias => alias.toLowerCase().includes(searchTerm))) {
          return true;
        }

        // Partial word matching for better search results
        const searchWords = searchTerm.split(/\s+/);
        const medWords = [name, genericName, nameVi].join(' ').toLowerCase().split(/\s+/);
        
        return searchWords.some(searchWord => 
          searchWord.length > 2 && medWords.some(medWord => 
            medWord.includes(searchWord) || searchWord.includes(medWord)
          )
        );
      });

      // Sort results by relevance
      const sortedResults = searchResults.sort((a, b) => {
        const aName = (a.name || '').toLowerCase();
        const bName = (b.name || '').toLowerCase();
        
        // Exact matches first
        if (aName === searchTerm && bName !== searchTerm) return -1;
        if (bName === searchTerm && aName !== searchTerm) return 1;
        
        // Starts with search term
        if (aName.startsWith(searchTerm) && !bName.startsWith(searchTerm)) return -1;
        if (bName.startsWith(searchTerm) && !aName.startsWith(searchTerm)) return 1;
        
        // Alphabetical order
        return aName.localeCompare(bName);
      });

      // Limit results for better performance
      const limitedResults = sortedResults.slice(0, 50);

      // Learn from search query for AI improvement
      if (limitedResults.length > 0) {
        enhancedAITrainer.continuousLearning(
          searchTerm,
          limitedResults[0].name || limitedResults[0].genericName || '',
          []
        );
      }

      res.json({
        success: true,
        medications: limitedResults,
        total: limitedResults.length,
        message: limitedResults.length > 0 
          ? `Found ${limitedResults.length} medication(s)`
          : "No medications found for your search"
      });

    } catch (error) {
      console.error("❌ Search medications failed:", error);
      res.status(500).json({
        success: false,
        message: "Search failed. Please try again."
      });
    }
  });

  // Enhanced image recognition with multiple OCR strategies
  app.post("/api/scan-medication", async (req, res) => {
    try {
      const { imageData } = req.body;

      if (!imageData || typeof imageData !== "string") {
        return res.status(400).json({
          success: false,
          message: "Image data is required"
        });
      }

      console.log("📸 Processing medication image...");

      // Use enhanced AI trainer for image recognition
      const ocrResult = await enhancedAITrainer.performEnhancedOCR(imageData);

      if (ocrResult.medicationName) {
        // Search for the detected medication in database
        const searchResults = await fetch(
          `/api/search-medications?query=${encodeURIComponent(ocrResult.medicationName)}`,
          { method: 'GET' }
        );

        let medications = [];
        if (searchResults.ok) {
          const searchData = await searchResults.json();
          medications = searchData.medications || [];
        }

        // Add successful recognition for AI learning
        enhancedAITrainer.addSuccessfulRecognition(
          imageData,
          ocrResult.medicationName,
          ocrResult.dosage || '',
          ocrResult.confidence / 100
        );

        res.json({
          success: true,
          detected: {
            medicationName: ocrResult.medicationName,
            dosage: ocrResult.dosage,
            confidence: ocrResult.confidence,
            detectedText: ocrResult.detectedText,
            strategies: ocrResult.strategies
          },
          medications: medications.slice(0, 5), // Top 5 matches
          message: `Detected: ${ocrResult.medicationName} (${ocrResult.confidence}% confidence)`
        });
      } else {
        res.json({
          success: false,
          detected: {
            detectedText: ocrResult.detectedText,
            confidence: ocrResult.confidence,
            strategies: ocrResult.strategies
          },
          message: "Could not identify medication from image. Please try a clearer photo or search manually.",
          suggestions: [
            "Ensure the medication label is clearly visible",
            "Take the photo in good lighting",
            "Hold the camera steady",
            "Try searching manually if scanning fails"
          ]
        });
      }

    } catch (error) {
      console.error("❌ Image recognition failed:", error);
      res.status(500).json({
        success: false,
        message: "Image processing failed. Please try again."
      });
    }
  });

  // Get medication details by ID
  app.get("/api/medication/:id", (req, res) => {
    try {
      const { id } = req.params;

      const allMedications = [
        ...fullComprehensiveDrugsDatabase,
        ...globalMedicationsDatabase,
        ...medicationsDatabase
      ];

      const medication = allMedications.find(med => 
        med.id === id || 
        med.name?.toLowerCase() === id.toLowerCase() ||
        med.genericName?.toLowerCase() === id.toLowerCase()
      );

      if (!medication) {
        return res.status(404).json({
          success: false,
          message: "Medication not found"
        });
      }

      // Get aliases for this medication
      const aliases = drugAliasService.getAliases(medication.name || medication.genericName || '');

      res.json({
        success: true,
        medication: {
          ...medication,
          aliases
        }
      });

    } catch (error) {
      console.error("❌ Get medication details failed:", error);
      res.status(500).json({
        success: false,
        message: "Failed to get medication details"
      });
    }
  });

  // Manual drug search endpoint (legacy support)
  app.post("/api/search-drug", async (req, res) => {
    try {
      const { query } = req.body;

      if (!query || typeof query !== "string") {
        return res.status(400).json({
          success: false,
          message: "Search query is required"
        });
      }

      // Redirect to the new search endpoint
      const searchResults = await fetch(
        `/api/search-medications?query=${encodeURIComponent(query)}`,
        { method: 'GET' }
      );

      if (searchResults.ok) {
        const data = await searchResults.json();
        res.json(data);
      } else {
        throw new Error('Search request failed');
      }

    } catch (error) {
      console.error("❌ Legacy search failed:", error);
      res.status(500).json({
        success: false,
        message: "Search failed"
      });
    }
  });

  // Get database statistics
  app.get("/api/stats", (req, res) => {
    try {
      const allMedications = [
        ...fullComprehensiveDrugsDatabase,
        ...globalMedicationsDatabase,
        ...medicationsDatabase
      ];

      const uniqueMedications = new Map();
      allMedications.forEach(med => {
        const key = (med.name || med.genericName || '').toLowerCase();
        if (key && !uniqueMedications.has(key)) {
          uniqueMedications.set(key, med);
        }
      });

      const backgroundTrainingStatus = enhancedAITrainer.getBackgroundTrainingStatus();

      res.json({
        success: true,
        stats: {
          totalMedications: uniqueMedications.size,
          databases: {
            comprehensive: fullComprehensiveDrugsDatabase.length,
            global: globalMedicationsDatabase.length,
            basic: medicationsDatabase.length
          },
          aiTraining: {
            isTraining: backgroundTrainingStatus.isTraining,
            hoursRemaining: Math.round(backgroundTrainingStatus.hoursRemaining * 10) / 10,
            cyclesCompleted: backgroundTrainingStatus.cyclesCompleted
          },
          lastUpdated: new Date().toISOString()
        }
      });

    } catch (error) {
      console.error("❌ Get stats failed:", error);
      res.status(500).json({
        success: false,
        message: "Failed to get statistics"
      });
    }
  });

  console.log("✅ API routes setup completed");
}
