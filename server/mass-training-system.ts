/**
 * Automated AI Training System for Medication Recognition
 * Simplified version for local Tesseract.js training
 */

import { enhancedAITrainer } from './enhanced-ai-training';
import { medicationsDatabase } from './medications-database';

export interface AutoTrainingProgress {
  processed: number;
  target: number;
  successRate: number;
  isTraining: boolean;
  startTime: Date;
  estimatedCompletion: Date | null;
  currentBatch: number;
  totalBatches: number;
  trainingSpeed: number; // images per second
}

export interface SyntheticTrainingData {
  medicationName: string;
  dosage: string;
  variations: string[];
  confidence: number;
  source: string;
}

export class AutomatedAITrainingSystem {
  private progress: AutoTrainingProgress = {
    processed: 0,
    target: 1000000, // 1 million training samples over 10 days
    successRate: 0,
    isTraining: false,
    startTime: new Date(),
    estimatedCompletion: null,
    currentBatch: 0,
    totalBatches: 10000,
    trainingSpeed: 0
  };

  private batchSize = 100; // Process 100 samples per batch
  private allMedications: any[] = [];
  private isRunning = false;
  private trainingInterval: NodeJS.Timeout | null = null;
  private successfulTraining = 0;
  private failedTraining = 0;

  constructor() {
    this.initializeMedicationDatabase();
    console.log('🎯 Automated training system ready (use startTraining() to begin)');
  }

  private initializeMedicationDatabase(): void {
    // Use the main medications database
    this.allMedications = medicationsDatabase.filter(med => 
      med.name && med.name.length > 2
    );

    this.progress.totalBatches = Math.ceil(this.progress.target / this.batchSize);

    console.log(`🤖 AI Training System Initialized`);
    console.log(`📚 Medication database: ${this.allMedications.length} unique medications`);
    console.log(`🎯 Training target: ${this.progress.target.toLocaleString()} training samples`);
    console.log(`📦 Batch processing: ${this.batchSize} samples per batch`);
  }

  /**
   * Start automated training
   */
  public startTraining(): void {
    if (this.isRunning) {
      console.log('⚠️ Training already in progress');
      return;
    }

    this.isRunning = true;
    this.progress.isTraining = true;
    this.progress.startTime = new Date();
    this.progress.processed = 0;
    this.successfulTraining = 0;
    this.failedTraining = 0;

    console.log(`🚀 Starting automated AI training...`);
    console.log(`📊 Target: ${this.progress.target} training samples`);

    // Start training immediately
    this.processContinuousTraining();

    // Set up interval for continuous training (every 30 seconds for 10-day training)
    // This will process ~1,157 samples per day to reach 1M in 10 days
    this.trainingInterval = setInterval(() => {
      this.processContinuousTraining();
    }, 30000); // Every 30 seconds
  }

  /**
   * Stop automated training
   */
  public stopTraining(): void {
    if (this.trainingInterval) {
      clearInterval(this.trainingInterval);
      this.trainingInterval = null;
    }
    
    this.isRunning = false;
    this.progress.isTraining = false;
    
    console.log(`⏹️ Training stopped. Processed: ${this.progress.processed}/${this.progress.target}`);
  }

  /**
   * Process continuous AI training in background
   */
  private async processContinuousTraining(): Promise<void> {
    if (!this.isRunning || this.progress.processed >= this.progress.target) {
      if (this.progress.processed >= this.progress.target) {
        this.completeTraining();
      }
      return;
    }

    const startTime = Date.now();
    const batchSize = Math.min(this.batchSize, this.progress.target - this.progress.processed);

    try {
      await this.processTrainingBatch(batchSize);

      const processingTime = Date.now() - startTime;
      this.progress.trainingSpeed = batchSize / (processingTime / 1000);

      this.updateProgress();

      const progressPercent = Math.round((this.progress.processed / this.progress.target) * 100);
      console.log(`🧠 Training Progress: ${this.progress.processed.toLocaleString()}/${this.progress.target.toLocaleString()} (${progressPercent}%) - Speed: ${Math.round(this.progress.trainingSpeed)} samples/s - Success Rate: ${Math.round(this.progress.successRate)}%`);

    } catch (error) {
      console.error('❌ Training batch failed:', error);
      this.failedTraining += batchSize;
      this.progress.processed += batchSize; // Still count as processed
    }
  }

