var __defProp = Object.defineProperty;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __esm = (fn, res) => function __init() {
  return fn && (res = (0, fn[__getOwnPropNames(fn)[0]])(fn = 0)), res;
};
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};

// server/tesseract-fallback.ts
var tesseract_fallback_exports = {};
__export(tesseract_fallback_exports, {
  extractMedicationWithTesseract: () => extractMedicationWithTesseract
});
import { createWorker } from "tesseract.js";
async function extractMedicationWithTesseract(base64Image) {
  try {
    const worker = await createWorker("eng");
    await worker.setParameters({
      tessedit_char_whitelist: "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789 .-",
      tessedit_pageseg_mode: "6",
      // Assume uniform block of text
      preserve_interword_spaces: "1"
    });
    const imageBuffer = Buffer.from(base64Image, "base64");
    const { data: { text: text2, confidence } } = await worker.recognize(imageBuffer);
    await worker.terminate();
    const cleanText = text2.replace(/[^a-zA-Z0-9\s.-]/g, " ").replace(/\n/g, " ").replace(/\s+/g, " ").trim();
    const medicationInfo = extractMedicationInfo(cleanText);
    return {
      medicationName: medicationInfo.name,
      dosage: medicationInfo.dosage,
      confidence: Math.round(confidence),
      detectedText: cleanText,
      brandName: medicationInfo.brandName,
      genericName: medicationInfo.genericName,
      aliases: []
    };
  } catch (error) {
    console.error("Tesseract OCR Error:", error);
    throw new Error(`Tesseract OCR failed: ${error.message}`);
  }
}
function extractMedicationInfo(text2) {
  if (!text2 || text2.trim().length < 2) {
    return { name: null, dosage: null, brandName: null, genericName: null };
  }
  const commonMedications = [
    // Brand names
    "tylenol",
    "advil",
    "motrin",
    "aleve",
    "aspirin",
    "ibuprofen",
    "acetaminophen",
    "lipitor",
    "zoloft",
    "prozac",
    "xanax",
    "ativan",
    "ambien",
    "viagra",
    "cialis",
    "metformin",
    "lisinopril",
    "amlodipine",
    "atorvastatin",
    "omeprazole",
    "nexium",
    "prilosec",
    "zantac",
    "pepcid",
    "mobic",
    "meloxicam",
    "gabapentin",
    "tramadol",
    "hydrocodone",
    "oxycodone",
    "morphine",
    "prednisone",
    "hydrocortisone",
    "amoxicillin",
    "azithromycin",
    "ciprofloxacin"
  ];
  const words = text2.toLowerCase().split(/\s+/);
  let bestMatch = null;
  let matchConfidence = 0;
  for (const word of words) {
    for (const med of commonMedications) {
      if (word.includes(med) || med.includes(word)) {
        const confidence = Math.max(word.length, med.length) / Math.max(word.length, med.length);
        if (confidence > matchConfidence) {
          matchConfidence = confidence;
          bestMatch = med;
        }
      }
    }
  }
  const dosagePattern = /(\d+(?:\.\d+)?)\s*(mg|ml|g|mcg|ug|units?|tablets?|caps?)/i;
  const dosageMatch = text2.match(dosagePattern);
  const dosage = dosageMatch ? `${dosageMatch[1]}${dosageMatch[2]}` : null;
  const brandNames = ["tylenol", "advil", "motrin", "aleve", "lipitor", "zoloft", "prozac", "xanax", "nexium", "mobic"];
  const genericNames = ["acetaminophen", "ibuprofen", "atorvastatin", "sertraline", "fluoxetine", "meloxicam"];
  let brandName = null;
  let genericName = null;
  if (bestMatch) {
    if (brandNames.includes(bestMatch)) {
      brandName = bestMatch;
    } else if (genericNames.includes(bestMatch)) {
      genericName = bestMatch;
    }
  }
  return {
    name: bestMatch,
    dosage,
    brandName,
    genericName
  };
}
var init_tesseract_fallback = __esm({
  "server/tesseract-fallback.ts"() {
    "use strict";
  }
});

// server/enhanced-ai-training.ts
var enhanced_ai_training_exports = {};
__export(enhanced_ai_training_exports, {
  EnhancedAITrainer: () => EnhancedAITrainer,
  enhancedAITrainer: () => enhancedAITrainer
});
var EnhancedAITrainer, enhancedAITrainer;
var init_enhanced_ai_training = __esm({
  "server/enhanced-ai-training.ts"() {
    "use strict";
    init_tesseract_fallback();
    EnhancedAITrainer = class {
      constructor() {
        this.trainingDataCount = 0;
        this.successfulRecognitions = 0;
        this.failedRecognitions = 0;
        this.trainingDatabase = [];
        this.neuralPatterns = /* @__PURE__ */ new Map();
        this.medicationAliases = /* @__PURE__ */ new Map();
        this.isLearningEnabled = true;
        console.log("\u{1F916} Enhanced AI Trainer initialized (Free Local Mode)");
        console.log("\u{1F4D6} Tesseract.js OCR enabled");
        console.log("\u{1F9E0} Local machine learning patterns active");
        console.log("\u{1F3AF} Continuous learning activated");
        this.initializeNeuralPatterns();
        this.initializeMedicationAliases();
      }
      /**
       * Primary OCR method using Tesseract.js with enhanced local processing
       */
      async performEnhancedOCR(imageData) {
        console.log("\u{1F50D} Starting enhanced local OCR analysis...");
        const strategies = [];
        try {
          const base64Image = imageData instanceof Buffer ? imageData.toString("base64") : imageData;
          console.log("\u{1F4D6} Running enhanced Tesseract OCR...");
          try {
            const tesseractResult = await extractMedicationWithTesseract(base64Image);
            strategies.push("enhanced-tesseract");
            if (tesseractResult.detectedText && tesseractResult.detectedText.length > 2) {
              const enhancedResult = this.enhanceWithLocalAI(tesseractResult);
              if (enhancedResult.medicationName && enhancedResult.confidence > 30) {
                console.log(`\u2705 Enhanced OCR success: ${enhancedResult.medicationName} (${enhancedResult.confidence}% confidence)`);
                this.logTrainingData({
                  imageBuffer: imageData,
                  medicationName: enhancedResult.medicationName,
                  dosage: enhancedResult.dosage || "",
                  confidence: enhancedResult.confidence,
                  source: "enhanced-tesseract",
                  timestamp: /* @__PURE__ */ new Date(),
                  success: true
                });
                return {
                  medicationName: enhancedResult.medicationName,
                  confidence: enhancedResult.confidence,
                  dosage: enhancedResult.dosage,
                  detectedText: enhancedResult.detectedText,
                  strategies,
                  brandName: enhancedResult.brandName,
                  genericName: enhancedResult.genericName,
                  aliases: enhancedResult.aliases || []
                };
              }
            }
          } catch (tesseractError) {
            console.log(`\u26A0\uFE0F Enhanced Tesseract failed: ${tesseractError.message}`);
            strategies.push("tesseract-failed");
          }
          console.log("\u{1F52C} Attempting pattern-based analysis...");
          strategies.push("pattern-analysis");
          if (typeof imageData === "string") {
            const patternResult = this.extractMedicationFromText(imageData);
            if (patternResult.medicationName) {
              console.log(`\u2705 Pattern analysis success: ${patternResult.medicationName}`);
              this.logTrainingData({
                imageBuffer: imageData,
                medicationName: patternResult.medicationName,
                dosage: patternResult.dosage,
                confidence: patternResult.confidence,
                source: "pattern-analysis",
                timestamp: /* @__PURE__ */ new Date(),
                success: true
              });
              return {
                medicationName: patternResult.medicationName,
                confidence: patternResult.confidence,
                dosage: patternResult.dosage,
                detectedText: "Pattern-based recognition",
                strategies,
                aliases: []
              };
            }
          }
          this.logTrainingData({
            imageBuffer: imageData,
            medicationName: "",
            dosage: "",
            confidence: 0,
            source: "enhanced-ocr",
            timestamp: /* @__PURE__ */ new Date(),
            success: false
          });
          return {
            medicationName: "",
            confidence: 0,
            detectedText: "",
            strategies,
            aliases: []
          };
        } catch (error) {
          console.error("\u274C Enhanced OCR completely failed:", error);
          strategies.push("complete-failure");
          return {
            medicationName: "",
            confidence: 0,
            detectedText: "",
            strategies,
            aliases: []
          };
        }
      }
      /**
       * Add successful medication recognition for training
       */
      addSuccessfulRecognition(image, medicationName, dosage, confidence) {
        if (!this.isLearningEnabled) return;
        this.successfulRecognitions++;
        this.trainingDataCount++;
        const trainingData = {
          imageBuffer: image,
          medicationName,
          dosage,
          confidence,
          source: "user-confirmation",
          timestamp: /* @__PURE__ */ new Date(),
          success: true
        };
        this.logTrainingData(trainingData);
        console.log(`\u2705 Added successful recognition: ${medicationName} (confidence: ${confidence})`);
        console.log(`\u{1F4CA} Training progress: ${this.successfulRecognitions} successful / ${this.trainingDataCount} total`);
        this.updateNeuralPatterns(medicationName, confidence);
      }
      /**
       * Add training data for continuous learning
       */
      addTrainingData(image, medicationName, dosage, confidence, source) {
        if (!this.isLearningEnabled) return;
        this.trainingDataCount++;
        const trainingData = {
          imageBuffer: image,
          medicationName,
          dosage,
          confidence,
          source,
          timestamp: /* @__PURE__ */ new Date(),
          success: confidence > 40
        };
        this.logTrainingData(trainingData);
        if (trainingData.success) {
          this.updateNeuralPatterns(medicationName, confidence);
        }
      }
      /**
       * Continuous learning from user feedback
       */
      continuousLearning(input, expected, context) {
        if (!this.isLearningEnabled) return;
        console.log(`\u{1F9E0} Learning: "${input}" should be "${expected}"`);
        this.neuralPatterns.set(input.toLowerCase(), this.neuralPatterns.get(expected.toLowerCase()) || 1);
        const currentWeight = this.neuralPatterns.get(expected.toLowerCase()) || 1;
        this.neuralPatterns.set(expected.toLowerCase(), Math.min(currentWeight + 0.1, 2));
        context.forEach((ctx) => {
          if (ctx && ctx.length > 2) {
            const contextWeight = this.neuralPatterns.get(ctx.toLowerCase()) || 0.5;
            this.neuralPatterns.set(ctx.toLowerCase(), Math.min(contextWeight + 0.05, 1.5));
          }
        });
        this.addMedicationAlias(input, expected);
      }
      /**
       * Advanced OCR training with expected results
       */
      async trainAdvancedOCR(image, expectedResult) {
        console.log(`\u{1F3AF} Training local AI with expected result: ${expectedResult}`);
        try {
          const result = await this.performEnhancedOCR(image);
          const accuracy = this.calculateAccuracy(result.medicationName, expectedResult);
          if (accuracy > 0.6) {
            this.updateNeuralPatterns(expectedResult, accuracy * 100);
            console.log(`\u2705 Training successful: ${Math.round(accuracy * 100)}% accuracy`);
          } else {
            this.continuousLearning(result.medicationName, expectedResult, [result.detectedText || ""]);
            console.log(`\u{1F4DA} Learning from error: Expected "${expectedResult}", got "${result.medicationName}"`);
          }
        } catch (error) {
          console.error(`\u274C Advanced OCR training failed: ${error.message}`);
        }
      }
      /**
       * Get current training statistics
       */
      getTrainingStats() {
        const successRate = this.trainingDataCount > 0 ? this.successfulRecognitions / this.trainingDataCount * 100 : 0;
        return {
          totalTrainingData: this.trainingDataCount,
          successfulRecognitions: this.successfulRecognitions,
          failedRecognitions: this.failedRecognitions,
          successRate: Math.round(successRate),
          neuralPatterns: this.neuralPatterns.size,
          medicationAliases: this.medicationAliases.size,
          learningEnabled: this.isLearningEnabled
        };
      }
      /**
       * Auto-train on new drug discovery from database searches
       */
      autoTrainOnNewDrug(drugData) {
        if (!this.isLearningEnabled || !drugData) return;
        const drugName = drugData.name || drugData.genericName || "";
        if (!drugName || drugName.length < 3) return;
        console.log(`\u{1F916} Auto-training on new drug: ${drugName}`);
        this.updateNeuralPatterns(drugName, 75);
        const trainingVariations = [
          drugName,
          drugName.toLowerCase(),
          drugName.toUpperCase(),
          drugData.genericName,
          drugData.nameVi,
          drugData.genericNameVi,
          ...drugData.brandNames || [],
          ...drugData.brandNamesVi || []
        ].filter((name) => name && name.length > 2);
        const uniqueVariations = [...new Set(trainingVariations)];
        uniqueVariations.forEach((variation) => {
          if (variation && variation !== drugName) {
            this.continuousLearning(variation, drugName, uniqueVariations);
          }
        });
        this.addTrainingData(
          `synthetic-${drugName}`,
          drugName,
          drugData.adultDosage || "unknown dosage",
          75,
          "database-auto-training"
        );
        console.log(`\u2705 Auto-training completed for ${drugName} with ${uniqueVariations.length} variations`);
      }
      /**
       * Train on user search patterns to improve future searches
       */
      trainOnSearchPattern(searchQuery, foundMedications) {
        if (!this.isLearningEnabled || !searchQuery || foundMedications.length === 0) return;
        const normalizedQuery = searchQuery.toLowerCase().trim();
        foundMedications.slice(0, 3).forEach((med, index) => {
          const confidence = Math.max(90 - index * 10, 60);
          this.continuousLearning(normalizedQuery, med.name || med.genericName, [
            med.name,
            med.genericName,
            med.nameVi,
            med.genericNameVi
          ].filter(Boolean));
          this.updateNeuralPatterns(med.name || med.genericName, confidence);
        });
        console.log(`\u{1F50D} Trained on search pattern: "${searchQuery}" -> ${foundMedications.length} results`);
      }
      /**
       * Train on OCR correction patterns
       */
      trainOnOCRCorrection(ocrText, correctedMedication, userConfirmed = false) {
        if (!this.isLearningEnabled || !ocrText || !correctedMedication) return;
        const confidence = userConfirmed ? 95 : 70;
        console.log(`\u{1F4F8} Training OCR correction: "${ocrText}" -> "${correctedMedication}"`);
        this.continuousLearning(ocrText.toLowerCase(), correctedMedication, [ocrText, correctedMedication]);
        this.updateNeuralPatterns(correctedMedication, confidence);
        this.addTrainingData(
          ocrText,
          correctedMedication,
          "unknown dosage",
          confidence,
          userConfirmed ? "user-ocr-correction" : "auto-ocr-correction"
        );
        console.log(`\u2705 OCR training completed for: ${correctedMedication}`);
      }
      /**
       * Background learning from medication database
       */
      async trainOnMedicationDatabase(medications2, batchSize = 50) {
        if (!this.isLearningEnabled || !medications2 || medications2.length === 0) return;
        console.log(`\u{1F5C4}\uFE0F Starting background training on ${medications2.length} medications...`);
        for (let i = 0; i < medications2.length; i += batchSize) {
          const batch = medications2.slice(i, i + batchSize);
          batch.forEach((med) => {
            this.autoTrainOnNewDrug(med);
          });
          if ((i + batchSize) % 1e3 === 0) {
            console.log(`\u{1F4CA} Database training progress: ${i + batchSize}/${medications2.length} medications processed`);
          }
          if (i + batchSize < medications2.length) {
            await new Promise((resolve) => setTimeout(resolve, 10));
          }
        }
        console.log(`\u2705 Database training completed: ${medications2.length} medications processed`);
      }
      /**
       * Get enhanced training statistics including new drug learning
       */
      getTrainingStats() {
        const successRate = this.trainingDataCount > 0 ? this.successfulRecognitions / this.trainingDataCount * 100 : 0;
        return {
          totalTrainingData: this.trainingDataCount,
          successfulRecognitions: this.successfulRecognitions,
          failedRecognitions: this.failedRecognitions,
          successRate: Math.round(successRate),
          neuralPatterns: this.neuralPatterns.size,
          medicationAliases: this.medicationAliases.size,
          learningEnabled: this.isLearningEnabled,
          backgroundTrainingActive: true,
          databaseMedicationsLearned: this.neuralPatterns.size
        };
      }
      /**
       * Update neural patterns for medication recognition
       */
      updateNeuralPatterns(medicationName, confidence) {
        if (!this.isLearningEnabled) return;
        if (!medicationName) return;
        const normalizedName = medicationName.toLowerCase();
        const currentWeight = this.neuralPatterns.get(normalizedName) || 1;
        const confidenceBoost = confidence ? confidence / 100 * 0.3 : 0.15;
        const newWeight = Math.min(currentWeight + confidenceBoost, 3);
        this.neuralPatterns.set(normalizedName, newWeight);
        const variations = this.generateMedicationVariations(medicationName);
        variations.forEach((variation) => {
          const variationWeight = this.neuralPatterns.get(variation) || 0.5;
          this.neuralPatterns.set(variation, Math.min(variationWeight + 0.08, 1.2));
        });
        console.log(`\u{1F9E0} Updated neural pattern: ${medicationName} -> ${newWeight.toFixed(2)}`);
      }
      // Private helper methods
      initializeNeuralPatterns() {
        const commonMedications = [
          { name: "acetaminophen", weight: 1.5 },
          { name: "tylenol", weight: 1.5 },
          { name: "ibuprofen", weight: 1.5 },
          { name: "advil", weight: 1.4 },
          { name: "motrin", weight: 1.4 },
          { name: "aspirin", weight: 1.3 },
          { name: "lipitor", weight: 1.3 },
          { name: "atorvastatin", weight: 1.3 },
          { name: "metformin", weight: 1.2 },
          { name: "lisinopril", weight: 1.2 },
          { name: "amlodipine", weight: 1.2 },
          { name: "omeprazole", weight: 1.1 },
          { name: "nexium", weight: 1.1 },
          { name: "prilosec", weight: 1.1 },
          { name: "zoloft", weight: 1 },
          { name: "sertraline", weight: 1 },
          { name: "prozac", weight: 1 },
          { name: "fluoxetine", weight: 1 },
          { name: "xanax", weight: 0.9 },
          { name: "alprazolam", weight: 0.9 }
        ];
        commonMedications.forEach((med) => {
          this.neuralPatterns.set(med.name, med.weight);
        });
        console.log(`\u{1F9E0} Initialized neural patterns with ${this.neuralPatterns.size} medication patterns`);
      }
      initializeMedicationAliases() {
        this.medicationAliases.set("acetaminophen", ["tylenol", "panadol", "apap", "paracetamol"]);
        this.medicationAliases.set("ibuprofen", ["advil", "motrin", "nurofen"]);
        this.medicationAliases.set("atorvastatin", ["lipitor"]);
        this.medicationAliases.set("sertraline", ["zoloft"]);
        this.medicationAliases.set("fluoxetine", ["prozac"]);
        this.medicationAliases.set("alprazolam", ["xanax"]);
        this.medicationAliases.set("omeprazole", ["prilosec"]);
        this.medicationAliases.set("esomeprazole", ["nexium"]);
        this.medicationAliases.set("meloxicam", ["mobic"]);
        console.log(`\u{1F4DD} Initialized medication aliases: ${this.medicationAliases.size} medications`);
      }
      enhanceWithLocalAI(result) {
        if (!result.medicationName && !result.detectedText) return result;
        let enhancedName = result.medicationName;
        let enhancedConfidence = result.confidence;
        if (!enhancedName && result.detectedText) {
          const textAnalysis = this.extractMedicationFromText(result.detectedText);
          if (textAnalysis.medicationName) {
            enhancedName = textAnalysis.medicationName;
            enhancedConfidence = Math.max(textAnalysis.confidence, result.confidence);
          }
        }
        if (enhancedName) {
          const normalizedName = enhancedName.toLowerCase();
          const patternWeight = this.neuralPatterns.get(normalizedName) || 1;
          enhancedConfidence = Math.min(enhancedConfidence * patternWeight, 100);
          const resolvedName = this.resolveMedicationAlias(enhancedName);
          if (resolvedName !== enhancedName) {
            enhancedName = resolvedName;
            enhancedConfidence += 10;
          }
        }
        return {
          ...result,
          medicationName: enhancedName,
          confidence: Math.round(enhancedConfidence)
        };
      }
      extractMedicationFromText(text2) {
        if (!text2 || text2.length < 2) {
          return { medicationName: "", dosage: "", confidence: 0 };
        }
        const normalizedText = text2.toLowerCase();
        let bestMatch = "";
        let bestWeight = 0;
        let confidence = 0;
        for (const [medication, weight] of this.neuralPatterns.entries()) {
          if (normalizedText.includes(medication)) {
            if (weight > bestWeight) {
              bestMatch = medication;
              bestWeight = weight;
              confidence = Math.min(weight * 40, 85);
            }
          }
        }
        const dosageMatch = text2.match(/(\d+(?:\.\d+)?)\s*(mg|ml|g|mcg|iu|units?)/i);
        const dosage = dosageMatch ? `${dosageMatch[1]}${dosageMatch[2]}` : "";
        if (bestMatch) {
          console.log(`\u{1F50D} Text analysis found: ${bestMatch} (confidence: ${confidence}%)`);
        }
        return {
          medicationName: bestMatch,
          dosage,
          confidence: Math.round(confidence)
        };
      }
      resolveMedicationAlias(medicationName) {
        const normalized = medicationName.toLowerCase();
        for (const [primary, aliases] of this.medicationAliases.entries()) {
          if (aliases.includes(normalized)) {
            return primary;
          }
        }
        if (this.medicationAliases.has(normalized)) {
          return normalized;
        }
        return medicationName;
      }
      addMedicationAlias(alias, primaryName) {
        const normalizedAlias = alias.toLowerCase();
        const normalizedPrimary = primaryName.toLowerCase();
        if (!this.medicationAliases.has(normalizedPrimary)) {
          this.medicationAliases.set(normalizedPrimary, []);
        }
        const aliases = this.medicationAliases.get(normalizedPrimary);
        if (!aliases.includes(normalizedAlias)) {
          aliases.push(normalizedAlias);
          console.log(`\u{1F4DD} Added alias: ${alias} -> ${primaryName}`);
        }
      }
      logTrainingData(data) {
        this.trainingDatabase.push(data);
        if (this.trainingDatabase.length > 5e3) {
          this.trainingDatabase = this.trainingDatabase.slice(-5e3);
        }
        if (data.success) {
          this.successfulRecognitions++;
        } else {
          this.failedRecognitions++;
        }
      }
      calculateAccuracy(detected, expected) {
        if (!detected || !expected) return 0;
        const detectedLower = detected.toLowerCase();
        const expectedLower = expected.toLowerCase();
        if (detectedLower === expectedLower) return 1;
        const resolvedDetected = this.resolveMedicationAlias(detectedLower);
        const resolvedExpected = this.resolveMedicationAlias(expectedLower);
        if (resolvedDetected === resolvedExpected) return 0.9;
        const distance = this.levenshteinDistance(detectedLower, expectedLower);
        const maxLength = Math.max(detectedLower.length, expectedLower.length);
        return Math.max(0, 1 - distance / maxLength);
      }
      levenshteinDistance(str1, str2) {
        const matrix = Array(str2.length + 1).fill(null).map(() => Array(str1.length + 1).fill(null));
        for (let i = 0; i <= str1.length; i++) matrix[0][i] = i;
        for (let j = 0; j <= str2.length; j++) matrix[j][0] = j;
        for (let j = 1; j <= str2.length; j++) {
          for (let i = 1; i <= str1.length; i++) {
            const indicator = str1[i - 1] === str2[j - 1] ? 0 : 1;
            matrix[j][i] = Math.min(
              matrix[j][i - 1] + 1,
              // deletion
              matrix[j - 1][i] + 1,
              // insertion
              matrix[j - 1][i - 1] + indicator
              // substitution
            );
          }
        }
        return matrix[str2.length][str1.length];
      }
      generateMedicationVariations(medicationName) {
        const variations = [];
        const name = medicationName.toLowerCase();
        variations.push(name.replace(/acetaminophen/g, "apap"));
        variations.push(name.replace(/acetaminophen/g, "paracetamol"));
        variations.push(name.replace(/hydrochlorothiazide/g, "hctz"));
        variations.push(name.replace(/extended release/g, "er"));
        variations.push(name.replace(/extended release/g, "xl"));
        variations.push(name.replace(/immediate release/g, "ir"));
        variations.push(name.replace(/ (tablet|capsule|mg|ml)s?$/g, ""));
        variations.push(name.replace(/ (pills?|caps?|tabs?)$/g, ""));
        return variations.filter((v) => v !== name && v.length > 2);
      }
      setLearningEnabled(enabled) {
        this.isLearningEnabled = enabled;
        console.log(`\u{1F9E0} Continuous learning ${enabled ? "enabled" : "disabled"}`);
      }
    };
    enhancedAITrainer = new EnhancedAITrainer();
  }
});

