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

  return JSON.parse(completion.choices[0].message.content);
}

export async function generateLogoImages(
  name: string,
  logoStyle: string,
  adjective: string,
  industry: string,
  description: string,
  colors: {
    primary: string;
    secondary: string;
    accent: string;
    background: string;
    text: string;
  },
  typography: {
    headingFont: string;
    bodyFont: string;
  }
): Promise<string[]> {
  const prompt = `
Create a high-resolution, ${adjective} **${logoStyle}** logo for a **${industry}** brand named "${name}".

**Brand essence:** ${description}

**Color palette**
• Primary: ${colors.primary}  
• Secondary: ${colors.secondary}  
• Accent: ${colors.accent}  
• Background the logo must work on: ${colors.background}  
• Text color guideline: ${colors.text}  

**Typography reference**  
• Heading: "${typography.headingFont}"  
• Body: "${typography.bodyFont}"

**Stylistic guidance**  
• Reflect the ${adjective} personality of the brand.  
• Use the ${logoStyle} approach (e.g. wordmark, lettermark, emblem ...).  
• Ensure strong contrast against ${colors.background}.  
• No mock-ups, watermarks, or realistic stationery shots—return a clean, centered logo on a transparent background.
  `.trim();

  try {
    console.log("Generating logo with prompt:", prompt.substring(0, 100) + "...");

    const response = await openai.images.generate({
      model: "dall-e-3",
      prompt,
      n: 2,
      size: "1024x1024",
      quality: "hd",
      style: "natural",
      response_format: "b64_json"
    });

    if (!response.data || response.data.length === 0 || !response.data[0].b64_json) {
      console.error(
        "No b64_json in response:",
        JSON.stringify(response).substring(0, 200)
      );
      throw new Error("No image data returned from OpenAI");
    }

    // Return array of base64 image data
    return response.data.map(image => `data:image/png;base64,${image.b64_json}`);
  } catch (error) {
    console.error("Error generating image with OpenAI:", error);
    throw error;
  }
}