  /**
   * Process a batch of training samples
   */
  private async processTrainingBatch(batchSize: number): Promise<void> {
    const batch: SyntheticTrainingData[] = [];

    // Generate synthetic training data
    for (let i = 0; i < batchSize; i++) {
      const randomMedication = this.getRandomMedication();
      if (randomMedication) {
        batch.push({
          medicationName: randomMedication.name,
          dosage: this.generateRandomDosage(),
          variations: this.generateMedicationVariations(randomMedication.name),
          confidence: Math.random() * 40 + 60, // 60-100% confidence
          source: 'synthetic-training'
        });
      }
    }

    // Train with the batch
    await this.trainAIWithBatch(batch);
    
    // Update progress counter after processing the batch
    this.progress.processed += batchSize;
  }

  /**
   * Train AI with a batch of synthetic data
   */
  private async trainAIWithBatch(batch: SyntheticTrainingData[]): Promise<void> {
    for (const trainingData of batch) {
      try {
        // Simulate text-based training (since we don't generate actual images)
        const syntheticText = this.generateSyntheticOCRText(trainingData);
        
        // Use the continuous learning feature
        enhancedAITrainer.continuousLearning(
          syntheticText,
          trainingData.medicationName,
          trainingData.variations
        );

        // Add training data to the AI trainer
        enhancedAITrainer.addTrainingData(
          syntheticText,
          trainingData.medicationName,
          trainingData.dosage,
          trainingData.confidence,
          trainingData.source
        );

        // Train with variations
        for (const variation of trainingData.variations) {
          enhancedAITrainer.continuousLearning(
            variation,
            trainingData.medicationName,
            [trainingData.medicationName]
          );
        }

        this.successfulTraining++;
      } catch (error) {
        console.error(`❌ Failed to train with ${trainingData.medicationName}:`, error);
        this.failedTraining++;
      }
    }
  }

  /**
   * Generate synthetic OCR text for training
   */
  private generateSyntheticOCRText(data: SyntheticTrainingData): string {
    const variations = [
      data.medicationName,
      data.medicationName.toUpperCase(),
      data.medicationName.toLowerCase(),
      `${data.medicationName} ${data.dosage}`,
      `${data.dosage} ${data.medicationName}`,
      ...data.variations
    ];

    // Add some OCR-like noise and variations
    const noisyVariations = variations.map(text => {
      // Simulate common OCR errors
      let noisy = text;
      if (Math.random() < 0.1) {
        noisy = noisy.replace(/o/g, '0'); // o -> 0
      }
      if (Math.random() < 0.1) {
        noisy = noisy.replace(/l/g, '1'); // l -> 1
      }
      if (Math.random() < 0.05) {
        noisy = noisy.replace(/ /g, ''); // remove spaces
      }
      return noisy;
    });

    return variations.concat(noisyVariations).join(' ');
  }

  /**
   * Generate medication name variations
   */
  private generateMedicationVariations(medicationName: string): string[] {
    const variations = [];
    const name = medicationName.toLowerCase();
    
    // Add common abbreviations
    variations.push(name.replace('acetaminophen', 'apap'));
    variations.push(name.replace('hydrochlorothiazide', 'hctz'));
    variations.push(name.replace('extended release', 'er'));
    variations.push(name.replace('immediate release', 'ir'));
    
    // Add brand name variations (if it's generic)
    const brandMappings = {
      'acetaminophen': ['tylenol', 'panadol'],
      'ibuprofen': ['advil', 'motrin'],
      'atorvastatin': ['lipitor'],
      'sertraline': ['zoloft'],
      'fluoxetine': ['prozac'],
      'alprazolam': ['xanax'],
      'omeprazole': ['prilosec'],
      'esomeprazole': ['nexium']
    };

    if (brandMappings[name as keyof typeof brandMappings]) {
      variations.push(...brandMappings[name as keyof typeof brandMappings]);
    }

    // Add case variations
    variations.push(medicationName.toUpperCase());
    variations.push(medicationName.charAt(0).toUpperCase() + medicationName.slice(1).toLowerCase());

    return variations.filter(v => v !== medicationName && v.length > 2);
  }

