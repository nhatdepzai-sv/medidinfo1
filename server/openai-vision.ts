import OpenAI from "openai";

// the newest OpenAI model is "gpt-5" which was released August 7, 2025. do not change this unless explicitly requested by the user
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export async function extractMedicationFromImage(base64Image: string): Promise<{
  medicationName: string | null;
  dosage: string | null;
  confidence: number;
  detectedText: string;
  brandName?: string | null;
  genericName?: string | null;
  aliases?: string[];
}> {
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-5",
      messages: [
        {
          role: "system",
          content: `You are an expert pharmacist and OCR specialist with extensive training in reading medication labels, bottles, blister packs, and pharmaceutical packaging from multiple angles and lighting conditions. You have been trained on thousands of medication images including:

MEDICATION RECOGNITION EXPERTISE:
- Brand names (Tylenol, Advil, Lipitor, Zoloft, Mobic, Prozac, Nexium, etc.)
- Generic names (acetaminophen, ibuprofen, atorvastatin, sertraline, meloxicam, fluoxetine, esomeprazole, etc.)
- International names and variants (paracetamol = acetaminophen)
- Combination medications (Percocet = oxycodone/acetaminophen)
- Different dosage forms (tablets, capsules, liquid, injection, topical)

VISUAL RECOGNITION TRAINING:
- Read text from various angles (tilted, rotated, curved labels)
- Handle poor lighting, shadows, reflections, and blur
- Distinguish medication names from manufacturer info, lot numbers, NDC codes, expiration dates
- Recognize partial text or partially obscured labels
- Handle multilingual labels (English, Spanish, Vietnamese, etc.)

ACCURACY ENHANCEMENT:
- Cross-reference multiple text elements on the package
- Use context clues (dosage form, color, shape) to validate medication identity
- Prioritize most prominent/largest text as primary medication name
- Flag uncertain readings with appropriate confidence levels

Return a JSON response with these fields:
- medicationName: The primary medication name visible (prioritize brand name if both present)
- dosage: The dosage/strength with units (like "75mg", "500mg", "10mg/ml")
- confidence: Your confidence level 0-100 based on text clarity and medication database match
- detectedText: All readable text from the image, cleaned and organized
- brandName: Brand/trade name if identified (Tylenol, Advil, Lipitor, etc.)
- genericName: Generic/chemical name if identified (acetaminophen, ibuprofen, atorvastatin, etc.)
- aliases: Alternative names, abbreviations, or international variants

ENHANCED BRAND/GENERIC DATABASE:
- Tylenol/Panadol = acetaminophen/paracetamol
- Advil/Motrin = ibuprofen  
- Lipitor = atorvastatin
- Zoloft = sertraline
- Mobic = meloxicam
- Prozac = fluoxetine
- Nexium = esomeprazole
- Viagra = sildenafil
- Xanax = alprazolam
- Percocet = oxycodone/acetaminophen
- Vicodin = hydrocodone/acetaminophen
- Metformin = glucophage
- Lisinopril = prinivil/zestril
- Amlodipine = norvasc

Focus on the primary medication name prominently displayed, ignore auxiliary information like NDC numbers, lot codes, manufacturer details, and barcodes. If multiple medications are visible, identify the primary/largest one.`
        },
        {
          role: "user",
          content: [
            {
              type: "text",
              text: "Please extract the medication name and dosage from this image. Return the response in JSON format."
            },
            {
              type: "image_url",
              image_url: {
                url: `data:image/jpeg;base64,${base64Image}`
              }
            }
          ],
        },
      ],
      response_format: { type: "json_object" },
      max_tokens: 500,
    });

    const result = JSON.parse(response.choices[0].message.content || '{}');
    
    // Import drug alias service to enhance results
    const { drugAliasService } = await import('./drug-alias-service');
    
    // If we have a medication name, try to get its aliases
    let aliases: string[] = [];
    if (result.medicationName) {
      try {
        aliases = await drugAliasService.getAllAliases(result.medicationName);
      } catch (error) {
        console.log('Could not fetch aliases:', error);
      }
    }
    
    return {
      medicationName: result.medicationName || null,
      dosage: result.dosage || null,
      confidence: Math.max(0, Math.min(100, result.confidence || 0)),
      detectedText: result.detectedText || '',
      brandName: result.brandName || null,
      genericName: result.genericName || null,
      aliases: aliases.length > 0 ? aliases : (result.aliases || [])
    };

  } catch (error: any) {
    console.error('OpenAI Vision API Error:', error);
    
    // Enhanced error handling with fallback attempt
    if (error.code === 'insufficient_quota' || error.status === 429) {
      throw new Error('AI service temporarily unavailable. Please try again in a moment.');
    } else if (error.code === 'invalid_request_error') {
      throw new Error('Image format not supported. Please try a clearer image.');
    } else if (error.message?.includes('content_policy_violation')) {
      throw new Error('Image content not recognized. Please ensure image contains medication packaging.');
    }
    
    throw new Error(`Vision processing failed: ${error.message || 'Unknown error'}`);
  }
}