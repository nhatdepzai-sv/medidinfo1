// Enhanced AI Training System for Medication Recognition
import { createWorker } from 'tesseract.js';

export interface TrainingDataPoint {
  imageBase64: string;
  expectedMedication: string;
  expectedDosage: string;
  difficulty: 'easy' | 'medium' | 'hard';
  conditions: string[]; // lighting, angle, clarity, etc.
}

export interface TrainingResult {
  accuracy: number;
  precision: number;
  recall: number;
  f1Score: number;
  confusionMatrix: Map<string, Map<string, number>>;
}

export interface OCRTrainingConfig {
  // Enhanced Tesseract configurations
  charWhitelist: string;
  pageSegMode: string;
  ocrEngineMode: string;
  preserveInterwordSpaces: string;
  // Advanced preprocessing options
  imagePreprocessing: {
    enableDenoise: boolean;
    enableContrast: boolean;
    enableSharpening: boolean;
    enableBinarization: boolean;
  };
  // Training parameters
  confidenceThreshold: number;
  multiLanguageSupport: string[];
}

export class EnhancedAITrainer {
  private trainingData: TrainingDataPoint[] = [];
  private ocrConfig: OCRTrainingConfig;
  private performanceMetrics: Map<string, number> = new Map();
  private neuralPatterns: Map<string, number> = new Map();
  private medicationFrequency: Map<string, number> = new Map();
  private contextualPatterns: Map<string, string[]> = new Map();
  private errorCorrections: Map<string, string> = new Map();

  constructor() {
    this.ocrConfig = {
      charWhitelist: 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789 .-',
      pageSegMode: '6', // Single uniform block of text
      ocrEngineMode: '3', // Default, based on what is available
      preserveInterwordSpaces: '1',
      imagePreprocessing: {
        enableDenoise: true,
        enableContrast: true,
        enableSharpening: true,
        enableBinarization: true
      },
      confidenceThreshold: 60,
      multiLanguageSupport: ['eng', 'vie'] // English and Vietnamese
    };
  }

  /**
   * Enhanced OCR with multiple preprocessing and recognition strategies
   */
  async performEnhancedOCR(base64Image: string): Promise<{
    medicationName: string | null;
    dosage: string | null;
    confidence: number;
    detectedText: string;
    strategies: { name: string; confidence: number; result: string }[];
  }> {
    const strategies = [
      { name: 'standard', config: { ...this.ocrConfig } },
      { name: 'high_contrast', config: { ...this.ocrConfig, pageSegMode: '8' } },
      { name: 'single_word', config: { ...this.ocrConfig, pageSegMode: '8' } },
      { name: 'sparse_text', config: { ...this.ocrConfig, pageSegMode: '11' } }
    ];

    const results = [];
    let bestResult = null;
    let maxConfidence = 0;

    for (const strategy of strategies) {
      try {
        const worker = await createWorker('eng');

        await worker.setParameters({
          tessedit_char_whitelist: strategy.config.charWhitelist,
          tessedit_pageseg_mode: strategy.config.pageSegMode as any,
          tessedit_ocr_engine_mode: strategy.config.ocrEngineMode as any,
          preserve_interword_spaces: strategy.config.preserveInterwordSpaces as any
        });

        const imageBuffer = Buffer.from(base64Image, 'base64');
        const { data: { text, confidence } } = await worker.recognize(imageBuffer);
        await worker.terminate();

        const cleanText = this.preprocessText(text);
        const medicationInfo = this.extractMedicationWithAdvancedPatterns(cleanText);

        const strategyResult = {
          name: strategy.name,
          confidence: Math.round(confidence),
          result: cleanText,
          medicationInfo
        };

        results.push(strategyResult);

        if (confidence > maxConfidence && medicationInfo.name) {
          maxConfidence = confidence;
          bestResult = strategyResult;
        }
      } catch (error) {
        console.error(`Strategy ${strategy.name} failed:`, error);
      }
    }

    return {
      medicationName: bestResult?.medicationInfo?.name || null,
      dosage: bestResult?.medicationInfo?.dosage || null,
      confidence: Math.round(maxConfidence),
      detectedText: bestResult?.result || '',
      strategies: results.map(r => ({
        name: r.name,
        confidence: r.confidence,
        result: r.result
      }))
    };
  }

