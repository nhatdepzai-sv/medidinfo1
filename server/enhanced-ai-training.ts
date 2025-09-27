/**
 * Enhanced AI Training System for Medication Recognition
 * Uses Tesseract.js OCR with local machine learning patterns
 * No external API costs - completely free and local
 */

import { extractMedicationWithTesseract } from './tesseract-fallback';

export interface OCRResult {
  medicationName: string;
  confidence: number;
  dosage?: string;
  detectedText?: string;
  strategies?: string[];
  brandName?: string | null;
  genericName?: string | null;
  aliases?: string[];
}

export interface TrainingData {
  imageBuffer: Buffer | string;
  medicationName: string;
  dosage: string;
  confidence: number;
  source: string;
  timestamp: Date;
  success: boolean;
}

export class EnhancedAITrainer {
  private trainingDataCount = 0;
  private successfulRecognitions = 0;
  private failedRecognitions = 0;
  private trainingDatabase: TrainingData[] = [];
  private neuralPatterns: Map<string, number> = new Map();
  private medicationAliases: Map<string, string[]> = new Map();
  private isLearningEnabled = true;

  constructor() {
    console.log('🤖 Enhanced AI Trainer initialized (Free Local Mode)');
    console.log('📖 Tesseract.js OCR enabled');
    console.log('🧠 Local machine learning patterns active');
    console.log('🎯 Continuous learning activated');
    this.initializeNeuralPatterns();
    this.initializeMedicationAliases();
  }

