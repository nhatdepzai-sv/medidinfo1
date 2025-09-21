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

      // Use Enhanced AI Trainer with multiple OCR strategies
      const { enhancedAITrainer } = await import('./enhanced-ai-training');
      
      try {
        const enhancedResult = await enhancedAITrainer.performEnhancedOCR(image);
        
        if (enhancedResult.confidence > 50 && enhancedResult.medicationName) {
          // Train the AI with successful recognition
          enhancedAITrainer.addSuccessfulRecognition(
            image,
            enhancedResult.medicationName,
            enhancedResult.dosage || '',
            enhancedResult.confidence / 100
          );

          res.json({
            success: true,
            medicationName: enhancedResult.medicationName,
            dosage: enhancedResult.dosage,
            confidence: enhancedResult.confidence,
            detectedText: enhancedResult.detectedText,
            strategies: enhancedResult.strategies,
            aiMethod: 'enhanced-ai-trainer',
            trainingPoints: enhancedAITrainer.getTrainingDataCount()
          });
          return;
        }
      } catch (enhancedError: any) {
        console.log("Enhanced AI Trainer failed, using fallback strategy:", enhancedError.message);
      }

      // Fallback to basic Tesseract with enhanced processing
      const { extractMedicationWithTesseract } = await import('./tesseract-fallback');
      const fallbackResult = await extractMedicationWithTesseract(image);

      if (fallbackResult.medicationName) {
        // Train the AI even with fallback results
        enhancedAITrainer.addTrainingData(
          image,
          fallbackResult.medicationName,
          fallbackResult.dosage || '',
          fallbackResult.confidence / 100,
          'fallback'
        );
      }

      // Enhanced text preprocessing for medication names
      const cleanedText = fallbackResult.detectedText
        .replace(/[^\w\s.-]/g, ' ') // Keep only alphanumeric, spaces, dots, hyphens
        .replace(/\d+\s*(mg|g|ml|mcg|iu|units?|tablets?|capsules?|pills?)/gi, '') // Remove dosage info
        .replace(/\b(take|with|food|daily|twice|morning|evening|before|after|meals?)\b/gi, '') // Remove instruction words
        .replace(/\s+/g, ' ') // Replace multiple spaces with single space
        .trim();

      // Extract potential medication names using multiple strategies
      const words = cleanedText.split(' ').filter(word => word.length > 2);
      const phrases = cleanedText.split(/[,.]/).map(phrase => phrase.trim()).filter(phrase => phrase.length > 3);

      // Intelligent medication name patterns
      const medicationPatterns = [
        // Common prefixes and suffixes
        ...words.filter(word => /^(acet|amox|azith|ibu|aspir|melox|metro|cipro)/i.test(word)),
        ...words.filter(word => /(mycin|cillin|prazole|statin|dipine|fenac|nazole)$/i.test(word)),
        // Brand name patterns (capitalized words)
        ...words.filter(word => /^[A-Z][a-z]{3,}$/.test(word)),
        // Generic patterns (common pharmaceutical endings)
        ...words.filter(word => /(ine|ate|ide|ium|phen|zole|tide)$/i.test(word))
      ];

      const potentialMedicationNames = [
        cleanedText, // Full cleaned text
        ...medicationPatterns, // Pattern-matched names
        ...phrases.slice(0, 3), // Top phrases
        ...words.filter(word => word.length > 3).slice(0, 5) // Top individual words
      ];

      // Remove duplicates and sort by length (longer names often more specific)
      const uniqueNames = [...new Set(potentialMedicationNames)]
        .sort((a, b) => b.length - a.length)
        .slice(0, 8); // Limit for performance

      res.json({
        success: true,
        medications: uniqueNames,
        confidence: fallbackResult.confidence,
        detectedText: fallbackResult.detectedText,
        fallbackUsed: true,
        aiMethod: 'local-ai-trainer',
        trainingPoints: enhancedAITrainer.getTrainingDataCount()
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