import { GoogleGenAI, Type } from '@google/genai';
import { GeneratedContent, BrandSettings } from '../types';

export async function generateAllLayoutsText(
  prompt: string, 
  isCarousel: boolean, 
  brandContext: BrandSettings
): Promise<Record<string, Partial<GeneratedContent> | Partial<GeneratedContent>[]>> {
  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  
  const systemInstruction = `You are an expert social media copywriter.
Create content for a brand with the following profile:
- Company Type: ${brandContext.companyType || 'Generic Business'}
- Target Audience: ${brandContext.targetAudience || 'General Public'}
- Tone of Voice: ${brandContext.toneOfVoice || 'Professional'}
- Description: ${brandContext.companyDescription || 'A business providing products/services.'}

Generate engaging social media post content based on the user's prompt.
If isCarousel is true, generate an array of 3-5 slides for the selected layout.
Otherwise, generate a single slide.
Return JSON matching the requested schema.`;

  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: `Prompt: ${prompt}\nIs Carousel: ${isCarousel}`,
    config: {
      systemInstruction,
      responseMimeType: 'application/json',
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          THOUGHT_LEADERSHIP: { type: Type.ARRAY, items: { type: Type.OBJECT, properties: { tagline: { type: Type.STRING }, headline: { type: Type.STRING }, subtext: { type: Type.STRING }, body: { type: Type.STRING }, cta: { type: Type.STRING }, icon: { type: Type.STRING } } } },
          TEAM_CULTURE: { type: Type.ARRAY, items: { type: Type.OBJECT, properties: { tagline: { type: Type.STRING }, headline: { type: Type.STRING }, subtext: { type: Type.STRING }, body: { type: Type.STRING }, cta: { type: Type.STRING }, icon: { type: Type.STRING } } } },
          CONVERSION: { type: Type.ARRAY, items: { type: Type.OBJECT, properties: { tagline: { type: Type.STRING }, headline: { type: Type.STRING }, subtext: { type: Type.STRING }, body: { type: Type.STRING }, cta: { type: Type.STRING }, icon: { type: Type.STRING } } } },
          KNOWLEDGE_SHARE: { type: Type.ARRAY, items: { type: Type.OBJECT, properties: { tagline: { type: Type.STRING }, headline: { type: Type.STRING }, subtext: { type: Type.STRING }, body: { type: Type.STRING }, cta: { type: Type.STRING }, icon: { type: Type.STRING } } } },
          GROWTH_METRICS: { type: Type.ARRAY, items: { type: Type.OBJECT, properties: { tagline: { type: Type.STRING }, headline: { type: Type.STRING }, subtext: { type: Type.STRING }, body: { type: Type.STRING }, cta: { type: Type.STRING }, icon: { type: Type.STRING } } } },
          COMPARISON: { type: Type.ARRAY, items: { type: Type.OBJECT, properties: { tagline: { type: Type.STRING }, headline: { type: Type.STRING }, subtext: { type: Type.STRING }, body: { type: Type.STRING }, cta: { type: Type.STRING }, icon: { type: Type.STRING } } } },
          PROCESS_TIMELINE: { type: Type.ARRAY, items: { type: Type.OBJECT, properties: { tagline: { type: Type.STRING }, headline: { type: Type.STRING }, subtext: { type: Type.STRING }, body: { type: Type.STRING }, cta: { type: Type.STRING }, icon: { type: Type.STRING } } } },
          VENTURE_SPOTLIGHT: { type: Type.ARRAY, items: { type: Type.OBJECT, properties: { tagline: { type: Type.STRING }, headline: { type: Type.STRING }, subtext: { type: Type.STRING }, body: { type: Type.STRING }, cta: { type: Type.STRING }, icon: { type: Type.STRING } } } },
          VISUAL_STORY: { type: Type.ARRAY, items: { type: Type.OBJECT, properties: { tagline: { type: Type.STRING }, headline: { type: Type.STRING }, subtext: { type: Type.STRING }, body: { type: Type.STRING }, cta: { type: Type.STRING }, icon: { type: Type.STRING } } } },
          PHOTO_COLLAGE: { type: Type.ARRAY, items: { type: Type.OBJECT, properties: { tagline: { type: Type.STRING }, headline: { type: Type.STRING }, subtext: { type: Type.STRING }, body: { type: Type.STRING }, cta: { type: Type.STRING }, icon: { type: Type.STRING } } } },
        }
      }
    }
  });

  try {
    const text = response.text || '{}';
    return JSON.parse(text);
  } catch (e) {
    console.error("Failed to parse Gemini response", e);
    return {};
  }
}

export async function analyzeCompanyContext(text: string): Promise<Partial<BrandSettings> & { companyName?: string }> {
  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  
  // Truncate text to prevent massive inputs that could cause token limits or huge outputs
  const truncatedText = text.length > 15000 ? text.substring(0, 15000) + '... [text truncated]' : text;
  
  const systemInstruction = `You are an expert brand strategist.
Analyze the provided text (which could be an 'About Us' page, pitch deck, or general company info) and extract key brand information.
IMPORTANT: Keep all extracted text concise and to the point. Do not copy large chunks of the input text.
Return a JSON object with the following fields:
- companyName: The name of the company.
- companyType: The type of company or industry (e.g., B2B SaaS, Local Bakery, E-commerce).
- companyDescription: A concise description or mission statement (max 2-3 sentences).
- targetAudience: Who the company is targeting (concise).
- usp: The Unique Selling Points of the company (concise).
- toneOfVoice: The tone of voice (e.g., formal, playful, expert).
- visualStyleType: The overall visual style (e.g., modern, minimalist, vibrant).
- illustrationStyle: The preferred illustration or photography style.
- defaultHashtags: 3 to 5 relevant hashtags as a single string (e.g., "#tech #innovation #startup").`;

  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: `Text to analyze:\n\n${truncatedText}`,
    config: {
      systemInstruction,
      responseMimeType: 'application/json',
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          companyName: { type: Type.STRING },
          companyType: { type: Type.STRING },
          companyDescription: { type: Type.STRING },
          targetAudience: { type: Type.STRING },
          usp: { type: Type.STRING },
          toneOfVoice: { type: Type.STRING },
          visualStyleType: { type: Type.STRING },
          illustrationStyle: { type: Type.STRING },
          defaultHashtags: { type: Type.STRING },
        }
      }
    }
  });

  try {
    const responseText = response.text || '{}';
    return JSON.parse(responseText);
  } catch (e) {
    console.error("Failed to parse Gemini response for company context", e);
    return {};
  }
}

export async function generateBrandImage(prompt: string, size: string, aspectRatio: string): Promise<string | null> {
  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3.1-flash-image-preview',
      contents: prompt,
      config: {
        imageConfig: {
          aspectRatio: aspectRatio as any,
          imageSize: size as any,
        }
      }
    });
    
    for (const part of response.candidates?.[0]?.content?.parts || []) {
      if (part.inlineData) {
        return `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
      }
    }
  } catch (e) {
    console.error("Image generation failed", e);
  }
  return null;
}
