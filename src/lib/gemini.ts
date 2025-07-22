interface GeminiMessage {
  role: 'user' | 'model'
  parts: { text: string }[]
}

interface GeminiRequest {
  contents: GeminiMessage[]
  generationConfig?: {
    temperature?: number
    topK?: number
    topP?: number
    maxOutputTokens?: number
  }
}

interface GeminiResponse {
  candidates: {
    content: {
      parts: { text: string }[]
    }
    finishReason: string
  }[]
}

class GeminiService {
  private apiKey: string
  private baseUrl = 'https://generativelanguage.googleapis.com/v1beta/models'

  constructor() {
    this.apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY || ''
    if (!this.apiKey) {
      console.warn('Gemini API key not found in environment variables')
    }
  }

  async generateContent(
    messages: GeminiMessage[],
    systemPrompt?: string,
    deepThinkMode = false
  ): Promise<string> {
    try {
      if (!this.apiKey) {
        throw new Error('Gemini API key not configured')
      }

      // Add system prompt as the first message if provided
      const contents: GeminiMessage[] = []
      
      if (systemPrompt) {
        contents.push({
          role: 'user',
          parts: [{ text: `System: ${systemPrompt}` }]
        })
        contents.push({
          role: 'model',
          parts: [{ text: 'Understood. I will respond according to this persona and context.' }]
        })
      }

      // Add conversation history
      contents.push(...messages)

      const requestBody: GeminiRequest = {
        contents,
        generationConfig: {
          temperature: deepThinkMode ? 0.7 : 0.9,
          topK: deepThinkMode ? 40 : 20,
          topP: deepThinkMode ? 0.8 : 0.95,
          maxOutputTokens: deepThinkMode ? 2048 : 1024
        }
      }

      const response = await fetch(
        `${this.baseUrl}/gemini-2.0-flash:generateContent`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-goog-api-key': this.apiKey
          },
          body: JSON.stringify(requestBody)
        }
      )

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(`Gemini API error: ${response.status} - ${errorData.error?.message || 'Unknown error'}`)
      }

      const data: GeminiResponse = await response.json()
      
      if (!data.candidates || data.candidates.length === 0) {
        throw new Error('No response generated from Gemini API')
      }

      return data.candidates[0].content.parts[0].text
    } catch (error) {
      console.error('Gemini API Error:', error)
      throw error
    }
  }

  async translateText(text: string, targetLanguage: string): Promise<string> {
    try {
      const prompt = `Translate the following text to ${targetLanguage}. Only return the translation, no additional text:\n\n${text}`
      
      const response = await this.generateContent([{
        role: 'user',
        parts: [{ text: prompt }]
      }])

      return response.trim()
    } catch (error) {
      console.error('Translation error:', error)
      return text // Return original text if translation fails
    }
  }
}

export const geminiService = new GeminiService()
