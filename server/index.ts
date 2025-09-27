import express, { type Request, Response, NextFunction } from "express";
import { setupRoutes } from "./routes";
import { addExtractMedicationRoute } from "./routes-minimal";
import { setupVite, serveStatic, log } from "./vite";
import { automatedTrainingSystem } from "./mass-training-system";
import { enhancedAITrainer } from "./enhanced-ai-training";
import { fullComprehensiveDrugsDatabase } from "./comprehensive-drugs-database";
import { globalMedicationsDatabase } from "./global-medications-database";
import { medicationsDatabase } from "./medications-database";

// TEMPORARILY DISABLE auto-training to fix infinite loop bug
enhancedAITrainer.setLearningEnabled(false);

const app = express();
app.use(express.json({ limit: '50mb' })); // Increase limit for large images
app.use(express.urlencoded({ extended: false, limit: '50mb' }));

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }

      log(logLine);
    }
  });

  next();
});



(async () => {
  // Add health check endpoint for network detection
  app.get("/api/health", (req, res) => {
    res.json({
      status: "ok",
      timestamp: new Date().toISOString(),
      offline: false
    });
  });

  setupRoutes(app);
  addExtractMedicationRoute(app);

  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    res.status(status).json({ message });
    log(`Error ${status}: ${message} - ${err.stack || err}`);
  });

  // ALWAYS serve the app on the port specified in the environment variable PORT
  // Other ports are firewalled. Default to 5000 if not specified.
  // this serves both the API and the client.
  // It is the only port that is not firewalled.
  const port = parseInt(process.env.PORT || '5000', 10);

  // Graceful shutdown handling
  process.on('SIGTERM', () => {
    console.log('SIGTERM received, shutting down gracefully...');
    process.exit(0);
  });

  process.on('SIGINT', () => {
    console.log('SIGINT received, shutting down gracefully...');
    process.exit(0);
  });

  const server = app.listen(port, "0.0.0.0", () => {
    log(`✅ Server running at http://0.0.0.0:${port}`);
    log(`📊 Database contains ${fullComprehensiveDrugsDatabase.length + globalMedicationsDatabase.length + medicationsDatabase.length} medications`);
    log(`🔍 Search and OCR ready`);
    log(`🧠 Enhanced AI trainer active`);

    // Start background training on the medication database
    console.log(`🚀 Starting background AI training on medication database...`);

    // Combine all medication databases for training
    const allMedications = [
      ...fullComprehensiveDrugsDatabase,
      ...globalMedicationsDatabase,
      ...medicationsDatabase
    ];

    // Start background training (non-blocking)
    enhancedAITrainer.trainOnMedicationDatabase(allMedications, 100)
      .then(() => {
        console.log(`🎉 Background AI training completed!`);
        console.log(`📈 Training stats:`, enhancedAITrainer.getTrainingStats());
      })
      .catch(error => {
        console.error(`❌ Background training failed:`, error);
      });
  });

  server.on('error', (err: any) => {
    if (err.code === 'EADDRINUSE') {
      console.error(`Port ${port} is busy. Application must run on port 5000 for Replit environment.`);
      process.exit(1);
    } else {
      console.error('Server error:', err);
      process.exit(1);
    }
  });

  // importantly only setup vite in development and after
  // setting up all the other routes so the catch-all route
  // doesn't interfere with the other routes
  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }
})();