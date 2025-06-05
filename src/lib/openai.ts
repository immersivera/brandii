import { supabase } from './supabase';
import { optimizeImage } from './imageProcessing';

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

export async function generateImageAssets(
  prompt: string,
  logoImageUrl?: string,
  size: ImageSize = '1024x1024',
  count: number = 1
): Promise<string[]> {
  try {
    let optimizedLogo = null;
    
    if (logoImageUrl) {
      optimizedLogo = await optimizeImage(logoImageUrl);
      if (!optimizedLogo) {
        throw new Error('Failed to optimize logo image');
      }
      
      // Upload optimized logo to Supabase Storage
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('brand-logos')
        .upload(`temp/${Date.now()}.png`, optimizedLogo.file);

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('brand-logos')
        .getPublicUrl(uploadData.path);

      logoImageUrl = publicUrl;
    }

    const { data, error } = await supabase.functions.invoke('openai', {
      body: {
        action: 'generateImageAssets',
        data: { 
          prompt, 
          logoImageUrl,
          size, 
          count 
        }
      }
    });

    if (error) throw error;

    // Clean up temporary logo file if it exists
    if (optimizedLogo) {
      URL.revokeObjectURL(optimizedLogo.url);
    }

    return data.map((image: any) => `data:image/png;base64,${image.b64_json}`);
  } catch (error) {
    console.error("Error generating image assets:", error);
    throw error;
  }
}