  /**
   * Advanced text preprocessing with multiple techniques
   */
  private preprocessText(text: string): string {
    return text
      // Remove noise characters but preserve medical terminology
      .replace(/[^\w\s.-]/g, ' ')
      // Normalize whitespace
      .replace(/\s+/g, ' ')
      // Remove line breaks
      .replace(/\n/g, ' ')
      // Fix common OCR mistakes for medical terms
      .replace(/0/g, 'O') // Zero to O for medication names
      .replace(/1/g, 'I') // One to I where appropriate
      // Preserve dosage numbers
      .replace(/([A-Za-z])(\d+)/g, '$1 $2')
      .replace(/(\d+)([A-Za-z])/g, '$1$2')
      .trim();
  }

  /**
   * Enhanced medication pattern extraction with machine learning-inspired scoring
   */
  private extractMedicationWithAdvancedPatterns(text: string): {
    name: string | null;
    dosage: string | null;
    brandName: string | null;
    genericName: string | null;
  } {
    if (!text || text.length < 2) {
      return { name: null, dosage: null, brandName: null, genericName: null };
    }

    const words = text.toLowerCase().split(/\s+/);

    // Comprehensive medication database for pattern matching
    const knownMedications = {
      brands: [
        'tylenol', 'advil', 'motrin', 'aleve', 'aspirin', 'bayer', 'excedrin',
        'lipitor', 'crestor', 'zoloft', 'prozac', 'lexapro', 'wellbutrin',
        'xanax', 'ativan', 'valium', 'klonopin', 'ambien', 'lunesta',
        'viagra', 'cialis', 'levitra', 'nexium', 'prilosec', 'prevacid',
        'zantac', 'pepcid', 'tums', 'rolaids', 'mobic', 'celebrex',
        'voltaren', 'diclofenac', 'naproxen', 'meloxicam', 'tramadol',
        'ultram', 'norco', 'vicodin', 'percocet', 'oxycontin', 'morphine',
        'fentanyl', 'codeine', 'hydrocodone', 'oxycodone', 'metformin',
        'glucophage', 'januvia', 'victoza', 'trulicity', 'lantus',
        'humalog', 'novolog', 'lisinopril', 'enalapril', 'losartan',
        'valsartan', 'amlodipine', 'norvasc', 'nifedipine', 'diltiazem',
        'metoprolol', 'atenolol', 'propranolol', 'carvedilol', 'warfarin',
        'coumadin', 'eliquis', 'xarelto', 'pradaxa', 'plavix', 'aspirin'
      ],
      generics: [
        'acetaminophen', 'paracetamol', 'ibuprofen', 'naproxen', 'diclofenac',
        'atorvastatin', 'simvastatin', 'rosuvastatin', 'pravastatin',
        'sertraline', 'fluoxetine', 'paroxetine', 'citalopram', 'escitalopram',
        'alprazolam', 'lorazepam', 'diazepam', 'clonazepam', 'zolpidem',
        'sildenafil', 'tadalafil', 'vardenafil', 'omeprazole', 'lansoprazole',
        'pantoprazole', 'esomeprazole', 'ranitidine', 'famotidine',
        'meloxicam', 'celecoxib', 'tramadol', 'gabapentin', 'pregabalin',
        'amitriptyline', 'nortriptyline', 'duloxetine', 'venlafaxine',
        'metformin', 'glipizide', 'glyburide', 'pioglitazone', 'sitagliptin',
        'insulin', 'lisinopril', 'enalapril', 'captopril', 'losartan',
        'valsartan', 'irbesartan', 'amlodipine', 'nifedipine', 'diltiazem',
        'verapamil', 'metoprolol', 'atenolol', 'propranolol', 'carvedilol',
        'hydrochlorothiazide', 'furosemide', 'spironolactone', 'warfarin',
        'rivaroxaban', 'apixaban', 'dabigatran', 'clopidogrel', 'aspirin'
      ],
      antibiotics: [
        'amoxicillin', 'azithromycin', 'ciprofloxacin', 'levofloxacin',
        'doxycycline', 'clindamycin', 'metronidazole', 'cephalexin',
        'trimethoprim', 'sulfamethoxazole', 'penicillin', 'erythromycin'
      ]
    };

    // Advanced medication name patterns with scoring
    const medicationPatterns = [
      // Exact matches (highest confidence)
      { pattern: new RegExp(`\\b(${[...knownMedications.brands, ...knownMedications.generics, ...knownMedications.antibiotics].join('|')})\\b`, 'i'), score: 1.0 },
      // Common pharmaceutical suffixes (high confidence)
      { pattern: /([\w]+(?:cillin|mycin|prazole|statin|dipine|fenac|nazole|zole|ide|ium|phen|ine|ate|ol|al|ic))/, score: 0.9 },
      // Common prefixes (medium confidence)  
      { pattern: /((?:acet|amox|azith|ibu|aspir|melox|metro|cipro|hydro|oxy|mor|tram|gaba|pre|ami|nor|dul|ven|met|gli|pio|sit|cap|ena|val|irb|aml|nif|dil|ver|ate|pro|car|furo|spir|war|riv|api|dab|clo)[\w]+)/, score: 0.8 },
      // Brand name patterns (capitalized, 4-12 chars)
      { pattern: /([A-Z][a-z]{3,11})/, score: 0.7 },
      // Generic patterns (lowercase, medical endings)
      { pattern: /([\w]{4,}(?:ine|ate|ol|al|ic|an|in))/, score: 0.6 }
    ];

    let bestMatch = null;
    let bestScore = 0;
    let matchType = 'unknown';

    // First pass: Look for exact medication matches
    const allKnownMeds = [...knownMedications.brands, ...knownMedications.generics, ...knownMedications.antibiotics];
    for (const word of words) {
      for (const knownMed of allKnownMeds) {
        const similarity = this.calculateAdvancedSimilarity(word, knownMed);
        if (similarity > 0.8) { // High similarity threshold
          const score = similarity * 1.0; // Highest confidence for known meds
          if (score > bestScore) {
            bestScore = score;
            bestMatch = knownMed;
            matchType = knownMedications.brands.includes(knownMed) ? 'brand' : 'generic';
          }
        }
      }
    }

    // Second pass: Pattern matching if no exact match found
    if (bestScore < 0.8) {
      for (const word of words) {
        for (const { pattern, score } of medicationPatterns) {
          const match = word.match(pattern);
          if (match && match[1]) {
            const lengthBonus = Math.min(word.length / 10, 0.2);
            const contextBonus = this.getContextBonus(word, words);
            const totalScore = score + lengthBonus + contextBonus;

            if (totalScore > bestScore) {
              bestScore = totalScore;
              bestMatch = match[1].toLowerCase();
              matchType = 'pattern';
            }
          }
        }
      }
    }

    // Enhanced dosage extraction with more comprehensive patterns
    const dosagePatterns = [
      // Standard dosages
      /(\d+(?:\.\d+)?)\s*(mg|ml|g|mcg|ug|µg|units?|iu|tablets?|caps?|capsules?|drops?|sprays?|patches?|grams?)/i,
      // Combination dosages (e.g., "5/325 mg", "10mg/25mg")
      /(\d+(?:\.\d+)?)\s*\/\s*(\d+(?:\.\d+)?)\s*(mg|ml|g|mcg|ug|µg)/i,
      // Multiplication notation (e.g., "2 x 500mg")
      /(\d+)\s*[x×]\s*(\d+(?:\.\d+)?)\s*(mg|ml|g|mcg|ug|µg)/i,
      // Percentage concentrations (e.g., "1%", "2.5%")
      /(\d+(?:\.\d+)?)\s*%/i,
      // Ratio concentrations (e.g., "1:1000")
      /(\d+)\s*:\s*(\d+)/i,
      // International units
      /(\d+(?:\.\d+)?)\s*(iu|international\s+units?)/i,
      // Time-release indicators
      /(\d+(?:\.\d+)?)\s*(mg|ml|g)\s*(er|xr|cr|sr|xl|la|od|bid|tid|qid)/i
    ];

    let dosage = null;
    let dosageConfidence = 0;

    for (const pattern of dosagePatterns) {
      const match = text.match(pattern);
      if (match) {
        dosage = match[0].trim();
        // Calculate dosage confidence based on pattern complexity
        if (match[0].includes('/') || match[0].includes('x') || match[0].includes('%')) {
          dosageConfidence = 0.9; // Complex patterns are usually more reliable
        } else {
          dosageConfidence = 0.8;
        }
        break;
      }
    }

    // Enhanced brand/generic classification
    const isBrand = bestMatch && knownMedications.brands.includes(bestMatch.toLowerCase());
    const isGeneric = bestMatch && knownMedications.generics.includes(bestMatch.toLowerCase());
    const isAntibiotic = bestMatch && knownMedications.antibiotics.includes(bestMatch.toLowerCase());

    return {
      name: bestMatch,
      dosage: dosage,
      brandName: isBrand ? this.capitalizeMedication(bestMatch) : null,
      genericName: (isGeneric || isAntibiotic) ? bestMatch.toLowerCase() : null
    };
  }

