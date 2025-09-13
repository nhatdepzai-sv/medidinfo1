import OpenAI from "openai";

// the newest OpenAI model is "gpt-5" which was released August 7, 2025. do not change this unless explicitly requested by the user
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export async function extractMedicationFromImage(base64Image: string): Promise<{
  medicationName: string | null;
  dosage: string | null;
  confidence: number;
  detectedText: string;
}> {
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-5",
      messages: [
        {
          role: "system",
          content: `You are an expert at reading medication labels and packaging. Extract medication information from images with high accuracy. 
          
          Return a JSON response with these fields:
          - medicationName: The primary brand or generic medication name (string or null)
          - dosage: The dosage/strength if visible (string or null)  
          - confidence: Your confidence level 0-100 in the medication name identification
          - detectedText: All text you can see in the image
          
          Focus on identifying the main medication name clearly visible on labels, bottles, or packaging. Ignore manufacturing codes, lot numbers, and extraneous text.`
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
    
    return {
      medicationName: result.medicationName || null,
      dosage: result.dosage || null,
      confidence: Math.max(0, Math.min(100, result.confidence || 0)),
      detectedText: result.detectedText || ''
    };

  } catch (error: any) {
    console.error('OpenAI Vision API Error:', error);
    throw new Error(`Vision API failed: ${error.message}`);
  }
}