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

      // Try OpenAI Vision first
      try {
        const { extractMedicationFromImage } = await import('./openai-vision');
        const result = await extractMedicationFromImage(image);
        
        res.json({ 
          success: true, 
          ...result
        });
        return;
      } catch (openaiError: any) {
        console.log("OpenAI Vision failed, falling back to Tesseract.js:", openaiError.message);
        
        // Fallback to Tesseract.js OCR
        const { extractMedicationWithTesseract } = await import('./tesseract-fallback');
        const result = await extractMedicationWithTesseract(image);
        
        res.json({ 
          success: true, 
          ...result,
          fallbackUsed: true
        });
      }
    } catch (error: any) {
      console.error("All OCR methods failed:", error);
      res.status(500).json({ 
        success: false, 
        error: error.message || "OCR processing failed" 
      });
    }
  });
}