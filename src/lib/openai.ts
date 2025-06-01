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
    model: "gpt-4",
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
          - typography: Object with headingFont and bodyFont (use Google Fonts names)`
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