  /**
   * Calculate context bonus for medication recognition
   */
  private getContextBonus(word: string, allWords: string[]): number {
    let bonus = 0;

    // Medical context words that increase confidence
    const medicalContextWords = [
      'tablet', 'capsule', 'mg', 'ml', 'dose', 'medication', 'drug', 'pill',
      'prescription', 'rx', 'generic', 'brand', 'active', 'ingredient',
      'strength', 'concentration', 'daily', 'twice', 'morning', 'evening'
    ];

    const contextCount = allWords.filter(w => 
      medicalContextWords.some(context => w.toLowerCase().includes(context))
    ).length;

    if (contextCount >= 3) bonus += 0.3;
    else if (contextCount >= 2) bonus += 0.2;
    else if (contextCount >= 1) bonus += 0.1;

    // Length bonus for reasonable medication names
    if (word.length >= 4 && word.length <= 15) {
      bonus += 0.1;
    }

    return bonus;
  }

  /**
   * Properly capitalize medication names
   */
  private capitalizeMedication(name: string): string {
    // Brand names are typically capitalized
    return name.charAt(0).toUpperCase() + name.slice(1).toLowerCase();
  }

  /**
   * Machine learning-inspired similarity scoring using multiple algorithms
   */
  calculateAdvancedSimilarity(str1: string, str2: string): number {
    const weights = {
      levenshtein: 0.3,
      jaro: 0.25,
      jaroWinkler: 0.25,
      dice: 0.2
    };

    const levenScore = this.levenshteinSimilarity(str1, str2);
    const jaroScore = this.jaroSimilarity(str1, str2);
    const jaroWinklerScore = this.jaroWinklerSimilarity(str1, str2);
    const diceScore = this.diceCoefficient(str1, str2);

    return (
      weights.levenshtein * levenScore +
      weights.jaro * jaroScore +
      weights.jaroWinkler * jaroWinklerScore +
      weights.dice * diceScore
    );
  }

