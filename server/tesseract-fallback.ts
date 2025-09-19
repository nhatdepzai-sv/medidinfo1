
import { createWorker } from 'tesseract.js';

export async function extractMedicationWithTesseract(base64Image: string): Promise<{
  medicationName: string | null;
  dosage: string | null;
  confidence: number;
  detectedText: string;
  brandName?: string | null;
  genericName?: string | null;
  aliases?: string[];
}> {
  try {
    // Initialize Tesseract worker
    const worker = await createWorker('eng');
    
    // Configure Tesseract for better medication text recognition
    await worker.setParameters({
      tessedit_char_whitelist: 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789 .-',
      tessedit_pageseg_mode: '6' as any, // Assume uniform block of text
      preserve_interword_spaces: '1' as any
    });

    // Convert base64 to buffer for Tesseract
    const imageBuffer = Buffer.from(base64Image, 'base64');
    
    // Perform OCR
    const { data: { text, confidence } } = await worker.recognize(imageBuffer);
    await worker.terminate();

    // Clean and process the detected text
    const cleanText = text
      .replace(/[^a-zA-Z0-9\s.-]/g, ' ')
      .replace(/\n/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();

    // Extract medication name and dosage using simple pattern matching
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

  } catch (error: any) {
    console.error('Tesseract OCR Error:', error);
    throw new Error(`Tesseract OCR failed: ${error.message}`);
  }
}

function extractMedicationInfo(text: string): {
  name: string | null;
  dosage: string | null;
  brandName: string | null;
  genericName: string | null;
} {
  if (!text || text.trim().length < 2) {
    return { name: null, dosage: null, brandName: null, genericName: null };
  }

  // Common medication patterns
  const commonMedications = [
    // Brand names
    'tylenol', 'advil', 'motrin', 'aleve', 'aspirin', 'ibuprofen', 'acetaminophen',
    'lipitor', 'zoloft', 'prozac', 'xanax', 'ativan', 'ambien', 'viagra',
    'cialis', 'metformin', 'lisinopril', 'amlodipine', 'atorvastatin',
    'omeprazole', 'nexium', 'prilosec', 'zantac', 'pepcid', 'mobic', 'meloxicam',
    'gabapentin', 'tramadol', 'hydrocodone', 'oxycodone', 'morphine',
    'prednisone', 'hydrocortisone', 'amoxicillin', 'azithromycin', 'ciprofloxacin'
  ];

  const words = text.toLowerCase().split(/\s+/);
  let bestMatch = null;
  let matchConfidence = 0;

  // Find the best medication match
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

  // Extract dosage pattern (numbers followed by mg, ml, etc.)
  const dosagePattern = /(\d+(?:\.\d+)?)\s*(mg|ml|g|mcg|ug|units?|tablets?|caps?)/i;
  const dosageMatch = text.match(dosagePattern);
  const dosage = dosageMatch ? `${dosageMatch[1]}${dosageMatch[2]}` : null;

  // Determine if it's a brand name or generic name
  const brandNames = ['tylenol', 'advil', 'motrin', 'aleve', 'lipitor', 'zoloft', 'prozac', 'xanax', 'nexium', 'mobic'];
  const genericNames = ['acetaminophen', 'ibuprofen', 'atorvastatin', 'sertraline', 'fluoxetine', 'meloxicam'];

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
    dosage: dosage,
    brandName: brandName,
    genericName: genericName
  };
}