  /**
   * Get a random medication from the database
   */
  private getRandomMedication(): any {
    if (this.allMedications.length === 0) return null;
    
    const randomIndex = Math.floor(Math.random() * this.allMedications.length);
    return this.allMedications[randomIndex];
  }

  /**
   * Generate a random realistic dosage
   */
  private generateRandomDosage(): string {
    const dosages = [
      '5mg', '10mg', '25mg', '50mg', '100mg', '200mg', '300mg', '500mg',
      '1mg', '2mg', '20mg', '40mg', '75mg', '150mg', '250mg', '400mg',
      '5ml', '10ml', '15ml', '30ml', '60ml', '120ml',
      '1g', '2g', '5g', '10g'
    ];
    
    return dosages[Math.floor(Math.random() * dosages.length)];
  }

  /**
   * Update training progress and estimates
   */
  private updateProgress(): void {
    this.progress.currentBatch = Math.floor(this.progress.processed / this.batchSize);
    
    if (this.successfulTraining + this.failedTraining > 0) {
      this.progress.successRate = (this.successfulTraining / (this.successfulTraining + this.failedTraining)) * 100;
    }

    // Calculate estimated completion time
    if (this.progress.trainingSpeed > 0) {
      const remainingItems = this.progress.target - this.progress.processed;
      const remainingTimeMs = (remainingItems / this.progress.trainingSpeed) * 1000;
      this.progress.estimatedCompletion = new Date(Date.now() + remainingTimeMs);
    }
  }

  /**
   * Complete training process
   */
  private completeTraining(): void {
    this.stopTraining();
    
    const endTime = new Date();
    const duration = endTime.getTime() - this.progress.startTime.getTime();
    const durationMinutes = Math.round(duration / (1000 * 60));

    console.log(`🎉 AI Training Complete!`);
    console.log(`📊 Final Stats:`);
    console.log(`   • Total processed: ${this.progress.processed.toLocaleString()}`);
    console.log(`   • Successful: ${this.successfulTraining.toLocaleString()}`);
    console.log(`   • Failed: ${this.failedTraining.toLocaleString()}`);
    console.log(`   • Success rate: ${Math.round(this.progress.successRate)}%`);
    console.log(`   • Duration: ${durationMinutes} minutes`);
    console.log(`   • Average speed: ${Math.round(this.progress.trainingSpeed)} samples/second`);

    // Display AI trainer stats
    const trainerStats = enhancedAITrainer.getTrainingStats();
    console.log(`🧠 Enhanced AI Trainer Stats:`);
    console.log(`   • Neural patterns: ${trainerStats.neuralPatterns}`);
    console.log(`   • Medication aliases: ${trainerStats.medicationAliases}`);
    console.log(`   • Training data count: ${trainerStats.totalTrainingData}`);
  }

  /**
   * Get current training progress
   */
  public getProgress(): AutoTrainingProgress {
    return {
      ...this.progress
    };
  }

  /**
   * Get training statistics
   */
  public getStats() {
    return {
      progress: this.progress,
      successfulTraining: this.successfulTraining,
      failedTraining: this.failedTraining,
      aiTrainerStats: enhancedAITrainer.getTrainingStats()
    };
  }
}

// Export singleton instance
export const automatedTrainingSystem = new AutomatedAITrainingSystem();