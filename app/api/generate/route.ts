import { GoogleGenAI, Type } from '@google/genai'
import { NextRequest, NextResponse } from 'next/server'
import { BrandSettings } from '@/lib/types'

const getApiKey = () => {
  const key = process.env.GEMINI_API_KEY
  if (!key) {
    throw new Error('GEMINI_API_KEY is not configured')
  }
  return key
}

export async function POST(request: NextRequest) {
  try {
    const { prompt, isCarousel, brandContext } = await request.json() as {
      prompt: string
      isCarousel: boolean
      brandContext: BrandSettings
    }

    const ai = new GoogleGenAI({ apiKey: getApiKey() })

    const systemInstruction = `You are an expert social media copywriter.
Create content for a brand with the following profile:
- Company Type: ${brandContext.company_type || 'Generic Business'}
- Target Audience: ${brandContext.target_audience || 'General Public'}
- Tone of Voice: ${brandContext.tone_of_voice || 'Professional'}
- Description: ${brandContext.company_description || 'A business providing products/services.'}

Generate engaging social media post content based on the user's prompt.
If isCarousel is true, generate an array of 3-5 slides for each layout.
Otherwise, generate a single slide per layout.
Return JSON matching the requested schema.`

    const response = await ai.models.generateContent({
      model: 'gemini-2.0-flash',
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
    })

    const text = response.text || '{}'
    const result = JSON.parse(text)

    return NextResponse.json(result)
  } catch (error) {
    console.error('Generation error:', error)
    return NextResponse.json(
      { error: 'Failed to generate content' },
      { status: 500 }
    )
  }
}
