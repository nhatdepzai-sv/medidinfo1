import express, { Request, Response } from "express";
import { z } from "zod";
import { enhancedAITrainer } from "./enhanced-ai-training";
import { fullComprehensiveDrugsDatabase } from "./comprehensive-drugs-database";
import { globalMedicationsDatabase } from "./global-medications-database";
import { medicationsDatabase } from "./medications-database";
import { drugAliasService } from "./drug-alias-service";
import { storage } from "./storage";
import { AuthService, registerSchema, loginSchema, authenticateToken } from "./auth";

// Shared search function to avoid recursive API calls
async function searchMedicationsInternal(query: string) {
  if (!query || query.trim().length < 2) {
    return {
      success: false,
      message: "Search query must be at least 2 characters",
      medications: []
    };
  }

  const searchTerm = query.toLowerCase().trim();
  console.log("🔍 Processing enhanced search term:", searchTerm);

  // Combine all databases for comprehensive search
  const allDatabases = [
    ...fullComprehensiveDrugsDatabase,
    ...globalMedicationsDatabase,
    ...medicationsDatabase
  ];

  // Advanced scoring algorithm for medication search with error handling
  const scoredResults = await Promise.all(allDatabases.slice(0, 1000).map(async (drug) => {
    try {
      let score = 0;
      const maxScore = 100;

      const drugName = drug.name?.toLowerCase() || '';
      const drugNameVi = drug.nameVi?.toLowerCase() || '';
      const drugGenericName = drug.genericName?.toLowerCase() || '';
      const drugGenericNameVi = drug.genericNameVi?.toLowerCase() || '';
      const drugCategory = drug.category?.toLowerCase() || '';
      const drugCategoryVi = drug.categoryVi?.toLowerCase() || '';

      // Exact matches (highest priority)
      if (drugName === searchTerm) score += 100;
      else if (drugNameVi === searchTerm) score += 95;
      else if (drugGenericName === searchTerm) score += 90;
      else if (drugGenericNameVi === searchTerm) score += 85;

      // Word-based exact matches (very high priority)
      const drugNameWords = drugName.split(' ');
      const drugNameViWords = drugNameVi.split(' ');
      const drugGenericWords = drugGenericName.split(' ');
      const drugGenericViWords = drugGenericNameVi.split(' ');

      if (drugNameWords.some(word => word === searchTerm)) score += 85;
      if (drugNameViWords.some(word => word === searchTerm)) score += 80;
      if (drugGenericWords.some(word => word === searchTerm)) score += 75;
      if (drugGenericViWords.some(word => word === searchTerm)) score += 70;

      // Starts with matches (high priority)
      if (drugName.startsWith(searchTerm)) score += 80;
      else if (drugNameVi.startsWith(searchTerm)) score += 75;
      else if (drugGenericName.startsWith(searchTerm)) score += 70;
      else if (drugGenericNameVi.startsWith(searchTerm)) score += 65;

      // Word starts with matches
      if (drugNameWords.some(word => word.startsWith(searchTerm))) score += 60;
      if (drugNameViWords.some(word => word.startsWith(searchTerm))) score += 55;
      if (drugGenericWords.some(word => word.startsWith(searchTerm))) score += 50;
      if (drugGenericViWords.some(word => word.startsWith(searchTerm))) score += 45;

      // Contains matches (medium priority)
      if (drugName.includes(searchTerm)) score += 50;
      else if (drugNameVi.includes(searchTerm)) score += 45;
      else if (drugGenericName.includes(searchTerm)) score += 40;
      else if (drugGenericNameVi.includes(searchTerm)) score += 35;

      // Category matches (lower priority)
      if (drugCategory.includes(searchTerm)) score += 20;
      if (drugCategoryVi.includes(searchTerm)) score += 15;

      // Alias matches (lower priority) with error handling
      try {
        const aliases = await drugAliasService.getAllAliases(drug.name || drug.genericName || '');
        if (aliases && aliases.some(alias => alias.toLowerCase().includes(searchTerm))) {
          score += 30;
        }
      } catch (aliasError) {
        console.warn('Alias lookup failed:', aliasError);
        // Continue without alias scoring
      }

      // Ensure score does not exceed maxScore and is non-negative
      return {
        ...drug,
        score: Math.max(0, Math.min(score, maxScore))
      };
    } catch (drugError) {
      console.warn('Error processing drug:', drug.name, drugError);
      return {
        ...drug,
        score: 0
      };
    }
  }));

  // Filter results by score and limit the number of results
  const filteredResults = scoredResults
    .filter(drug => drug.score > 30) // Minimum score threshold
    .sort((a, b) => b.score - a.score) // Sort by score descending
    .slice(0, 50); // Limit to top 50 results

  console.log(`✅ Found ${filteredResults.length} medications for: "${searchTerm}"`);

  return {
    success: true,
    message: `Found ${filteredResults.length} medications`,
    medications: filteredResults,
    searchTerm: searchTerm,
    totalResults: filteredResults.length
  };
}

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

  // Authentication routes
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

  app.post("/api/auth/guest", async (req: Request, res: Response) => {
    console.log("Guest login endpoint called");
    try {
      const result = await AuthService.loginAsGuest();
      console.log("Guest login successful:", result.user.id);

      res.status(200).json({
        success: true,
        user: result.user,
        token: result.token,
        message: "Guest login successful"
      });
    } catch (error: any) {
      console.error("Guest login error:", error);
      res.status(200).json({
        success: false,
        message: error.message || "Guest login failed"
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

  // Admin account creation endpoint
  app.post("/api/auth/create-admin", async (req: Request, res: Response) => {
    try {
      const { username, email, password, adminKey } = req.body;

      // Simple admin key check (you can change this)
      if (adminKey !== "admin-setup-key-2024") {
        return res.status(403).json({
          success: false,
          message: "Invalid admin key"
        });
      }

      // Validate input
      const validationResult = registerSchema.safeParse({ username, email, password });
      if (!validationResult.success) {
        return res.status(400).json({
          success: false,
          message: "Invalid input data",
          errors: validationResult.error.errors
        });
      }

      // Check if admin user already exists
      const existingAdmin = await storage.getUserByUsername(username);
      if (existingAdmin) {
        return res.status(400).json({
          success: false,
          message: "Admin user already exists"
        });
      }

      // Create admin user with role
      const result = await AuthService.registerAdmin({ username, email, password });

      res.json({
        success: true,
        user: {
          ...result.user,
          role: "admin",
          permissions: [
            "view_all_users",
            "manage_medications",
            "view_analytics",
            "manage_system",
            "delete_users",
            "bulk_operations"
          ]
        },
        token: result.token,
        message: "Admin account created successfully"
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        message: error.message || "Admin account creation failed"
      });
    }
  });

  // Admin routes
  app.get("/api/admin/users", authenticateToken, async (req: any, res: Response) => {
    try {
      // Check if user has admin role
      const user = await storage.getUser(req.user.id);
      if (!user || user.role !== 'admin') {
        return res.status(403).json({
          success: false,
          message: "Admin access required"
        });
      }

      const users = await storage.getAllUsers?.() || [];
      res.json({
        success: true,
        users: users.map(user => ({
          id: user.id,
          username: user.username,
          email: user.email,
          role: user.role || 'user',
          createdAt: user.createdAt
        }))
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: "Failed to fetch users"
      });
    }
  });

  app.delete("/api/admin/users/:userId", authenticateToken, async (req: any, res: Response) => {
    try {
      const { userId } = req.params;
      await storage.deleteUser?.(userId);
      res.json({
        success: true,
        message: "User deleted successfully"
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: "Failed to delete user"
      });
    }
  });

  app.delete("/api/admin/users", authenticateToken, async (req: any, res: Response) => {
    try {
      // Get all users first
      const users = await storage.getAllUsers?.() || [];
      
      // Delete all users except the current admin
      const currentUserId = req.user.userId;
      const usersToDelete = users.filter(user => user.id !== currentUserId);
      
      for (const user of usersToDelete) {
        await storage.deleteUser?.(user.id);
      }
      
      res.json({
        success: true,
        message: `Successfully deleted ${usersToDelete.length} users`
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: "Failed to clear all users"
      });
    }
  });

  app.get("/api/admin/search-history", authenticateToken, async (req: any, res: Response) => {
    try {
      const history = await storage.getAllSearchHistory?.() || [];
      res.json({
        success: true,
        history
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: "Failed to fetch search history"
      });
    }
  });

  app.get("/api/admin/stats", authenticateToken, async (req: any, res: Response) => {
    try {
      const stats = {
        totalUsers: (await storage.getAllUsers?.())?.length || 0,
        totalSearches: (await storage.getAllSearchHistory?.())?.length || 0,
        totalMedications: 199954, // From your database
        serverUptime: process.uptime(),
        lastRestart: new Date(Date.now() - process.uptime() * 1000).toISOString()
      };

      res.json({
        success: true,
        stats
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: "Failed to fetch stats"
      });
    }
  });

  // Enhanced medication search with comprehensive database
  app.get("/api/search-medications", async (req: Request, res: Response) => {
    try {
      const query = req.query.query as string;

      if (!query || typeof query !== "string" || query.trim().length < 2) {
        return res.json({
          success: false,
          message: "Search query must be at least 2 characters",
          medications: []
        });
      }

      // Use shared search function
      const searchResult = await searchMedicationsInternal(query);

      // TEMPORARILY DISABLED: Auto-training to stop infinite loop
      // if (searchResult.success && searchResult.medications.length > 0) {
      //   try {
      //     enhancedAITrainer.trainOnSearchPattern(searchResult.searchTerm, searchResult.medications);
      //     searchResult.medications.forEach(med => {
      //       enhancedAITrainer.autoTrainOnNewDrug(med);
      //     });
      //   } catch (trainingError) {
      //     console.warn('Training on search pattern failed:', trainingError);
      //   }
      // }

      res.json(searchResult);

    } catch (error: any) {
      console.error("❌ Search medications failed:", error);
      res.status(500).json({
        success: false,
        message: "Search temporarily unavailable. Please try again.",
        medications: []
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
        // Search for the detected medication using internal function (no HTTP call)
        const searchResult = await searchMedicationsInternal(ocrResult.medicationName);
        const medications = searchResult.medications || [];

        // Add successful recognition for AI learning
        enhancedAITrainer.addSuccessfulRecognition(
          imageData,
          ocrResult.medicationName,
          ocrResult.dosage || '',
          ocrResult.confidence / 100
        );

        // Train on OCR-to-medication mapping
        enhancedAITrainer.trainOnOCRCorrection(
          ocrResult.detectedText || '',
          ocrResult.medicationName,
          false // Auto-detected, not user-confirmed
        );

        // TEMPORARILY DISABLED: Auto-training to stop infinite loop
        // medications.forEach(med => {
        //   enhancedAITrainer.autoTrainOnNewDrug(med);
        // });

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

      // Use internal search function instead of HTTP call
      const searchResult = await searchMedicationsInternal(query);
      res.json(searchResult);

    } catch (error) {
      console.error("❌ Legacy search failed:", error);
      res.status(500).json({
        success: false,
        message: "Search failed"
      });
    }
  });

  // User feedback endpoint for AI training improvement
  app.post("/api/training/feedback", authenticateToken, async (req: any, res: Response) => {
    try {
      const { ocrText, correctMedication, wasCorrect, confidence } = req.body;

      if (!ocrText || !correctMedication) {
        return res.status(400).json({
          success: false,
          message: "OCR text and correct medication name are required"
        });
      }

      // Train based on user feedback
      enhancedAITrainer.trainOnOCRCorrection(ocrText, correctMedication, true);

      // If user provided the correct medication, add it to successful recognitions
      if (wasCorrect) {
        enhancedAITrainer.addSuccessfulRecognition(
          ocrText,
          correctMedication,
          '',
          confidence || 100
        );
      }

      res.json({
        success: true,
        message: "Training feedback received and processed",
        trainingStats: enhancedAITrainer.getTrainingStats()
      });

    } catch (error) {
      console.error("❌ Training feedback failed:", error);
      res.status(500).json({
        success: false,
        message: "Failed to process training feedback"
      });
    }
  });

  // Background training status endpoint
  app.get("/api/training/status", (req, res) => {
    try {
      const stats = enhancedAITrainer.getTrainingStats();
      res.json({
        success: true,
        stats
      });
    } catch (error) {
      console.error("❌ Get training status failed:", error);
      res.status(500).json({
        success: false,
        message: "Failed to get training status"
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