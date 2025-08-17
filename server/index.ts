import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

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

// Enhanced search medications endpoint with better Vietnamese support
app.get('/api/search-medications', (req, res) => {
  const query = req.query.query as string;

  if (!query || query.length < 2) {
    return res.json({
      success: false,
      message: 'Query must be at least 2 characters long',
      medications: []
    });
  }

  const searchTerm = query.toLowerCase().trim();

  // Enhanced search with fuzzy matching and multiple criteria
  const results = fullComprehensiveDrugsDatabase.filter(drug => {
    // Direct matches
    const nameMatch = drug.name.toLowerCase().includes(searchTerm);
    const nameViMatch = drug.nameVi?.toLowerCase().includes(searchTerm);
    const genericMatch = drug.genericName?.toLowerCase().includes(searchTerm);
    const genericViMatch = drug.genericNameVi?.toLowerCase().includes(searchTerm);
    const categoryMatch = drug.category?.toLowerCase().includes(searchTerm);
    const categoryViMatch = drug.categoryVi?.toLowerCase().includes(searchTerm);

    // Partial word matches for better search results
    const nameWords = drug.name.toLowerCase().split(/[\s-]+/);
    const nameViWords = drug.nameVi?.toLowerCase().split(/[\s-]+/) || [];
    const genericWords = drug.genericName?.toLowerCase().split(/[\s-]+/) || [];
    const genericViWords = drug.genericNameVi?.toLowerCase().split(/[\s-]+/) || [];

    const wordMatch = [...nameWords, ...nameViWords, ...genericWords, ...genericViWords]
      .some(word => word.startsWith(searchTerm) || searchTerm.startsWith(word));

    // Brand name matching if available
    const brandMatch = (drug as any).brandNames?.some((brand: string) => 
      brand.toLowerCase().includes(searchTerm)
    ) || (drug as any).brandNamesVi?.some((brand: string) => 
      brand.toLowerCase().includes(searchTerm)
    );

    return nameMatch || nameViMatch || genericMatch || genericViMatch || 
           categoryMatch || categoryViMatch || wordMatch || brandMatch;
  })
  .sort((a, b) => {
    // Prioritize exact matches
    const aExact = a.name.toLowerCase() === searchTerm || a.nameVi?.toLowerCase() === searchTerm;
    const bExact = b.name.toLowerCase() === searchTerm || b.nameVi?.toLowerCase() === searchTerm;

    if (aExact && !bExact) return -1;
    if (bExact && !aExact) return 1;

    // Then prioritize starts with matches
    const aStartsWith = a.name.toLowerCase().startsWith(searchTerm) || a.nameVi?.toLowerCase().startsWith(searchTerm);
    const bStartsWith = b.name.toLowerCase().startsWith(searchTerm) || b.nameVi?.toLowerCase().startsWith(searchTerm);

    if (aStartsWith && !bStartsWith) return -1;
    if (bStartsWith && !aStartsWith) return 1;

    return 0;
  })
  .slice(0, 25); // Increased limit to 25 results

  res.json({
    success: results.length > 0,
    medications: results,
    message: results.length > 0 ? 
      `Found ${results.length} medication${results.length > 1 ? 's' : ''}` : 
      'No medications found for your search'
  });
});

(async () => {
  const server = await registerRoutes(app);

  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    res.status(status).json({ message });
    throw err;
  });

  // importantly only setup vite in development and after
  // setting up all the other routes so the catch-all route
  // doesn't interfere with the other routes
  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  // ALWAYS serve the app on the port specified in the environment variable PORT
  // Other ports are firewalled. Default to 5000 if not specified.
  // this serves both the API and the client.
  // It is the only port that is not firewalled.
  const port = parseInt(process.env.PORT || '5000', 10);
  server.listen({
    port,
    host: "0.0.0.0",
    reusePort: true,
  }, () => {
    log(`serving on port ${port}`);
  });
})();