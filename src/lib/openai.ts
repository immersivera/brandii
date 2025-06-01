import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: import.meta.env.VITE_OPENAI_API_KEY,
  dangerouslyAllowBrowser: true
});

export interface AIBrandSuggestion {
  name: string;
  description: string;
  industry: string;
  adjective: string;
  logoStyle: string;
  colors: {
    primary: string;
    secondary: string;
    accent: string;
    background: string;
    text: string;
  };
  typography: {
    headingFont: string;
    bodyFont: string;
  };
}

export async function generateBrandSuggestion(prompt: string): Promise<AIBrandSuggestion> {
  const completion = await openai.chat.completions.create({
    model: "gpt-4.1-nano",
    messages: [
      {
        role: "system",
        content: `You are a brand identity expert. Generate brand suggestions in JSON format based on the user's description. Include:
          - name: A creative brand name
          - description: A concise brand description
          - industry: One of [technology, creative, business, health, food, education, ecommerce, custom]
          - adjective: One of [modern, minimal, bold, playful, elegant, retro, organic, tech]
          - logoStyle: One of [wordmark, lettermark, abstract, mascot, combination, emblem]
          - colors: Object with primary, secondary, accent, background, and text colors (in hex)
          - typography: Object with headingFont and bodyFont (use Google Fonts names)
          
          Example response format:
          {
            "name": "Luminary",
            "description": "A modern technology company focused on innovative AI solutions",
            "industry": "technology",
            "adjective": "modern",
            "logoStyle": "combination",
            "colors": {
              "primary": "#3B82F6",
              "secondary": "#1E40AF",
              "accent": "#F59E0B",
              "background": "#F8FAFC",
              "text": "#1F2937"
            },
            "typography": {
              "headingFont": "Plus Jakarta Sans",
              "bodyFont": "Inter"
            }
          }`
      },
      {
        role: "user",
        content: prompt
      }
    ],
    response_format: { type: "json_object" }
  });

  const suggestion = JSON.parse(completion.choices[0].message.content);
  return suggestion;
}