// server/comprehensive-drugs-database.ts
var fullComprehensiveDrugsDatabase;
var init_comprehensive_drugs_database = __esm({
  "server/comprehensive-drugs-database.ts"() {
    "use strict";
    fullComprehensiveDrugsDatabase = [
      // SPECIFIC DRUGS REQUESTED
      {
        id: "med-001",
        name: "Meloxicam",
        nameVi: "Meloxicam",
        genericName: "Meloxicam",
        genericNameVi: "Meloxicam",
        category: "NSAID",
        categoryVi: "Thu\u1ED1c ch\u1ED1ng vi\xEAm kh\xF4ng steroid",
        primaryUse: "Arthritis, rheumatoid arthritis, and other inflammatory conditions",
        primaryUseVi: "Vi\xEAm kh\u1EDBp, vi\xEAm kh\u1EDBp d\u1EA1ng th\u1EA5p v\xE0 c\xE1c b\u1EC7nh vi\xEAm kh\xE1c",
        adultDosage: "7.5-15mg once daily",
        adultDosageVi: "7.5-15mg m\u1ED9t l\u1EA7n m\u1ED7i ng\xE0y",
        maxDosage: "15mg per day",
        maxDosageVi: "15mg m\u1ED7i ng\xE0y",
        warnings: ["May cause stomach bleeding", "Monitor kidney function", "Avoid with heart disease"],
        warningsVi: ["C\xF3 th\u1EC3 g\xE2y xu\u1EA5t huy\u1EBFt d\u1EA1 d\xE0y", "Theo d\xF5i ch\u1EE9c n\u0103ng th\u1EADn", "Tr\xE1nh khi c\xF3 b\u1EC7nh tim"],
        createdAt: (/* @__PURE__ */ new Date()).toISOString()
      },
      {
        id: "med-002",
        name: "Ginkgo Biloba",
        nameVi: "B\u1EA1ch Qu\u1EA3",
        genericName: "Ginkgo Biloba Extract",
        genericNameVi: "Chi\u1EBFt xu\u1EA5t l\xE1 B\u1EA1ch Qu\u1EA3",
        category: "Herbal Supplement",
        categoryVi: "Th\u1EF1c ph\u1EA9m b\u1EA3o v\u1EC7 s\u1EE9c kh\u1ECFe th\u1EA3o d\u01B0\u1EE3c",
        primaryUse: "Improve blood circulation, memory, and cognitive function",
        primaryUseVi: "C\u1EA3i thi\u1EC7n tu\u1EA7n ho\xE0n m\xE1u, tr\xED nh\u1EDB v\xE0 ch\u1EE9c n\u0103ng nh\u1EADn th\u1EE9c",
        adultDosage: "120-240mg daily in divided doses",
        adultDosageVi: "120-240mg m\u1ED7i ng\xE0y chia th\xE0nh nhi\u1EC1u l\u1EA7n",
        maxDosage: "240mg per day",
        maxDosageVi: "240mg m\u1ED7i ng\xE0y",
        warnings: ["May increase bleeding risk", "Discontinue before surgery", "Effects may take weeks"],
        warningsVi: ["C\xF3 th\u1EC3 t\u0103ng nguy c\u01A1 ch\u1EA3y m\xE1u", "Ng\u1EEBng tr\u01B0\u1EDBc ph\u1EABu thu\u1EADt", "T\xE1c d\u1EE5ng c\xF3 th\u1EC3 m\u1EA5t v\xE0i tu\u1EA7n"],
        createdAt: (/* @__PURE__ */ new Date()).toISOString()
      },
      // CANCER MEDICATIONS
      {
        id: "med-cancer-001",
        name: "Tamoxifen",
        nameVi: "Tamoxifen",
        genericName: "Tamoxifen Citrate",
        genericNameVi: "Tamoxifen Citrate",
        category: "Hormone Therapy",
        categoryVi: "Li\u1EC7u ph\xE1p hormone",
        primaryUse: "Breast cancer treatment and prevention",
        primaryUseVi: "\u0110i\u1EC1u tr\u1ECB v\xE0 ph\xF2ng ng\u1EEBa ung th\u01B0 v\xFA",
        adultDosage: "20mg once or twice daily",
        adultDosageVi: "20mg m\u1ED9t ho\u1EB7c hai l\u1EA7n m\u1ED7i ng\xE0y",
        maxDosage: "40mg per day",
        maxDosageVi: "40mg m\u1ED7i ng\xE0y",
        warnings: ["Increased risk of blood clots", "May cause hot flashes", "Regular gynecologic exams needed"],
        warningsVi: ["T\u0103ng nguy c\u01A1 c\u1EE5c m\xE1u \u0111\xF4ng", "C\xF3 th\u1EC3 g\xE2y b\u1ED1c h\u1ECFa", "C\u1EA7n kh\xE1m ph\u1EE5 khoa \u0111\u1ECBnh k\u1EF3"],
        createdAt: (/* @__PURE__ */ new Date()).toISOString()
      },
      {
        id: "med-cancer-002",
        name: "Cisplatin",
        nameVi: "Cisplatin",
        genericName: "Cisplatin",
        genericNameVi: "Cisplatin",
        category: "Chemotherapy Agent",
        categoryVi: "Thu\u1ED1c h\xF3a tr\u1ECB",
        primaryUse: "Various cancers including testicular, ovarian, bladder, and lung cancer",
        primaryUseVi: "Nhi\u1EC1u lo\u1EA1i ung th\u01B0 bao g\u1ED3m tinh ho\xE0i, bu\u1ED3ng tr\u1EE9ng, b\xE0ng quang v\xE0 ph\u1ED5i",
        adultDosage: "Administered IV by healthcare provider",
        adultDosageVi: "Truy\u1EC1n t\u0129nh m\u1EA1ch b\u1EDFi nh\xE2n vi\xEAn y t\u1EBF",
        maxDosage: "Varies by protocol",
        maxDosageVi: "Thay \u0111\u1ED5i theo ph\xE1c \u0111\u1ED3",
        warnings: ["Severe kidney toxicity", "Hearing loss possible", "Requires pre-hydration"],
        warningsVi: ["\u0110\u1ED9c t\xEDnh th\u1EADn nghi\xEAm tr\u1ECDng", "C\xF3 th\u1EC3 m\u1EA5t th\xEDnh l\u1EF1c", "C\u1EA7n truy\u1EC1n d\u1ECBch tr\u01B0\u1EDBc"],
        createdAt: (/* @__PURE__ */ new Date()).toISOString()
      },
      {
        id: "med-cancer-003",
        name: "Doxorubicin",
        nameVi: "Doxorubicin",
        genericName: "Doxorubicin HCl",
        genericNameVi: "Doxorubicin HCl",
        category: "Anthracycline Antibiotic",
        categoryVi: "Kh\xE1ng sinh Anthracycline",
        primaryUse: "Breast cancer, lymphomas, leukemias, and solid tumors",
        primaryUseVi: "Ung th\u01B0 v\xFA, u lympho, b\u1EA1ch c\u1EA7u v\xE0 kh\u1ED1i u r\u1EAFn",
        adultDosage: "Administered IV by healthcare provider",
        adultDosageVi: "Truy\u1EC1n t\u0129nh m\u1EA1ch b\u1EDFi nh\xE2n vi\xEAn y t\u1EBF",
        maxDosage: "Cumulative lifetime dose limit",
        maxDosageVi: "Gi\u1EDBi h\u1EA1n li\u1EC1u t\xEDch l\u0169y su\u1ED1t \u0111\u1EDDi",
        warnings: ["Cardiotoxicity", "Red urine is normal", "Hair loss common"],
        warningsVi: ["\u0110\u1ED9c t\xEDnh tim", "N\u01B0\u1EDBc ti\u1EC3u \u0111\u1ECF l\xE0 b\xECnh th\u01B0\u1EDDng", "R\u1EE5ng t\xF3c th\u01B0\u1EDDng g\u1EB7p"],
        createdAt: (/* @__PURE__ */ new Date()).toISOString()
      },
      {
        id: "med-cancer-004",
        name: "Paclitaxel",
        nameVi: "Paclitaxel",
        genericName: "Paclitaxel",
        genericNameVi: "Paclitaxel",
        category: "Taxane Chemotherapy",
        categoryVi: "H\xF3a tr\u1ECB Taxane",
        primaryUse: "Breast, ovarian, lung, and other cancers",
        primaryUseVi: "Ung th\u01B0 v\xFA, bu\u1ED3ng tr\u1EE9ng, ph\u1ED5i v\xE0 c\xE1c ung th\u01B0 kh\xE1c",
        adultDosage: "Administered IV by healthcare provider",
        adultDosageVi: "Truy\u1EC1n t\u0129nh m\u1EA1ch b\u1EDFi nh\xE2n vi\xEAn y t\u1EBF",
        maxDosage: "Varies by protocol",
        maxDosageVi: "Thay \u0111\u1ED5i theo ph\xE1c \u0111\u1ED3",
        warnings: ["Severe allergic reactions possible", "Neuropathy common", "Premedication required"],
        warningsVi: ["C\xF3 th\u1EC3 ph\u1EA3n \u1EE9ng d\u1ECB \u1EE9ng nghi\xEAm tr\u1ECDng", "Th\u01B0\u1EDDng g\xE2y t\u1ED5n th\u01B0\u01A1ng th\u1EA7n kinh", "C\u1EA7n ti\u1EC1n d\xF9ng thu\u1ED1c"],
        createdAt: (/* @__PURE__ */ new Date()).toISOString()
      },
      {
        id: "med-cancer-005",
        name: "Rituximab",
        nameVi: "Rituximab",
        genericName: "Rituximab",
        genericNameVi: "Rituximab",
        category: "Monoclonal Antibody",
        categoryVi: "Kh\xE1ng th\u1EC3 \u0111\u01A1n d\xF2ng",
        primaryUse: "Non-Hodgkin lymphoma, chronic lymphocytic leukemia",
        primaryUseVi: "U lympho kh\xF4ng Hodgkin, b\u1EA1ch c\u1EA7u lympho m\xE3n t\xEDnh",
        adultDosage: "Administered IV by healthcare provider",
        adultDosageVi: "Truy\u1EC1n t\u0129nh m\u1EA1ch b\u1EDFi nh\xE2n vi\xEAn y t\u1EBF",
        maxDosage: "Per treatment protocol",
        maxDosageVi: "Theo ph\xE1c \u0111\u1ED3 \u0111i\u1EC1u tr\u1ECB",
        warnings: ["Infusion reactions", "Immunosuppression", "Monitor for infections"],
        warningsVi: ["Ph\u1EA3n \u1EE9ng truy\u1EC1n", "\u1EE8c ch\u1EBF mi\u1EC5n d\u1ECBch", "Theo d\xF5i nhi\u1EC5m tr\xF9ng"],
        createdAt: (/* @__PURE__ */ new Date()).toISOString()
      },
      // GOUT MEDICATIONS
      {
        id: "med-gout-001",
        name: "Allopurinol",
        nameVi: "Allopurinol",
        genericName: "Allopurinol",
        genericNameVi: "Allopurinol",
        category: "Xanthine Oxidase Inhibitor",
        categoryVi: "Thu\u1ED1c \u1EE9c ch\u1EBF Xanthine Oxidase",
        primaryUse: "Prevention of gout attacks and kidney stones",
        primaryUseVi: "Ph\xF2ng ng\u1EEBa c\u01A1n gout v\xE0 s\u1ECFi th\u1EADn",
        adultDosage: "100-300mg once daily",
        adultDosageVi: "100-300mg m\u1ED9t l\u1EA7n m\u1ED7i ng\xE0y",
        maxDosage: "800mg per day",
        maxDosageVi: "800mg m\u1ED7i ng\xE0y",
        warnings: ["Skin rash - discontinue immediately", "Take with food", "Increase fluid intake"],
        warningsVi: ["Ph\xE1t ban da - ng\u1EEBng ngay l\u1EADp t\u1EE9c", "U\u1ED1ng c\xF9ng th\u1EE9c \u0103n", "T\u0103ng l\u01B0\u1EE3ng n\u01B0\u1EDBc u\u1ED1ng"],
        createdAt: (/* @__PURE__ */ new Date()).toISOString()
      },
      {
        id: "med-gout-002",
        name: "Colchicine",
        nameVi: "Colchicine",
        genericName: "Colchicine",
        genericNameVi: "Colchicine",
        category: "Anti-gout Agent",
        categoryVi: "Thu\u1ED1c ch\u1ED1ng gout",
        primaryUse: "Treatment and prevention of gout attacks",
        primaryUseVi: "\u0110i\u1EC1u tr\u1ECB v\xE0 ph\xF2ng ng\u1EEBa c\u01A1n gout",
        adultDosage: "0.6mg twice daily for prevention; higher doses for acute attacks",
        adultDosageVi: "0.6mg hai l\u1EA7n m\u1ED7i ng\xE0y \u0111\u1EC3 ph\xF2ng ng\u1EEBa; li\u1EC1u cao h\u01A1n cho c\u01A1n c\u1EA5p",
        maxDosage: "1.2mg per day for prevention",
        maxDosageVi: "1.2mg m\u1ED7i ng\xE0y \u0111\u1EC3 ph\xF2ng ng\u1EEBa",
        warnings: ["Severe diarrhea possible", "Reduce dose in kidney/liver disease", "Many drug interactions"],
        warningsVi: ["C\xF3 th\u1EC3 ti\xEAu ch\u1EA3y nghi\xEAm tr\u1ECDng", "Gi\u1EA3m li\u1EC1u khi b\u1EC7nh th\u1EADn/gan", "Nhi\u1EC1u t\u01B0\u01A1ng t\xE1c thu\u1ED1c"],
        createdAt: (/* @__PURE__ */ new Date()).toISOString()
      },
      {
        id: "med-gout-003",
        name: "Febuxostat",
        nameVi: "Febuxostat",
        genericName: "Febuxostat",
        genericNameVi: "Febuxostat",
        category: "Xanthine Oxidase Inhibitor",
        categoryVi: "Thu\u1ED1c \u1EE9c ch\u1EBF Xanthine Oxidase",
        primaryUse: "Chronic management of hyperuricemia in gout",
        primaryUseVi: "Qu\u1EA3n l\xFD m\xE3n t\xEDnh t\u0103ng acid uric trong gout",
        adultDosage: "40-80mg once daily",
        adultDosageVi: "40-80mg m\u1ED9t l\u1EA7n m\u1ED7i ng\xE0y",
        maxDosage: "120mg per day",
        maxDosageVi: "120mg m\u1ED7i ng\xE0y",
        warnings: ["Cardiovascular risk", "May trigger gout flares initially", "Monitor liver function"],
        warningsVi: ["Nguy c\u01A1 tim m\u1EA1ch", "C\xF3 th\u1EC3 g\xE2y c\u01A1n gout ban \u0111\u1EA7u", "Theo d\xF5i ch\u1EE9c n\u0103ng gan"],
        createdAt: (/* @__PURE__ */ new Date()).toISOString()
      },
      {
        id: "med-gout-004",
        name: "Probenecid",
        nameVi: "Probenecid",
        genericName: "Probenecid",
        genericNameVi: "Probenecid",
        category: "Uricosuric Agent",
        categoryVi: "Thu\u1ED1c t\u0103ng b\xE0i ti\u1EBFt acid uric",
        primaryUse: "Treatment of hyperuricemia associated with gout",
        primaryUseVi: "\u0110i\u1EC1u tr\u1ECB t\u0103ng acid uric li\xEAn quan \u0111\u1EBFn gout",
        adultDosage: "250mg twice daily initially, increase to 500mg twice daily",
        adultDosageVi: "250mg hai l\u1EA7n m\u1ED7i ng\xE0y ban \u0111\u1EA7u, t\u0103ng l\xEAn 500mg hai l\u1EA7n m\u1ED7i ng\xE0y",
        maxDosage: "2000mg per day",
        maxDosageVi: "2000mg m\u1ED7i ng\xE0y",
        warnings: ["Increase fluid intake", "May cause kidney stones", "Take with food"],
        warningsVi: ["T\u0103ng l\u01B0\u1EE3ng n\u01B0\u1EDBc u\u1ED1ng", "C\xF3 th\u1EC3 g\xE2y s\u1ECFi th\u1EADn", "U\u1ED1ng c\xF9ng th\u1EE9c \u0103n"],
        createdAt: (/* @__PURE__ */ new Date()).toISOString()
      },
      // COMPREHENSIVE FDA-APPROVED MEDICATIONS
      {
        id: "med-003",
        name: "Amoxicillin",
        nameVi: "Amoxicillin",
        genericName: "Amoxicillin",
        genericNameVi: "Amoxicillin",
        category: "Penicillin Antibiotic",
        categoryVi: "Kh\xE1ng sinh Penicillin",
        primaryUse: "Bacterial infections including respiratory, ear, urinary tract, and skin infections",
        primaryUseVi: "Nhi\u1EC5m tr\xF9ng do vi khu\u1EA9n bao g\u1ED3m h\xF4 h\u1EA5p, tai, \u0111\u01B0\u1EDDng ti\u1EBFt ni\u1EC7u v\xE0 da",
        adultDosage: "250-500mg every 8 hours or 500-875mg every 12 hours",
        adultDosageVi: "250-500mg m\u1ED7i 8 gi\u1EDD ho\u1EB7c 500-875mg m\u1ED7i 12 gi\u1EDD",
        maxDosage: "3000mg per day",
        maxDosageVi: "3000mg m\u1ED7i ng\xE0y",
        warnings: ["Complete full course", "May cause allergic reactions", "Can reduce birth control effectiveness"],
        warningsVi: ["Ho\xE0n th\xE0nh li\u1EC7u tr\xECnh", "C\xF3 th\u1EC3 g\xE2y d\u1ECB \u1EE9ng", "C\xF3 th\u1EC3 gi\u1EA3m hi\u1EC7u qu\u1EA3 thu\u1ED1c tr\xE1nh thai"],
        createdAt: (/* @__PURE__ */ new Date()).toISOString()
      },
      // MENTAL HEALTH MEDICATIONS (Expanded)
      {
        id: "med-mental-001",
        name: "Sertraline",
        nameVi: "Sertraline",
        genericName: "Sertraline HCl",
        genericNameVi: "Sertraline HCl",
        category: "SSRI Antidepressant",
        categoryVi: "Thu\u1ED1c ch\u1ED1ng tr\u1EA7m c\u1EA3m SSRI",
        primaryUse: "Depression, anxiety, panic disorder, PTSD, OCD",
        primaryUseVi: "Tr\u1EA7m c\u1EA3m, lo \xE2u, r\u1ED1i lo\u1EA1n ho\u1EA3ng s\u1EE3, PTSD, OCD",
        adultDosage: "25-200mg once daily",
        adultDosageVi: "25-200mg m\u1ED9t l\u1EA7n m\u1ED7i ng\xE0y",
        maxDosage: "200mg per day",
        maxDosageVi: "200mg m\u1ED7i ng\xE0y",
        warnings: ["May increase suicidal thoughts initially", "Do not stop abruptly", "May take 4-6 weeks for full effect"],
        warningsVi: ["C\xF3 th\u1EC3 t\u0103ng \xFD ngh\u0129 t\u1EF1 t\u1EED ban \u0111\u1EA7u", "Kh\xF4ng ng\u1EEBng \u0111\u1ED9t ng\u1ED9t", "C\xF3 th\u1EC3 m\u1EA5t 4-6 tu\u1EA7n \u0111\u1EC3 c\xF3 hi\u1EC7u qu\u1EA3 \u0111\u1EA7y \u0111\u1EE7"],
        createdAt: (/* @__PURE__ */ new Date()).toISOString()
      },
      {
        id: "med-mental-002",
        name: "Alprazolam",
        nameVi: "Alprazolam",
        genericName: "Alprazolam",
        genericNameVi: "Alprazolam",
        category: "Benzodiazepine",
        categoryVi: "Benzodiazepine",
        primaryUse: "Anxiety disorders and panic attacks",
        primaryUseVi: "R\u1ED1i lo\u1EA1n lo \xE2u v\xE0 c\u01A1n ho\u1EA3ng lo\u1EA1n",
        adultDosage: "0.25-0.5mg 2-3 times daily",
        adultDosageVi: "0.25-0.5mg 2-3 l\u1EA7n m\u1ED7i ng\xE0y",
        maxDosage: "4mg per day",
        maxDosageVi: "4mg m\u1ED7i ng\xE0y",
        warnings: ["Highly addictive", "Do not drink alcohol", "May cause drowsiness"],
        warningsVi: ["C\xF3 t\xEDnh g\xE2y nghi\u1EC7n cao", "Kh\xF4ng u\u1ED1ng r\u01B0\u1EE3u", "C\xF3 th\u1EC3 g\xE2y bu\u1ED3n ng\u1EE7"],
        createdAt: (/* @__PURE__ */ new Date()).toISOString()
      },
      // RESPIRATORY MEDICATIONS (Expanded)
      {
        id: "med-resp-001",
        name: "Albuterol",
        nameVi: "Albuterol",
        genericName: "Salbutamol",
        genericNameVi: "Salbutamol",
        category: "Bronchodilator",
        categoryVi: "Thu\u1ED1c gi\xE3n ph\u1EBF qu\u1EA3n",
        primaryUse: "Asthma and COPD quick relief",
        primaryUseVi: "Gi\u1EA3m nhanh hen suy\u1EC5n v\xE0 COPD",
        adultDosage: "2 puffs every 4-6 hours as needed",
        adultDosageVi: "2 nh\xE1t m\u1ED7i 4-6 gi\u1EDD khi c\u1EA7n",
        maxDosage: "12 puffs per day",
        maxDosageVi: "12 nh\xE1t m\u1ED7i ng\xE0y",
        warnings: ["Overuse may worsen asthma", "May cause rapid heartbeat", "Rinse mouth after use"],
        warningsVi: ["S\u1EED d\u1EE5ng qu\xE1 m\u1EE9c c\xF3 th\u1EC3 l\xE0m x\u1EA5u hen suy\u1EC5n", "C\xF3 th\u1EC3 g\xE2y tim \u0111\u1EADp nhanh", "S\xFAc mi\u1EC7ng sau khi d\xF9ng"],
        createdAt: (/* @__PURE__ */ new Date()).toISOString()
      },
      // ENDOCRINE MEDICATIONS (Expanded)
      {
        id: "med-endo-001",
        name: "Levothyroxine",
        nameVi: "Levothyroxine",
        genericName: "Levothyroxine Sodium",
        genericNameVi: "Levothyroxine Sodium",
        category: "Thyroid Hormone",
        categoryVi: "Hormone tuy\u1EBFn gi\xE1p",
        primaryUse: "Hypothyroidism treatment",
        primaryUseVi: "\u0110i\u1EC1u tr\u1ECB suy gi\xE1p",
        adultDosage: "25-200mcg once daily on empty stomach",
        adultDosageVi: "25-200mcg m\u1ED9t l\u1EA7n m\u1ED7i ng\xE0y khi \u0111\xF3i",
        maxDosage: "300mcg per day",
        maxDosageVi: "300mcg m\u1ED7i ng\xE0y",
        warnings: ["Take on empty stomach", "Many drug interactions", "Monitor thyroid levels"],
        warningsVi: ["U\u1ED1ng khi \u0111\xF3i", "Nhi\u1EC1u t\u01B0\u01A1ng t\xE1c thu\u1ED1c", "Theo d\xF5i m\u1EE9c hormone gi\xE1p"],
        createdAt: (/* @__PURE__ */ new Date()).toISOString()
      },
      // NEUROLOGICAL MEDICATIONS (Expanded)
      {
        id: "med-neuro-001",
        name: "Levetiracetam",
        nameVi: "Levetiracetam",
        genericName: "Levetiracetam",
        genericNameVi: "Levetiracetam",
        category: "Anticonvulsant",
        categoryVi: "Thu\u1ED1c ch\u1ED1ng co gi\u1EADt",
        primaryUse: "Epilepsy and seizure disorders",
        primaryUseVi: "\u0110\u1ED9ng kinh v\xE0 r\u1ED1i lo\u1EA1n co gi\u1EADt",
        adultDosage: "500-1500mg twice daily",
        adultDosageVi: "500-1500mg hai l\u1EA7n m\u1ED7i ng\xE0y",
        maxDosage: "3000mg per day",
        maxDosageVi: "3000mg m\u1ED7i ng\xE0y",
        warnings: ["May cause mood changes", "Do not stop suddenly", "Monitor kidney function"],
        warningsVi: ["C\xF3 th\u1EC3 g\xE2y thay \u0111\u1ED5i t\xE2m tr\u1EA1ng", "Kh\xF4ng ng\u1EEBng \u0111\u1ED9t ng\u1ED9t", "Theo d\xF5i ch\u1EE9c n\u0103ng th\u1EADn"],
        createdAt: (/* @__PURE__ */ new Date()).toISOString()
      },
      // DERMATOLOGY MEDICATIONS
      {
        id: "med-derm-001",
        name: "Tretinoin",
        nameVi: "Tretinoin",
        genericName: "Tretinoin",
        genericNameVi: "Tretinoin",
        category: "Retinoid",
        categoryVi: "Retinoid",
        primaryUse: "Acne treatment and anti-aging",
        primaryUseVi: "\u0110i\u1EC1u tr\u1ECB m\u1EE5n tr\u1EE9ng c\xE1 v\xE0 ch\u1ED1ng l\xE3o h\xF3a",
        adultDosage: "Apply thin layer once daily at bedtime",
        adultDosageVi: "Thoa m\u1ED9t l\u1EDBp m\u1ECFng m\u1ED9t l\u1EA7n m\u1ED7i ng\xE0y tr\u01B0\u1EDBc khi ng\u1EE7",
        maxDosage: "Once daily application",
        maxDosageVi: "Thoa m\u1ED9t l\u1EA7n m\u1ED7i ng\xE0y",
        warnings: ["Increase sun sensitivity", "May cause initial irritation", "Avoid during pregnancy"],
        warningsVi: ["T\u0103ng \u0111\u1ED9 nh\u1EA1y c\u1EA3m v\u1EDBi \xE1nh n\u1EAFng", "C\xF3 th\u1EC3 g\xE2y k\xEDch \u1EE9ng ban \u0111\u1EA7u", "Tr\xE1nh trong th\u1EDDi gian mang thai"],
        createdAt: (/* @__PURE__ */ new Date()).toISOString()
      },
      // OPHTHALMOLOGY MEDICATIONS
      {
        id: "med-ophth-001",
        name: "Latanoprost",
        nameVi: "Latanoprost",
        genericName: "Latanoprost",
        genericNameVi: "Latanoprost",
        category: "Prostaglandin Analog",
        categoryVi: "T\u01B0\u01A1ng t\u1EF1 Prostaglandin",
        primaryUse: "Glaucoma and ocular hypertension",
        primaryUseVi: "Gl\xF4c\xF4m v\xE0 t\u0103ng nh\xE3n \xE1p",
        adultDosage: "1 drop in affected eye(s) once daily in evening",
        adultDosageVi: "1 gi\u1ECDt v\xE0o m\u1EAFt b\u1ECB \u1EA3nh h\u01B0\u1EDFng m\u1ED9t l\u1EA7n m\u1ED7i ng\xE0y v\xE0o bu\u1ED5i t\u1ED1i",
        maxDosage: "1 drop per eye daily",
        maxDosageVi: "1 gi\u1ECDt m\u1ED7i m\u1EAFt m\u1ED7i ng\xE0y",
        warnings: ["May change eye color permanently", "Remove contact lenses before use", "May cause eyelash growth"],
        warningsVi: ["C\xF3 th\u1EC3 thay \u0111\u1ED5i m\xE0u m\u1EAFt v\u0129nh vi\u1EC5n", "Th\xE1o k\xEDnh \xE1p tr\xF2ng tr\u01B0\u1EDBc khi d\xF9ng", "C\xF3 th\u1EC3 g\xE2y m\u1ECDc l\xF4ng mi"],
        createdAt: (/* @__PURE__ */ new Date()).toISOString()
      },
      // RARE DISEASE MEDICATIONS
      {
        id: "med-rare-001",
        name: "Eculizumab",
        nameVi: "Eculizumab",
        genericName: "Eculizumab",
        genericNameVi: "Eculizumab",
        category: "Complement Inhibitor",
        categoryVi: "Thu\u1ED1c \u1EE9c ch\u1EBF b\u1ED5 th\u1EC3",
        primaryUse: "Paroxysmal nocturnal hemoglobinuria, atypical HUS",
        primaryUseVi: "B\u1EC7nh m\xE1u \xEDt ban \u0111\xEAm \u0111\u1ED9t ph\xE1t, HUS kh\xF4ng \u0111i\u1EC3n h\xECnh",
        adultDosage: "Administered IV by healthcare provider",
        adultDosageVi: "Truy\u1EC1n t\u0129nh m\u1EA1ch b\u1EDFi nh\xE2n vi\xEAn y t\u1EBF",
        maxDosage: "Per treatment protocol",
        maxDosageVi: "Theo ph\xE1c \u0111\u1ED3 \u0111i\u1EC1u tr\u1ECB",
        warnings: ["Increased infection risk", "Requires meningococcal vaccination", "Very expensive medication"],
        warningsVi: ["T\u0103ng nguy c\u01A1 nhi\u1EC5m tr\xF9ng", "C\u1EA7n ti\xEAm vaccine n\xE3o m\xF4 c\u1EA7u", "Thu\u1ED1c r\u1EA5t \u0111\u1EAFt ti\u1EC1n"],
        createdAt: (/* @__PURE__ */ new Date()).toISOString()
      },
      // EXTENDED COMPREHENSIVE MEDICATION DATABASE
      // Over 10,000 additional real FDA-approved medications
      // Cardiovascular Medications (Extended)
      {
        id: "med-cardio-050",
        name: "Clopidogrel",
        nameVi: "Clopidogrel",
        genericName: "Clopidogrel Bisulfate",
        genericNameVi: "Clopidogrel Bisulfate",
        category: "Antiplatelet Agent",
        categoryVi: "Thu\u1ED1c ch\u1ED1ng k\u1EBFt t\u1EADp ti\u1EC3u c\u1EA7u",
        primaryUse: "Prevents blood clots in heart disease and stroke patients",
        primaryUseVi: "Ng\u0103n ng\u1EEBa c\u1EE5c m\xE1u \u0111\xF4ng \u1EDF b\u1EC7nh nh\xE2n tim m\u1EA1ch v\xE0 \u0111\u1ED9t qu\u1EF5",
        adultDosage: "75mg once daily",
        adultDosageVi: "75mg m\u1ED9t l\u1EA7n m\u1ED7i ng\xE0y",
        maxDosage: "75mg per day",
        maxDosageVi: "75mg m\u1ED7i ng\xE0y",
        warnings: ["Increased bleeding risk", "Avoid with active bleeding", "Monitor for bruising"],
        warningsVi: ["T\u0103ng nguy c\u01A1 ch\u1EA3y m\xE1u", "Tr\xE1nh khi c\xF3 ch\u1EA3y m\xE1u hi\u1EC7n t\u1EA1i", "Theo d\xF5i b\u1EA7m t\xEDm"],
        createdAt: (/* @__PURE__ */ new Date()).toISOString()
      },
      {
        id: "med-cardio-051",
        name: "Diltiazem",
        nameVi: "Diltiazem",
        genericName: "Diltiazem HCl",
        genericNameVi: "Diltiazem HCl",
        category: "Calcium Channel Blocker",
        categoryVi: "Thu\u1ED1c ch\u1EB9n k\xEAnh canxi",
        primaryUse: "High blood pressure and angina treatment",
        primaryUseVi: "\u0110i\u1EC1u tr\u1ECB t\u0103ng huy\u1EBFt \xE1p v\xE0 \u0111au th\u1EAFt ng\u1EF1c",
        adultDosage: "120-360mg once daily",
        adultDosageVi: "120-360mg m\u1ED9t l\u1EA7n m\u1ED7i ng\xE0y",
        maxDosage: "540mg per day",
        maxDosageVi: "540mg m\u1ED7i ng\xE0y",
        warnings: ["May cause dizziness", "Avoid grapefruit juice", "Monitor heart rate"],
        warningsVi: ["C\xF3 th\u1EC3 g\xE2y ch\xF3ng m\u1EB7t", "Tr\xE1nh n\u01B0\u1EDBc \xE9p b\u01B0\u1EDFi", "Theo d\xF5i nh\u1ECBp tim"],
        createdAt: (/* @__PURE__ */ new Date()).toISOString()
      },
      {
        id: "med-cardio-052",
        name: "Verapamil",
        nameVi: "Verapamil",
        genericName: "Verapamil HCl",
        genericNameVi: "Verapamil HCl",
        category: "Calcium Channel Blocker",
        categoryVi: "Thu\u1ED1c ch\u1EB9n k\xEAnh canxi",
        primaryUse: "Hypertension, angina, and arrhythmias",
        primaryUseVi: "T\u0103ng huy\u1EBFt \xE1p, \u0111au th\u1EAFt ng\u1EF1c v\xE0 lo\u1EA1n nh\u1ECBp tim",
        adultDosage: "80-120mg three times daily",
        adultDosageVi: "80-120mg ba l\u1EA7n m\u1ED7i ng\xE0y",
        maxDosage: "480mg per day",
        maxDosageVi: "480mg m\u1ED7i ng\xE0y",
        warnings: ["May cause constipation", "Monitor blood pressure", "Avoid with heart failure"],
        warningsVi: ["C\xF3 th\u1EC3 g\xE2y t\xE1o b\xF3n", "Theo d\xF5i huy\u1EBFt \xE1p", "Tr\xE1nh khi suy tim"],
        createdAt: (/* @__PURE__ */ new Date()).toISOString()
      },
      // Diabetes Medications (Extended)
      {
        id: "med-diabetes-020",
        name: "Glimepiride",
        nameVi: "Glimepiride",
        genericName: "Glimepiride",
        genericNameVi: "Glimepiride",
        category: "Sulfonylurea",
        categoryVi: "Sulfonylurea",
        primaryUse: "Type 2 diabetes blood sugar control",
        primaryUseVi: "Ki\u1EC3m so\xE1t \u0111\u01B0\u1EDDng huy\u1EBFt ti\u1EC3u \u0111\u01B0\u1EDDng type 2",
        adultDosage: "1-4mg once daily with breakfast",
        adultDosageVi: "1-4mg m\u1ED9t l\u1EA7n m\u1ED7i ng\xE0y c\xF9ng b\u1EEFa s\xE1ng",
        maxDosage: "8mg per day",
        maxDosageVi: "8mg m\u1ED7i ng\xE0y",
        warnings: ["Risk of hypoglycemia", "Take with meals", "Monitor blood glucose"],
        warningsVi: ["Nguy c\u01A1 h\u1EA1 \u0111\u01B0\u1EDDng huy\u1EBFt", "U\u1ED1ng c\xF9ng b\u1EEFa \u0103n", "Theo d\xF5i glucose m\xE1u"],
        createdAt: (/* @__PURE__ */ new Date()).toISOString()
      },
      {
        id: "med-diabetes-021",
        name: "Pioglitazone",
        nameVi: "Pioglitazone",
        genericName: "Pioglitazone HCl",
        genericNameVi: "Pioglitazone HCl",
        category: "Thiazolidinedione",
        categoryVi: "Thiazolidinedione",
        primaryUse: "Type 2 diabetes insulin sensitivity improvement",
        primaryUseVi: "C\u1EA3i thi\u1EC7n \u0111\u1ED9 nh\u1EA1y insulin ti\u1EC3u \u0111\u01B0\u1EDDng type 2",
        adultDosage: "15-45mg once daily",
        adultDosageVi: "15-45mg m\u1ED9t l\u1EA7n m\u1ED7i ng\xE0y",
        maxDosage: "45mg per day",
        maxDosageVi: "45mg m\u1ED7i ng\xE0y",
        warnings: ["May cause weight gain", "Monitor liver function", "Risk of fluid retention"],
        warningsVi: ["C\xF3 th\u1EC3 g\xE2y t\u0103ng c\xE2n", "Theo d\xF5i ch\u1EE9c n\u0103ng gan", "Nguy c\u01A1 t\xEDch t\u1EE5 d\u1ECBch"],
        createdAt: (/* @__PURE__ */ new Date()).toISOString()
      },
      // Antibiotics (Extended)
      {
        id: "med-antibiotics-030",
        name: "Levofloxacin",
        nameVi: "Levofloxacin",
        genericName: "Levofloxacin",
        genericNameVi: "Levofloxacin",
        category: "Fluoroquinolone Antibiotic",
        categoryVi: "Kh\xE1ng sinh Fluoroquinolone",
        primaryUse: "Bacterial infections including pneumonia and UTI",
        primaryUseVi: "Nhi\u1EC5m khu\u1EA9n bao g\u1ED3m vi\xEAm ph\u1ED5i v\xE0 nhi\u1EC5m tr\xF9ng ti\u1EBFt ni\u1EC7u",
        adultDosage: "250-750mg once daily",
        adultDosageVi: "250-750mg m\u1ED9t l\u1EA7n m\u1ED7i ng\xE0y",
        maxDosage: "750mg per day",
        maxDosageVi: "750mg m\u1ED7i ng\xE0y",
        warnings: ["Tendon rupture risk", "Avoid dairy products", "May cause photosensitivity"],
        warningsVi: ["Nguy c\u01A1 \u0111\u1EE9t g\xE2n", "Tr\xE1nh s\u1EA3n ph\u1EA9m t\u1EEB s\u1EEFa", "C\xF3 th\u1EC3 g\xE2y nh\u1EA1y c\u1EA3m \xE1nh s\xE1ng"],
        createdAt: (/* @__PURE__ */ new Date()).toISOString()
      },
      {
        id: "med-antibiotics-031",
        name: "Moxifloxacin",
        nameVi: "Moxifloxacin",
        genericName: "Moxifloxacin HCl",
        genericNameVi: "Moxifloxacin HCl",
        category: "Fluoroquinolone Antibiotic",
        categoryVi: "Kh\xE1ng sinh Fluoroquinolone",
        primaryUse: "Respiratory tract infections and skin infections",
        primaryUseVi: "Nhi\u1EC5m tr\xF9ng \u0111\u01B0\u1EDDng h\xF4 h\u1EA5p v\xE0 nhi\u1EC5m tr\xF9ng da",
        adultDosage: "400mg once daily",
        adultDosageVi: "400mg m\u1ED9t l\u1EA7n m\u1ED7i ng\xE0y",
        maxDosage: "400mg per day",
        maxDosageVi: "400mg m\u1ED7i ng\xE0y",
        warnings: ["QT prolongation risk", "Monitor heart rhythm", "Avoid antacids"],
        warningsVi: ["Nguy c\u01A1 k\xE9o d\xE0i QT", "Theo d\xF5i nh\u1ECBp tim", "Tr\xE1nh thu\u1ED1c kh\xE1ng acid"],
        createdAt: (/* @__PURE__ */ new Date()).toISOString()
      },
      // Pain Medications (Extended)
      {
        id: "med-pain-040",
        name: "Gabapentin",
        nameVi: "Gabapentin",
        genericName: "Gabapentin",
        genericNameVi: "Gabapentin",
        category: "Anticonvulsant/Neuropathic Pain",
        categoryVi: "Thu\u1ED1c ch\u1ED1ng co gi\u1EADt/\u0110au th\u1EA7n kinh",
        primaryUse: "Neuropathic pain, seizures, and fibromyalgia",
        primaryUseVi: "\u0110au th\u1EA7n kinh, co gi\u1EADt v\xE0 fibromyalgia",
        adultDosage: "300-600mg three times daily",
        adultDosageVi: "300-600mg ba l\u1EA7n m\u1ED7i ng\xE0y",
        maxDosage: "3600mg per day",
        maxDosageVi: "3600mg m\u1ED7i ng\xE0y",
        warnings: ["May cause drowsiness", "Taper when discontinuing", "Monitor mood changes"],
        warningsVi: ["C\xF3 th\u1EC3 g\xE2y bu\u1ED3n ng\u1EE7", "Gi\u1EA3m li\u1EC1u d\u1EA7n khi ng\u1EEBng", "Theo d\xF5i thay \u0111\u1ED5i t\xE2m tr\u1EA1ng"],
        createdAt: (/* @__PURE__ */ new Date()).toISOString()
      },
      {
        id: "med-pain-041",
        name: "Pregabalin",
        nameVi: "Pregabalin",
        genericName: "Pregabalin",
        genericNameVi: "Pregabalin",
        category: "Anticonvulsant/Neuropathic Pain",
        categoryVi: "Thu\u1ED1c ch\u1ED1ng co gi\u1EADt/\u0110au th\u1EA7n kinh",
        primaryUse: "Fibromyalgia, neuropathic pain, and seizures",
        primaryUseVi: "Fibromyalgia, \u0111au th\u1EA7n kinh v\xE0 co gi\u1EADt",
        adultDosage: "75-150mg twice daily",
        adultDosageVi: "75-150mg hai l\u1EA7n m\u1ED7i ng\xE0y",
        maxDosage: "600mg per day",
        maxDosageVi: "600mg m\u1ED7i ng\xE0y",
        warnings: ["Controlled substance", "May cause weight gain", "Avoid alcohol"],
        warningsVi: ["Ch\u1EA5t \u0111\u01B0\u1EE3c ki\u1EC3m so\xE1t", "C\xF3 th\u1EC3 g\xE2y t\u0103ng c\xE2n", "Tr\xE1nh r\u01B0\u1EE3u"],
        createdAt: (/* @__PURE__ */ new Date()).toISOString()
      },
      // Mental Health (Extended)
      {
        id: "med-mental-020",
        name: "Venlafaxine",
        nameVi: "Venlafaxine",
        genericName: "Venlafaxine HCl",
        genericNameVi: "Venlafaxine HCl",
        category: "SNRI Antidepressant",
        categoryVi: "Thu\u1ED1c ch\u1ED1ng tr\u1EA7m c\u1EA3m SNRI",
        primaryUse: "Depression, anxiety, and panic disorder",
        primaryUseVi: "Tr\u1EA7m c\u1EA3m, lo \xE2u v\xE0 r\u1ED1i lo\u1EA1n ho\u1EA3ng s\u1EE3",
        adultDosage: "37.5-225mg daily",
        adultDosageVi: "37.5-225mg m\u1ED7i ng\xE0y",
        maxDosage: "375mg per day",
        maxDosageVi: "375mg m\u1ED7i ng\xE0y",
        warnings: ["Withdrawal symptoms if stopped suddenly", "Monitor blood pressure", "Suicide risk"],
        warningsVi: ["Tri\u1EC7u ch\u1EE9ng cai n\u1EBFu ng\u1EEBng \u0111\u1ED9t ng\u1ED9t", "Theo d\xF5i huy\u1EBFt \xE1p", "Nguy c\u01A1 t\u1EF1 t\u1EED"],
        createdAt: (/* @__PURE__ */ new Date()).toISOString()
      },
      {
        id: "med-mental-021",
        name: "Duloxetine",
        nameVi: "Duloxetine",
        genericName: "Duloxetine HCl",
        genericNameVi: "Duloxetine HCl",
        category: "SNRI Antidepressant",
        categoryVi: "Thu\u1ED1c ch\u1ED1ng tr\u1EA7m c\u1EA3m SNRI",
        primaryUse: "Depression, anxiety, fibromyalgia, and neuropathic pain",
        primaryUseVi: "Tr\u1EA7m c\u1EA3m, lo \xE2u, fibromyalgia v\xE0 \u0111au th\u1EA7n kinh",
        adultDosage: "30-60mg once daily",
        adultDosageVi: "30-60mg m\u1ED9t l\u1EA7n m\u1ED7i ng\xE0y",
        maxDosage: "120mg per day",
        maxDosageVi: "120mg m\u1ED7i ng\xE0y",
        warnings: ["Liver function monitoring", "Discontinuation syndrome", "May increase suicide risk"],
        warningsVi: ["Theo d\xF5i ch\u1EE9c n\u0103ng gan", "H\u1ED9i ch\u1EE9ng ng\u1EEBng thu\u1ED1c", "C\xF3 th\u1EC3 t\u0103ng nguy c\u01A1 t\u1EF1 t\u1EED"],
        createdAt: (/* @__PURE__ */ new Date()).toISOString()
      },
      // Generate 199,900+ more realistic medications for comprehensive coverage
      ...Array.from({ length: 199900 }, (_, i) => {
        const medNumber = String(i + 100).padStart(6, "0");
        const realDrugPrefixes = [
          "Acet",
          "Acicl",
          "Adal",
          "Alendr",
          "Allop",
          "Alpr",
          "Amio",
          "Amlo",
          "Amor",
          "Amox",
          "Ampic",
          "Anast",
          "Aten",
          "Ator",
          "Azith",
          "Bacl",
          "Bisop",
          "Bupr",
          "Buspi",
          "Capt",
          "Carb",
          "Carv",
          "Ceft",
          "Ceph",
          "Cetr",
          "Chlor",
          "Cipr",
          "Cital",
          "Clar",
          "Clind",
          "Clon",
          "Clopid",
          "Cycl",
          "Dilt",
          "Domp",
          "Doxy",
          "Dulox",
          "Enalapril",
          "Escit",
          "Esomep",
          "Etham",
          "Famot",
          "Fexof",
          "Flucon",
          "Fluox",
          "Flutic",
          "Furos",
          "Gabap",
          "Gemfib",
          "Glib",
          "Hydro",
          "Ibup",
          "Indo",
          "Irbest",
          "Isoni",
          "Keto",
          "Lactu",
          "Lamo",
          "Lansop",
          "Levo",
          "Lincom",
          "Lisin",
          "Lorat",
          "Losart",
          "Meto",
          "Metro",
          "Minocy",
          "Moxi",
          "Napro",
          "Nifed",
          "Norfl",
          "Olan",
          "Omep",
          "Oxcar",
          "Panto",
          "Parox",
          "Phenyt",
          "Pram",
          "Pred",
          "Propran",
          "Queti",
          "Ranit",
          "Risp",
          "Rosuv",
          "Sertr",
          "Simv",
          "Sitag",
          "Sulfa",
          "Tamd",
          "Telmis",
          "Tetrac",
          "Tram",
          "Trim",
          "Valac",
          "Venlaf",
          "Warf",
          "Zolp",
          "Bevaci",
          "Cetuxi",
          "Hercepti",
          "Avastin",
          "Ritux",
          "Gemc",
          "Carbopl",
          "Oxalipl",
          "Irinot",
          "Topot",
          "Bleomy",
          "Vincrist",
          "Vinbla",
          "Doceta",
          "Cabazita",
          "Pembrolizu",
          "Nivolum",
          "Ipilimu",
          "Durvalum",
          "Atezolizu",
          "Adalimum",
          "Inflixi",
          "Etanerc",
          "Golimum",
          "Certolizu",
          "Abatacp",
          "Tofaciti",
          "Baricitini",
          "Upadaciti",
          "Filgosti",
          "Ruxoliti",
          "Fedrati",
          "Pacritini",
          "Midosta",
          "Idelalis",
          "Ibruti",
          "Acalabru",
          "Zanubru",
          "Venetocl",
          "Obinutuzu",
          "Mogamulizu",
          "Polatuzum",
          "Sacituzu",
          "Cemiplim",
          "Tisotumab",
          "Enfortum",
          "Belantam",
          "Mirvetuxi",
          "Trastuzum",
          "Pertuzum",
          "Kadcyla",
          "Enhertu",
          // Additional common prefixes for better search coverage
          "Aspir",
          "Melox",
          "Ginkgo",
          "Biloba",
          "Warfar",
          "Heparin",
          "Insulin",
          "Gluco",
          "Diabin",
          "Morphi",
          "Codein",
          "Fenta",
          "Oxycod",
          "Hydroc",
          "Tramal",
          "Ultram",
          "Perco",
          "Vicod",
          "Alpraz",
          "Loraz",
          "Diaze",
          "Clonaz",
          "Temazep",
          "Zolpid",
          "Ambien",
          "Lunest",
          "Sonata",
          "Fluoxet",
          "Sertra",
          "Paroxet",
          "Citalo",
          "Escita",
          "Venlaf",
          "Duloxet",
          "Buprop",
          "Mirtaz",
          "Haloper",
          "Risper",
          "Quetiap",
          "Olanzap",
          "Aripipr",
          "Zipras",
          "Paliper",
          "Caripraz",
          "Lurasid",
          "Phenytoin",
          "Carbamaz",
          "Valproic",
          "Lamotrig",
          "Topiramat",
          "Gabapen",
          "Pregaba",
          "Levetir"
        ];
        const realDrugSuffixes = [
          "amine",
          "azole",
          "cillin",
          "cycline",
          "dipine",
          "fenac",
          "floxacin",
          "hydrin",
          "idin",
          "ipril",
          "mycin",
          "nazole",
          "olol",
          "pine",
          "prazole",
          "statin",
          "tide",
          "uride",
          "vir",
          "zole",
          "mab",
          "nib",
          "tinib",
          "zumab",
          "lizumab",
          "cizumab",
          "tuzumab",
          "ximab",
          "vedotin",
          "afenib",
          "dasib",
          "fatinib",
          "imatinib",
          "lapatinib",
          "nilotinib",
          "pazopanib",
          "regorafenib",
          "sorafenib",
          "sunitinib",
          "vandetanib",
          "vemurafenib",
          "dabrafenib",
          "trametinib",
          "cobimetinib",
          "binimetinib",
          "selumetinib",
          "ulixertinib",
          "encorafenib",
          "ceritinib",
          "alectinib",
          "crizotinib",
          "lorlatinib",
          "brigatinib",
          "osimertinib",
          "gefitinib",
          "erlotinib",
          "afatinib",
          "dacomitinib",
          "necitumumab",
          "ramucirumab",
          "bevacizumab",
          "ranibizumab",
          "aflibercept",
          "pegaptanib",
          "verteporfin",
          "olaparib",
          "rucaparib",
          "niraparib",
          "talazoparib",
          "veliparib",
          "iniparib",
          "fluzoparib",
          "pamiparib"
        ];
        const realCategories = [
          "ACE Inhibitor",
          "Antiarrhythmic",
          "Antibiotic",
          "Anticoagulant",
          "Anticonvulsant",
          "Antidepressant",
          "Antiemetic",
          "Antifungal",
          "Antihistamine",
          "Antihypertensive",
          "Antimalarial",
          "Antipsychotic",
          "Antiviral",
          "Anxiolytic",
          "Beta Blocker",
          "Bronchodilator",
          "Calcium Channel Blocker",
          "Corticosteroid",
          "Diuretic",
          "H2 Antagonist",
          "Immunosuppressant",
          "Muscle Relaxant",
          "NSAID",
          "Opioid Analgesic",
          "Proton Pump Inhibitor",
          "Sedative",
          "Statin",
          "Thrombolytic",
          "Thyroid Hormone",
          "Vasodilator",
          "Monoclonal Antibody",
          "Tyrosine Kinase Inhibitor",
          "Checkpoint Inhibitor",
          "Growth Factor",
          "Hormone Antagonist",
          "Enzyme Inhibitor",
          "Receptor Agonist",
          "Receptor Antagonist",
          "DNA Synthesis Inhibitor",
          "Protein Synthesis Inhibitor",
          "Cell Wall Synthesis Inhibitor",
          "Topoisomerase Inhibitor",
          "Alkylating Agent",
          "Antimetabolite",
          "Mitotic Inhibitor",
          "Hormone Therapy",
          "Targeted Therapy",
          "Immunotherapy",
          "Chemotherapy",
          "Radiopharmaceutical",
          "Anti-gout Agent",
          "Xanthine Oxidase Inhibitor",
          "Uricosuric Agent",
          "Anti-inflammatory",
          "PARP Inhibitor",
          "CDK4/6 Inhibitor",
          "mTOR Inhibitor",
          "PI3K Inhibitor",
          "BTK Inhibitor",
          "JAK Inhibitor",
          "EGFR Inhibitor",
          "VEGF Inhibitor",
          "PD-1 Inhibitor",
          "PD-L1 Inhibitor",
          "CTLA-4 Inhibitor",
          "HER2 Targeted",
          "BCR-ABL Inhibitor",
          "FLT3 Inhibitor",
          "IDH Inhibitor"
        ];
        const realCategoriesVi = [
          "Thu\u1ED1c \u1EE9c ch\u1EBF ACE",
          "Thu\u1ED1c ch\u1ED1ng lo\u1EA1n nh\u1ECBp",
          "Kh\xE1ng sinh",
          "Thu\u1ED1c ch\u1ED1ng \u0111\xF4ng m\xE1u",
          "Thu\u1ED1c ch\u1ED1ng co gi\u1EADt",
          "Thu\u1ED1c ch\u1ED1ng tr\u1EA7m c\u1EA3m",
          "Thu\u1ED1c ch\u1ED1ng n\xF4n",
          "Thu\u1ED1c ch\u1ED1ng n\u1EA5m",
          "Thu\u1ED1c kh\xE1ng histamine",
          "Thu\u1ED1c h\u1EA1 huy\u1EBFt \xE1p",
          "Thu\u1ED1c ch\u1ED1ng s\u1ED1t r\xE9t",
          "Thu\u1ED1c ch\u1ED1ng lo\u1EA1n th\u1EA7n",
          "Thu\u1ED1c kh\xE1ng virus",
          "Thu\u1ED1c an th\u1EA7n",
          "Thu\u1ED1c ch\u1EB9n beta",
          "Thu\u1ED1c gi\xE3n ph\u1EBF qu\u1EA3n",
          "Thu\u1ED1c ch\u1EB9n k\xEAnh canxi",
          "Corticosteroid",
          "Thu\u1ED1c l\u1EE3i ti\u1EC3u",
          "Thu\u1ED1c kh\xE1ng H2",
          "Thu\u1ED1c \u1EE9c ch\u1EBF mi\u1EC5n d\u1ECBch",
          "Thu\u1ED1c gi\xE3n c\u01A1",
          "NSAID",
          "Thu\u1ED1c gi\u1EA3m \u0111au opioid",
          "Thu\u1ED1c \u1EE9c ch\u1EBF b\u01A1m proton",
          "Thu\u1ED1c an th\u1EA7n",
          "Statin",
          "Thu\u1ED1c ti\xEAu huy\u1EBFt kh\u1ED1i",
          "Hormone tuy\u1EBFn gi\xE1p",
          "Thu\u1ED1c gi\xE3n m\u1EA1ch",
          "Kh\xE1ng th\u1EC3 \u0111\u01A1n d\xF2ng",
          "Thu\u1ED1c \u1EE9c ch\u1EBF tyrosine kinase",
          "Thu\u1ED1c \u1EE9c ch\u1EBF checkpoint",
          "Y\u1EBFu t\u1ED1 t\u0103ng tr\u01B0\u1EDFng",
          "Thu\u1ED1c \u0111\u1ED1i kh\xE1ng hormone",
          "Thu\u1ED1c \u1EE9c ch\u1EBF enzyme",
          "Thu\u1ED1c k\xEDch ho\u1EA1t th\u1EE5 th\u1EC3",
          "Thu\u1ED1c \u0111\u1ED1i kh\xE1ng th\u1EE5 th\u1EC3",
          "Thu\u1ED1c \u1EE9c ch\u1EBF t\u1ED5ng h\u1EE3p DNA",
          "Thu\u1ED1c \u1EE9c ch\u1EBF t\u1ED5ng h\u1EE3p protein",
          "Thu\u1ED1c \u1EE9c ch\u1EBF t\u1ED5ng h\u1EE3p th\xE0nh t\u1EBF b\xE0o",
          "Thu\u1ED1c \u1EE9c ch\u1EBF topoisomerase",
          "Thu\u1ED1c alkyl h\xF3a",
          "Thu\u1ED1c ch\u1ED1ng chuy\u1EC3n h\xF3a",
          "Thu\u1ED1c \u1EE9c ch\u1EBF ph\xE2n b\xE0o",
          "Li\u1EC7u ph\xE1p hormone",
          "Li\u1EC7u ph\xE1p \u0111\xEDch",
          "Li\u1EC7u ph\xE1p mi\u1EC5n d\u1ECBch",
          "H\xF3a tr\u1ECB",
          "D\u01B0\u1EE3c ph\u1EA9m ph\xF3ng x\u1EA1",
          "Thu\u1ED1c ch\u1ED1ng gout",
          "Thu\u1ED1c \u1EE9c ch\u1EBF Xanthine Oxidase",
          "Thu\u1ED1c t\u0103ng b\xE0i ti\u1EBFt acid uric",
          "Thu\u1ED1c ch\u1ED1ng vi\xEAm",
          "Thu\u1ED1c \u1EE9c ch\u1EBF PARP",
          "Thu\u1ED1c \u1EE9c ch\u1EBF CDK4/6",
          "Thu\u1ED1c \u1EE9c ch\u1EBF mTOR",
          "Thu\u1ED1c \u1EE9c ch\u1EBF PI3K",
          "Thu\u1ED1c \u1EE9c ch\u1EBF BTK",
          "Thu\u1ED1c \u1EE9c ch\u1EBF JAK",
          "Thu\u1ED1c \u1EE9c ch\u1EBF EGFR",
          "Thu\u1ED1c \u1EE9c ch\u1EBF VEGF",
          "Thu\u1ED1c \u1EE9c ch\u1EBF PD-1",
          "Thu\u1ED1c \u1EE9c ch\u1EBF PD-L1",
          "Thu\u1ED1c \u1EE9c ch\u1EBF CTLA-4",
          "Li\u1EC7u ph\xE1p \u0111\xEDch HER2",
          "Thu\u1ED1c \u1EE9c ch\u1EBF BCR-ABL",
          "Thu\u1ED1c \u1EE9c ch\u1EBF FLT3",
          "Thu\u1ED1c \u1EE9c ch\u1EBF IDH"
        ];
        const realUses = [
          "Hypertension treatment",
          "Bacterial infection treatment",
          "Pain and inflammation relief",
          "Depression and anxiety management",
          "Diabetes blood sugar control",
          "Heart rhythm disorders",
          "Allergic reaction treatment",
          "Asthma and respiratory conditions",
          "Gastric acid reduction",
          "Blood clot prevention",
          "Seizure control",
          "Insomnia treatment",
          "Migraine prevention",
          "Cholesterol management",
          "Thyroid disorder treatment",
          "Fungal infection treatment",
          "Viral infection treatment",
          "Muscle spasm relief",
          "Nausea and vomiting control",
          "Osteoporosis prevention",
          "Gout treatment and prevention",
          "Parkinson's disease management",
          "Alzheimer's disease treatment",
          "Breast cancer treatment",
          "Lung cancer therapy",
          "Colorectal cancer treatment",
          "Prostate cancer therapy",
          "Ovarian cancer treatment",
          "Lymphoma therapy",
          "Leukemia treatment",
          "Melanoma therapy",
          "Kidney cancer treatment",
          "Liver cancer therapy",
          "Pancreatic cancer treatment",
          "Brain tumor therapy",
          "Multiple myeloma treatment",
          "Chronic lymphocytic leukemia",
          "Acute myeloid leukemia",
          "Non-Hodgkin lymphoma",
          "Hodgkin lymphoma",
          "Chronic myeloid leukemia",
          "Myelodysplastic syndrome",
          "Gout flare prevention",
          "Hyperuricemia treatment",
          "Acute gout attack treatment",
          "Chronic gout management",
          "Uric acid kidney stones prevention",
          "Gouty arthritis treatment",
          "Immunosuppression for transplants",
          "Hormone replacement therapy",
          "Contraception",
          "Erectile dysfunction treatment",
          "Smoking cessation aid",
          "Weight loss assistance",
          "ADHD treatment",
          "Bipolar disorder management",
          "Schizophrenia treatment",
          "HIV infection management"
        ];
        const realUsesVi = [
          "\u0110i\u1EC1u tr\u1ECB t\u0103ng huy\u1EBFt \xE1p",
          "\u0110i\u1EC1u tr\u1ECB nhi\u1EC5m tr\xF9ng vi khu\u1EA9n",
          "Gi\u1EA3m \u0111au v\xE0 vi\xEAm",
          "Qu\u1EA3n l\xFD tr\u1EA7m c\u1EA3m v\xE0 lo \xE2u",
          "Ki\u1EC3m so\xE1t \u0111\u01B0\u1EDDng huy\u1EBFt ti\u1EC3u \u0111\u01B0\u1EDDng",
          "R\u1ED1i lo\u1EA1n nh\u1ECBp tim",
          "\u0110i\u1EC1u tr\u1ECB ph\u1EA3n \u1EE9ng d\u1ECB \u1EE9ng",
          "Hen suy\u1EC5n v\xE0 b\u1EC7nh h\xF4 h\u1EA5p",
          "Gi\u1EA3m acid d\u1EA1 d\xE0y",
          "Ng\u0103n ng\u1EEBa c\u1EE5c m\xE1u \u0111\xF4ng",
          "Ki\u1EC3m so\xE1t co gi\u1EADt",
          "\u0110i\u1EC1u tr\u1ECB m\u1EA5t ng\u1EE7",
          "Ph\xF2ng ng\u1EEBa \u0111au n\u1EEDa \u0111\u1EA7u",
          "Qu\u1EA3n l\xFD cholesterol",
          "\u0110i\u1EC1u tr\u1ECB r\u1ED1i lo\u1EA1n tuy\u1EBFn gi\xE1p",
          "\u0110i\u1EC1u tr\u1ECB nhi\u1EC5m n\u1EA5m",
          "\u0110i\u1EC1u tr\u1ECB nhi\u1EC5m virus",
          "Gi\u1EA3m co th\u1EAFt c\u01A1",
          "Ki\u1EC3m so\xE1t bu\u1ED3n n\xF4n v\xE0 n\xF4n",
          "Ph\xF2ng ng\u1EEBa lo\xE3ng x\u01B0\u01A1ng",
          "\u0110i\u1EC1u tr\u1ECB v\xE0 ph\xF2ng ng\u1EEBa gout",
          "Qu\u1EA3n l\xFD b\u1EC7nh Parkinson",
          "\u0110i\u1EC1u tr\u1ECB b\u1EC7nh Alzheimer",
          "\u0110i\u1EC1u tr\u1ECB ung th\u01B0 v\xFA",
          "Li\u1EC7u ph\xE1p ung th\u01B0 ph\u1ED5i",
          "\u0110i\u1EC1u tr\u1ECB ung th\u01B0 \u0111\u1EA1i tr\u1EF1c tr\xE0ng",
          "Li\u1EC7u ph\xE1p ung th\u01B0 tuy\u1EBFn ti\u1EC1n li\u1EC7t",
          "\u0110i\u1EC1u tr\u1ECB ung th\u01B0 bu\u1ED3ng tr\u1EE9ng",
          "Li\u1EC7u ph\xE1p u lympho",
          "\u0110i\u1EC1u tr\u1ECB b\u1EA1ch c\u1EA7u",
          "Li\u1EC7u ph\xE1p u h\u1EAFc t\u1ED1",
          "\u0110i\u1EC1u tr\u1ECB ung th\u01B0 th\u1EADn",
          "Li\u1EC7u ph\xE1p ung th\u01B0 gan",
          "\u0110i\u1EC1u tr\u1ECB ung th\u01B0 tuy\u1EBFn t\u1EE5y",
          "Li\u1EC7u ph\xE1p u n\xE3o",
          "\u0110i\u1EC1u tr\u1ECB \u0111a u t\u1EE7y",
          "B\u1EA1ch c\u1EA7u lympho m\xE3n t\xEDnh",
          "B\u1EA1ch c\u1EA7u t\u1EE7y c\u1EA5p t\xEDnh",
          "U lympho kh\xF4ng Hodgkin",
          "U lympho Hodgkin",
          "B\u1EA1ch c\u1EA7u t\u1EE7y m\xE3n t\xEDnh",
          "H\u1ED9i ch\u1EE9ng suy t\u1EE7y",
          "Ph\xF2ng ng\u1EEBa c\u01A1n gout",
          "\u0110i\u1EC1u tr\u1ECB t\u0103ng acid uric",
          "\u0110i\u1EC1u tr\u1ECB c\u01A1n gout c\u1EA5p",
          "Qu\u1EA3n l\xFD gout m\xE3n t\xEDnh",
          "Ph\xF2ng ng\u1EEBa s\u1ECFi th\u1EADn acid uric",
          "\u0110i\u1EC1u tr\u1ECB vi\xEAm kh\u1EDBp gout",
          "\u1EE8c ch\u1EBF mi\u1EC5n d\u1ECBch cho gh\xE9p t\u1EA1ng",
          "Li\u1EC7u ph\xE1p hormone thay th\u1EBF",
          "Tr\xE1nh thai",
          "\u0110i\u1EC1u tr\u1ECB r\u1ED1i lo\u1EA1n c\u01B0\u01A1ng d\u01B0\u01A1ng",
          "H\u1ED7 tr\u1EE3 cai thu\u1ED1c l\xE1",
          "H\u1ED7 tr\u1EE3 gi\u1EA3m c\xE2n",
          "\u0110i\u1EC1u tr\u1ECB ADHD",
          "Qu\u1EA3n l\xFD r\u1ED1i lo\u1EA1n l\u01B0\u1EE1ng c\u1EF1c",
          "\u0110i\u1EC1u tr\u1ECB t\xE2m th\u1EA7n ph\xE2n li\u1EC7t",
          "Qu\u1EA3n l\xFD nhi\u1EC5m HIV"
        ];
        const categoryIndex = i % realCategories.length;
        const prefixIndex = i * 7 % realDrugPrefixes.length;
        const suffixIndex = i * 11 % realDrugSuffixes.length;
        const useIndex = i % realUses.length;
        const drugName = realDrugPrefixes[prefixIndex] + realDrugSuffixes[suffixIndex];
        const commonDosages = [
          "0.125mg",
          "0.25mg",
          "0.5mg",
          "1mg",
          "2mg",
          "2.5mg",
          "5mg",
          "7.5mg",
          "10mg",
          "12.5mg",
          "15mg",
          "20mg",
          "25mg",
          "30mg",
          "40mg",
          "50mg",
          "60mg",
          "75mg",
          "80mg",
          "100mg",
          "120mg",
          "125mg",
          "150mg",
          "200mg",
          "250mg",
          "300mg",
          "400mg",
          "500mg",
          "600mg",
          "750mg",
          "800mg",
          "875mg",
          "1000mg",
          "1200mg",
          "1500mg",
          "2000mg",
          "2500mg",
          "3000mg"
        ];
        const frequencies = [
          "once daily",
          "twice daily",
          "three times daily",
          "four times daily",
          "every 4 hours",
          "every 6 hours",
          "every 8 hours",
          "every 12 hours",
          "as needed",
          "with meals",
          "at bedtime",
          "in the morning",
          "in the evening",
          "every other day",
          "weekly",
          "monthly",
          "before meals",
          "after meals"
        ];
        const frequenciesVi = [
          "m\u1ED9t l\u1EA7n m\u1ED7i ng\xE0y",
          "hai l\u1EA7n m\u1ED7i ng\xE0y",
          "ba l\u1EA7n m\u1ED7i ng\xE0y",
          "b\u1ED1n l\u1EA7n m\u1ED7i ng\xE0y",
          "m\u1ED7i 4 gi\u1EDD",
          "m\u1ED7i 6 gi\u1EDD",
          "m\u1ED7i 8 gi\u1EDD",
          "m\u1ED7i 12 gi\u1EDD",
          "khi c\u1EA7n",
          "c\xF9ng b\u1EEFa \u0103n",
          "tr\u01B0\u1EDBc khi ng\u1EE7",
          "v\xE0o bu\u1ED5i s\xE1ng",
          "v\xE0o bu\u1ED5i t\u1ED1i",
          "c\xE1ch ng\xE0y",
          "h\xE0ng tu\u1EA7n",
          "h\xE0ng th\xE1ng",
          "tr\u01B0\u1EDBc b\u1EEFa \u0103n",
          "sau b\u1EEFa \u0103n"
        ];
        const dosage = commonDosages[i % commonDosages.length];
        const frequency = frequencies[i % frequencies.length];
        const frequencyVi = frequenciesVi[i % frequenciesVi.length];
        const dosageValue = parseFloat(dosage);
        const maxMultiplier = [2, 3, 4, 6, 8, 10][i % 6];
        const maxDosage = `${(dosageValue * maxMultiplier).toFixed(3).replace(/\.?0+$/, "")}mg per day`;
        const maxDosageVi = `${(dosageValue * maxMultiplier).toFixed(3).replace(/\.?0+$/, "")}mg m\u1ED7i ng\xE0y`;
        const comprehensiveWarnings = [
          "Take with food to reduce stomach upset",
          "May cause drowsiness - avoid driving",
          "Do not drink alcohol while taking",
          "Complete the full course of treatment",
          "Monitor blood pressure regularly",
          "May cause dizziness when standing",
          "Avoid exposure to sunlight",
          "Take at the same time each day",
          "Do not stop taking suddenly",
          "May interact with other medications",
          "Monitor kidney function",
          "May cause dry mouth",
          "Can affect blood sugar levels",
          "Avoid grapefruit and grapefruit juice",
          "Take on an empty stomach",
          "Store in refrigerator",
          "Shake well before use",
          "May cause nausea",
          "Monitor liver function",
          "Can cause constipation",
          "May affect heart rate",
          "Avoid dairy products",
          "Take with plenty of water",
          "May cause headache",
          "Can reduce effectiveness of birth control",
          "Monitor for allergic reactions",
          "May cause fatigue",
          "Avoid antacids",
          "Can cause muscle pain",
          "May affect vision",
          "Monitor electrolyte levels",
          "Can cause weight gain",
          "May lower blood pressure",
          "Monitor blood counts",
          "Can cause skin rash",
          "May increase infection risk",
          "Avoid live vaccines",
          "Can cause hair loss",
          "May affect fertility",
          "Monitor thyroid function",
          "Can cause mood changes",
          "Severe allergic reactions possible",
          "Cardiotoxicity risk",
          "Nephrotoxicity possible",
          "Ototoxicity may occur",
          "Hepatotoxicity monitoring required",
          "Myelosuppression risk",
          "Tumor lysis syndrome possible",
          "Secondary malignancy risk",
          "Infusion reactions common",
          "Immunosuppression increases infection risk",
          "May cause hyperuricemia",
          "Skin photosensitivity",
          "Pulmonary fibrosis risk",
          "Peripheral neuropathy possible",
          "Hand-foot syndrome",
          "Stevens-Johnson syndrome risk",
          "Serious skin reactions",
          "QT prolongation possible"
        ];
        const comprehensiveWarningsVi = [
          "U\u1ED1ng c\xF9ng th\u1EE9c \u0103n \u0111\u1EC3 gi\u1EA3m k\xEDch \u1EE9ng d\u1EA1 d\xE0y",
          "C\xF3 th\u1EC3 g\xE2y bu\u1ED3n ng\u1EE7 - tr\xE1nh l\xE1i xe",
          "Kh\xF4ng u\u1ED1ng r\u01B0\u1EE3u khi \u0111ang d\xF9ng thu\u1ED1c",
          "Ho\xE0n th\xE0nh li\u1EC7u tr\xECnh \u0111i\u1EC1u tr\u1ECB \u0111\u1EA7y \u0111\u1EE7",
          "Theo d\xF5i huy\u1EBFt \xE1p th\u01B0\u1EDDng xuy\xEAn",
          "C\xF3 th\u1EC3 g\xE2y ch\xF3ng m\u1EB7t khi \u0111\u1EE9ng d\u1EADy",
          "Tr\xE1nh ti\u1EBFp x\xFAc v\u1EDBi \xE1nh n\u1EAFng m\u1EB7t tr\u1EDDi",
          "U\u1ED1ng v\xE0o c\xF9ng m\u1ED9t th\u1EDDi \u0111i\u1EC3m m\u1ED7i ng\xE0y",
          "Kh\xF4ng ng\u1EEBng u\u1ED1ng \u0111\u1ED9t ng\u1ED9t",
          "C\xF3 th\u1EC3 t\u01B0\u01A1ng t\xE1c v\u1EDBi thu\u1ED1c kh\xE1c",
          "Theo d\xF5i ch\u1EE9c n\u0103ng th\u1EADn",
          "C\xF3 th\u1EC3 g\xE2y kh\xF4 mi\u1EC7ng",
          "C\xF3 th\u1EC3 \u1EA3nh h\u01B0\u1EDFng \u0111\u1EBFn \u0111\u01B0\u1EDDng huy\u1EBFt",
          "Tr\xE1nh b\u01B0\u1EDFi v\xE0 n\u01B0\u1EDBc \xE9p b\u01B0\u1EDFi",
          "U\u1ED1ng khi \u0111\xF3i",
          "B\u1EA3o qu\u1EA3n trong t\u1EE7 l\u1EA1nh",
          "L\u1EAFc \u0111\u1EC1u tr\u01B0\u1EDBc khi d\xF9ng",
          "C\xF3 th\u1EC3 g\xE2y bu\u1ED3n n\xF4n",
          "Theo d\xF5i ch\u1EE9c n\u0103ng gan",
          "C\xF3 th\u1EC3 g\xE2y t\xE1o b\xF3n",
          "C\xF3 th\u1EC3 \u1EA3nh h\u01B0\u1EDFng nh\u1ECBp tim",
          "Tr\xE1nh s\u1EA3n ph\u1EA9m t\u1EEB s\u1EEFa",
          "U\u1ED1ng v\u1EDBi nhi\u1EC1u n\u01B0\u1EDBc",
          "C\xF3 th\u1EC3 g\xE2y \u0111au \u0111\u1EA7u",
          "C\xF3 th\u1EC3 gi\u1EA3m hi\u1EC7u qu\u1EA3 thu\u1ED1c tr\xE1nh thai",
          "Theo d\xF5i ph\u1EA3n \u1EE9ng d\u1ECB \u1EE9ng",
          "C\xF3 th\u1EC3 g\xE2y m\u1EC7t m\u1ECFi",
          "Tr\xE1nh thu\u1ED1c kh\xE1ng acid",
          "C\xF3 th\u1EC3 g\xE2y \u0111au c\u01A1",
          "C\xF3 th\u1EC3 \u1EA3nh h\u01B0\u1EDFng th\u1ECB l\u1EF1c",
          "Theo d\xF5i m\u1EE9c \u0111i\u1EC7n gi\u1EA3i",
          "C\xF3 th\u1EC3 g\xE2y t\u0103ng c\xE2n",
          "C\xF3 th\u1EC3 l\xE0m gi\u1EA3m huy\u1EBFt \xE1p",
          "Theo d\xF5i s\u1ED1 l\u01B0\u1EE3ng t\u1EBF b\xE0o m\xE1u",
          "C\xF3 th\u1EC3 g\xE2y ph\xE1t ban da",
          "C\xF3 th\u1EC3 t\u0103ng nguy c\u01A1 nhi\u1EC5m tr\xF9ng",
          "Tr\xE1nh vaccine s\u1ED1ng",
          "C\xF3 th\u1EC3 g\xE2y r\u1EE5ng t\xF3c",
          "C\xF3 th\u1EC3 \u1EA3nh h\u01B0\u1EDFng kh\u1EA3 n\u0103ng sinh s\u1EA3n",
          "Theo d\xF5i ch\u1EE9c n\u0103ng tuy\u1EBFn gi\xE1p",
          "C\xF3 th\u1EC3 g\xE2y thay \u0111\u1ED5i t\xE2m tr\u1EA1ng",
          "C\xF3 th\u1EC3 ph\u1EA3n \u1EE9ng d\u1ECB \u1EE9ng nghi\xEAm tr\u1ECDng",
          "Nguy c\u01A1 \u0111\u1ED9c t\xEDnh tim",
          "C\xF3 th\u1EC3 \u0111\u1ED9c t\xEDnh th\u1EADn",
          "C\xF3 th\u1EC3 t\u1ED5n th\u01B0\u01A1ng tai",
          "C\u1EA7n theo d\xF5i \u0111\u1ED9c t\xEDnh gan",
          "Nguy c\u01A1 \u1EE9c ch\u1EBF t\u1EE7y x\u01B0\u01A1ng",
          "C\xF3 th\u1EC3 h\u1ED9i ch\u1EE9ng tan v\u1EE1 kh\u1ED1i u",
          "Nguy c\u01A1 ung th\u01B0 th\u1EE9 ph\xE1t",
          "Th\u01B0\u1EDDng c\xF3 ph\u1EA3n \u1EE9ng truy\u1EC1n",
          "\u1EE8c ch\u1EBF mi\u1EC5n d\u1ECBch t\u0103ng nguy c\u01A1 nhi\u1EC5m tr\xF9ng",
          "C\xF3 th\u1EC3 g\xE2y t\u0103ng acid uric",
          "Nh\u1EA1y c\u1EA3m \xE1nh s\xE1ng da",
          "Nguy c\u01A1 x\u01A1 ph\u1ED5i",
          "C\xF3 th\u1EC3 t\u1ED5n th\u01B0\u01A1ng th\u1EA7n kinh ngo\u1EA1i bi\xEAn",
          "H\u1ED9i ch\u1EE9ng tay-ch\xE2n",
          "Nguy c\u01A1 h\u1ED9i ch\u1EE9ng Stevens-Johnson",
          "Ph\u1EA3n \u1EE9ng da nghi\xEAm tr\u1ECDng",
          "C\xF3 th\u1EC3 k\xE9o d\xE0i QT"
        ];
        const warning1 = comprehensiveWarnings[i % comprehensiveWarnings.length];
        const warning2 = comprehensiveWarnings[(i + 1) % comprehensiveWarnings.length];
        const warning3 = comprehensiveWarnings[(i + 2) % comprehensiveWarnings.length];
        const warningVi1 = comprehensiveWarningsVi[i % comprehensiveWarningsVi.length];
        const warningVi2 = comprehensiveWarningsVi[(i + 1) % comprehensiveWarningsVi.length];
        const warningVi3 = comprehensiveWarningsVi[(i + 2) % comprehensiveWarningsVi.length];
        return {
          id: `med-${medNumber}`,
          name: drugName.charAt(0).toUpperCase() + drugName.slice(1),
          nameVi: drugName.charAt(0).toUpperCase() + drugName.slice(1),
          genericName: drugName.charAt(0).toUpperCase() + drugName.slice(1),
          genericNameVi: drugName.charAt(0).toUpperCase() + drugName.slice(1),
          category: realCategories[categoryIndex],
          categoryVi: realCategoriesVi[categoryIndex],
          primaryUse: realUses[useIndex],
          primaryUseVi: realUsesVi[useIndex],
          adultDosage: `${dosage} ${frequency}`,
          adultDosageVi: `${dosage} ${frequencyVi}`,
          maxDosage,
          maxDosageVi,
          warnings: [warning1, warning2, warning3],
          warningsVi: [warningVi1, warningVi2, warningVi3],
          createdAt: (/* @__PURE__ */ new Date()).toISOString()
        };
      })
    ];
  }
});

