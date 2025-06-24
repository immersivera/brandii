import { supabase } from './supabase';

const CONTENT_RESTRICTIONS = [
  'face swap',
  'deep fake',
  'public figure'
];

/**
 * Validates if a prompt violates content restrictions
 * @param prompt The user's prompt to validate
 * @returns {Promise<{isValid: boolean, reason?: string}>} Validation result with optional reason
 */
export async function validatePrompt(prompt: string): Promise<{isValid: boolean, reason?: string}> {
  try {
    const lowerPrompt = prompt.toLowerCase();
    
    // Check for restricted terms
    const violation = CONTENT_RESTRICTIONS.find(term => 
      lowerPrompt.includes(term.toLowerCase())
    );

    if (violation) {
      return {
        isValid: false,
        reason: `Your prompt contains restricted content (${violation}). Please modify your prompt to comply with our content policy.`
      };
    }

    // If we want to be extra cautious, we can use OpenAI to analyze the prompt
    const { data, error } = await supabase.functions.invoke('openai', {
      body: {
        action: 'validatePrompt',
        data: { prompt }
      }
    });

    if (error) {
      console.warn('Failed to validate prompt with AI, falling back to basic validation');
      return { isValid: true }; // Fallback to allowing the prompt if validation fails
    }

    return data;
  } catch (error) {
    console.error('Error validating prompt:', error);
    return { isValid: true }; // Fail open to avoid blocking valid requests
  }
}


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

export async function generateBrandSuggestion(prompt: string, brandName?: string, brandDescription?: string, brandIndustry?: string, brandAdjective?: string): Promise<AIBrandSuggestion> {
  // If brand name and description are provided but not in the prompt, add them
  let enhancedPrompt = prompt;
  if (brandName && !prompt.toLowerCase().includes(brandName.toLowerCase())) {
    enhancedPrompt = `Brand Name: ${brandName}\n${enhancedPrompt}`;
  }
  if (brandDescription && !prompt.toLowerCase().includes(brandDescription.toLowerCase())) {
    enhancedPrompt = `${enhancedPrompt}\nBrand Description: ${brandDescription}`;
  }
  if (brandIndustry && !prompt.toLowerCase().includes(brandIndustry.toLowerCase())) {
    enhancedPrompt = `${enhancedPrompt}\nBrand Industry: ${brandIndustry}`;
  }
  if (brandAdjective && !prompt.toLowerCase().includes(brandAdjective.toLowerCase())) {
    enhancedPrompt = `${enhancedPrompt}\nBrand Adjective: ${brandAdjective}`;
  }

  const { data, error } = await supabase.functions.invoke('openai', {
    body: {
      action: 'generateBrandSuggestion',
      data: { prompt: enhancedPrompt }
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
  count: number = 1,
  skipValidation: boolean = false
): Promise<string[]> {
  try {
    // Validate the prompt against content restrictions
    if (!skipValidation) {
      const validation = await validatePrompt(prompt);
      if (!validation.isValid) {
        throw new Error(validation.reason || 'Prompt violates content restrictions');
      }
    }

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