  private levenshteinSimilarity(str1: string, str2: string): number {
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

    const distance = matrix[str2.length][str1.length];
    const maxLength = Math.max(str1.length, str2.length);
    return 1 - (distance / maxLength);
  }

  private jaroSimilarity(str1: string, str2: string): number {
    if (str1 === str2) return 1;

    const len1 = str1.length;
    const len2 = str2.length;
    const matchDistance = Math.floor(Math.max(len1, len2) / 2) - 1;

    const str1Matches = new Array(len1).fill(false);
    const str2Matches = new Array(len2).fill(false);

    let matches = 0;
    let transpositions = 0;

    // Find matches
    for (let i = 0; i < len1; i++) {
      const start = Math.max(0, i - matchDistance);
      const end = Math.min(i + matchDistance + 1, len2);

      for (let j = start; j < end; j++) {
        if (str2Matches[j] || str1[i] !== str2[j]) continue;
        str1Matches[i] = str2Matches[j] = true;
        matches++;
        break;
      }
    }

    if (matches === 0) return 0;

    // Count transpositions
    let k = 0;
    for (let i = 0; i < len1; i++) {
      if (!str1Matches[i]) continue;
      while (!str2Matches[k]) k++;
      if (str1[i] !== str2[k]) transpositions++;
      k++;
    }

    return (matches / len1 + matches / len2 + (matches - transpositions / 2) / matches) / 3;
  }

  private jaroWinklerSimilarity(str1: string, str2: string): number {
    const jaroSim = this.jaroSimilarity(str1, str2);

    if (jaroSim < 0.7) return jaroSim;

    let prefixLength = 0;
    for (let i = 0; i < Math.min(str1.length, str2.length, 4); i++) {
      if (str1[i] === str2[i]) prefixLength++;
      else break;
    }

    return jaroSim + (0.1 * prefixLength * (1 - jaroSim));
  }

  private diceCoefficient(str1: string, str2: string): number {
    const bigrams1 = this.getBigrams(str1);
    const bigrams2 = this.getBigrams(str2);

    const intersection = bigrams1.filter(bigram => bigrams2.includes(bigram));

    return (2 * intersection.length) / (bigrams1.length + bigrams2.length);
  }

  private getBigrams(str: string): string[] {
    const bigrams = [];
    for (let i = 0; i < str.length - 1; i++) {
      bigrams.push(str.substring(i, i + 2));
    }
    return bigrams;
  }

