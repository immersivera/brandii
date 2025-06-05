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

export type ImageSize = '1024x1024' | '1792x1024' | '1024x1792';

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

export async function generateImageAssets(
  prompt: string,
  logoImage?: string,
  size: ImageSize = '1024x1024'
): Promise<string[]> {
  try {
    const { data, error } = await supabase.functions.invoke('openai', {
      body: {
        action: 'generateImageAssets',
        data: { prompt, logoImage, size }
      }
    });

    if (error) throw error;

    return data.map((image: any) => `data:image/png;base64,${image.b64_json}`);
  } catch (error) {
    console.error("Error generating image assets:", error);
    throw error;
  }
}