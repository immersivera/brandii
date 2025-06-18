import { supabase } from './supabase';

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
  const { data, error } = await supabase.functions.invoke('openai', {
    body: {
      action: 'generateBrandSuggestion',
      data: { prompt }
    }
  });

  if (error) throw error;
  return JSON.parse(data);
}

interface LogoGenerationOptions {
  brandName: string;
  style: string;
  colors: {
    primary: string;
    secondary: string;
    accent: string;
  };
  description: string;
  industry: string;
  personality: string;
}

export type ImageSize = '1024x1024' | '1024x1536' | '1536x1024' | 'auto';

export async function generateLogoImages(options: LogoGenerationOptions): Promise<string[]> {
  try {
    const { data, error } = await supabase.functions.invoke('openai', {
      body: {
        action: 'generateLogoImages',
        data: options
      }
    });

    if (error) throw error;

    return data.map((image: any) => `data:image/png;base64,${image.b64_json}`);
  } catch (error) {
    console.error("Error generating logo images:", error);
    throw error;
  }
}

export interface ImageForGeneration {
  base64: string;
  type: string;
}

export async function generateImageAssets(
  prompt: string,
  images?: ImageForGeneration[],
  size: ImageSize = '1024x1024',
  count: number = 1
): Promise<string[]> {
  try {
    // Add content restrictions to the prompt
    const restrictedPrompt = `${prompt}. IMPORTANT: DO NOT generate any of the following: ` +
      `human-like faces (realistic, stylized, or animated), face swaps, ` +
      `deep fake images, or any content using a person's likeness.`;

    const { data, error } = await supabase.functions.invoke('openai', {
      body: {
        action: 'generateImageAssets',
        data: { 
          prompt: restrictedPrompt,
          images,
          size,
          count 
        }
      }
    });

    if (error) throw error;

    return data.map((image: any) => `data:image/png;base64,${image.b64_json}`);
  } catch (error) {
    console.error("Error generating image assets:", error);
    throw error;
  }
}