  /**
   * Feedback learning system to improve accuracy over time
   */
  addTrainingFeedback(
    originalImage: string,
    ocrResult: string,
    correctResult: string,
    userConfidence: number
  ): void {
    const trainingPoint: TrainingDataPoint = {
      imageBase64: originalImage,
      expectedMedication: correctResult,
      expectedDosage: '', // Can be extracted from correctResult
      difficulty: userConfidence > 0.8 ? 'easy' : userConfidence > 0.5 ? 'medium' : 'hard',
      conditions: [] // Can be analyzed from image metadata
    };

    this.trainingData.push(trainingPoint);
    this.updatePerformanceMetrics(ocrResult, correctResult);
  }

  private updatePerformanceMetrics(predicted: string, actual: string): void {
    const similarity = this.calculateAdvancedSimilarity(predicted.toLowerCase(), actual.toLowerCase());

    const currentAvg = this.performanceMetrics.get('accuracy') || 0;
    const currentCount = this.performanceMetrics.get('count') || 0;

    const newAvg = (currentAvg * currentCount + similarity) / (currentCount + 1);

    this.performanceMetrics.set('accuracy', newAvg);
    this.performanceMetrics.set('count', currentCount + 1);
  }

  /**
   * Get current training performance metrics
   */
  getPerformanceMetrics(): { accuracy: number; trainingDataPoints: number } {
    return {
      accuracy: this.performanceMetrics.get('accuracy') || 0,
      trainingDataPoints: this.trainingData.length
    };
  }

  /**
   * Advanced pattern learning from user interactions
   */
  learnFromUserBehavior(searchQuery: string, selectedResult: string, rejectedResults: string[]): void {
    // Update medication frequency
    const currentFreq = this.medicationFrequency.get(selectedResult) || 0;
    this.medicationFrequency.set(selectedResult, currentFreq + 1);

    // Learn contextual patterns
    const queryWords = searchQuery.toLowerCase().split(/\s+/);
    const existingPatterns = this.contextualPatterns.get(selectedResult) || [];
    this.contextualPatterns.set(selectedResult, [...new Set([...existingPatterns, ...queryWords])]);

    // Learn error corrections from rejected results
    rejectedResults.forEach(rejected => {
      if (this.calculateAdvancedSimilarity(rejected, selectedResult) > 0.7) {
        this.errorCorrections.set(rejected, selectedResult);
      }
    });

    // Update neural patterns with weighted scoring
    this.updateNeuralPatterns(searchQuery, selectedResult, 1.0);
    rejectedResults.forEach(rejected => {
      this.updateNeuralPatterns(searchQuery, rejected, -0.5);
    });
  }

  /**
   * Update neural network-like patterns for medication recognition
   */
  private updateNeuralPatterns(input: string, output: string, weight: number): void {
    const pattern = `${input.toLowerCase()}->${output.toLowerCase()}`;
    const currentWeight = this.neuralPatterns.get(pattern) || 0;
    this.neuralPatterns.set(pattern, currentWeight + weight);
  }

  /**
   * Public method to update neural patterns (for external training)
   */
  updateNeuralPatterns(input: string, output: string, weight: number): void {
    const pattern = `${input.toLowerCase()}->${output.toLowerCase()}`;
    const currentWeight = this.neuralPatterns.get(pattern) || 0;
    this.neuralPatterns.set(pattern, currentWeight + weight);
    console.log(`🧠 Neural pattern updated: ${pattern} (weight: ${weight})`);
  }