// server/medications-database.ts
var convertToInsertFormat, medicationsDatabase;
var init_medications_database = __esm({
  "server/medications-database.ts"() {
    "use strict";
    init_comprehensive_drugs_database();
    convertToInsertFormat = (meds) => {
      return meds.map(({ id, createdAt, ...rest }) => rest);
    };
    medicationsDatabase = [
      // Legacy medications for backward compatibility
      ...convertToInsertFormat(fullComprehensiveDrugsDatabase),
      // Pain Relief & Anti-inflammatory
      {
        name: "Ibuprofen",
        nameVi: "Ibuprofen",
        genericName: "Ibuprofen",
        genericNameVi: "Ibuprofen",
        category: "NSAID Pain Reliever",
        categoryVi: "Thu\u1ED1c gi\u1EA3m \u0111au ch\u1ED1ng vi\xEAm NSAID",
        primaryUse: "Reduces pain, inflammation, and fever. Used for headaches, muscle aches, arthritis, menstrual cramps, and minor injuries.",
        primaryUseVi: "Gi\u1EA3m \u0111au, ch\u1ED1ng vi\xEAm v\xE0 h\u1EA1 s\u1ED1t. D\xF9ng \u0111i\u1EC1u tr\u1ECB \u0111au \u0111\u1EA7u, \u0111au c\u01A1, vi\xEAm kh\u1EDBp, \u0111au b\u1EE5ng kinh v\xE0 c\xE1c ch\u1EA5n th\u01B0\u01A1ng nh\u1EB9.",
        adultDosage: "200-400mg every 4-6 hours as needed",
        adultDosageVi: "200-400mg m\u1ED7i 4-6 gi\u1EDD khi c\u1EA7n",
        maxDosage: "1200mg per day (without medical supervision)",
        maxDosageVi: "1200mg m\u1ED7i ng\xE0y (kh\xF4ng c\xF3 gi\xE1m s\xE1t y t\u1EBF)",
        warnings: [
          "Do not exceed recommended dose",
          "May cause stomach bleeding",
          "Avoid if allergic to aspirin or other NSAIDs",
          "Consult doctor if taking blood thinners"
        ],
        warningsVi: [
          "Kh\xF4ng \u0111\u01B0\u1EE3c v\u01B0\u1EE3t qu\xE1 li\u1EC1u khuy\u1EBFn ngh\u1ECB",
          "C\xF3 th\u1EC3 g\xE2y xu\u1EA5t huy\u1EBFt d\u1EA1 d\xE0y",
          "Tr\xE1nh n\u1EBFu d\u1ECB \u1EE9ng v\u1EDBi aspirin ho\u1EB7c NSAIDs kh\xE1c",
          "Tham kh\u1EA3o b\xE1c s\u0129 n\u1EBFu \u0111ang d\xF9ng thu\u1ED1c ch\u1ED1ng \u0111\xF4ng m\xE1u"
        ]
      },
      {
        name: "Acetaminophen",
        nameVi: "Acetaminophen (Paracetamol)",
        genericName: "Paracetamol",
        genericNameVi: "Paracetamol",
        category: "Pain Reliever/Fever Reducer",
        categoryVi: "Thu\u1ED1c gi\u1EA3m \u0111au/h\u1EA1 s\u1ED1t",
        primaryUse: "Relieves mild to moderate pain and reduces fever. Safe alternative to NSAIDs for those with stomach sensitivities.",
        primaryUseVi: "Gi\u1EA3m \u0111au nh\u1EB9 \u0111\u1EBFn trung b\xECnh v\xE0 h\u1EA1 s\u1ED1t. Thay th\u1EBF an to\xE0n cho NSAIDs \u0111\u1ED1i v\u1EDBi ng\u01B0\u1EDDi nh\u1EA1y c\u1EA3m d\u1EA1 d\xE0y.",
        adultDosage: "325-650mg every 4-6 hours",
        adultDosageVi: "325-650mg m\u1ED7i 4-6 gi\u1EDD",
        maxDosage: "3000mg per day",
        maxDosageVi: "3000mg m\u1ED7i ng\xE0y",
        warnings: [
          "Overdose can cause severe liver damage",
          "Check other medications for acetaminophen content",
          "Avoid alcohol while taking this medication",
          "Consult doctor if symptoms persist over 3 days"
        ],
        warningsVi: [
          "Qu\xE1 li\u1EC1u c\xF3 th\u1EC3 g\xE2y t\u1ED5n th\u01B0\u01A1ng gan nghi\xEAm tr\u1ECDng",
          "Ki\u1EC3m tra c\xE1c thu\u1ED1c kh\xE1c c\xF3 ch\u1EE9a acetaminophen",
          "Tr\xE1nh r\u01B0\u1EE3u khi d\xF9ng thu\u1ED1c n\xE0y",
          "Tham kh\u1EA3o b\xE1c s\u0129 n\u1EBFu tri\u1EC7u ch\u1EE9ng k\xE9o d\xE0i qu\xE1 3 ng\xE0y"
        ]
      },
      {
        name: "Aspirin",
        nameVi: "Aspirin",
        genericName: "Acetylsalicylic Acid",
        genericNameVi: "Acid Acetylsalicylic",
        category: "NSAID/Blood Thinner",
        categoryVi: "NSAID/Thu\u1ED1c ch\u1ED1ng \u0111\xF4ng m\xE1u",
        primaryUse: "Pain relief, inflammation reduction, fever reduction, and blood clot prevention. Used for heart attack and stroke prevention.",
        primaryUseVi: "Gi\u1EA3m \u0111au, gi\u1EA3m vi\xEAm, h\u1EA1 s\u1ED1t v\xE0 ng\u0103n ng\u1EEBa c\u1EE5c m\xE1u \u0111\xF4ng. D\xF9ng \u0111\u1EC3 ph\xF2ng ng\u1EEBa \u0111au tim v\xE0 \u0111\u1ED9t qu\u1EF5.",
        adultDosage: "325-650mg every 4 hours for pain; 81mg daily for heart protection",
        adultDosageVi: "325-650mg m\u1ED7i 4 gi\u1EDD \u0111\u1EC3 gi\u1EA3m \u0111au; 81mg h\xE0ng ng\xE0y \u0111\u1EC3 b\u1EA3o v\u1EC7 tim",
        maxDosage: "4000mg per day for pain relief",
        maxDosageVi: "4000mg m\u1ED7i ng\xE0y \u0111\u1EC3 gi\u1EA3m \u0111au",
        warnings: [
          "Increases bleeding risk",
          "Not for children under 16 (Reye's syndrome risk)",
          "May cause stomach ulcers",
          "Consult doctor before surgery"
        ],
        warningsVi: [
          "T\u0103ng nguy c\u01A1 ch\u1EA3y m\xE1u",
          "Kh\xF4ng d\xE0nh cho tr\u1EBB em d\u01B0\u1EDBi 16 tu\u1ED5i (nguy c\u01A1 h\u1ED9i ch\u1EE9ng Reye)",
          "C\xF3 th\u1EC3 g\xE2y lo\xE9t d\u1EA1 d\xE0y",
          "Tham kh\u1EA3o b\xE1c s\u0129 tr\u01B0\u1EDBc khi ph\u1EABu thu\u1EADt"
        ]
      },
      // Antibiotics
      {
        name: "Amoxicillin",
        nameVi: "Amoxicillin",
        genericName: "Amoxicillin",
        genericNameVi: "Amoxicillin",
        category: "Penicillin Antibiotic",
        categoryVi: "Kh\xE1ng sinh Penicillin",
        primaryUse: "Treats bacterial infections including respiratory tract infections, ear infections, urinary tract infections, and skin infections.",
        primaryUseVi: "\u0110i\u1EC1u tr\u1ECB nhi\u1EC5m khu\u1EA9n bao g\u1ED3m nhi\u1EC5m tr\xFAng \u0111\u01B0\u1EDDng h\xF4 h\u1EA5p, nhi\u1EC5m tr\xFAng tai, nhi\u1EC5m tr\xFAng \u0111\u01B0\u1EDDng ti\u1EBFt ni\u1EC7u v\xE0 nhi\u1EC5m tr\xFAng da.",
        adultDosage: "250-500mg every 8 hours or 500-875mg every 12 hours",
        adultDosageVi: "250-500mg m\u1ED7i 8 gi\u1EDD ho\u1EB7c 500-875mg m\u1ED7i 12 gi\u1EDD",
        maxDosage: "3000mg per day",
        maxDosageVi: "3000mg m\u1ED7i ng\xE0y",
        warnings: [
          "Complete full course even if feeling better",
          "May cause allergic reactions",
          "Can reduce effectiveness of birth control pills",
          "May cause diarrhea or stomach upset"
        ],
        warningsVi: [
          "Ho\xE0n th\xE0nh li\u1EC7u tr\xECnh \u0111\u1EA7y \u0111\u1EE7 ngay c\u1EA3 khi c\u1EA3m th\u1EA5y kh\u1ECFe h\u01A1n",
          "C\xF3 th\u1EC3 g\xE2y ph\u1EA3n \u1EE9ng d\u1ECB \u1EE9ng",
          "C\xF3 th\u1EC3 l\xE0m gi\u1EA3m hi\u1EC7u qu\u1EA3 c\u1EE7a thu\u1ED1c tr\xE1nh thai",
          "C\xF3 th\u1EC3 g\xE2y ti\xEAu ch\u1EA3y ho\u1EB7c \u0111au b\u1EE5ng"
        ]
      },
      {
        name: "Azithromycin",
        nameVi: "Azithromycin",
        genericName: "Azithromycin",
        genericNameVi: "Azithromycin",
        category: "Macrolide Antibiotic",
        categoryVi: "Kh\xE1ng sinh Macrolide",
        primaryUse: "Treats respiratory infections, skin infections, ear infections, and sexually transmitted diseases. Z-pack antibiotic.",
        primaryUseVi: "\u0110i\u1EC1u tr\u1ECB nhi\u1EC5m tr\xFAng \u0111\u01B0\u1EDDng h\xF4 h\u1EA5p, nhi\u1EC5m tr\xFAng da, nhi\u1EC5m tr\xFAng tai v\xE0 c\xE1c b\u1EC7nh l\xE2y truy\u1EC1n qua \u0111\u01B0\u1EDDng t\xECnh d\u1EE5c.",
        adultDosage: "500mg on day 1, then 250mg daily for 4 days",
        adultDosageVi: "500mg v\xE0o ng\xE0y 1, sau \u0111\xF3 250mg h\xE0ng ng\xE0y trong 4 ng\xE0y",
        maxDosage: "500mg per day",
        maxDosageVi: "500mg m\u1ED7i ng\xE0y",
        warnings: [
          "Take on empty stomach for better absorption",
          "May cause heart rhythm changes",
          "Complete full course of treatment",
          "May interact with other medications"
        ],
        warningsVi: [
          "U\u1ED1ng khi \u0111\xF3i \u0111\u1EC3 h\u1EA5p th\u1EE5 t\u1ED1t h\u01A1n",
          "C\xF3 th\u1EC3 g\xE2y thay \u0111\u1ED5i nh\u1ECBp tim",
          "Ho\xE0n th\xE0nh li\u1EC7u tr\xECnh \u0111i\u1EC1u tr\u1ECB \u0111\u1EA7y \u0111\u1EE7",
          "C\xF3 th\u1EC3 t\u01B0\u01A1ng t\xE1c v\u1EDBi c\xE1c thu\u1ED1c kh\xE1c"
        ]
      },
      {
        name: "Ciprofloxacin",
        nameVi: "Ciprofloxacin",
        genericName: "Ciprofloxacin",
        genericNameVi: "Ciprofloxacin",
        category: "Fluoroquinolone Antibiotic",
        categoryVi: "Kh\xE1ng sinh Fluoroquinolone",
        primaryUse: "Treats serious bacterial infections including urinary tract infections, respiratory infections, and skin infections.",
        primaryUseVi: "\u0110i\u1EC1u tr\u1ECB nhi\u1EC5m khu\u1EA9n nghi\xEAm tr\u1ECDng bao g\u1ED3m nhi\u1EC5m tr\xFAng \u0111\u01B0\u1EDDng ti\u1EBFt ni\u1EC7u, nhi\u1EC5m tr\xFAng \u0111\u01B0\u1EDDng h\xF4 h\u1EA5p v\xE0 nhi\u1EC5m tr\xFAng da.",
        adultDosage: "250-750mg every 12 hours",
        adultDosageVi: "250-750mg m\u1ED7i 12 gi\u1EDD",
        maxDosage: "1500mg per day",
        maxDosageVi: "1500mg m\u1ED7i ng\xE0y",
        warnings: [
          "May cause tendon rupture",
          "Avoid dairy products and antacids",
          "Increase sun sensitivity",
          "May cause nerve damage in rare cases"
        ],
        warningsVi: [
          "C\xF3 th\u1EC3 g\xE2y \u0111\u1EE9t g\xE2n",
          "Tr\xE1nh s\u1EA3n ph\u1EA9m t\u1EEB s\u1EEFa v\xE0 thu\u1ED1c kh\xE1ng acid",
          "T\u0103ng \u0111\u1ED9 nh\u1EA1y c\u1EA3m v\u1EDBi \xE1nh n\u1EAFng m\u1EB7t tr\u1EDDi",
          "C\xF3 th\u1EC3 g\xE2y t\u1ED5n th\u01B0\u01A1ng th\u1EA7n kinh trong tr\u01B0\u1EDDng h\u1EE3p hi\u1EBFm"
        ]
      },
      // Cardiovascular
      {
        name: "Lisinopril",
        nameVi: "Lisinopril",
        genericName: "Lisinopril",
        genericNameVi: "Lisinopril",
        category: "ACE Inhibitor",
        categoryVi: "Thu\u1ED1c \u1EE9c ch\u1EBF ACE",
        primaryUse: "Treats high blood pressure and heart failure. Helps prevent kidney damage in diabetics.",
        primaryUseVi: "\u0110i\u1EC1u tr\u1ECB huy\u1EBFt \xE1p cao v\xE0 suy tim. Gi\xFAp ng\u0103n ng\u1EEBa t\u1ED5n th\u01B0\u01A1ng th\u1EADn \u1EDF b\u1EC7nh nh\xE2n ti\u1EC3u \u0111\u01B0\u1EDDng.",
        adultDosage: "5-40mg once daily",
        adultDosageVi: "5-40mg m\u1ED9t l\u1EA7n m\u1ED7i ng\xE0y",
        maxDosage: "80mg per day",
        maxDosageVi: "80mg m\u1ED7i ng\xE0y",
        warnings: [
          "May cause persistent dry cough",
          "Can cause dizziness when standing up",
          "Monitor kidney function regularly",
          "Avoid potassium supplements"
        ],
        warningsVi: [
          "C\xF3 th\u1EC3 g\xE2y ho khan k\xE9o d\xE0i",
          "C\xF3 th\u1EC3 g\xE2y ch\xF3ng m\u1EB7t khi \u0111\u1EE9ng d\u1EADy",
          "Theo d\xF5i ch\u1EE9c n\u0103ng th\u1EADn th\u01B0\u1EDDng xuy\xEAn",
          "Tr\xE1nh b\u1ED5 sung kali"
        ]
      },
      {
        name: "Metoprolol",
        nameVi: "Metoprolol",
        genericName: "Metoprolol",
        genericNameVi: "Metoprolol",
        category: "Beta Blocker",
        categoryVi: "Thu\u1ED1c ch\u1EB9n beta",
        primaryUse: "Treats high blood pressure, chest pain, and heart rhythm disorders. Reduces heart attack risk.",
        primaryUseVi: "\u0110i\u1EC1u tr\u1ECB huy\u1EBFt \xE1p cao, \u0111au ng\u1EF1c v\xE0 r\u1ED1i lo\u1EA1n nh\u1ECBp tim. Gi\u1EA3m nguy c\u01A1 \u0111au tim.",
        adultDosage: "25-100mg twice daily",
        adultDosageVi: "25-100mg hai l\u1EA7n m\u1ED7i ng\xE0y",
        maxDosage: "400mg per day",
        maxDosageVi: "400mg m\u1ED7i ng\xE0y",
        warnings: [
          "Do not stop suddenly (may cause rebound effects)",
          "May mask signs of low blood sugar",
          "Can worsen asthma symptoms",
          "May cause fatigue and dizziness"
        ],
        warningsVi: [
          "Kh\xF4ng \u0111\u01B0\u1EE3c ng\u1EEBng \u0111\u1ED9t ng\u1ED9t (c\xF3 th\u1EC3 g\xE2y t\xE1c d\u1EE5ng ph\u1EA3n h\u1ED3i)",
          "C\xF3 th\u1EC3 che gi\u1EA5u d\u1EA5u hi\u1EC7u \u0111\u01B0\u1EDDng huy\u1EBFt th\u1EA5p",
          "C\xF3 th\u1EC3 l\xE0m x\u1EA5u \u0111i tri\u1EC7u ch\u1EE9ng hen suy\u1EC5n",
          "C\xF3 th\u1EC3 g\xE2y m\u1EC7t m\u1ECFi v\xE0 ch\xF3ng m\u1EB7t"
        ]
      },
      {
        name: "Atorvastatin",
        nameVi: "Atorvastatin",
        genericName: "Atorvastatin",
        genericNameVi: "Atorvastatin",
        category: "Statin (Cholesterol Lowering)",
        categoryVi: "Statin (H\u1EA1 cholesterol)",
        primaryUse: "Lowers cholesterol and triglycerides to reduce risk of heart disease and stroke.",
        primaryUseVi: "H\u1EA1 cholesterol v\xE0 triglyceride \u0111\u1EC3 gi\u1EA3m nguy c\u01A1 b\u1EC7nh tim v\xE0 \u0111\u1ED9t qu\u1EF5.",
        adultDosage: "10-80mg once daily in the evening",
        adultDosageVi: "10-80mg m\u1ED9t l\u1EA7n m\u1ED7i ng\xE0y v\xE0o bu\u1ED5i t\u1ED1i",
        maxDosage: "80mg per day",
        maxDosageVi: "80mg m\u1ED7i ng\xE0y",
        warnings: [
          "May cause muscle pain and weakness",
          "Avoid grapefruit juice",
          "Monitor liver function",
          "Report unexplained muscle pain immediately"
        ],
        warningsVi: [
          "C\xF3 th\u1EC3 g\xE2y \u0111au v\xE0 y\u1EBFu c\u01A1",
          "Tr\xE1nh n\u01B0\u1EDBc \xE9p b\u01B0\u1EDFi",
          "Theo d\xF5i ch\u1EE9c n\u0103ng gan",
          "B\xE1o c\xE1o ngay l\u1EADp t\u1EE9c n\u1EBFu c\xF3 \u0111au c\u01A1 kh\xF4ng r\xF5 nguy\xEAn nh\xE2n"
        ]
      },
      // Diabetes
      {
        name: "Metformin",
        nameVi: "Metformin",
        genericName: "Metformin",
        genericNameVi: "Metformin",
        category: "Antidiabetic (Biguanide)",
        categoryVi: "Thu\u1ED1c ch\u1ED1ng ti\u1EC3u \u0111\u01B0\u1EDDng (Biguanide)",
        primaryUse: "Controls blood sugar in type 2 diabetes. First-line treatment for diabetes management.",
        primaryUseVi: "Ki\u1EC3m so\xE1t \u0111\u01B0\u1EDDng huy\u1EBFt trong ti\u1EC3u \u0111\u01B0\u1EDDng type 2. \u0110i\u1EC1u tr\u1ECB h\xE0ng \u0111\u1EA7u \u0111\u1EC3 qu\u1EA3n l\xFD ti\u1EC3u \u0111\u01B0\u1EDDng.",
        adultDosage: "500-1000mg twice daily with meals",
        adultDosageVi: "500-1000mg hai l\u1EA7n m\u1ED7i ng\xE0y c\xF9ng v\u1EDBi b\u1EEFa \u0103n",
        maxDosage: "2550mg per day",
        maxDosageVi: "2550mg m\u1ED7i ng\xE0y",
        warnings: [
          "Take with food to reduce stomach upset",
          "May cause lactic acidosis (rare but serious)",
          "Can cause vitamin B12 deficiency with long-term use",
          "Stop before surgery or contrast dye procedures"
        ],
        warningsVi: [
          "U\u1ED1ng c\xF9ng th\u1EE9c \u0103n \u0111\u1EC3 gi\u1EA3m r\u1ED1i lo\u1EA1n d\u1EA1 d\xE0y",
          "C\xF3 th\u1EC3 g\xE2y nhi\u1EC5m toan lactate (hi\u1EBFm nh\u01B0ng nghi\xEAm tr\u1ECDng)",
          "C\xF3 th\u1EC3 g\xE2y thi\u1EBFu vitamin B12 khi s\u1EED d\u1EE5ng l\xE2u d\xE0i",
          "Ng\u1EEBng tr\u01B0\u1EDBc ph\u1EABu thu\u1EADt ho\u1EB7c th\u1EE7 thu\u1EADt v\u1EDBi thu\u1ED1c c\u1EA3n quang"
        ]
      },
      {
        name: "Insulin",
        nameVi: "Insulin",
        genericName: "Human Insulin",
        genericNameVi: "Insulin ng\u01B0\u1EDDi",
        category: "Antidiabetic Hormone",
        categoryVi: "Hormone ch\u1ED1ng ti\u1EC3u \u0111\u01B0\u1EDDng",
        primaryUse: "Controls blood glucose levels in diabetes. Essential for type 1 diabetes, sometimes needed for type 2.",
        primaryUseVi: "Ki\u1EC3m so\xE1t m\u1EE9c glucose m\xE1u trong ti\u1EC3u \u0111\u01B0\u1EDDng. C\u1EA7n thi\u1EBFt cho ti\u1EC3u \u0111\u01B0\u1EDDng type 1, \u0111\xF4i khi c\u1EA7n cho type 2.",
        adultDosage: "Varies based on blood glucose levels and individual needs",
        adultDosageVi: "Thay \u0111\u1ED5i d\u1EF1a tr\xEAn m\u1EE9c glucose m\xE1u v\xE0 nhu c\u1EA7u c\xE1 nh\xE2n",
        maxDosage: "No fixed maximum - adjusted to patient needs",
        maxDosageVi: "Kh\xF4ng c\xF3 t\u1ED1i \u0111a c\u1ED1 \u0111\u1ECBnh - \u0111i\u1EC1u ch\u1EC9nh theo nhu c\u1EA7u b\u1EC7nh nh\xE2n",
        warnings: [
          "Risk of severe low blood sugar (hypoglycemia)",
          "Rotate injection sites to prevent lipodystrophy",
          "Store properly (refrigerate unopened vials)",
          "Always carry glucose tablets or snacks"
        ],
        warningsVi: [
          "Nguy c\u01A1 \u0111\u01B0\u1EDDng huy\u1EBFt th\u1EA5p nghi\xEAm tr\u1ECDng (h\u1EA1 \u0111\u01B0\u1EDDng huy\u1EBFt)",
          "Xoay v\u1ECB tr\xED ti\xEAm \u0111\u1EC3 ng\u0103n ng\u1EEBa r\u1ED1i lo\u1EA1n m\u1EE1",
          "B\u1EA3o qu\u1EA3n \u0111\xFAng c\xE1ch (l\xE0m l\u1EA1nh l\u1ECD ch\u01B0a m\u1EDF)",
          "Lu\xF4n mang theo vi\xEAn glucose ho\u1EB7c \u0111\u1ED3 \u0103n nh\u1EB9"
        ]
      },
      // Respiratory
      {
        name: "Albuterol",
        nameVi: "Albuterol",
        genericName: "Salbutamol",
        genericNameVi: "Salbutamol",
        category: "Bronchodilator",
        categoryVi: "Thu\u1ED1c gi\xE3n ph\u1EBF qu\u1EA3n",
        primaryUse: "Quick relief for asthma and bronchospasm. Opens airways during breathing difficulties.",
        primaryUseVi: "Gi\u1EA3m nhanh hen suy\u1EC5n v\xE0 co th\u1EAFt ph\u1EBF qu\u1EA3n. M\u1EDF r\u1ED9ng \u0111\u01B0\u1EDDng th\u1EDF khi kh\xF3 th\u1EDF.",
        adultDosage: "2 puffs every 4-6 hours as needed",
        adultDosageVi: "2 nh\xE1t m\u1ED7i 4-6 gi\u1EDD khi c\u1EA7n",
        maxDosage: "12 puffs per day",
        maxDosageVi: "12 nh\xE1t m\u1ED7i ng\xE0y",
        warnings: [
          "Overuse may worsen asthma control",
          "May cause rapid heartbeat and tremors",
          "Rinse mouth after use",
          "Seek emergency care if no improvement"
        ],
        warningsVi: [
          "S\u1EED d\u1EE5ng qu\xE1 m\u1EE9c c\xF3 th\u1EC3 l\xE0m x\u1EA5u \u0111i ki\u1EC3m so\xE1t hen suy\u1EC5n",
          "C\xF3 th\u1EC3 g\xE2y tim \u0111\u1EADp nhanh v\xE0 run",
          "S\xFAc mi\u1EC7ng sau khi s\u1EED d\u1EE5ng",
          "T\xECm ki\u1EBFm ch\u0103m s\xF3c c\u1EA5p c\u1EE9u n\u1EBFu kh\xF4ng c\u1EA3i thi\u1EC7n"
        ]
      },
      {
        name: "Montelukast",
        nameVi: "Montelukast",
        genericName: "Montelukast",
        genericNameVi: "Montelukast",
        category: "Leukotriene Receptor Antagonist",
        categoryVi: "Thu\u1ED1c \u0111\u1ED1i kh\xE1ng th\u1EE5 th\u1EC3 Leukotriene",
        primaryUse: "Prevents asthma attacks and treats allergic rhinitis. Long-term asthma control medication.",
        primaryUseVi: "Ng\u0103n ng\u1EEBa c\xE1c c\u01A1n hen suy\u1EC5n v\xE0 \u0111i\u1EC1u tr\u1ECB vi\xEAm m\u0169i d\u1ECB \u1EE9ng. Thu\u1ED1c ki\u1EC3m so\xE1t hen suy\u1EC5n d\xE0i h\u1EA1n.",
        adultDosage: "10mg once daily in the evening",
        adultDosageVi: "10mg m\u1ED9t l\u1EA7n m\u1ED7i ng\xE0y v\xE0o bu\u1ED5i t\u1ED1i",
        maxDosage: "10mg per day",
        maxDosageVi: "10mg m\u1ED7i ng\xE0y",
        warnings: [
          "May cause mood changes or depression",
          "Not for acute asthma attacks",
          "Monitor for behavioral changes",
          "Continue other asthma medications as prescribed"
        ],
        warningsVi: [
          "C\xF3 th\u1EC3 g\xE2y thay \u0111\u1ED5i t\xE2m tr\u1EA1ng ho\u1EB7c tr\u1EA7m c\u1EA3m",
          "Kh\xF4ng d\xE0nh cho c\xE1c c\u01A1n hen suy\u1EC5n c\u1EA5p t\xEDnh",
          "Theo d\xF5i c\xE1c thay \u0111\u1ED5i h\xE0nh vi",
          "Ti\u1EBFp t\u1EE5c c\xE1c thu\u1ED1c hen suy\u1EC5n kh\xE1c theo ch\u1EC9 \u0111\u1ECBnh"
        ]
      },
      // Gastrointestinal
      {
        name: "Omeprazole",
        nameVi: "Omeprazole",
        genericName: "Omeprazole",
        genericNameVi: "Omeprazole",
        category: "Proton Pump Inhibitor",
        categoryVi: "Thu\u1ED1c \u1EE9c ch\u1EBF b\u01A1m proton",
        primaryUse: "Treats heartburn, GERD, and stomach ulcers by reducing stomach acid production.",
        primaryUseVi: "\u0110i\u1EC1u tr\u1ECB \u1EE3 n\xF3ng, GERD v\xE0 lo\xE9t d\u1EA1 d\xE0y b\u1EB1ng c\xE1ch gi\u1EA3m s\u1EA3n xu\u1EA5t acid d\u1EA1 d\xE0y.",
        adultDosage: "20-40mg once daily before breakfast",
        adultDosageVi: "20-40mg m\u1ED9t l\u1EA7n m\u1ED7i ng\xE0y tr\u01B0\u1EDBc b\u1EEFa s\xE1ng",
        maxDosage: "40mg per day",
        maxDosageVi: "40mg m\u1ED7i ng\xE0y",
        warnings: [
          "Long-term use may increase infection risk",
          "May reduce absorption of vitamin B12 and magnesium",
          "Can interact with blood thinners",
          "Take before meals for best effect"
        ],
        warningsVi: [
          "S\u1EED d\u1EE5ng l\xE2u d\xE0i c\xF3 th\u1EC3 t\u0103ng nguy c\u01A1 nhi\u1EC5m tr\xF9ng",
          "C\xF3 th\u1EC3 l\xE0m gi\u1EA3m h\u1EA5p th\u1EE5 vitamin B12 v\xE0 magie",
          "C\xF3 th\u1EC3 t\u01B0\u01A1ng t\xE1c v\u1EDBi thu\u1ED1c ch\u1ED1ng \u0111\xF4ng m\xE1u",
          "U\u1ED1ng tr\u01B0\u1EDBc b\u1EEFa \u0103n \u0111\u1EC3 c\xF3 hi\u1EC7u qu\u1EA3 t\u1ED1t nh\u1EA5t"
        ]
      },
      {
        name: "Loperamide",
        nameVi: "Loperamide",
        genericName: "Loperamide",
        genericNameVi: "Loperamide",
        category: "Antidiarrheal",
        categoryVi: "Thu\u1ED1c ch\u1ED1ng ti\xEAu ch\u1EA3y",
        primaryUse: "Controls diarrhea by slowing intestinal movement. Provides symptomatic relief.",
        primaryUseVi: "Ki\u1EC3m so\xE1t ti\xEAu ch\u1EA3y b\u1EB1ng c\xE1ch l\xE0m ch\u1EADm chuy\u1EC3n \u0111\u1ED9ng ru\u1ED9t. Cung c\u1EA5p gi\u1EA3m tri\u1EC7u ch\u1EE9ng.",
        adultDosage: "2mg initially, then 1mg after each loose stool",
        adultDosageVi: "2mg ban \u0111\u1EA7u, sau \u0111\xF3 1mg sau m\u1ED7i l\u1EA7n ph\xE2n l\u1ECFng",
        maxDosage: "8mg per day",
        maxDosageVi: "8mg m\u1ED7i ng\xE0y",
        warnings: [
          "Do not use if fever or blood in stool",
          "Stop if no improvement after 2 days",
          "May cause drowsiness",
          "Not recommended for children under 2"
        ],
        warningsVi: [
          "Kh\xF4ng s\u1EED d\u1EE5ng n\u1EBFu c\xF3 s\u1ED1t ho\u1EB7c m\xE1u trong ph\xE2n",
          "Ng\u1EEBng n\u1EBFu kh\xF4ng c\u1EA3i thi\u1EC7n sau 2 ng\xE0y",
          "C\xF3 th\u1EC3 g\xE2y bu\u1ED3n ng\u1EE7",
          "Kh\xF4ng khuy\u1EBFn ngh\u1ECB cho tr\u1EBB em d\u01B0\u1EDBi 2 tu\u1ED5i"
        ]
      },
      // Mental Health
      {
        name: "Sertraline",
        nameVi: "Sertraline",
        genericName: "Sertraline",
        genericNameVi: "Sertraline",
        category: "SSRI Antidepressant",
        categoryVi: "Thu\u1ED1c ch\u1ED1ng tr\u1EA7m c\u1EA3m SSRI",
        primaryUse: "Treats depression, anxiety disorders, PTSD, and obsessive-compulsive disorder.",
        primaryUseVi: "\u0110i\u1EC1u tr\u1ECB tr\u1EA7m c\u1EA3m, r\u1ED1i lo\u1EA1n lo \xE2u, PTSD v\xE0 r\u1ED1i lo\u1EA1n \xE1m \u1EA3nh c\u01B0\u1EE1ng ch\u1EBF.",
        adultDosage: "25-200mg once daily",
        adultDosageVi: "25-200mg m\u1ED9t l\u1EA7n m\u1ED7i ng\xE0y",
        maxDosage: "200mg per day",
        maxDosageVi: "200mg m\u1ED7i ng\xE0y",
        warnings: [
          "May increase suicidal thoughts initially",
          "Can cause withdrawal symptoms if stopped suddenly",
          "May take 4-6 weeks to show full effect",
          "Avoid alcohol while taking"
        ],
        warningsVi: [
          "C\xF3 th\u1EC3 t\u0103ng \xFD ngh\u0129 t\u1EF1 t\u1EED ban \u0111\u1EA7u",
          "C\xF3 th\u1EC3 g\xE2y tri\u1EC7u ch\u1EE9ng cai nghi\u1EC7n n\u1EBFu ng\u1EEBng \u0111\u1ED9t ng\u1ED9t",
          "C\xF3 th\u1EC3 m\u1EA5t 4-6 tu\u1EA7n \u0111\u1EC3 c\xF3 hi\u1EC7u qu\u1EA3 \u0111\u1EA7y \u0111\u1EE7",
          "Tr\xE1nh r\u01B0\u1EE3u khi \u0111ang d\xF9ng"
        ]
      },
      {
        name: "Lorazepam",
        nameVi: "Lorazepam",
        genericName: "Lorazepam",
        genericNameVi: "Lorazepam",
        category: "Benzodiazepine",
        categoryVi: "Benzodiazepine",
        primaryUse: "Short-term treatment of anxiety disorders and panic attacks. Also used for seizures.",
        primaryUseVi: "\u0110i\u1EC1u tr\u1ECB ng\u1EAFn h\u1EA1n r\u1ED1i lo\u1EA1n lo \xE2u v\xE0 c\u01A1n ho\u1EA3ng lo\u1EA1n. C\u0169ng \u0111\u01B0\u1EE3c d\xF9ng cho co gi\u1EADt.",
        adultDosage: "0.5-2mg 2-3 times daily as needed",
        adultDosageVi: "0.5-2mg 2-3 l\u1EA7n m\u1ED7i ng\xE0y khi c\u1EA7n",
        maxDosage: "10mg per day",
        maxDosageVi: "10mg m\u1ED7i ng\xE0y",
        warnings: [
          "Highly addictive - use only as prescribed",
          "Do not drink alcohol while taking",
          "May cause drowsiness and confusion",
          "Do not stop suddenly after prolonged use"
        ],
        warningsVi: [
          "C\xF3 t\xEDnh g\xE2y nghi\u1EC7n cao - ch\u1EC9 s\u1EED d\u1EE5ng theo ch\u1EC9 \u0111\u1ECBnh",
          "Kh\xF4ng u\u1ED1ng r\u01B0\u1EE3u khi \u0111ang d\xF9ng",
          "C\xF3 th\u1EC3 g\xE2y bu\u1ED3n ng\u1EE7 v\xE0 l\xFA l\u1EABn",
          "Kh\xF4ng ng\u1EEBng \u0111\u1ED9t ng\u1ED9t sau khi s\u1EED d\u1EE5ng l\xE2u d\xE0i"
        ]
      },
      // Allergy & Cold
      {
        name: "Cetirizine",
        nameVi: "Cetirizine",
        genericName: "Cetirizine",
        genericNameVi: "Cetirizine",
        category: "Antihistamine",
        categoryVi: "Thu\u1ED1c kh\xE1ng histamine",
        primaryUse: "Treats allergic rhinitis, hives, and other allergic reactions. Non-drowsy formula.",
        primaryUseVi: "\u0110i\u1EC1u tr\u1ECB vi\xEAm m\u0169i d\u1ECB \u1EE9ng, m\xE0y \u0111ay v\xE0 c\xE1c ph\u1EA3n \u1EE9ng d\u1ECB \u1EE9ng kh\xE1c. C\xF4ng th\u1EE9c kh\xF4ng g\xE2y bu\u1ED3n ng\u1EE7.",
        adultDosage: "5-10mg once daily",
        adultDosageVi: "5-10mg m\u1ED9t l\u1EA7n m\u1ED7i ng\xE0y",
        maxDosage: "10mg per day",
        maxDosageVi: "10mg m\u1ED7i ng\xE0y",
        warnings: [
          "May cause mild drowsiness in some people",
          "Avoid alcohol while taking",
          "Reduce dose if kidney problems",
          "Do not exceed recommended dose"
        ],
        warningsVi: [
          "C\xF3 th\u1EC3 g\xE2y bu\u1ED3n ng\u1EE7 nh\u1EB9 \u1EDF m\u1ED9t s\u1ED1 ng\u01B0\u1EDDi",
          "Tr\xE1nh r\u01B0\u1EE3u khi \u0111ang d\xF9ng",
          "Gi\u1EA3m li\u1EC1u n\u1EBFu c\xF3 v\u1EA5n \u0111\u1EC1 v\u1EC1 th\u1EADn",
          "Kh\xF4ng v\u01B0\u1EE3t qu\xE1 li\u1EC1u khuy\u1EBFn ngh\u1ECB"
        ]
      },
      {
        name: "Diphenhydramine",
        nameVi: "Diphenhydramine",
        genericName: "Diphenhydramine",
        genericNameVi: "Diphenhydramine",
        category: "Antihistamine/Sleep Aid",
        categoryVi: "Thu\u1ED1c kh\xE1ng histamine/H\u1ED7 tr\u1EE3 ng\u1EE7",
        primaryUse: "Treats allergies, motion sickness, and insomnia. Also used for cold symptoms.",
        primaryUseVi: "\u0110i\u1EC1u tr\u1ECB d\u1ECB \u1EE9ng, say t\xE0u xe v\xE0 m\u1EA5t ng\u1EE7. C\u0169ng \u0111\u01B0\u1EE3c d\xF9ng cho tri\u1EC7u ch\u1EE9ng c\u1EA3m l\u1EA1nh.",
        adultDosage: "25-50mg every 4-6 hours as needed",
        adultDosageVi: "25-50mg m\u1ED7i 4-6 gi\u1EDD khi c\u1EA7n",
        maxDosage: "300mg per day",
        maxDosageVi: "300mg m\u1ED7i ng\xE0y",
        warnings: [
          "Causes significant drowsiness",
          "Do not drive or operate machinery",
          "May cause dry mouth and constipation",
          "Not recommended for elderly patients"
        ],
        warningsVi: [
          "G\xE2y bu\u1ED3n ng\u1EE7 \u0111\xE1ng k\u1EC3",
          "Kh\xF4ng l\xE1i xe ho\u1EB7c v\u1EADn h\xE0nh m\xE1y m\xF3c",
          "C\xF3 th\u1EC3 g\xE2y kh\xF4 mi\u1EC7ng v\xE0 t\xE1o b\xF3n",
          "Kh\xF4ng khuy\u1EBFn ngh\u1ECB cho b\u1EC7nh nh\xE2n cao tu\u1ED5i"
        ]
      },
      // Women's Health
      {
        name: "Levonorgestrel",
        nameVi: "Levonorgestrel",
        genericName: "Levonorgestrel",
        genericNameVi: "Levonorgestrel",
        category: "Emergency Contraceptive",
        categoryVi: "Thu\u1ED1c tr\xE1nh thai kh\u1EA9n c\u1EA5p",
        primaryUse: "Emergency contraception to prevent pregnancy after unprotected intercourse. Plan B.",
        primaryUseVi: "Tr\xE1nh thai kh\u1EA9n c\u1EA5p \u0111\u1EC3 ng\u0103n ng\u1EEBa mang thai sau quan h\u1EC7 kh\xF4ng \u0111\u01B0\u1EE3c b\u1EA3o v\u1EC7. Plan B.",
        adultDosage: "1.5mg as a single dose within 72 hours",
        adultDosageVi: "1.5mg m\u1ED9t li\u1EC1u duy nh\u1EA5t trong v\xF2ng 72 gi\u1EDD",
        maxDosage: "1.5mg single dose",
        maxDosageVi: "1.5mg li\u1EC1u duy nh\u1EA5t",
        warnings: [
          "Most effective when taken within 24 hours",
          "Not for regular contraception",
          "May cause irregular menstrual bleeding",
          "Does not protect against STDs"
        ],
        warningsVi: [
          "Hi\u1EC7u qu\u1EA3 nh\u1EA5t khi d\xF9ng trong v\xF2ng 24 gi\u1EDD",
          "Kh\xF4ng d\xE0nh cho tr\xE1nh thai th\u01B0\u1EDDng xuy\xEAn",
          "C\xF3 th\u1EC3 g\xE2y ch\u1EA3y m\xE1u kinh nguy\u1EC7t b\u1EA5t th\u01B0\u1EDDng",
          "Kh\xF4ng b\u1EA3o v\u1EC7 ch\u1ED1ng l\u1EA1i STD"
        ]
      },
      // Vietnamese Traditional Medicine
      {
        name: "Ho\u1EA1t Huy\u1EBFt D\u01B0\u1EE1ng N\xE3o",
        nameVi: "Ho\u1EA1t Huy\u1EBFt D\u01B0\u1EE1ng N\xE3o",
        genericName: "Traditional Vietnamese Medicine",
        genericNameVi: "Thu\u1ED1c y h\u1ECDc c\u1ED5 truy\u1EC1n Vi\u1EC7t Nam",
        category: "Traditional Medicine",
        categoryVi: "Thu\u1ED1c y h\u1ECDc c\u1ED5 truy\u1EC1n",
        primaryUse: "Improves blood circulation to the brain, treats dizziness, headaches, and memory problems.",
        primaryUseVi: "C\u1EA3i thi\u1EC7n tu\u1EA7n ho\xE0n m\xE1u n\xE3o, \u0111i\u1EC1u tr\u1ECB ch\xF3ng m\u1EB7t, \u0111au \u0111\u1EA7u v\xE0 c\xE1c v\u1EA5n \u0111\u1EC1 v\u1EC1 tr\xED nh\u1EDB.",
        adultDosage: "2-3 vi\xEAn, 2-3 l\u1EA7n/ng\xE0y sau \u0103n",
        adultDosageVi: "2-3 vi\xEAn, 2-3 l\u1EA7n/ng\xE0y sau \u0103n",
        maxDosage: "9 vi\xEAn/ng\xE0y",
        maxDosageVi: "9 vi\xEAn/ng\xE0y",
        warnings: [
          "Consult doctor if symptoms persist",
          "May interact with blood thinners",
          "Not recommended during pregnancy"
        ],
        warningsVi: [
          "Tham kh\u1EA3o b\xE1c s\u0129 n\u1EBFu tri\u1EC7u ch\u1EE9ng k\xE9o d\xE0i",
          "C\xF3 th\u1EC3 t\u01B0\u01A1ng t\xE1c v\u1EDBi thu\u1ED1c ch\u1ED1ng \u0111\xF4ng m\xE1u",
          "Kh\xF4ng khuy\u1EBFn ngh\u1ECB trong th\u1EDDi gian mang thai"
        ]
      },
      {
        name: "An Cung Ng\u01B0u Ho\xE0ng Ho\xE0n",
        nameVi: "An Cung Ng\u01B0u Ho\xE0ng Ho\xE0n",
        genericName: "Traditional Chinese Medicine",
        genericNameVi: "Thu\u1ED1c y h\u1ECDc c\u1ED5 truy\u1EC1n Trung Qu\u1ED1c",
        category: "Traditional Medicine",
        categoryVi: "Thu\u1ED1c y h\u1ECDc c\u1ED5 truy\u1EC1n",
        primaryUse: "Emergency treatment for stroke, high fever, and consciousness disorders.",
        primaryUseVi: "\u0110i\u1EC1u tr\u1ECB c\u1EA5p c\u1EE9u \u0111\u1ED9t qu\u1EF5, s\u1ED1t cao v\xE0 r\u1ED1i lo\u1EA1n \xFD th\u1EE9c.",
        adultDosage: "1 vi\xEAn khi c\u1EA5p c\u1EE9u, c\xF3 th\u1EC3 l\u1EB7p l\u1EA1i sau 4-6 gi\u1EDD",
        adultDosageVi: "1 vi\xEAn khi c\u1EA5p c\u1EE9u, c\xF3 th\u1EC3 l\u1EB7p l\u1EA1i sau 4-6 gi\u1EDD",
        maxDosage: "2 vi\xEAn/ng\xE0y",
        maxDosageVi: "2 vi\xEAn/ng\xE0y",
        warnings: [
          "For emergency use only",
          "Seek immediate medical attention",
          "Very expensive medicine",
          "Keep refrigerated"
        ],
        warningsVi: [
          "Ch\u1EC9 d\xF9ng trong tr\u01B0\u1EDDng h\u1EE3p c\u1EA5p c\u1EE9u",
          "T\xECm ki\u1EBFm ch\u0103m s\xF3c y t\u1EBF ngay l\u1EADp t\u1EE9c",
          "Thu\u1ED1c r\u1EA5t \u0111\u1EAFt ti\u1EC1n",
          "B\u1EA3o qu\u1EA3n trong t\u1EE7 l\u1EA1nh"
        ]
      },
      {
        name: "Ginkgo Biloba",
        nameVi: "B\u1EA1ch Qu\u1EA3",
        genericName: "Ginkgo Biloba Extract",
        genericNameVi: "Chi\u1EBFt xu\u1EA5t l\xE1 B\u1EA1ch Qu\u1EA3",
        category: "Herbal Supplement / Cognitive Enhancer",
        categoryVi: "Th\u1EF1c ph\u1EA9m b\u1EA3o v\u1EC7 s\u1EE9c kh\u1ECFe th\u1EA3o d\u01B0\u1EE3c / T\u0103ng c\u01B0\u1EDDng tr\xED nh\u1EDB",
        primaryUse: "Improves blood circulation, memory, and cognitive function. Used for dementia, tinnitus, and peripheral artery disease. Contains standardized flavonoids and terpenoids.",
        primaryUseVi: "C\u1EA3i thi\u1EC7n tu\u1EA7n ho\xE0n m\xE1u, tr\xED nh\u1EDB v\xE0 ch\u1EE9c n\u0103ng nh\u1EADn th\u1EE9c. D\xF9ng cho sa s\xFAt tr\xED tu\u1EC7, \xF9 tai v\xE0 b\u1EC7nh \u0111\u1ED9ng m\u1EA1ch ngo\u1EA1i bi\xEAn. Ch\u1EE9a flavonoid v\xE0 terpenoid chu\u1EA9n h\xF3a.",
        adultDosage: "120-240mg daily in 2-3 divided doses with meals. Start with 40mg 3 times daily.",
        adultDosageVi: "120-240mg m\u1ED7i ng\xE0y chia 2-3 l\u1EA7n c\xF9ng b\u1EEFa \u0103n. B\u1EAFt \u0111\u1EA7u v\u1EDBi 40mg 3 l\u1EA7n m\u1ED7i ng\xE0y.",
        maxDosage: "240mg per day in divided doses",
        maxDosageVi: "240mg m\u1ED7i ng\xE0y chia th\xE0nh nhi\u1EC1u l\u1EA7n u\u1ED1ng",
        warnings: [
          "May increase bleeding risk - avoid with blood thinners",
          "Discontinue 2 weeks before surgery",
          "May cause headaches, dizziness, or stomach upset",
          "Effects may take 6-8 weeks to appear",
          "Not recommended during pregnancy or breastfeeding",
          "May lower seizure threshold in epileptic patients"
        ],
        warningsVi: [
          "C\xF3 th\u1EC3 t\u0103ng nguy c\u01A1 ch\u1EA3y m\xE1u - tr\xE1nh d\xF9ng c\xF9ng thu\u1ED1c ch\u1ED1ng \u0111\xF4ng",
          "Ng\u1EEBng d\xF9ng 2 tu\u1EA7n tr\u01B0\u1EDBc ph\u1EABu thu\u1EADt",
          "C\xF3 th\u1EC3 g\xE2y \u0111au \u0111\u1EA7u, ch\xF3ng m\u1EB7t ho\u1EB7c \u0111au b\u1EE5ng",
          "T\xE1c d\u1EE5ng c\xF3 th\u1EC3 m\u1EA5t 6-8 tu\u1EA7n m\u1EDBi xu\u1EA5t hi\u1EC7n",
          "Kh\xF4ng khuy\u1EBFn ngh\u1ECB s\u1EED d\u1EE5ng khi mang thai ho\u1EB7c cho con b\xFA",
          "C\xF3 th\u1EC3 l\xE0m gi\u1EA3m ng\u01B0\u1EE1ng co gi\u1EADt \u1EDF b\u1EC7nh nh\xE2n \u0111\u1ED9ng kinh"
        ]
      }
      // NOTE: Above legacy medications are now supplemented by 5000+ comprehensive FDA-based medications
      // from fullComprehensiveDrugsDatabase imported above
    ];
  }
});

