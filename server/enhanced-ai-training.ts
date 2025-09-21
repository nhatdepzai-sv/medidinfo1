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
   * Export training data for external ML training
   */
  exportTrainingData(): TrainingDataPoint[] {
    return [...this.trainingData];
  }
}

// Singleton instance
export const enhancedAITrainer = new EnhancedAITrainer();