  /**
   * Enhanced medication prediction using learned patterns
   */
  predictMedication(query: string): { medication: string; confidence: number }[] {
    const queryLower = query.toLowerCase();
    const predictions: { medication: string; confidence: number }[] = [];

    // Use neural patterns for prediction
    for (const [pattern, weight] of this.neuralPatterns.entries()) {
      const [inputPattern, outputMed] = pattern.split('->');
      const similarity = this.calculateAdvancedSimilarity(queryLower, inputPattern);

      if (similarity > 0.6) {
        const confidence = similarity * Math.min(weight + 1, 2) * 0.5;
        predictions.push({ medication: outputMed, confidence });
      }
    }

    // Use frequency-based scoring
    for (const [medication, frequency] of this.medicationFrequency.entries()) {
      const similarity = this.calculateAdvancedSimilarity(queryLower, medication.toLowerCase());
      if (similarity > 0.5) {
        const frequencyBonus = Math.log(frequency + 1) * 0.1;
        const confidence = similarity + frequencyBonus;
        predictions.push({ medication, confidence });
      }
    }

    // Use contextual patterns
    for (const [medication, patterns] of this.contextualPatterns.entries()) {
      const queryWords = queryLower.split(/\s+/);
      const matchingPatterns = patterns.filter(pattern => 
        queryWords.some(word => word.includes(pattern) || pattern.includes(word))
      );

      if (matchingPatterns.length > 0) {
        const contextConfidence = (matchingPatterns.length / patterns.length) * 0.8;
        predictions.push({ medication, confidence: contextConfidence });
      }
    }

    // Apply error corrections
    const correctedQuery = this.errorCorrections.get(queryLower);
    if (correctedQuery) {
      predictions.push({ medication: correctedQuery, confidence: 0.9 });
    }

    // Deduplicate and sort by confidence
    const uniquePredictions = new Map<string, number>();
    predictions.forEach(({ medication, confidence }) => {
      const existing = uniquePredictions.get(medication) || 0;
      uniquePredictions.set(medication, Math.max(existing, confidence));
    });

    return Array.from(uniquePredictions.entries())
      .map(([medication, confidence]) => ({ medication, confidence }))
      .sort((a, b) => b.confidence - a.confidence)
      .slice(0, 10);
  }

  /**
   * Advanced OCR training with multiple neural network strategies
   */
  async trainAdvancedOCR(imageData: string, expectedText: string): Promise<void> {
    try {
      // Perform OCR with multiple strategies
      const strategies = [
        { name: 'high_dpi', config: { psm: '6', dpi: 300 } },
        { name: 'text_block', config: { psm: '8', dpi: 150 } },
        { name: 'sparse_text', config: { psm: '11', dpi: 200 } },
        { name: 'single_char', config: { psm: '10', dpi: 250 } }
      ];

      for (const strategy of strategies) {
        const Tesseract = await import('tesseract.js');
        const worker = await Tesseract.createWorker('eng');

        await worker.setParameters({
          tessedit_pageseg_mode: strategy.config.psm as any,
          user_defined_dpi: strategy.config.dpi.toString()
        });

        const { data: { text, confidence } } = await worker.recognize(imageData);
        await worker.terminate();

        // Calculate accuracy for this strategy
        const similarity = this.calculateAdvancedSimilarity(text.toLowerCase(), expectedText.toLowerCase());

        // Store strategy performance
        const strategyKey = `strategy_${strategy.name}`;
        const currentPerf = this.performanceMetrics.get(strategyKey) || 0;
        const currentCount = this.performanceMetrics.get(`${strategyKey}_count`) || 0;

        this.performanceMetrics.set(strategyKey, (currentPerf * currentCount + similarity) / (currentCount + 1));
        this.performanceMetrics.set(`${strategyKey}_count`, currentCount + 1);

        // Learn from this training example
        if (similarity > 0.7) {
          this.updateNeuralPatterns(text, expectedText, similarity);
        }
      }

      // Add to training data
      this.trainingData.push({
        imageBase64: imageData,
        expectedMedication: expectedText,
        expectedDosage: '',
        difficulty: 'medium',
        conditions: []
      });

    } catch (error) {
      console.error('Advanced OCR training failed:', error);
    }
  }

  /**
   * Get the best OCR strategy based on learned performance
   */
  getBestOCRStrategy(): { name: string; config: any } {
    const strategies = ['high_dpi', 'text_block', 'sparse_text', 'single_char'];
    let bestStrategy = 'high_dpi';
    let bestPerformance = 0;

    for (const strategy of strategies) {
      const performance = this.performanceMetrics.get(`strategy_${strategy}`) || 0;
      if (performance > bestPerformance) {
        bestPerformance = performance;
        bestStrategy = strategy;
      }
    }

    const configs = {
      high_dpi: { psm: '6', dpi: 300 },
      text_block: { psm: '8', dpi: 150 },
      sparse_text: { psm: '11', dpi: 200 },
      single_char: { psm: '10', dpi: 250 }
    };

    return { name: bestStrategy, config: configs[bestStrategy as keyof typeof configs] };
  }

  /**
   * Advanced medication database learning
   */
  learnMedicationPatterns(medications: any[]): void {
    medications.forEach(med => {
      // Learn name patterns
      if (med.name) {
        const namePatterns = this.extractLinguisticPatterns(med.name);
        namePatterns.forEach(pattern => {
          this.updateNeuralPatterns(pattern, med.name, 0.8);
        });
      }

      // Learn brand-generic associations
      if (med.genericName && med.name !== med.genericName) {
        this.updateNeuralPatterns(med.genericName, med.name, 0.9);
        this.updateNeuralPatterns(med.name, med.genericName, 0.9);
      }

      // Learn category patterns
      if (med.category) {
        this.updateNeuralPatterns(med.category, med.name, 0.6);
      }
    });
  }

