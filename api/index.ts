
import express, { type Request, Response, NextFunction } from "express";
import { setupRoutes } from "../server/routes";
import { addExtractMedicationRoute } from "../server/routes-minimal";

const app = express();
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: false, limit: '50mb' }));

// Health check endpoint
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
});

// Export for Vercel serverless
export default app;
