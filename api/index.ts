
import express, { type Request, Response, NextFunction } from "express";
import path from "path";
import { setupRoutes } from "../server/routes";
import { addExtractMedicationRoute } from "../server/routes-minimal";
import { AuthService } from "../server/auth";

const app = express();
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: false, limit: '50mb' }));

// CORS for Vercel
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Credentials', 'true');
  res.header('Access-Control-Allow-Origin', req.headers.origin || '*');
  res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,UPDATE,OPTIONS');
  res.header('Access-Control-Allow-Headers', 'X-Requested-With, X-HTTP-Method-Override, Content-Type, Accept, Authorization');
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  next();
});

// Serve static files from dist/public in production (Vercel)
if (process.env.VERCEL || process.env.NODE_ENV === 'production') {
  const publicPath = path.join(process.cwd(), 'dist', 'public');
  app.use(express.static(publicPath));
}

// Health check endpoint
app.get("/api/health", (req, res) => {
  res.json({
    status: "ok",
    timestamp: new Date().toISOString(),
    offline: false,
    platform: "vercel"
  });
});

// Add guest login route explicitly for Vercel - MUST be before setupRoutes
app.post("/api/auth/guest", async (req, res) => {
  console.log("[Vercel] Guest login endpoint called");
  try {
    const result = await AuthService.loginAsGuest();
    console.log("[Vercel] Guest login successful:", result.user.id);
    res.status(200).json({
      success: true,
      user: result.user,
      token: result.token,
      message: "Guest login successful"
    });
  } catch (error: any) {
    console.error("[Vercel] Guest login error:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Guest login failed",
      error: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

setupRoutes(app);
addExtractMedicationRoute(app);

app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
  const status = err.status || err.statusCode || 500;
  const message = err.message || "Internal Server Error";
  console.error(`[Vercel] Error ${status}:`, message);
  res.status(status).json({ 
    message,
    error: process.env.NODE_ENV === 'development' ? err.stack : undefined
  });
});

// Export for Vercel serverless
export default app;