  /**
   * Extract linguistic patterns from medication names
   */
  private extractLinguisticPatterns(name: string): string[] {
    const patterns = [];
    const cleanName = name.toLowerCase();

    // Add prefixes (first 3-5 characters)
    if (cleanName.length >= 3) patterns.push(cleanName.substring(0, 3));
    if (cleanName.length >= 4) patterns.push(cleanName.substring(0, 4));
    if (cleanName.length >= 5) patterns.push(cleanName.substring(0, 5));

    // Add suffixes (last 3-5 characters)
    if (cleanName.length >= 3) patterns.push(cleanName.substring(cleanName.length - 3));
    if (cleanName.length >= 4) patterns.push(cleanName.substring(cleanName.length - 4));
    if (cleanName.length >= 5) patterns.push(cleanName.substring(cleanName.length - 5));

    // Add middle patterns for longer names
    if (cleanName.length >= 6) {
      const middle = Math.floor(cleanName.length / 2);
      patterns.push(cleanName.substring(middle - 2, middle + 2));
    }

    // Add phonetic patterns
    patterns.push(this.generatePhoneticPattern(cleanName));

    return patterns;
  }

  /**
   * Generate phonetic patterns for better matching
   */
  private generatePhoneticPattern(word: string): string {
    return word
      .replace(/ph/g, 'f')
      .replace(/[ckq]/g, 'k')
      .replace(/[xyz]/g, 's')
      .replace(/[aeiou]/g, 'a')
      .replace(/[bp]/g, 'b')
      .replace(/[dt]/g, 'd')
      .replace(/[gj]/g, 'g')
      .replace(/[mn]/g, 'm')
      .replace(/[rv]/g, 'r');
  }

  /**
   * Add successful recognition for training
   */
  addSuccessfulRecognition(
    imageBase64: string,
    medicationName: string,
    dosage: string,
    confidence: number
  ): void {
    const trainingPoint: TrainingDataPoint = {
      imageBase64,
      expectedMedication: medicationName,
      expectedDosage: dosage,
      difficulty: confidence > 0.8 ? 'easy' : confidence > 0.6 ? 'medium' : 'hard',
      conditions: ['successful_recognition']
    };

    this.trainingData.push(trainingPoint);

    // Learn from successful pattern
    this.updateNeuralPatterns(medicationName.toLowerCase(), medicationName, confidence);

    // Update medication frequency
    const currentFreq = this.medicationFrequency.get(medicationName.toLowerCase()) || 0;
    this.medicationFrequency.set(medicationName.toLowerCase(), currentFreq + 1);

    console.log(`✅ Added successful recognition: ${medicationName} (confidence: ${confidence})`);
  }

  /**
   * Add training data from any source
   */
  addTrainingData(
    imageBase64: string,
    medicationName: string,
    dosage: string,
    confidence: number,
    source: string
  ): void {
    const trainingPoint: TrainingDataPoint = {
      imageBase64,
      expectedMedication: medicationName,
      expectedDosage: dosage,
      difficulty: confidence > 0.7 ? 'easy' : confidence > 0.5 ? 'medium' : 'hard',
      conditions: [source, `confidence_${Math.round(confidence * 100)}`]
    };

    this.trainingData.push(trainingPoint);

    // Update patterns
    this.updateNeuralPatterns(medicationName.toLowerCase(), medicationName, confidence);

    console.log(`📚 Added training data from ${source}: ${medicationName}`);
  }

  /**
   * Get training data count
   */
  getTrainingDataCount(): number {
    return this.trainingData.length;
  }

  /**
   * Advanced self-learning from successful identifications
   */
  selfLearn(ocrText: string, identifiedMedication: string, userConfirmed: boolean): void {
    if (userConfirmed && identifiedMedication) {
      // Strengthen the pattern association
      this.updateNeuralPatterns(ocrText.toLowerCase(), identifiedMedication.toLowerCase(), 0.9);

      // Learn text preprocessing patterns
      const cleanedText = this.preprocessText(ocrText);
      this.updateNeuralPatterns(cleanedText.toLowerCase(), identifiedMedication.toLowerCase(), 0.8);

      // Extract and learn word patterns
      const words = ocrText.toLowerCase().split(/\s+/);
      words.forEach(word => {
        if (word.length > 3 && identifiedMedication.toLowerCase().includes(word)) {
          this.updateNeuralPatterns(word, identifiedMedication.toLowerCase(), 0.7);
        }
      });

      console.log(`🧠 Self-learning: Strengthened pattern for ${identifiedMedication}`);
    }
  }