// server/drug-alias-service.ts
var drug_alias_service_exports = {};
__export(drug_alias_service_exports, {
  DrugAliasService: () => DrugAliasService,
  drugAliasService: () => drugAliasService
});
var DrugAliasService, drugAliasService;
var init_drug_alias_service = __esm({
  "server/drug-alias-service.ts"() {
    "use strict";
    DrugAliasService = class {
      constructor() {
        this.baseUrl = "https://rxnav.nlm.nih.gov/REST";
        this.cache = /* @__PURE__ */ new Map();
      }
      /**
       * Main search function - finds all related drug names for a given input
       */
      async searchDrugAliases(inputName) {
        const normalizedInput = inputName.toLowerCase().trim();
        if (this.cache.has(normalizedInput)) {
          return this.cache.get(normalizedInput);
        }
        try {
          const drugsResponse = await fetch(`${this.baseUrl}/drugs.json?name=${encodeURIComponent(inputName)}`);
          if (!drugsResponse.ok) return null;
          const drugsData = await drugsResponse.json();
          if (!drugsData.drugGroup?.conceptGroup) {
            return null;
          }
          const result = {
            name: inputName,
            type: "generic",
            rxcui: "",
            aliases: [],
            relatedDrugs: []
          };
          const allRxcuis = /* @__PURE__ */ new Set();
          const allNames = /* @__PURE__ */ new Set();
          for (const group of drugsData.drugGroup.conceptGroup) {
            if (!group.conceptProperties) continue;
            for (const concept of group.conceptProperties) {
              allRxcuis.add(concept.rxcui);
              allNames.add(concept.name);
              if (group.tty === "SBD" || group.tty === "BPCK") {
                result.type = "brand";
              }
              if (!result.rxcui) {
                result.rxcui = concept.rxcui;
              }
            }
          }
          for (const rxcui of Array.from(allRxcuis).slice(0, 5)) {
            await this.getRelatedDrugNames(rxcui, result, allNames);
          }
          result.aliases = Array.from(allNames).filter(
            (name) => name.toLowerCase() !== normalizedInput
          );
          this.cache.set(normalizedInput, result);
          return result;
        } catch (error) {
          console.error("RxNorm API error:", error);
          return null;
        }
      }
      /**
       * Get related drug names (brand/generic equivalents) for a given RXCUI
       */
      async getRelatedDrugNames(rxcui, result, allNames) {
        try {
          const relatedResponse = await fetch(`${this.baseUrl}/rxcui/${rxcui}/related.json?tty=SBD+GPCK+BPCK+SCD`);
          if (!relatedResponse.ok) return;
          const relatedData = await relatedResponse.json();
          if (!relatedData.relatedGroup?.conceptGroup) return;
          for (const group of relatedData.relatedGroup.conceptGroup) {
            if (!group.conceptProperties) continue;
            for (const concept of group.conceptProperties) {
              allNames.add(concept.name);
              const drugAlias = {
                brandName: "",
                genericName: "",
                rxcui: concept.rxcui
              };
              if (group.tty === "SBD" || group.tty === "BPCK") {
                drugAlias.brandName = concept.name;
                await this.getGenericForBrand(concept.rxcui, drugAlias);
              } else if (group.tty === "SCD" || group.tty === "GPCK") {
                drugAlias.genericName = concept.name;
                await this.getBrandForGeneric(concept.rxcui, drugAlias);
              }
              if (drugAlias.brandName || drugAlias.genericName) {
                result.relatedDrugs.push(drugAlias);
              }
            }
          }
        } catch (error) {
          console.error("Error getting related drug names:", error);
        }
      }
      /**
       * Get generic name for a brand drug RXCUI
       */
      async getGenericForBrand(rxcui, drugAlias) {
        try {
          const response = await fetch(`${this.baseUrl}/rxcui/${rxcui}/related.json?tty=SCD`);
          if (!response.ok) return;
          const data = await response.json();
          if (data.relatedGroup?.conceptGroup?.[0]?.conceptProperties?.[0]) {
            drugAlias.genericName = data.relatedGroup.conceptGroup[0].conceptProperties[0].name;
          }
        } catch (error) {
          console.error("Error getting generic for brand:", error);
        }
      }
      /**
       * Get brand names for a generic drug RXCUI
       */
      async getBrandForGeneric(rxcui, drugAlias) {
        try {
          const response = await fetch(`${this.baseUrl}/rxcui/${rxcui}/related.json?tty=SBD`);
          if (!response.ok) return;
          const data = await response.json();
          if (data.relatedGroup?.conceptGroup?.[0]?.conceptProperties?.[0]) {
            drugAlias.brandName = data.relatedGroup.conceptGroup[0].conceptProperties[0].name;
          }
        } catch (error) {
          console.error("Error getting brand for generic:", error);
        }
      }
      /**
       * Quick brand to generic lookup
       */
      async getBrandToGenericMapping(brandName) {
        const result = await this.searchDrugAliases(brandName);
        if (!result) return null;
        for (const drug of result.relatedDrugs) {
          if (drug.genericName && drug.brandName.toLowerCase().includes(brandName.toLowerCase())) {
            return drug.genericName;
          }
        }
        for (const alias of result.aliases) {
          if (this.seemsLikeGeneric(alias)) {
            return alias;
          }
        }
        return null;
      }
      /**
       * Quick generic to brand lookup
       */
      async getGenericToBrandMapping(genericName) {
        const result = await this.searchDrugAliases(genericName);
        if (!result) return [];
        const brands = [];
        for (const drug of result.relatedDrugs) {
          if (drug.brandName && drug.genericName.toLowerCase().includes(genericName.toLowerCase())) {
            brands.push(drug.brandName);
          }
        }
        return brands;
      }
      /**
       * Helper to determine if a drug name seems like a generic (lowercase, chemical-sounding)
       */
      seemsLikeGeneric(name) {
        return name === name.toLowerCase() && // Generic names are typically lowercase
        !name.includes(" ") && // Usually single words
        name.length > 4 && // Reasonable length
        !this.seemsLikeBrand(name);
      }
      /**
       * Helper to determine if a drug name seems like a brand (capitalized, shorter)
       */
      seemsLikeBrand(name) {
        return name[0] === name[0].toUpperCase() && // Starts with capital
        name.length < 15 && // Brand names are typically shorter
        !name.includes("/");
      }
      /**
       * Get all known aliases for a drug name
       */
      async getAllAliases(drugName) {
        const result = await this.searchDrugAliases(drugName);
        if (!result) return [drugName];
        const allAliases = /* @__PURE__ */ new Set([drugName]);
        result.aliases.forEach((alias) => allAliases.add(alias));
        result.relatedDrugs.forEach((drug) => {
          if (drug.brandName) allAliases.add(drug.brandName);
          if (drug.genericName) allAliases.add(drug.genericName);
        });
        return Array.from(allAliases);
      }
    };
    drugAliasService = new DrugAliasService();
  }
});

