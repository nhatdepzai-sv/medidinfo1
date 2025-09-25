import express, { Request, Response } from "express";
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

      // Create admin user
      const result = await AuthService.register({ username, email, password });
      
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
      // In a real app, check if user has admin role
      const users = await storage.getAllUsers?.() || [];
      res.json({
        success: true,
        users: users.map(user => ({
          id: user.id,
          username: user.username,
          email: user.email,
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

      const searchTerm = query.toLowerCase().trim();
      console.log("🔍 Processing enhanced search term:", searchTerm);

      // Combine all databases for comprehensive search
      const allDatabases = [
        ...fullComprehensiveDrugsDatabase,
        ...globalMedicationsDatabase,
        ...medicationsDatabase
      ];

      // Advanced scoring algorithm for medication search
      const scoredResults = allDatabases.map((drug) => {
        let score = 0;
        const maxScore = 100;

        // Exact matches (highest priority)
        if (drug.name.toLowerCase() === searchTerm) score += 100;
        else if (drug.nameVi?.toLowerCase() === searchTerm) score += 95;
        else if (drug.genericName?.toLowerCase() === searchTerm) score += 90;
        else if (drug.genericNameVi?.toLowerCase() === searchTerm) score += 85;

        // Starts with matches (high priority)
        if (drug.name.toLowerCase().startsWith(searchTerm)) score += 80;
        else if (drug.nameVi?.toLowerCase().startsWith(searchTerm)) score += 75;
        else if (drug.genericName?.toLowerCase().startsWith(searchTerm)) score += 70;
        else if (drug.genericNameVi?.toLowerCase().startsWith(searchTerm)) score += 65;

        // Contains matches (medium priority)
        if (drug.name.toLowerCase().includes(searchTerm)) score += 50;
        else if (drug.nameVi?.toLowerCase().includes(searchTerm)) score += 45;
        else if (drug.genericName?.toLowerCase().includes(searchTerm)) score += 40;
        else if (drug.genericNameVi?.toLowerCase().includes(searchTerm)) score += 35;

        // Category matches (lower priority)
        if (drug.category?.toLowerCase().includes(searchTerm)) score += 20;
        if (drug.categoryVi?.toLowerCase().includes(searchTerm)) score += 15;

        // Alias matches (lower priority)
        const aliases = drugAliasService.getAliases(drug.name || drug.genericName || '');
        if (aliases.some(alias => alias.toLowerCase().includes(searchTerm))) score += 30;

        // Ensure score does not exceed maxScore and is non-negative
        return {
          ...drug,
          score: Math.max(0, Math.min(score, maxScore))
        };
      });

      // Filter results by score and limit the number of results
      const filteredResults = scoredResults
        .filter(drug => drug.score > 30) // Minimum score threshold
        .sort((a, b) => b.score - a.score) // Sort by score descending
        .slice(0, 50); // Limit to top 50 results

      console.log(`✅ Found ${filteredResults.length} medications for: "${searchTerm}"`);

      res.json({
        success: true,
        message: `Found ${filteredResults.length} medications`,
        medications: filteredResults,
        searchTerm: searchTerm,
        totalResults: filteredResults.length
      });

    } catch (error: any) {
      console.error("❌ Search medications failed:", error);
      res.status(500).json({
        success: false,
        message: error?.message || "Search failed. Please try again.",
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