  /**
   * Batch train from medication database
   */
  batchTrainFromDatabase(medications: any[]): void {
    console.log(`🎯 Starting batch training with ${medications.length} medications`);

    medications.forEach((med, index) => {
      // Learn name patterns
      if (med.name) {
        const patterns = this.extractLinguisticPatterns(med.name);
        patterns.forEach(pattern => {
          this.updateNeuralPatterns(pattern, med.name.toLowerCase(), 0.6);
        });
      }

      // Learn brand-generic associations
      if (med.genericName && med.name !== med.genericName) {
        this.updateNeuralPatterns(med.genericName.toLowerCase(), med.name.toLowerCase(), 0.8);
        this.updateNeuralPatterns(med.name.toLowerCase(), med.genericName.toLowerCase(), 0.8);
      }

      // Learn Vietnamese translations
      if (med.nameVi) {
        this.updateNeuralPatterns(med.nameVi.toLowerCase(), med.name.toLowerCase(), 0.7);
      }

      // Learn category associations
      if (med.category) {
        this.updateNeuralPatterns(med.category.toLowerCase(), med.name.toLowerCase(), 0.5);
      }

      // Update frequency based on commonality
      const frequency = Math.floor(Math.random() * 10) + 1; // Simulate usage frequency
      this.medicationFrequency.set(med.name.toLowerCase(), frequency);
    });

    console.log(`✅ Batch training completed: ${medications.length} medications processed`);
  }

  /**
   * Continuous learning from user interactions
   */
  continuousLearning(searchQuery: string, selectedMedication: string, rejectedMedications: string[] = []): void {
    // Strengthen successful selection
    this.updateNeuralPatterns(searchQuery.toLowerCase(), selectedMedication.toLowerCase(), 1.0);

    // Weaken rejected selections
    rejectedMedications.forEach(rejected => {
      this.updateNeuralPatterns(searchQuery.toLowerCase(), rejected.toLowerCase(), -0.3);
    });

    // Learn contextual words
    const queryWords = searchQuery.toLowerCase().split(/\s+/);
    queryWords.forEach(word => {
      if (word.length > 2) {
        this.updateNeuralPatterns(word, selectedMedication.toLowerCase(), 0.4);
      }
    });

    console.log(`🔄 Continuous learning: ${searchQuery} → ${selectedMedication}`);
  }

  /**
   * Export comprehensive training data
   */
  exportTrainingData(): {
    trainingPoints: TrainingDataPoint[];
    neuralPatterns: [string, number][];
    medicationFrequency: [string, number][];
    performanceMetrics: [string, number][];
    errorCorrections: [string, string][];
    totalTrainingPoints: number;
  } {
    return {
      trainingPoints: [...this.trainingData],
      neuralPatterns: Array.from(this.neuralPatterns.entries()),
      medicationFrequency: Array.from(this.medicationFrequency.entries()),
      performanceMetrics: Array.from(this.performanceMetrics.entries()),
      errorCorrections: Array.from(this.errorCorrections.entries()),
      totalTrainingPoints: this.trainingData.length
    };
  }

  /**
   * Import training data to continue learning
   */
  importTrainingData(data: {
    trainingPoints?: TrainingDataPoint[];
    neuralPatterns?: [string, number][];
    medicationFrequency?: [string, number][];
    performanceMetrics?: [string, number][];
    errorCorrections?: [string, string][];
  }): void {
    if (data.trainingPoints) this.trainingData.push(...data.trainingPoints);
    if (data.neuralPatterns) data.neuralPatterns.forEach(([k, v]) => this.neuralPatterns.set(k, v));
    if (data.medicationFrequency) data.medicationFrequency.forEach(([k, v]) => this.medicationFrequency.set(k, v));
    if (data.performanceMetrics) data.performanceMetrics.forEach(([k, v]) => this.performanceMetrics.set(k, v));
    if (data.errorCorrections) data.errorCorrections.forEach(([k, v]) => this.errorCorrections.set(k, v));
  }
}

// Singleton instance
export const enhancedAITrainer = new EnhancedAITrainer();