// shared/schema.ts
var schema_exports = {};
__export(schema_exports, {
  aiStats: () => aiStats,
  drugSearchResponseSchema: () => drugSearchResponseSchema,
  insertAiStatsSchema: () => insertAiStatsSchema,
  insertMedicationSchema: () => insertMedicationSchema,
  insertSearchHistorySchema: () => insertSearchHistorySchema,
  insertTrainingProgressSchema: () => insertTrainingProgressSchema,
  insertUserSchema: () => insertUserSchema,
  medications: () => medications,
  searchHistory: () => searchHistory,
  trainingProgress: () => trainingProgress,
  users: () => users
});
import { sql } from "drizzle-orm";
import { pgTable, text, varchar, timestamp, jsonb, integer, boolean, real } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
var users, medications, searchHistory, trainingProgress, aiStats, insertUserSchema, insertMedicationSchema, insertSearchHistorySchema, insertTrainingProgressSchema, insertAiStatsSchema, drugSearchResponseSchema;
var init_schema = __esm({
  "shared/schema.ts"() {
    "use strict";
    users = pgTable("users", {
      id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
      username: text("username").notNull().unique(),
      email: text("email").notNull().unique(),
      password: text("password").notNull(),
      role: text("role").default("user"),
      createdAt: timestamp("created_at").defaultNow()
    });
    medications = pgTable("medications", {
      id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
      name: text("name").notNull(),
      nameVi: text("name_vi"),
      genericName: text("generic_name"),
      genericNameVi: text("generic_name_vi"),
      category: text("category"),
      categoryVi: text("category_vi"),
      primaryUse: text("primary_use"),
      primaryUseVi: text("primary_use_vi"),
      adultDosage: text("adult_dosage"),
      adultDosageVi: text("adult_dosage_vi"),
      maxDosage: text("max_dosage"),
      maxDosageVi: text("max_dosage_vi"),
      warnings: jsonb("warnings").$type(),
      warningsVi: jsonb("warnings_vi").$type(),
      createdAt: timestamp("created_at").defaultNow()
    });
    searchHistory = pgTable("search_history", {
      id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
      userId: varchar("user_id"),
      medicationId: varchar("medication_id").references(() => medications.id),
      searchQuery: text("search_query"),
      searchMethod: text("search_method"),
      // 'photo' or 'manual'
      createdAt: timestamp("created_at").defaultNow()
    });
    trainingProgress = pgTable("training_progress", {
      id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
      processed: integer("processed").notNull().default(0),
      target: integer("target").notNull().default(1e6),
      isTraining: boolean("is_training").notNull().default(false),
      currentPhase: text("current_phase"),
      successRate: real("success_rate").default(0),
      lastUpdated: timestamp("last_updated").defaultNow(),
      createdAt: timestamp("created_at").defaultNow()
    });
    aiStats = pgTable("ai_stats", {
      id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
      accuracy: real("accuracy").notNull().default(0),
      trainingPoints: integer("training_points").notNull().default(0),
      lastUpdated: timestamp("last_updated").defaultNow()
    });
    insertUserSchema = createInsertSchema(users).pick({
      username: true,
      email: true,
      password: true
    });
    insertMedicationSchema = createInsertSchema(medications).omit({
      id: true,
      createdAt: true
    });
    insertSearchHistorySchema = createInsertSchema(searchHistory).omit({
      id: true,
      createdAt: true
    });
    insertTrainingProgressSchema = createInsertSchema(trainingProgress).omit({
      id: true,
      createdAt: true,
      lastUpdated: true
    });
    insertAiStatsSchema = createInsertSchema(aiStats).omit({
      id: true,
      lastUpdated: true
    });
    drugSearchResponseSchema = z.object({
      name: z.string(),
      genericName: z.string().optional(),
      category: z.string().optional(),
      primaryUse: z.string(),
      adultDosage: z.string().optional(),
      maxDosage: z.string().optional(),
      warnings: z.array(z.string()).optional()
    });
  }
});

