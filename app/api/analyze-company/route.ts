import { GoogleGenAI } from '@google/genai'
import { NextResponse } from 'next/server'

const getApiKey = () => {
  const key = process.env.GEMINI_API_KEY
  if (!key) {
    throw new Error('GEMINI_API_KEY is not configured')
  }
  return key
}

export async function POST(request: Request) {
  try {
    const { text } = await request.json()

    if (!text || text.trim().length < 10) {
      return NextResponse.json(
        { error: 'Tekst is te kort om te analyseren' },
        { status: 400 }
      )
    }

    const ai = new GoogleGenAI({ apiKey: getApiKey() })

    const prompt = `Analyseer de volgende bedrijfstekst en extraheer de volgende informatie in JSON formaat:
- companyName: de naam van het bedrijf
- description: een korte beschrijving van wat het bedrijf doet (missie/beschrijving)
- targetAudience: de doelgroep van het bedrijf
- usp: de unique selling points (USP's) van het bedrijf
- toneOfVoice: de tone of voice die het bedrijf hanteert

Tekst om te analyseren:
"""
${text}
"""

Geef alleen een JSON object terug zonder markdown code blocks, met de bovenstaande velden. Als je een veld niet kunt bepalen, gebruik dan een lege string.`

    const response = await ai.models.generateContent({
      model: 'gemini-2.0-flash',
      contents: prompt,
    })

    const responseText = response.text || ''
    
    // Clean up the response - remove markdown code blocks if present
    let cleanedResponse = responseText
      .replace(/```json\n?/g, '')
      .replace(/```\n?/g, '')
      .trim()

    try {
      const result = JSON.parse(cleanedResponse)
      return NextResponse.json(result)
    } catch {
      // If JSON parsing fails, return empty fields
      return NextResponse.json({
        companyName: '',
        description: '',
        targetAudience: '',
        usp: '',
        toneOfVoice: ''
      })
    }
  } catch (error) {
    console.error('Analysis error:', error)
    return NextResponse.json(
      { error: 'Analyse mislukt. Controleer je API key.' },
      { status: 500 }
    )
  }
}
