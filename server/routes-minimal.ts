import type { Express } from "express";
import { storage } from "./storage";

export async function addExtractMedicationRoute(app: Express) {
  app.post("/api/extract-medication", async (req, res) => {
    try {
      const { image } = req.body;
      
      if (!image) {
        return res.status(400).json({ 
          success: false, 
          error: "No image provided" 
        });
      }

      const { extractMedicationFromImage } = await import('./openai-vision');
      const result = await extractMedicationFromImage(image);
      
      res.json({ 
        success: true, 
        ...result
      });
    } catch (error: any) {
      console.error("Vision API error:", error);
      res.status(500).json({ 
        success: false, 
        error: error.message || "Vision processing failed" 
      });
    }
  });
}