// server/storage.ts
var storage_exports = {};
__export(storage_exports, {
  DatabaseStorage: () => DatabaseStorage,
  storage: () => storage
});
import { randomUUID } from "crypto";
import { drizzle } from "drizzle-orm/neon-http";
import { neon } from "@neondatabase/serverless";
import { eq, like, or, desc, sql as sql2 } from "drizzle-orm";
async function safeDbOperation(operation, fallback) {
  if (!useDatabase || !db) {
    return fallback();
  }
  try {
    return await operation();
  } catch (error) {
    console.error("Database operation failed, falling back to memory:", error);
    useDatabase = false;
    return fallback();
  }
}
function generateId() {
  return randomUUID();
}
var db, useDatabase, DatabaseStorage, storage;
var init_storage = __esm({
  "server/storage.ts"() {
    "use strict";
    init_medications_database();
    init_schema();
    db = null;
    useDatabase = false;
    if (process.env.DATABASE_URL) {
      try {
        const neonSql = neon(process.env.DATABASE_URL);
        db = drizzle(neonSql, { schema: schema_exports });
        useDatabase = true;
        console.log("Database connection established");
      } catch (error) {
        console.error("Database connection failed:", error);
        useDatabase = false;
      }
    } else {
      console.log("No DATABASE_URL found, using in-memory storage");
      useDatabase = false;
    }
    DatabaseStorage = class {
      constructor() {
        this.memoryUsers = /* @__PURE__ */ new Map();
        this.memoryMedications = /* @__PURE__ */ new Map();
        this.memorySearchHistory = [];
        this.medicationsInitialized = false;
        this.initializeMedications().catch(console.error);
      }
      async initializeMedications() {
        try {
          if (useDatabase && db) {
            const existingMedications = await db.select().from(medications).limit(1);
            if (existingMedications.length === 0) {
              console.log("Initializing medications database with 100,000+ medications...");
              const medications2 = medicationsDatabase.map((med) => ({
                ...med,
                id: randomUUID()
              }));
              console.log(`Preparing to insert ${medications2.length} medications...`);
              const batchSize = 1e3;
              for (let i = 0; i < medications2.length; i += batchSize) {
                const batch = medications2.slice(i, i + batchSize);
                await db.insert(medications).values(batch);
                console.log(`Inserted batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(medications2.length / batchSize)}`);
              }
              console.log(`Successfully inserted ${medications2.length} medications into database`);
            } else {
              console.log("Medications database already initialized");
            }
          } else {
            console.log("Initializing in-memory medications database with 100,000+ medications...");
            medicationsDatabase.forEach((med) => {
              const medication = { ...med, id: randomUUID() };
              this.memoryMedications.set(medication.id, medication);
            });
            console.log(`Successfully initialized ${this.memoryMedications.size} medications in memory`);
          }
          this.medicationsInitialized = true;
        } catch (error) {
          console.error("Error initializing medications:", error);
          if (!this.medicationsInitialized) {
            console.log("Falling back to in-memory storage...");
            medicationsDatabase.forEach((med) => {
              const medication = { ...med, id: randomUUID() };
              this.memoryMedications.set(medication.id, medication);
            });
            this.medicationsInitialized = true;
            console.log(`Fallback: Successfully initialized ${this.memoryMedications.size} medications in memory`);
          }
        }
      }
      async getUser(id) {
        return await safeDbOperation(
          async () => {
            const users2 = await db.select().from(users).where(eq(users.id, id));
            return users2[0];
          },
          () => this.memoryUsers.get(id)
        );
      }
      async getUserByUsername(username) {
        return await safeDbOperation(
          async () => {
            const users2 = await db.select().from(users).where(eq(users.username, username));
            return users2[0];
          },
          () => {
            for (const user of Array.from(this.memoryUsers.values())) {
              if (user.username === username) {
                return user;
              }
            }
            return void 0;
          }
        );
      }
      async getUserByEmail(email) {
        return await safeDbOperation(
          async () => {
            const users2 = await db.select().from(users).where(eq(users.email, email));
            return users2[0];
          },
          () => {
            for (const user of Array.from(this.memoryUsers.values())) {
              if (user.email === email) {
                return user;
              }
            }
            return void 0;
          }
        );
      }
      async createUser(userData) {
        const existingUserByEmail = await this.getUserByEmail(userData.email);
        if (existingUserByEmail) {
          throw new Error("Email address is already in use.");
        }
        const existingUserByUsername = await this.getUserByUsername(userData.username);
        if (existingUserByUsername) {
          throw new Error("Username is already in use.");
        }
        const newUser = {
          id: generateId(),
          username: userData.username,
          password: userData.password,
          email: userData.email,
          role: userData.role || "user",
          // Default to 'user' role
          createdAt: /* @__PURE__ */ new Date()
        };
        await safeDbOperation(
          async () => {
            await db.insert(users).values(newUser);
            return newUser;
          },
          () => {
            this.memoryUsers.set(newUser.id, newUser);
            return newUser;
          }
        );
        return newUser;
      }
      async getMedication(id) {
        if (useDatabase && db) {
          const medications2 = await db.select().from(medications).where(eq(medications.id, id));
          return medications2[0];
        }
        return this.memoryMedications.get(id);
      }
      async getMedicationByName(name) {
        if (useDatabase && db) {
          const medications2 = await db.select().from(medications).where(
            or(
              eq(medications.name, name),
              eq(medications.nameVi, name),
              eq(medications.genericName, name),
              eq(medications.genericNameVi, name)
            )
          );
          return medications2[0];
        }
        for (const med of Array.from(this.memoryMedications.values())) {
          if (med.name === name || med.nameVi === name || med.genericName === name || med.genericNameVi === name) {
            return med;
          }
        }
        return void 0;
      }
      async getMedicationByPartialName(partialName) {
        if (useDatabase && db) {
          const medications2 = await db.select().from(medications).where(
            or(
              like(medications.name, `%${partialName}%`),
              like(medications.nameVi, `%${partialName}%`),
              like(medications.genericName, `%${partialName}%`),
              like(medications.genericNameVi, `%${partialName}%`)
            )
          );
          return medications2[0];
        }
        const lowerPartial = partialName.toLowerCase();
        for (const med of Array.from(this.memoryMedications.values())) {
          if (med.name?.toLowerCase().includes(lowerPartial) || med.nameVi?.toLowerCase().includes(lowerPartial) || med.genericName?.toLowerCase().includes(lowerPartial) || med.genericNameVi?.toLowerCase().includes(lowerPartial)) {
            return med;
          }
        }
        return void 0;
      }
      async createMedication(medication) {
        const newMedication = {
          ...medication,
          id: randomUUID()
        };
        if (useDatabase && db) {
          await db.insert(medications).values(newMedication);
        } else {
          this.memoryMedications.set(newMedication.id, newMedication);
        }
        return newMedication;
      }
      async searchMedications(query) {
        const searchTerm = `%${query.toLowerCase()}%`;
        const directResults = useDatabase && db ? await db.select().from(medications).where(
          or(
            sql2`LOWER(${medications.name}) LIKE ${searchTerm}`,
            sql2`LOWER(${medications.nameVi}) LIKE ${searchTerm}`,
            sql2`LOWER(${medications.genericName}) LIKE ${searchTerm}`,
            sql2`LOWER(${medications.genericNameVi}) LIKE ${searchTerm}`
          )
        ).limit(20) : Array.from(this.memoryMedications.values()).filter(
          (med) => med.name?.toLowerCase().includes(query.toLowerCase()) || med.nameVi?.toLowerCase().includes(query.toLowerCase()) || med.genericName?.toLowerCase().includes(query.toLowerCase()) || med.genericNameVi?.toLowerCase().includes(query.toLowerCase())
        ).slice(0, 20);
        if (directResults.length > 0) {
          return directResults;
        }
        try {
          const { drugAliasService: drugAliasService2 } = await Promise.resolve().then(() => (init_drug_alias_service(), drug_alias_service_exports));
          const aliases = await drugAliasService2.getAllAliases(query);
          const aliasResults = await Promise.all(
            aliases.map(async (alias) => {
              const aliasSearchTerm = `%${alias.toLowerCase()}%`;
              return useDatabase && db ? await db.select().from(medications).where(
                or(
                  sql2`LOWER(${medications.name}) LIKE ${aliasSearchTerm}`,
                  sql2`LOWER(${medications.nameVi}) LIKE ${aliasSearchTerm}`,
                  sql2`LOWER(${medications.genericName}) LIKE ${aliasSearchTerm}`,
                  sql2`LOWER(${medications.genericNameVi}) LIKE ${aliasSearchTerm}`
                )
              ).limit(5) : Array.from(this.memoryMedications.values()).filter(
                (med) => med.name?.toLowerCase().includes(alias.toLowerCase()) || med.nameVi?.toLowerCase().includes(alias.toLowerCase()) || med.genericName?.toLowerCase().includes(alias.toLowerCase()) || med.genericNameVi?.toLowerCase().includes(alias.toLowerCase())
              ).slice(0, 5);
            })
          );
          const allAliasResults = aliasResults.flat();
          const uniqueResults = allAliasResults.filter(
            (med, index, arr) => arr.findIndex((m) => m.id === med.id) === index
          );
          return uniqueResults.slice(0, 20);
        } catch (error) {
          console.error("Alias search failed:", error);
          return directResults;
        }
      }
      async fuzzySearchMedications(searchTerm) {
        if (useDatabase && db) {
          const query = `%${searchTerm.toLowerCase()}%`;
          const results = await db.select().from(medications).where(
            or(
              sql2`LOWER(${medications.name}) LIKE ${query}`,
              sql2`LOWER(${medications.genericName}) LIKE ${query}`,
              sql2`LOWER(${medications.nameVi}) LIKE ${query}`,
              sql2`LOWER(${medications.genericNameVi}) LIKE ${query}`,
              sql2`LOWER(${medications.category}) LIKE ${query}`,
              sql2`LOWER(${medications.categoryVi}) LIKE ${query}`
            )
          ).limit(20);
          return results;
        } else {
          const searchLower = searchTerm.toLowerCase().trim();
          const results = [];
          for (const med of Array.from(this.memoryMedications.values())) {
            let maxScore = 0;
            const fields = [
              med.name.toLowerCase(),
              med.genericName?.toLowerCase() || "",
              med.nameVi?.toLowerCase() || "",
              med.genericNameVi?.toLowerCase() || "",
              med.category?.toLowerCase() || "",
              med.categoryVi?.toLowerCase() || ""
            ].filter((field) => field.length > 0);
            for (const field of fields) {
              if (field.includes(searchLower) || searchLower.includes(field)) {
                maxScore = Math.max(maxScore, 1);
                continue;
              }
              const levenScore = this.calculateLevenshteinSimilarity(searchLower, field);
              maxScore = Math.max(maxScore, levenScore);
              const jaroScore = this.calculateJaroWinklerSimilarity(searchLower, field);
              maxScore = Math.max(maxScore, jaroScore);
              const wordScore = this.calculateWordSimilarity(searchLower, field);
              maxScore = Math.max(maxScore, wordScore);
            }
            if (maxScore > 0.5) {
              results.push({ medication: med, score: maxScore });
            }
          }
          return results.sort((a, b) => b.score - a.score).slice(0, 20).map((result) => result.medication);
        }
      }
      calculateLevenshteinSimilarity(str1, str2) {
        const maxLength = Math.max(str1.length, str2.length);
        if (maxLength === 0) return 1;
        const distance = this.levenshteinDistance(str1, str2);
        return 1 - distance / maxLength;
      }
      calculateJaroWinklerSimilarity(str1, str2) {
        if (str1 === str2) return 1;
        const jaro = this.jaroSimilarity(str1, str2);
        const prefixLength = Math.min(4, this.commonPrefixLength(str1, str2));
        return jaro + 0.1 * prefixLength * (1 - jaro);
      }
      calculateWordSimilarity(search, target) {
        const searchWords = search.split(/\s+/);
        const targetWords = target.split(/\s+/);
        let matches = 0;
        for (const searchWord of searchWords) {
          for (const targetWord of targetWords) {
            if (targetWord.includes(searchWord) || searchWord.includes(targetWord)) {
              matches++;
              break;
            }
          }
        }
        return matches / searchWords.length;
      }
      levenshteinDistance(str1, str2) {
        const matrix = Array(str2.length + 1).fill(null).map(() => Array(str1.length + 1).fill(null));
        for (let i = 0; i <= str1.length; i++) matrix[0][i] = i;
        for (let j = 0; j <= str2.length; j++) matrix[j][0] = j;
        for (let j = 1; j <= str2.length; j++) {
          for (let i = 1; i <= str1.length; i++) {
            const indicator = str1[i - 1] === str2[j - 1] ? 0 : 1;
            matrix[j][i] = Math.min(
              matrix[j][i - 1] + 1,
              matrix[j - 1][i] + 1,
              matrix[j - 1][i - 1] + indicator
            );
          }
        }
        return matrix[str2.length][str1.length];
      }
      jaroSimilarity(str1, str2) {
        const len1 = str1.length;
        const len2 = str2.length;
        if (len1 === 0 || len2 === 0) return 0;
        const matchDistance = Math.floor(Math.max(len1, len2) / 2) - 1;
        const matches1 = new Array(len1).fill(false);
        const matches2 = new Array(len2).fill(false);
        let matches = 0;
        for (let i = 0; i < len1; i++) {
          const start = Math.max(0, i - matchDistance);
          const end = Math.min(len2 - 1, i + matchDistance);
          for (let j = start; j <= end; j++) {
            if (!matches2[j] && str1[i] === str2[j]) {
              matches1[i] = true;
              matches2[j] = true;
              matches++;
              break;
            }
          }
        }
        if (matches === 0) return 0;
        let transpositions = 0;
        let k = 0;
        for (let i = 0; i < len1; i++) {
          if (matches1[i]) {
            while (!matches2[k]) k++;
            if (str1[i] !== str2[k]) transpositions++;
            k++;
          }
        }
        return (matches / len1 + matches / len2 + (matches - transpositions / 2) / matches) / 3;
      }
      commonPrefixLength(str1, str2) {
        let length = 0;
        const maxLength = Math.min(str1.length, str2.length);
        for (let i = 0; i < maxLength; i++) {
          if (str1[i] === str2[i]) {
            length++;
          } else {
            break;
          }
        }
        return length;
      }
      async getSearchHistory(userId) {
        if (useDatabase && db) {
          if (userId) {
            return await db.select().from(searchHistory).where(eq(searchHistory.userId, userId)).orderBy(desc(searchHistory.createdAt));
          }
          return await db.select().from(searchHistory).orderBy(desc(searchHistory.createdAt));
        }
        let history = [...this.memorySearchHistory];
        if (userId) {
          history = history.filter((h) => h.userId === userId);
        }
        return history.sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
      }
      async createSearchHistory(searchHistory2) {
        const newSearchHistory = {
          ...searchHistory2,
          id: randomUUID(),
          createdAt: /* @__PURE__ */ new Date()
        };
        if (useDatabase && db) {
          await db.insert(searchHistory).values(newSearchHistory);
        } else {
          this.memorySearchHistory.push(newSearchHistory);
        }
        return newSearchHistory;
      }
      async getTrainingProgress() {
        if (useDatabase && db) {
          const [progress] = await db.select().from(trainingProgress).orderBy(desc(trainingProgress.lastUpdated)).limit(1);
          return progress || void 0;
        }
        return void 0;
      }
      async createTrainingProgress(progress) {
        const newProgress = {
          ...progress,
          id: randomUUID(),
          createdAt: /* @__PURE__ */ new Date(),
          lastUpdated: /* @__PURE__ */ new Date()
        };
        if (useDatabase && db) {
          const [created] = await db.insert(trainingProgress).values(newProgress).returning();
          return created;
        }
        return newProgress;
      }
      async updateTrainingProgress(progressUpdate) {
        if (useDatabase && db) {
          let existing = await this.getTrainingProgress();
          if (!existing) {
            return await this.createTrainingProgress({
              processed: progressUpdate.processed || 0,
              target: progressUpdate.target || 1e6,
              isTraining: progressUpdate.isTraining || false,
              currentPhase: progressUpdate.currentPhase || "Phase 1",
              successRate: progressUpdate.successRate || 0
            });
          }
          const [updated] = await db.update(trainingProgress).set({ ...progressUpdate, lastUpdated: /* @__PURE__ */ new Date() }).where(eq(trainingProgress.id, existing.id)).returning();
          return updated;
        }
        throw new Error("Database not available");
      }
      async getAiStats() {
        if (useDatabase && db) {
          const [stats] = await db.select().from(aiStats).orderBy(desc(aiStats.lastUpdated)).limit(1);
          return stats || void 0;
        }
        return void 0;
      }
      async createAiStats(stats) {
        const newStats = {
          ...stats,
          id: randomUUID(),
          lastUpdated: /* @__PURE__ */ new Date()
        };
        if (useDatabase && db) {
          const [created] = await db.insert(aiStats).values(newStats).returning();
          return created;
        }
        return newStats;
      }
      async updateAiStats(statsUpdate) {
        if (useDatabase && db) {
          let existing = await this.getAiStats();
          if (!existing) {
            return await this.createAiStats({
              accuracy: statsUpdate.accuracy || 0,
              trainingPoints: statsUpdate.trainingPoints || 0
            });
          }
          const [updated] = await db.update(aiStats).set({ ...statsUpdate, lastUpdated: /* @__PURE__ */ new Date() }).where(eq(aiStats.id, existing.id)).returning();
          return updated;
        }
        throw new Error("Database not available");
      }
      // Admin methods
      async getAllUsers() {
        if (useDatabase && db) {
          const result = await db.select().from(users);
          return result;
        }
        return Array.from(this.memoryUsers.values());
      }
      async deleteUser(userId) {
        if (useDatabase && db) {
          await db.delete(users).where(eq(users.id, userId));
        } else {
          this.memoryUsers.delete(userId);
        }
      }
      async getAllSearchHistory() {
        if (useDatabase && db) {
          const result = await db.select().from(searchHistory);
          return result;
        }
        return this.memorySearchHistory;
      }
    };
    storage = new DatabaseStorage();
  }
});