  /**
   * Primary OCR method using Tesseract.js with enhanced local processing
   */
  async performEnhancedOCR(imageData: Buffer | string): Promise<OCRResult> {
    console.log('🔍 Starting enhanced local OCR analysis...');
    const strategies: string[] = [];

    try {
      // Convert Buffer to base64 if needed
      const base64Image = imageData instanceof Buffer 
        ? imageData.toString('base64')
        : imageData;

      // Strategy 1: Enhanced Tesseract OCR with preprocessing
      console.log('📖 Running enhanced Tesseract OCR...');
      try {
        const tesseractResult = await extractMedicationWithTesseract(base64Image);
        strategies.push('enhanced-tesseract');

        if (tesseractResult.detectedText && tesseractResult.detectedText.length > 2) {
          // Apply local AI enhancement
          const enhancedResult = this.enhanceWithLocalAI(tesseractResult);

          if (enhancedResult.medicationName && enhancedResult.confidence > 30) {
            console.log(`✅ Enhanced OCR success: ${enhancedResult.medicationName} (${enhancedResult.confidence}% confidence)`);

            // Log successful recognition for learning
            this.logTrainingData({
              imageBuffer: imageData,
              medicationName: enhancedResult.medicationName,
              dosage: enhancedResult.dosage || '',
              confidence: enhancedResult.confidence,
              source: 'enhanced-tesseract',
              timestamp: new Date(),
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
      } catch (tesseractError: any) {
        console.log(`⚠️ Enhanced Tesseract failed: ${tesseractError.message}`);
        strategies.push('tesseract-failed');
      }

      // Strategy 2: Pattern-based text analysis
      console.log('🔬 Attempting pattern-based analysis...');
      strategies.push('pattern-analysis');

      // Try to extract medication from any detected text using patterns
      if (typeof imageData === 'string') {
        const patternResult = this.extractMedicationFromText(imageData);
        if (patternResult.medicationName) {
          console.log(`✅ Pattern analysis success: ${patternResult.medicationName}`);

          this.logTrainingData({
            imageBuffer: imageData,
            medicationName: patternResult.medicationName,
            dosage: patternResult.dosage,
            confidence: patternResult.confidence,
            source: 'pattern-analysis',
            timestamp: new Date(),
            success: true
          });

          return {
            medicationName: patternResult.medicationName,
            confidence: patternResult.confidence,
            dosage: patternResult.dosage,
            detectedText: 'Pattern-based recognition',
            strategies,
            aliases: []
          };
        }
      }

      // If we reach here, all methods failed
      this.logTrainingData({
        imageBuffer: imageData,
        medicationName: '',
        dosage: '',
        confidence: 0,
        source: 'enhanced-ocr',
        timestamp: new Date(),
        success: false
      });

      return {
        medicationName: '',
        confidence: 0,
        detectedText: '',
        strategies,
        aliases: []
      };

    } catch (error: any) {
      console.error('❌ Enhanced OCR completely failed:', error);
      strategies.push('complete-failure');

      return {
        medicationName: '',
        confidence: 0,
        detectedText: '',
        strategies,
        aliases: []
      };
    }
  }

  /**
   * Add successful medication recognition for training
   */
  addSuccessfulRecognition(
    image: Buffer | string, 
    medicationName: string, 
    dosage: string, 
    confidence: number
  ): void {
    if (!this.isLearningEnabled) return; // CRITICAL: Stop all learning when disabled
    this.successfulRecognitions++;
    this.trainingDataCount++;

    const trainingData: TrainingData = {
      imageBuffer: image,
      medicationName,
      dosage,
      confidence,
      source: 'user-confirmation',
      timestamp: new Date(),
      success: true
    };

    this.logTrainingData(trainingData);
    console.log(`✅ Added successful recognition: ${medicationName} (confidence: ${confidence})`);
    console.log(`📊 Training progress: ${this.successfulRecognitions} successful / ${this.trainingDataCount} total`);

    // Update neural patterns based on successful recognition
    this.updateNeuralPatterns(medicationName, confidence);
  }

  /**
   * Add training data for continuous learning
   */
  addTrainingData(
    image: string,
    medicationName: string,
    dosage: string,
    confidence: number,
    source: string
  ): void {
    if (!this.isLearningEnabled) return; // CRITICAL: Stop all learning when disabled
    this.trainingDataCount++;

    const trainingData: TrainingData = {
      imageBuffer: image,
      medicationName,
      dosage,
      confidence,
      source,
      timestamp: new Date(),
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
  continuousLearning(input: string, expected: string, context: string[]): void {
    if (!this.isLearningEnabled) return;

    console.log(`🧠 Learning: "${input}" should be "${expected}"`);

    // Update neural patterns with correct mapping
    this.neuralPatterns.set(input.toLowerCase(), this.neuralPatterns.get(expected.toLowerCase()) || 1);

    // Increase confidence for correct medication names
    const currentWeight = this.neuralPatterns.get(expected.toLowerCase()) || 1;
    this.neuralPatterns.set(expected.toLowerCase(), Math.min(currentWeight + 0.1, 2.0));

    // Store context for future pattern recognition
    context.forEach(ctx => {
      if (ctx && ctx.length > 2) {
        const contextWeight = this.neuralPatterns.get(ctx.toLowerCase()) || 0.5;
        this.neuralPatterns.set(ctx.toLowerCase(), Math.min(contextWeight + 0.05, 1.5));
      }
    });

    // Learn medication aliases
    this.addMedicationAlias(input, expected);
  }

  /**
   * Advanced OCR training with expected results
   */
  async trainAdvancedOCR(image: string, expectedResult: string): Promise<void> {
    console.log(`🎯 Training local AI with expected result: ${expectedResult}`);

    try {
      // Perform OCR on training image
      const result = await this.performEnhancedOCR(image);

      // Calculate accuracy
      const accuracy = this.calculateAccuracy(result.medicationName, expectedResult);

      // Update neural patterns based on training result
      if (accuracy > 0.6) {
        this.updateNeuralPatterns(expectedResult, accuracy * 100);
        console.log(`✅ Training successful: ${Math.round(accuracy * 100)}% accuracy`);
      } else {
        // Learn from the incorrect result
        this.continuousLearning(result.medicationName, expectedResult, [result.detectedText || '']);
        console.log(`📚 Learning from error: Expected "${expectedResult}", got "${result.medicationName}"`);
      }

    } catch (error: any) {
      console.error(`❌ Advanced OCR training failed: ${error.message}`);
    }
  }

  /**
   * Get current training statistics
   */
  getTrainingStats() {
    const successRate = this.trainingDataCount > 0 
      ? (this.successfulRecognitions / this.trainingDataCount) * 100 
      : 0;

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
  autoTrainOnNewDrug(drugData: any): void {
    if (!this.isLearningEnabled || !drugData) return;

    const drugName = drugData.name || drugData.genericName || '';
    if (!drugName || drugName.length < 3) return;

    console.log(`🤖 Auto-training on new drug: ${drugName}`);

    // Add the drug to neural patterns
    this.updateNeuralPatterns(drugName, 75); // Start with 75% confidence for database drugs

    // Train with various name formats
    const trainingVariations = [
      drugName,
      drugName.toLowerCase(),
      drugName.toUpperCase(),
      drugData.genericName,
      drugData.nameVi,
      drugData.genericNameVi,
      ...(drugData.brandNames || []),
      ...(drugData.brandNamesVi || [])
    ].filter(name => name && name.length > 2);

    // Remove duplicates
    const uniqueVariations = [...new Set(trainingVariations)];

    uniqueVariations.forEach(variation => {
      if (variation && variation !== drugName) {
        this.continuousLearning(variation, drugName, uniqueVariations);
      }
    });

    // Add synthetic training data
    this.addTrainingData(
      `synthetic-${drugName}`,
      drugName,
      drugData.adultDosage || 'unknown dosage',
      75,
      'database-auto-training'
    );

    console.log(`✅ Auto-training completed for ${drugName} with ${uniqueVariations.length} variations`);
  }

  /**
   * Train on user search patterns to improve future searches
   */
  trainOnSearchPattern(searchQuery: string, foundMedications: any[]): void {
    if (!this.isLearningEnabled || !searchQuery || foundMedications.length === 0) return;

    const normalizedQuery = searchQuery.toLowerCase().trim();

    // Train on the top 3 search results to reinforce good matches
    foundMedications.slice(0, 3).forEach((med, index) => {
      const confidence = Math.max(90 - (index * 10), 60); // 90%, 80%, 70% confidence

      // Learn the association between search query and medication name
      this.continuousLearning(normalizedQuery, med.name || med.genericName, [
        med.name,
        med.genericName,
        med.nameVi,
        med.genericNameVi
      ].filter(Boolean));

      // Update neural patterns
      this.updateNeuralPatterns(med.name || med.genericName, confidence);
    });

    console.log(`🔍 Trained on search pattern: "${searchQuery}" -> ${foundMedications.length} results`);
  }

  /**
   * Train on OCR correction patterns
   */
  trainOnOCRCorrection(ocrText: string, correctedMedication: string, userConfirmed: boolean = false): void {
    if (!this.isLearningEnabled || !ocrText || !correctedMedication) return;

    const confidence = userConfirmed ? 95 : 70; // Higher confidence for user-confirmed corrections

    console.log(`📸 Training OCR correction: "${ocrText}" -> "${correctedMedication}"`);

    // Learn the OCR-to-medication mapping
    this.continuousLearning(ocrText.toLowerCase(), correctedMedication, [ocrText, correctedMedication]);

    // Update neural patterns
    this.updateNeuralPatterns(correctedMedication, confidence);

    // Add specific OCR training data
    this.addTrainingData(
      ocrText,
      correctedMedication,
      'unknown dosage',
      confidence,
      userConfirmed ? 'user-ocr-correction' : 'auto-ocr-correction'
    );

    console.log(`✅ OCR training completed for: ${correctedMedication}`);
  }

  /**
   * Background learning from medication database
   */
  async trainOnMedicationDatabase(medications: any[], batchSize: number = 50): Promise<void> {
    if (!this.isLearningEnabled || !medications || medications.length === 0) return;

    console.log(`🗄️ Starting background training on ${medications.length} medications...`);

    for (let i = 0; i < medications.length; i += batchSize) {
      const batch = medications.slice(i, i + batchSize);

      batch.forEach(med => {
        this.autoTrainOnNewDrug(med);
      });

      // Log progress every 1000 medications
      if ((i + batchSize) % 1000 === 0) {
        console.log(`📊 Database training progress: ${i + batchSize}/${medications.length} medications processed`);
      }

      // Small delay to prevent overwhelming the system
      if (i + batchSize < medications.length) {
        await new Promise(resolve => setTimeout(resolve, 10));
      }
    }

    console.log(`✅ Database training completed: ${medications.length} medications processed`);
  }

  /**
   * Get enhanced training statistics including new drug learning
   */
  getTrainingStats() {
    const successRate = this.trainingDataCount > 0 
      ? (this.successfulRecognitions / this.trainingDataCount) * 100 
      : 0;

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
  updateNeuralPatterns(medicationName?: string, confidence?: number): void {
    if (!this.isLearningEnabled) return; // CRITICAL: Stop all pattern updates when disabled
    if (!medicationName) return;

    const normalizedName = medicationName.toLowerCase();
    const currentWeight = this.neuralPatterns.get(normalizedName) || 1.0;
    const confidenceBoost = confidence ? confidence / 100 * 0.3 : 0.15;
    const newWeight = Math.min(currentWeight + confidenceBoost, 3.0);

    this.neuralPatterns.set(normalizedName, newWeight);

    // Also store common variations
    const variations = this.generateMedicationVariations(medicationName);
    variations.forEach(variation => {
      const variationWeight = this.neuralPatterns.get(variation) || 0.5;
      this.neuralPatterns.set(variation, Math.min(variationWeight + 0.08, 1.2));
    });

    console.log(`🧠 Updated neural pattern: ${medicationName} -> ${newWeight.toFixed(2)}`);
  }

  // Private helper methods

  private initializeNeuralPatterns(): void {
    // Initialize with common medication patterns and weights
    const commonMedications = [
      { name: 'acetaminophen', weight: 1.5 }, { name: 'tylenol', weight: 1.5 },
      { name: 'ibuprofen', weight: 1.5 }, { name: 'advil', weight: 1.4 }, { name: 'motrin', weight: 1.4 },
      { name: 'aspirin', weight: 1.3 }, { name: 'lipitor', weight: 1.3 }, { name: 'atorvastatin', weight: 1.3 },
      { name: 'metformin', weight: 1.2 }, { name: 'lisinopril', weight: 1.2 }, { name: 'amlodipine', weight: 1.2 },
      { name: 'omeprazole', weight: 1.1 }, { name: 'nexium', weight: 1.1 }, { name: 'prilosec', weight: 1.1 },
      { name: 'zoloft', weight: 1.0 }, { name: 'sertraline', weight: 1.0 }, { name: 'prozac', weight: 1.0 },
      { name: 'fluoxetine', weight: 1.0 }, { name: 'xanax', weight: 0.9 }, { name: 'alprazolam', weight: 0.9 }
    ];

    commonMedications.forEach(med => {
      this.neuralPatterns.set(med.name, med.weight);
    });

    console.log(`🧠 Initialized neural patterns with ${this.neuralPatterns.size} medication patterns`);
  }

  private initializeMedicationAliases(): void {
    // Initialize common medication aliases
    this.medicationAliases.set('acetaminophen', ['tylenol', 'panadol', 'apap', 'paracetamol']);
    this.medicationAliases.set('ibuprofen', ['advil', 'motrin', 'nurofen']);
    this.medicationAliases.set('atorvastatin', ['lipitor']);
    this.medicationAliases.set('sertraline', ['zoloft']);
    this.medicationAliases.set('fluoxetine', ['prozac']);
    this.medicationAliases.set('alprazolam', ['xanax']);
    this.medicationAliases.set('omeprazole', ['prilosec']);
    this.medicationAliases.set('esomeprazole', ['nexium']);
    this.medicationAliases.set('meloxicam', ['mobic']);

    console.log(`📝 Initialized medication aliases: ${this.medicationAliases.size} medications`);
  }

  private enhanceWithLocalAI(result: any): any {
    if (!result.medicationName && !result.detectedText) return result;

    // First, try to enhance using detected text
    let enhancedName = result.medicationName;
    let enhancedConfidence = result.confidence;

    // If no medication name was found, try to extract from detected text
    if (!enhancedName && result.detectedText) {
      const textAnalysis = this.extractMedicationFromText(result.detectedText);
      if (textAnalysis.medicationName) {
        enhancedName = textAnalysis.medicationName;
        enhancedConfidence = Math.max(textAnalysis.confidence, result.confidence);
      }
    }

    // Apply neural pattern enhancement
    if (enhancedName) {
      const normalizedName = enhancedName.toLowerCase();
      const patternWeight = this.neuralPatterns.get(normalizedName) || 1.0;

      // Boost confidence based on neural pattern recognition
      enhancedConfidence = Math.min(enhancedConfidence * patternWeight, 100);

      // Check for aliases and resolve to primary name
      const resolvedName = this.resolveMedicationAlias(enhancedName);
      if (resolvedName !== enhancedName) {
        enhancedName = resolvedName;
        enhancedConfidence += 10; // Boost for resolved alias
      }
    }

    return {
      ...result,
      medicationName: enhancedName,
      confidence: Math.round(enhancedConfidence)
    };
  }

  private extractMedicationFromText(text: string): { medicationName: string, dosage: string, confidence: number } {
    if (!text || text.length < 2) {
      return { medicationName: '', dosage: '', confidence: 0 };
    }

    const normalizedText = text.toLowerCase();
    let bestMatch = '';
    let bestWeight = 0;
    let confidence = 0;

    // Search for known medications in the text
    for (const [medication, weight] of this.neuralPatterns.entries()) {
      if (normalizedText.includes(medication)) {
        if (weight > bestWeight) {
          bestMatch = medication;
          bestWeight = weight;
          confidence = Math.min(weight * 40, 85); // Convert weight to confidence
        }
      }
    }

    // Extract dosage patterns
    const dosageMatch = text.match(/(\d+(?:\.\d+)?)\s*(mg|ml|g|mcg|iu|units?)/i);
    const dosage = dosageMatch ? `${dosageMatch[1]}${dosageMatch[2]}` : '';

    if (bestMatch) {
      console.log(`🔍 Text analysis found: ${bestMatch} (confidence: ${confidence}%)`);
    }

    return {
      medicationName: bestMatch,
      dosage: dosage,
      confidence: Math.round(confidence)
    };
  }

  private resolveMedicationAlias(medicationName: string): string {
    const normalized = medicationName.toLowerCase();

    // Check if this is an alias for another medication
    for (const [primary, aliases] of this.medicationAliases.entries()) {
      if (aliases.includes(normalized)) {
        return primary;
      }
    }

    // Check if this is a primary name with aliases
    if (this.medicationAliases.has(normalized)) {
      return normalized;
    }

    return medicationName;
  }

  private addMedicationAlias(alias: string, primaryName: string): void {
    const normalizedAlias = alias.toLowerCase();
    const normalizedPrimary = primaryName.toLowerCase();

    if (!this.medicationAliases.has(normalizedPrimary)) {
      this.medicationAliases.set(normalizedPrimary, []);
    }

    const aliases = this.medicationAliases.get(normalizedPrimary)!;
    if (!aliases.includes(normalizedAlias)) {
      aliases.push(normalizedAlias);
      console.log(`📝 Added alias: ${alias} -> ${primaryName}`);
    }
  }

  private logTrainingData(data: TrainingData): void {
    // Add to in-memory training database
    this.trainingDatabase.push(data);

    // Keep only the last 5,000 training records to save memory
    if (this.trainingDatabase.length > 5000) {
      this.trainingDatabase = this.trainingDatabase.slice(-5000);
    }

    // Update counters
    if (data.success) {
      this.successfulRecognitions++;
    } else {
      this.failedRecognitions++;
    }
  }

  private calculateAccuracy(detected: string, expected: string): number {
    if (!detected || !expected) return 0;

    const detectedLower = detected.toLowerCase();
    const expectedLower = expected.toLowerCase();

    if (detectedLower === expectedLower) return 1.0;

    // Check if they are aliases of each other
    const resolvedDetected = this.resolveMedicationAlias(detectedLower);
    const resolvedExpected = this.resolveMedicationAlias(expectedLower);

    if (resolvedDetected === resolvedExpected) return 0.9;

    // Use Levenshtein distance for fuzzy matching
    const distance = this.levenshteinDistance(detectedLower, expectedLower);
    const maxLength = Math.max(detectedLower.length, expectedLower.length);

    return Math.max(0, 1 - (distance / maxLength));
  }

  private levenshteinDistance(str1: string, str2: string): number {
    const matrix = Array(str2.length + 1).fill(null).map(() => Array(str1.length + 1).fill(null));

    for (let i = 0; i <= str1.length; i++) matrix[0][i] = i;
    for (let j = 0; j <= str2.length; j++) matrix[j][0] = j;

    for (let j = 1; j <= str2.length; j++) {
      for (let i = 1; i <= str1.length; i++) {
        const indicator = str1[i - 1] === str2[j - 1] ? 0 : 1;
        matrix[j][i] = Math.min(
          matrix[j][i - 1] + 1,     // deletion
          matrix[j - 1][i] + 1,     // insertion
          matrix[j - 1][i - 1] + indicator // substitution
        );
      }
    }

    return matrix[str2.length][str1.length];
  }

  private generateMedicationVariations(medicationName: string): string[] {
    const variations = [];
    const name = medicationName.toLowerCase();

    // Common abbreviations and variations
    variations.push(name.replace(/acetaminophen/g, 'apap'));
    variations.push(name.replace(/acetaminophen/g, 'paracetamol'));
    variations.push(name.replace(/hydrochlorothiazide/g, 'hctz'));
    variations.push(name.replace(/extended release/g, 'er'));
    variations.push(name.replace(/extended release/g, 'xl'));
    variations.push(name.replace(/immediate release/g, 'ir'));

    // Remove common suffixes
    variations.push(name.replace(/ (tablet|capsule|mg|ml)s?$/g, ''));
    variations.push(name.replace(/ (pills?|caps?|tabs?)$/g, ''));

    return variations.filter(v => v !== name && v.length > 2);
  }

  setLearningEnabled(enabled: boolean): void {
    this.isLearningEnabled = enabled;
    console.log(`🧠 Continuous learning ${enabled ? 'enabled' : 'disabled'}`);
  }
}

// Export singleton instance
export const enhancedAITrainer = new EnhancedAITrainer();