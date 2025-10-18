
import express, { type Request, Response, NextFunction } from "express";
import path from "path";
import { setupRoutes } from "../server/routes";
import { addExtractMedicationRoute } from "../server/routes-minimal";

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

// Add guest login route explicitly for Vercel
app.post("/api/auth/guest", async (req, res) => {
  try {
    const { AuthService } = await import("../server/auth");
    const result = await AuthService.loginAsGuest();
    res.json({
      success: true,
      user: result.user,
      token: result.token,
      message: "Guest login successful"
    });
  } catch (error: any) {
    console.error("Guest login error:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Guest login failed"
    });
  }
});

setupRoutes(app);
addExtractMedicationRoute(app);

app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
  const status = err.status || err.statusCode || 500;
  const message = err.message || "Internal Server Error";
  res.status(status).json({ message });
  console.error(`Error ${status}: ${message}`);
});

// Export for Vercel serverless
export default app;