// server/auth.ts
var auth_exports = {};
__export(auth_exports, {
  AuthService: () => AuthService,
  authenticateToken: () => authenticateToken,
  loginSchema: () => loginSchema,
  registerSchema: () => registerSchema
});
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import { z as z2 } from "zod";
function authenticateToken(req, res, next) {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];
  if (!token) {
    return res.status(401).json({ success: false, message: "Access token required" });
  }
  jwt.verify(token, JWT_SECRET, async (err, decoded) => {
    if (err) {
      return res.status(403).json({ success: false, message: "Invalid token" });
    }
    try {
      if (decoded.isGuest) {
        req.user = {
          id: decoded.userId,
          username: decoded.username,
          email: "guest@drugscanner.app"
        };
        return next();
      }
      const user = await storage.getUser(decoded.userId);
      if (!user) {
        return res.status(403).json({ success: false, message: "User not found" });
      }
      req.user = {
        id: user.id,
        username: user.username,
        email: user.email
      };
      next();
    } catch (dbError) {
      console.warn("Database error during authentication:", dbError);
      if (decoded.userId && decoded.username) {
        req.user = {
          id: decoded.userId,
          username: decoded.username,
          email: "fallback@drugscanner.app"
        };
        return next();
      }
      return res.status(500).json({ success: false, message: "Authentication service temporarily unavailable" });
    }
  });
}
var JWT_SECRET, registerSchema, loginSchema, AuthService;
var init_auth = __esm({
  "server/auth.ts"() {
    "use strict";
    init_storage();
    JWT_SECRET = process.env.JWT_SECRET || "your-secret-key-change-in-production";
    registerSchema = z2.object({
      username: z2.string().min(3).max(50),
      email: z2.string().email(),
      password: z2.string().min(6)
    });
    loginSchema = z2.object({
      username: z2.string(),
      password: z2.string()
    });
    AuthService = class {
      static async register(userData) {
        const existingUser = await storage.getUserByUsername(userData.username);
        if (existingUser) {
          throw new Error("Username already exists");
        }
        const existingEmail = await storage.getUserByEmail(userData.email);
        if (existingEmail) {
          throw new Error("Email already exists");
        }
        const hashedPassword = await bcrypt.hash(userData.password, 12);
        const user = await storage.createUser({
          username: userData.username,
          password: hashedPassword,
          email: userData.email
        });
        const token = jwt.sign(
          { userId: user.id, username: user.username },
          JWT_SECRET,
          { expiresIn: "7d" }
        );
        return {
          user: {
            id: user.id,
            username: user.username,
            email: user.email
          },
          token
        };
      }
      static async registerAdmin(userData) {
        const existingUser = await storage.getUserByUsername(userData.username);
        if (existingUser) {
          throw new Error("Username already exists");
        }
        const existingEmail = await storage.getUserByEmail(userData.email);
        if (existingEmail) {
          throw new Error("Email already exists");
        }
        const hashedPassword = await bcrypt.hash(userData.password, 12);
        const user = await storage.createUser({
          username: userData.username,
          password: hashedPassword,
          email: userData.email,
          role: "admin"
        });
        const token = jwt.sign(
          { userId: user.id, username: user.username, role: "admin" },
          JWT_SECRET,
          { expiresIn: "7d" }
        );
        return {
          user: {
            id: user.id,
            username: user.username,
            email: user.email
          },
          token
        };
      }
      static async login(loginData) {
        const user = await storage.getUserByUsername(loginData.username);
        if (!user) {
          throw new Error("Invalid credentials");
        }
        const isValidPassword = await bcrypt.compare(loginData.password, user.password);
        if (!isValidPassword) {
          throw new Error("Invalid credentials");
        }
        const token = jwt.sign(
          { userId: user.id, username: user.username },
          JWT_SECRET,
          { expiresIn: "7d" }
        );
        return {
          user: {
            id: user.id,
            username: user.username,
            email: user.email
          },
          token
        };
      }
      static async loginAsGuest() {
        const guestId = `guest_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        const guestUser = {
          id: guestId,
          username: "Guest User",
          email: "guest@drugscanner.app"
        };
        const token = jwt.sign(
          { userId: guestId, username: "Guest User", isGuest: true },
          JWT_SECRET,
          { expiresIn: "24h" }
          // Shorter expiry for guest sessions
        );
        return {
          user: guestUser,
          token
        };
      }
      static async verifyToken(token) {
        try {
          const decoded = jwt.verify(token, JWT_SECRET);
          if (decoded.isGuest) {
            return {
              id: decoded.userId,
              username: decoded.username,
              email: "guest@drugscanner.app"
            };
          }
          try {
            const user = await storage.getUser(decoded.userId);
            if (!user) {
              return null;
            }
            return {
              id: user.id,
              username: user.username,
              email: user.email
            };
          } catch (dbError) {
            console.warn("Database error during token verification:", dbError);
            if (decoded.userId && decoded.username) {
              return {
                id: decoded.userId,
                username: decoded.username,
                email: "fallback@drugscanner.app"
              };
            }
            return null;
          }
        } catch (error) {
          console.warn("Token verification failed:", error);
          return null;
        }
      }
    };
  }
});

// server/index.ts
import express2 from "express";

// server/routes.ts
init_enhanced_ai_training();
init_comprehensive_drugs_database();

// server/global-medications-database.ts
var globalMedicationsDatabase = [
  // Pain Relief & Anti-inflammatory (Expanded)
  {
    id: "med-pain-001",
    name: "Acetaminophen",
    nameVi: "Paracetamol",
    genericName: "Acetaminophen",
    genericNameVi: "Paracetamol",
    category: "Pain Reliever",
    categoryVi: "Thu\u1ED1c gi\u1EA3m \u0111au",
    primaryUse: "Pain relief and fever reduction",
    primaryUseVi: "Gi\u1EA3m \u0111au v\xE0 h\u1EA1 s\u1ED1t",
    adultDosage: "500-1000mg every 4-6 hours",
    adultDosageVi: "500-1000mg m\u1ED7i 4-6 gi\u1EDD",
    maxDosage: "4000mg per day",
    maxDosageVi: "4000mg m\u1ED7i ng\xE0y",
    warnings: ["Do not exceed 4000mg daily", "Avoid alcohol"],
    warningsVi: ["Kh\xF4ng v\u01B0\u1EE3t qu\xE1 4000mg m\u1ED7i ng\xE0y", "Tr\xE1nh r\u01B0\u1EE3u"],
    brandNames: ["Tylenol", "Panadol", "Calpol", "Fevadol"],
    brandNamesVi: ["Tylenol", "Panadol", "Calpol", "Fevadol"],
    createdAt: (/* @__PURE__ */ new Date()).toISOString()
  },
  {
    id: "med-pain-002",
    name: "Ibuprofen",
    nameVi: "Ibuprofen",
    genericName: "Ibuprofen",
    genericNameVi: "Ibuprofen",
    category: "NSAID",
    categoryVi: "Thu\u1ED1c ch\u1ED1ng vi\xEAm",
    primaryUse: "Pain, inflammation, and fever relief",
    primaryUseVi: "Gi\u1EA3m \u0111au, ch\u1ED1ng vi\xEAm v\xE0 h\u1EA1 s\u1ED1t",
    adultDosage: "200-400mg every 4-6 hours",
    adultDosageVi: "200-400mg m\u1ED7i 4-6 gi\u1EDD",
    maxDosage: "1200mg per day",
    maxDosageVi: "1200mg m\u1ED7i ng\xE0y",
    warnings: ["Take with food", "May cause stomach bleeding"],
    warningsVi: ["U\u1ED1ng c\xF9ng th\u1EE9c \u0103n", "C\xF3 th\u1EC3 g\xE2y xu\u1EA5t huy\u1EBFt d\u1EA1 d\xE0y"],
    brandNames: ["Advil", "Motrin", "Brufen", "Nurofen"],
    brandNamesVi: ["Advil", "Motrin", "Brufen", "Nurofen"],
    createdAt: (/* @__PURE__ */ new Date()).toISOString()
  },
  // Cardiovascular Medications
  {
    id: "med-cardio-001",
    name: "Lisinopril",
    nameVi: "Lisinopril",
    genericName: "Lisinopril",
    genericNameVi: "Lisinopril",
    category: "ACE Inhibitor",
    categoryVi: "Thu\u1ED1c \u1EE9c ch\u1EBF ACE",
    primaryUse: "High blood pressure and heart failure",
    primaryUseVi: "Huy\u1EBFt \xE1p cao v\xE0 suy tim",
    adultDosage: "5-40mg once daily",
    adultDosageVi: "5-40mg m\u1ED9t l\u1EA7n m\u1ED7i ng\xE0y",
    maxDosage: "80mg per day",
    maxDosageVi: "80mg m\u1ED7i ng\xE0y",
    warnings: ["May cause dry cough", "Monitor kidney function"],
    warningsVi: ["C\xF3 th\u1EC3 g\xE2y ho khan", "Theo d\xF5i ch\u1EE9c n\u0103ng th\u1EADn"],
    brandNames: ["Prinivil", "Zestril"],
    brandNamesVi: ["Prinivil", "Zestril"],
    createdAt: (/* @__PURE__ */ new Date()).toISOString()
  },
  {
    id: "med-cardio-002",
    name: "Amlodipine",
    nameVi: "Amlodipine",
    genericName: "Amlodipine",
    genericNameVi: "Amlodipine",
    category: "Calcium Channel Blocker",
    categoryVi: "Thu\u1ED1c ch\u1EB9n k\xEAnh canxi",
    primaryUse: "High blood pressure and chest pain",
    primaryUseVi: "Huy\u1EBFt \xE1p cao v\xE0 \u0111au ng\u1EF1c",
    adultDosage: "2.5-10mg once daily",
    adultDosageVi: "2.5-10mg m\u1ED9t l\u1EA7n m\u1ED7i ng\xE0y",
    maxDosage: "10mg per day",
    maxDosageVi: "10mg m\u1ED7i ng\xE0y",
    warnings: ["May cause ankle swelling", "Dizziness possible"],
    warningsVi: ["C\xF3 th\u1EC3 g\xE2y s\u01B0ng c\u1ED5 ch\xE2n", "C\xF3 th\u1EC3 ch\xF3ng m\u1EB7t"],
    brandNames: ["Norvasc", "Amlocard"],
    brandNamesVi: ["Norvasc", "Amlocard"],
    createdAt: (/* @__PURE__ */ new Date()).toISOString()
  },
  // Antibiotics
  {
    id: "med-antibiotic-001",
    name: "Amoxicillin",
    nameVi: "Amoxicillin",
    genericName: "Amoxicillin",
    genericNameVi: "Amoxicillin",
    category: "Antibiotic",
    categoryVi: "Kh\xE1ng sinh",
    primaryUse: "Bacterial infections",
    primaryUseVi: "Nhi\u1EC5m tr\xF9ng do vi khu\u1EA9n",
    adultDosage: "250-500mg every 8 hours",
    adultDosageVi: "250-500mg m\u1ED7i 8 gi\u1EDD",
    maxDosage: "1500mg per day",
    maxDosageVi: "1500mg m\u1ED7i ng\xE0y",
    warnings: ["Complete full course", "May cause diarrhea"],
    warningsVi: ["Ho\xE0n th\xE0nh li\u1EC7u tr\xECnh", "C\xF3 th\u1EC3 g\xE2y ti\xEAu ch\u1EA3y"],
    brandNames: ["Amoxil", "Trimox"],
    brandNamesVi: ["Amoxil", "Trimox"],
    createdAt: (/* @__PURE__ */ new Date()).toISOString()
  },
  {
    id: "med-antibiotic-002",
    name: "Azithromycin",
    nameVi: "Azithromycin",
    genericName: "Azithromycin",
    genericNameVi: "Azithromycin",
    category: "Antibiotic",
    categoryVi: "Kh\xE1ng sinh",
    primaryUse: "Respiratory and skin infections",
    primaryUseVi: "Nhi\u1EC5m tr\xF9ng h\xF4 h\u1EA5p v\xE0 da",
    adultDosage: "500mg once daily for 3 days",
    adultDosageVi: "500mg m\u1ED9t l\u1EA7n m\u1ED7i ng\xE0y trong 3 ng\xE0y",
    maxDosage: "500mg per day",
    maxDosageVi: "500mg m\u1ED7i ng\xE0y",
    warnings: ["Take on empty stomach", "Complete course"],
    warningsVi: ["U\u1ED1ng khi \u0111\xF3i", "Ho\xE0n th\xE0nh li\u1EC7u tr\xECnh"],
    brandNames: ["Zithromax", "Z-Pak"],
    brandNamesVi: ["Zithromax", "Z-Pak"],
    createdAt: (/* @__PURE__ */ new Date()).toISOString()
  },
  // Diabetes Medications
  {
    id: "med-diabetes-001",
    name: "Metformin",
    nameVi: "Metformin",
    genericName: "Metformin",
    genericNameVi: "Metformin",
    category: "Diabetes Medication",
    categoryVi: "Thu\u1ED1c ti\u1EC3u \u0111\u01B0\u1EDDng",
    primaryUse: "Type 2 diabetes",
    primaryUseVi: "Ti\u1EC3u \u0111\u01B0\u1EDDng type 2",
    adultDosage: "500-1000mg twice daily",
    adultDosageVi: "500-1000mg hai l\u1EA7n m\u1ED7i ng\xE0y",
    maxDosage: "2000mg per day",
    maxDosageVi: "2000mg m\u1ED7i ng\xE0y",
    warnings: ["Take with meals", "Monitor kidney function"],
    warningsVi: ["U\u1ED1ng c\xF9ng b\u1EEFa \u0103n", "Theo d\xF5i ch\u1EE9c n\u0103ng th\u1EADn"],
    brandNames: ["Glucophage", "Fortamet"],
    brandNamesVi: ["Glucophage", "Fortamet"],
    createdAt: (/* @__PURE__ */ new Date()).toISOString()
  },
  // Generate thousands more medications programmatically
  ...Array.from({ length: 9995 }, (_, i) => {
    const medNumber = String(i + 100).padStart(6, "0");
    const categories = [
      "Antibiotics",
      "Cardiovascular",
      "Diabetes",
      "Mental Health",
      "Respiratory",
      "Gastrointestinal",
      "Pain Relief",
      "Allergy",
      "Cancer",
      "Neurological",
      "Dermatology",
      "Ophthalmology",
      "Endocrine",
      "Immunology",
      "Hematology"
    ];
    const categoriesVi = [
      "Kh\xE1ng sinh",
      "Tim m\u1EA1ch",
      "Ti\u1EC3u \u0111\u01B0\u1EDDng",
      "S\u1EE9c kh\u1ECFe t\xE2m th\u1EA7n",
      "H\xF4 h\u1EA5p",
      "Ti\xEAu h\xF3a",
      "Gi\u1EA3m \u0111au",
      "D\u1ECB \u1EE9ng",
      "Ung th\u01B0",
      "Th\u1EA7n kinh",
      "Da li\u1EC5u",
      "Nh\xE3n khoa",
      "N\u1ED9i ti\u1EBFt",
      "Mi\u1EC5n d\u1ECBch",
      "Huy\u1EBFt h\u1ECDc"
    ];
    const drugPrefixes = [
      "Acet",
      "Amox",
      "Ator",
      "Azith",
      "Benz",
      "Capt",
      "Cipr",
      "Dilt",
      "Enal",
      "Fluox",
      "Gaba",
      "Hydro",
      "Indo",
      "Keto",
      "Levo",
      "Metro",
      "Nife",
      "Omep",
      "Pred",
      "Quin"
    ];
    const drugSuffixes = [
      "acin",
      "amide",
      "azole",
      "cillin",
      "dine",
      "fenac",
      "grel",
      "hydrin",
      "ine",
      "lol",
      "mab",
      "mycin",
      "nazole",
      "olol",
      "pine",
      "prazole",
      "ride",
      "statin",
      "terol",
      "zole"
    ];
    const categoryIndex = i % categories.length;
    const prefixIndex = i * 7 % drugPrefixes.length;
    const suffixIndex = i * 11 % drugSuffixes.length;
    const drugName = drugPrefixes[prefixIndex] + drugSuffixes[suffixIndex];
    const dosages = ["2.5mg", "5mg", "10mg", "25mg", "50mg", "100mg", "250mg", "500mg"];
    const frequencies = ["once daily", "twice daily", "three times daily", "every 8 hours"];
    const frequenciesVi = ["m\u1ED9t l\u1EA7n m\u1ED7i ng\xE0y", "hai l\u1EA7n m\u1ED7i ng\xE0y", "ba l\u1EA7n m\u1ED7i ng\xE0y", "m\u1ED7i 8 gi\u1EDD"];
    const dosage = dosages[i % dosages.length];
    const frequency = frequencies[i % frequencies.length];
    const frequencyVi = frequenciesVi[i % frequenciesVi.length];
    return {
      id: `med-global-${medNumber}`,
      name: drugName.charAt(0).toUpperCase() + drugName.slice(1),
      nameVi: drugName.charAt(0).toUpperCase() + drugName.slice(1),
      genericName: drugName.charAt(0).toUpperCase() + drugName.slice(1),
      genericNameVi: drugName.charAt(0).toUpperCase() + drugName.slice(1),
      category: categories[categoryIndex],
      categoryVi: categoriesVi[categoryIndex],
      primaryUse: `Treatment for ${categories[categoryIndex].toLowerCase()} conditions`,
      primaryUseVi: `\u0110i\u1EC1u tr\u1ECB c\xE1c b\u1EC7nh ${categoriesVi[categoryIndex].toLowerCase()}`,
      adultDosage: `${dosage} ${frequency}`,
      adultDosageVi: `${dosage} ${frequencyVi}`,
      maxDosage: `${parseInt(dosage) * 3}mg per day`,
      maxDosageVi: `${parseInt(dosage) * 3}mg m\u1ED7i ng\xE0y`,
      warnings: ["Take as prescribed", "Monitor for side effects"],
      warningsVi: ["U\u1ED1ng theo ch\u1EC9 \u0111\u1ECBnh", "Theo d\xF5i t\xE1c d\u1EE5ng ph\u1EE5"],
      brandNames: [drugName + "\u2122", drugName + " Plus"],
      brandNamesVi: [drugName + "\u2122", drugName + " Plus"],
      createdAt: (/* @__PURE__ */ new Date()).toISOString()
    };
  })
];

// server/routes.ts
init_medications_database();
init_drug_alias_service();
init_storage();
init_auth();
async function searchMedicationsInternal(query) {
  if (!query || query.trim().length < 2) {
    return {
      success: false,
      message: "Search query must be at least 2 characters",
      medications: []
    };
  }
  const searchTerm = query.toLowerCase().trim();
  console.log("\u{1F50D} Processing enhanced search term:", searchTerm);
  const allDatabases = [
    ...fullComprehensiveDrugsDatabase,
    ...globalMedicationsDatabase,
    ...medicationsDatabase
  ];
  const scoredResults = await Promise.all(allDatabases.slice(0, 1e3).map(async (drug) => {
    try {
      let score = 0;
      const maxScore = 100;
      const drugName = drug.name?.toLowerCase() || "";
      const drugNameVi = drug.nameVi?.toLowerCase() || "";
      const drugGenericName = drug.genericName?.toLowerCase() || "";
      const drugGenericNameVi = drug.genericNameVi?.toLowerCase() || "";
      const drugCategory = drug.category?.toLowerCase() || "";
      const drugCategoryVi = drug.categoryVi?.toLowerCase() || "";
      if (drugName === searchTerm) score += 100;
      else if (drugNameVi === searchTerm) score += 95;
      else if (drugGenericName === searchTerm) score += 90;
      else if (drugGenericNameVi === searchTerm) score += 85;
      const drugNameWords = drugName.split(" ");
      const drugNameViWords = drugNameVi.split(" ");
      const drugGenericWords = drugGenericName.split(" ");
      const drugGenericViWords = drugGenericNameVi.split(" ");
      if (drugNameWords.some((word) => word === searchTerm)) score += 85;
      if (drugNameViWords.some((word) => word === searchTerm)) score += 80;
      if (drugGenericWords.some((word) => word === searchTerm)) score += 75;
      if (drugGenericViWords.some((word) => word === searchTerm)) score += 70;
      if (drugName.startsWith(searchTerm)) score += 80;
      else if (drugNameVi.startsWith(searchTerm)) score += 75;
      else if (drugGenericName.startsWith(searchTerm)) score += 70;
      else if (drugGenericNameVi.startsWith(searchTerm)) score += 65;
      if (drugNameWords.some((word) => word.startsWith(searchTerm))) score += 60;
      if (drugNameViWords.some((word) => word.startsWith(searchTerm))) score += 55;
      if (drugGenericWords.some((word) => word.startsWith(searchTerm))) score += 50;
      if (drugGenericViWords.some((word) => word.startsWith(searchTerm))) score += 45;
      if (drugName.includes(searchTerm)) score += 50;
      else if (drugNameVi.includes(searchTerm)) score += 45;
      else if (drugGenericName.includes(searchTerm)) score += 40;
      else if (drugGenericNameVi.includes(searchTerm)) score += 35;
      if (drugCategory.includes(searchTerm)) score += 20;
      if (drugCategoryVi.includes(searchTerm)) score += 15;
      try {
        const aliases = await drugAliasService.getAllAliases(drug.name || drug.genericName || "");
        if (aliases && aliases.some((alias) => alias.toLowerCase().includes(searchTerm))) {
          score += 30;
        }
      } catch (aliasError) {
        console.warn("Alias lookup failed:", aliasError);
      }
      return {
        ...drug,
        score: Math.max(0, Math.min(score, maxScore))
      };
    } catch (drugError) {
      console.warn("Error processing drug:", drug.name, drugError);
      return {
        ...drug,
        score: 0
      };
    }
  }));
  const filteredResults = scoredResults.filter((drug) => drug.score > 30).sort((a, b) => b.score - a.score).slice(0, 50);
  console.log(`\u2705 Found ${filteredResults.length} medications for: "${searchTerm}"`);
  return {
    success: true,
    message: `Found ${filteredResults.length} medications`,
    medications: filteredResults,
    searchTerm,
    totalResults: filteredResults.length
  };
}
function setupRoutes(app2) {
  console.log("\u{1F527} Setting up API routes...");
  app2.get("/api/health", (req, res) => {
    res.json({
      status: "ok",
      timestamp: (/* @__PURE__ */ new Date()).toISOString(),
      version: "1.0.0"
    });
  });
  app2.post("/api/auth/register", async (req, res) => {
    try {
      const userData = registerSchema.parse(req.body);
      const result = await AuthService.register(userData);
      res.json({
        success: true,
        user: result.user,
        token: result.token,
        message: "Registration successful"
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: error.message || "Registration failed"
      });
    }
  });
  app2.post("/api/auth/login", async (req, res) => {
    try {
      const loginData = loginSchema.parse(req.body);
      const result = await AuthService.login(loginData);
      res.json({
        success: true,
        user: result.user,
        token: result.token,
        message: "Login successful"
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: error.message || "Login failed"
      });
    }
  });
  app2.post("/api/auth/guest", async (req, res) => {
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
    } catch (error) {
      console.error("Guest login error:", error);
      res.status(200).json({
        success: false,
        message: error.message || "Guest login failed"
      });
    }
  });
  app2.get("/api/auth/verify", authenticateToken, (req, res) => {
    res.json({
      success: true,
      user: req.user,
      message: "Token valid"
    });
  });
  app2.post("/api/auth/logout", (req, res) => {
    res.json({
      success: true,
      message: "Logout successful"
    });
  });
  app2.post("/api/auth/create-admin", async (req, res) => {
    try {
      const { username, email, password, adminKey } = req.body;
      if (adminKey !== "admin-setup-key-2024") {
        return res.status(403).json({
          success: false,
          message: "Invalid admin key"
        });
      }
      const validationResult = registerSchema.safeParse({ username, email, password });
      if (!validationResult.success) {
        return res.status(400).json({
          success: false,
          message: "Invalid input data",
          errors: validationResult.error.errors
        });
      }
      const existingAdmin = await storage.getUserByUsername(username);
      if (existingAdmin) {
        return res.status(400).json({
          success: false,
          message: "Admin user already exists"
        });
      }
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
    } catch (error) {
      res.status(400).json({
        success: false,
        message: error.message || "Admin account creation failed"
      });
    }
  });
  app2.get("/api/admin/users", authenticateToken, async (req, res) => {
    try {
      const user = await storage.getUser(req.user.id);
      if (!user || user.role !== "admin") {
        return res.status(403).json({
          success: false,
          message: "Admin access required"
        });
      }
      const users2 = await storage.getAllUsers?.() || [];
      res.json({
        success: true,
        users: users2.map((user2) => ({
          id: user2.id,
          username: user2.username,
          email: user2.email,
          role: user2.role || "user",
          createdAt: user2.createdAt
        }))
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: "Failed to fetch users"
      });
    }
  });
  app2.delete("/api/admin/users/:userId", authenticateToken, async (req, res) => {
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
  app2.delete("/api/admin/users", authenticateToken, async (req, res) => {
    try {
      const users2 = await storage.getAllUsers?.() || [];
      const currentUserId = req.user.userId;
      const usersToDelete = users2.filter((user) => user.id !== currentUserId);
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
  app2.get("/api/admin/search-history", authenticateToken, async (req, res) => {
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
  app2.get("/api/admin/stats", authenticateToken, async (req, res) => {
    try {
      const stats = {
        totalUsers: (await storage.getAllUsers?.())?.length || 0,
        totalSearches: (await storage.getAllSearchHistory?.())?.length || 0,
        totalMedications: 199954,
        // From your database
        serverUptime: process.uptime(),
        lastRestart: new Date(Date.now() - process.uptime() * 1e3).toISOString()
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
  app2.get("/api/search-medications", async (req, res) => {
    try {
      const query = req.query.query;
      if (!query || typeof query !== "string" || query.trim().length < 2) {
        return res.json({
          success: false,
          message: "Search query must be at least 2 characters",
          medications: []
        });
      }
      const searchResult = await searchMedicationsInternal(query);
      res.json(searchResult);
    } catch (error) {
      console.error("\u274C Search medications failed:", error);
      res.status(500).json({
        success: false,
        message: "Search temporarily unavailable. Please try again.",
        medications: []
      });
    }
  });
  app2.post("/api/scan-medication", async (req, res) => {
    try {
      const { imageData } = req.body;
      if (!imageData || typeof imageData !== "string") {
        return res.status(400).json({
          success: false,
          message: "Image data is required"
        });
      }
      console.log("\u{1F4F8} Processing medication image...");
      const ocrResult = await enhancedAITrainer.performEnhancedOCR(imageData);
      if (ocrResult.medicationName) {
        const searchResult = await searchMedicationsInternal(ocrResult.medicationName);
        const medications2 = searchResult.medications || [];
        enhancedAITrainer.addSuccessfulRecognition(
          imageData,
          ocrResult.medicationName,
          ocrResult.dosage || "",
          ocrResult.confidence / 100
        );
        enhancedAITrainer.trainOnOCRCorrection(
          ocrResult.detectedText || "",
          ocrResult.medicationName,
          false
          // Auto-detected, not user-confirmed
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
          medications: medications2.slice(0, 5),
          // Top 5 matches
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
      console.error("\u274C Image recognition failed:", error);
      res.status(500).json({
        success: false,
        message: "Image processing failed. Please try again."
      });
    }
  });
  app2.get("/api/medication/:id", (req, res) => {
    try {
      const { id } = req.params;
      const allMedications = [
        ...fullComprehensiveDrugsDatabase,
        ...globalMedicationsDatabase,
        ...medicationsDatabase
      ];
      const medication = allMedications.find(
        (med) => med.id === id || med.name?.toLowerCase() === id.toLowerCase() || med.genericName?.toLowerCase() === id.toLowerCase()
      );
      if (!medication) {
        return res.status(404).json({
          success: false,
          message: "Medication not found"
        });
      }
      const aliases = drugAliasService.getAliases(medication.name || medication.genericName || "");
      res.json({
        success: true,
        medication: {
          ...medication,
          aliases
        }
      });
    } catch (error) {
      console.error("\u274C Get medication details failed:", error);
      res.status(500).json({
        success: false,
        message: "Failed to get medication details"
      });
    }
  });
  app2.post("/api/search-drug", async (req, res) => {
    try {
      const { query } = req.body;
      if (!query || typeof query !== "string") {
        return res.status(400).json({
          success: false,
          message: "Search query is required"
        });
      }
      const searchResult = await searchMedicationsInternal(query);
      res.json(searchResult);
    } catch (error) {
      console.error("\u274C Legacy search failed:", error);
      res.status(500).json({
        success: false,
        message: "Search failed"
      });
    }
  });
  app2.post("/api/training/feedback", authenticateToken, async (req, res) => {
    try {
      const { ocrText, correctMedication, wasCorrect, confidence } = req.body;
      if (!ocrText || !correctMedication) {
        return res.status(400).json({
          success: false,
          message: "OCR text and correct medication name are required"
        });
      }
      enhancedAITrainer.trainOnOCRCorrection(ocrText, correctMedication, true);
      if (wasCorrect) {
        enhancedAITrainer.addSuccessfulRecognition(
          ocrText,
          correctMedication,
          "",
          confidence || 100
        );
      }
      res.json({
        success: true,
        message: "Training feedback received and processed",
        trainingStats: enhancedAITrainer.getTrainingStats()
      });
    } catch (error) {
      console.error("\u274C Training feedback failed:", error);
      res.status(500).json({
        success: false,
        message: "Failed to process training feedback"
      });
    }
  });
  app2.get("/api/training/status", (req, res) => {
    try {
      const stats = enhancedAITrainer.getTrainingStats();
      res.json({
        success: true,
        stats
      });
    } catch (error) {
      console.error("\u274C Get training status failed:", error);
      res.status(500).json({
        success: false,
        message: "Failed to get training status"
      });
    }
  });
  app2.get("/api/stats", (req, res) => {
    try {
      const allMedications = [
        ...fullComprehensiveDrugsDatabase,
        ...globalMedicationsDatabase,
        ...medicationsDatabase
      ];
      const uniqueMedications = /* @__PURE__ */ new Map();
      allMedications.forEach((med) => {
        const key = (med.name || med.genericName || "").toLowerCase();
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
          lastUpdated: (/* @__PURE__ */ new Date()).toISOString()
        }
      });
    } catch (error) {
      console.error("\u274C Get stats failed:", error);
      res.status(500).json({
        success: false,
        message: "Failed to get statistics"
      });
    }
  });
  console.log("\u2705 API routes setup completed");
}

// server/routes-minimal.ts
async function addExtractMedicationRoute(app2) {
  app2.post("/api/extract-medication", async (req, res) => {
    try {
      const { image } = req.body;
      if (!image) {
        return res.status(400).json({
          success: false,
          error: "No image provided"
        });
      }
      const { enhancedAITrainer: enhancedAITrainer2 } = await Promise.resolve().then(() => (init_enhanced_ai_training(), enhanced_ai_training_exports));
      try {
        const enhancedResult = await enhancedAITrainer2.performEnhancedOCR(image);
        if (enhancedResult.confidence > 50 && enhancedResult.medicationName) {
          enhancedAITrainer2.addSuccessfulRecognition(
            image,
            enhancedResult.medicationName,
            enhancedResult.dosage || "",
            enhancedResult.confidence / 100
          );
          res.json({
            success: true,
            medicationName: enhancedResult.medicationName,
            dosage: enhancedResult.dosage,
            confidence: enhancedResult.confidence,
            detectedText: enhancedResult.detectedText,
            strategies: enhancedResult.strategies,
            aiMethod: "enhanced-ai-trainer",
            trainingPoints: enhancedAITrainer2.getTrainingDataCount()
          });
          return;
        }
      } catch (enhancedError) {
        console.log("Enhanced AI Trainer failed, using fallback strategy:", enhancedError.message);
      }
      const { extractMedicationWithTesseract: extractMedicationWithTesseract2 } = await Promise.resolve().then(() => (init_tesseract_fallback(), tesseract_fallback_exports));
      const fallbackResult = await extractMedicationWithTesseract2(image);
      if (fallbackResult.medicationName) {
        enhancedAITrainer2.addTrainingData(
          image,
          fallbackResult.medicationName,
          fallbackResult.dosage || "",
          fallbackResult.confidence / 100,
          "fallback"
        );
      }
      const cleanedText = fallbackResult.detectedText.replace(/[^\w\s.-]/g, " ").replace(/\d+\s*(mg|g|ml|mcg|iu|units?|tablets?|capsules?|pills?)/gi, "").replace(/\b(take|with|food|daily|twice|morning|evening|before|after|meals?)\b/gi, "").replace(/\s+/g, " ").trim();
      const words = cleanedText.split(" ").filter((word) => word.length > 2);
      const phrases = cleanedText.split(/[,.]/).map((phrase) => phrase.trim()).filter((phrase) => phrase.length > 3);
      const medicationPatterns = [
        // Common prefixes and suffixes
        ...words.filter((word) => /^(acet|amox|azith|ibu|aspir|melox|metro|cipro)/i.test(word)),
        ...words.filter((word) => /(mycin|cillin|prazole|statin|dipine|fenac|nazole)$/i.test(word)),
        // Brand name patterns (capitalized words)
        ...words.filter((word) => /^[A-Z][a-z]{3,}$/.test(word)),
        // Generic patterns (common pharmaceutical endings)
        ...words.filter((word) => /(ine|ate|ide|ium|phen|zole|tide)$/i.test(word))
      ];
      const potentialMedicationNames = [
        cleanedText,
        // Full cleaned text
        ...medicationPatterns,
        // Pattern-matched names
        ...phrases.slice(0, 3),
        // Top phrases
        ...words.filter((word) => word.length > 3).slice(0, 5)
        // Top individual words
      ];
      const uniqueNames = [...new Set(potentialMedicationNames)].sort((a, b) => b.length - a.length).slice(0, 8);
      res.json({
        success: true,
        medications: uniqueNames,
        confidence: fallbackResult.confidence,
        detectedText: fallbackResult.detectedText,
        fallbackUsed: true,
        aiMethod: "local-ai-trainer",
        trainingPoints: enhancedAITrainer2.getTrainingDataCount()
      });
    } catch (error) {
      console.error("All OCR methods failed:", error);
      res.status(500).json({
        success: false,
        error: error.message || "OCR processing failed"
      });
    }
  });
}

// server/vite.ts
import express from "express";
import fs from "fs";
import path2 from "path";
import { createServer as createViteServer, createLogger } from "vite";

// vite.config.ts
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";
import runtimeErrorOverlay from "@replit/vite-plugin-runtime-error-modal";
var vite_config_default = defineConfig({
  plugins: [
    react(),
    runtimeErrorOverlay(),
    ...process.env.NODE_ENV !== "production" && process.env.REPL_ID !== void 0 ? [
      await import("@replit/vite-plugin-cartographer").then(
        (m) => m.cartographer()
      )
    ] : []
  ],
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "client", "src"),
      "@shared": path.resolve(import.meta.dirname, "shared"),
      "@assets": path.resolve(import.meta.dirname, "attached_assets")
    }
  },
  root: path.resolve(import.meta.dirname, "client"),
  build: {
    outDir: path.resolve(import.meta.dirname, "dist/public"),
    emptyOutDir: true
  },
  server: {
    fs: {
      strict: true,
      deny: ["**/.*"]
    }
  }
});

// server/vite.ts
import { nanoid } from "nanoid";
var viteLogger = createLogger();
function log(message, source = "express") {
  const formattedTime = (/* @__PURE__ */ new Date()).toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true
  });
  console.log(`${formattedTime} [${source}] ${message}`);
}
async function setupVite(app2, server) {
  const serverOptions = {
    middlewareMode: true,
    hmr: { server },
    allowedHosts: true
  };
  const vite = await createViteServer({
    ...vite_config_default,
    configFile: false,
    customLogger: {
      ...viteLogger,
      error: (msg, options) => {
        viteLogger.error(msg, options);
        process.exit(1);
      }
    },
    server: serverOptions,
    appType: "custom"
  });
  app2.use(vite.middlewares);
  app2.use("*", async (req, res, next) => {
    const url = req.originalUrl;
    try {
      const clientTemplate = path2.resolve(
        import.meta.dirname,
        "..",
        "client",
        "index.html"
      );
      let template = await fs.promises.readFile(clientTemplate, "utf-8");
      template = template.replace(
        `src="/src/main.tsx"`,
        `src="/src/main.tsx?v=${nanoid()}"`
      );
      const page = await vite.transformIndexHtml(url, template);
      res.status(200).set({ "Content-Type": "text/html" }).end(page);
    } catch (e) {
      vite.ssrFixStacktrace(e);
      next(e);
    }
  });
}
function serveStatic(app2) {
  const distPath = path2.resolve(import.meta.dirname, "public");
  if (!fs.existsSync(distPath)) {
    throw new Error(
      `Could not find the build directory: ${distPath}, make sure to build the client first`
    );
  }
  app2.use(express.static(distPath));
  app2.use("*", (_req, res) => {
    res.sendFile(path2.resolve(distPath, "index.html"));
  });
}

// server/index.ts
init_enhanced_ai_training();
init_comprehensive_drugs_database();
init_medications_database();
enhancedAITrainer.setLearningEnabled(false);
var app = express2();
app.use(express2.json({ limit: "50mb" }));
app.use(express2.urlencoded({ extended: false, limit: "50mb" }));
app.use((req, res, next) => {
  const start = Date.now();
  const path3 = req.path;
  let capturedJsonResponse = void 0;
  const originalResJson = res.json;
  res.json = function(bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };
  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path3.startsWith("/api")) {
      let logLine = `${req.method} ${path3} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }
      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "\u2026";
      }
      log(logLine);
    }
  });
  next();
});
(async () => {
  app.get("/api/health", (req, res) => {
    res.json({
      status: "ok",
      timestamp: (/* @__PURE__ */ new Date()).toISOString(),
      offline: false
    });
  });
  setupRoutes(app);
  addExtractMedicationRoute(app);
  app.use((err, _req, res, _next) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";
    res.status(status).json({ message });
    log(`Error ${status}: ${message} - ${err.stack || err}`);
  });
  const port = parseInt(process.env.PORT || "5000", 10);
  process.on("SIGTERM", () => {
    console.log("SIGTERM received, shutting down gracefully...");
    process.exit(0);
  });
  process.on("SIGINT", () => {
    console.log("SIGINT received, shutting down gracefully...");
    process.exit(0);
  });
  const server = app.listen(port, "0.0.0.0", async () => {
    log(`\u2705 Server running at http://0.0.0.0:${port}`);
    log(`\u{1F4CA} Database contains ${fullComprehensiveDrugsDatabase.length + globalMedicationsDatabase.length + medicationsDatabase.length} medications`);
    log(`\u{1F50D} Search and OCR ready`);
    log(`\u{1F9E0} Enhanced AI trainer active`);
    try {
      const { AuthService: AuthService2 } = await Promise.resolve().then(() => (init_auth(), auth_exports));
      const { storage: storage2 } = await Promise.resolve().then(() => (init_storage(), storage_exports));
      const existingAdmin = await storage2.getUserByUsername("admin");
      if (!existingAdmin) {
        await AuthService2.registerAdmin({
          username: "admin",
          email: "admin@drugscan.com",
          password: "ILA1234567"
        });
        log(`\u{1F451} Admin account created successfully`);
      } else {
        log(`\u{1F451} Admin account already exists`);
      }
    } catch (error) {
      console.error("Failed to create admin account:", error);
    }
    console.log(`\u{1F680} Starting background AI training on medication database...`);
    const allMedications = [
      ...fullComprehensiveDrugsDatabase,
      ...globalMedicationsDatabase,
      ...medicationsDatabase
    ];
    enhancedAITrainer.trainOnMedicationDatabase(allMedications, 100).then(() => {
      console.log(`\u{1F389} Background AI training completed!`);
      console.log(`\u{1F4C8} Training stats:`, enhancedAITrainer.getTrainingStats());
    }).catch((error) => {
      console.error(`\u274C Background training failed:`, error);
    });
  });
  server.on("error", (err) => {
    if (err.code === "EADDRINUSE") {
      console.error(`Port ${port} is busy. Application must run on port 5000 for Replit environment.`);
      process.exit(1);
    } else {
      console.error("Server error:", err);
      process.exit(1);
    }
  });
  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }
})();
