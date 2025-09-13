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
          content: `You are an expert pharmacist reading medication labels and packaging. Extract medication information with high accuracy, understanding that medications have both brand names (like Mobic, Tylenol) and generic names (like meloxicam, acetaminophen).
          
          Return a JSON response with these fields:
          - medicationName: The primary medication name visible (brand or generic)
          - dosage: The dosage/strength if visible (like "75mg", "500mg") 
          - confidence: Your confidence level 0-100 in the medication identification
          - detectedText: All text you can see in the image
          - brandName: If you identify a brand name (like Mobic, Tylenol), put it here
          - genericName: If you identify a generic name (like meloxicam, acetaminophen), put it here
          - aliases: Any alternative names you recognize for this medication
          
          Common brand/generic pairs to recognize:
          - Mobic = meloxicam
          - Tylenol = acetaminophen
          - Advil = ibuprofen
          - Zoloft = sertraline
          - Lipitor = atorvastatin
          
          Focus on the main medication name, ignoring lot numbers, NDC codes, and manufacturer information.`
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
    throw new Error(`Vision API failed: ${error.message}`);
  }
}