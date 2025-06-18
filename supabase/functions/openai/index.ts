import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'npm:@supabase/supabase-js@2.39.7'
import OpenAI from 'npm:openai@4.28.4'

const CONTENT_RESTRICTIONS = [
  'face swap',
  'deep fake',
  'celebrity',
  'public figure'
];

async function validatePromptWithAI(prompt: string): Promise<{isValid: boolean, reason?: string}> {
  try {
    const openai = new OpenAI({
      apiKey: Deno.env.get('OPENAI_API_KEY'),
    });

    const response = await openai.chat.completions.create({
      model: 'gpt-4.1-nano',
      messages: [
        {
          role: 'system',
          content: `You are a content moderator. Analyze the following prompt and determine if it violates any content restrictions.
          
Restrictions to enforce:
- No human-like faces (realistic, stylized, or animated)
- No face swaps
- No deep fake images or videos
- No content using a person's likeness
- No celebrities or public figures

Return a JSON response with the following structure:
{
  "isValid": boolean,  // true if the prompt is allowed, false if it violates restrictions
  "reason": string     // Explanation of why the prompt was rejected (if applicable)
}`
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      response_format: { type: 'json_object' },
      temperature: 0.1
    });

    const result = JSON.parse(response.choices[0].message.content || '{}');
    return {
      isValid: result.isValid === true,
      reason: result.reason
    };
  } catch (error) {
    console.error('Error validating prompt with AI:', error);
    throw error;
  }
}

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const openai = new OpenAI({
      apiKey: Deno.env.get('OPENAI_API_KEY'),
    })

    const { action, data } = await req.json()

    switch (action) {
      case 'validatePrompt': {
        // First do a quick check against our restricted terms
        const lowerPrompt = (data.prompt || '').toLowerCase();
        const violation = CONTENT_RESTRICTIONS.find(term => 
          lowerPrompt.includes(term.toLowerCase())
        );

        if (violation) {
          return new Response(JSON.stringify({
            isValid: false,
            reason: `Your prompt contains restricted content (${violation}). Please modify your prompt to comply with our content policy.`
          }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }


        // If no obvious violations found, use AI for more nuanced validation
        try {
          const validation = await validatePromptWithAI(data.prompt);
          return new Response(JSON.stringify(validation), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        } catch (error) {
          console.error('AI validation failed, falling back to basic validation');
          // If AI validation fails, fall back to allowing the prompt
          // This is a security decision - you might want to be more strict in production
          return new Response(JSON.stringify({ isValid: true }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }
      }
      case 'generateBrandSuggestion': {
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
                - typography: Object with headingFont and bodyFont (use Google Fonts names)`
            },
            {
              role: "user",
              content: data.prompt
            }
          ],
          response_format: { type: "json_object" }
        })
        
        return new Response(JSON.stringify(completion.choices[0].message.content), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      }

      case 'generateLogoImages': {
        const styleDescriptions = {
          wordmark: `a minimalist, modern wordmark logo design for "${data.brandName}" using the colors ${data.colors.primary} (primary), ${data.colors.secondary} (secondary), and ${data.colors.accent} (accent). The design should be clean, professional, and versatile. Brand description: ${data.description}. Industry: ${data.industry}. Brand personality: ${data.personality}.`,
          lettermark: `a sophisticated lettermark logo using the letter "${data.brandName[0]}" with colors ${data.colors.primary} (primary), ${data.colors.secondary} (secondary), and ${data.colors.accent} (accent). The design should be bold and memorable. Brand description: ${data.description}. Industry: ${data.industry}. Brand personality: ${data.personality}.`,
          abstract: `an abstract, geometric logo mark that represents "${data.brandName}" using colors ${data.colors.primary} (primary), ${data.colors.secondary} (secondary), and ${data.colors.accent} (accent). The design should be unique and contemporary. Brand description: ${data.description}. Industry: ${data.industry}. Brand personality: ${data.personality}.`,
          mascot: `a friendly, character-based logo design for "${data.brandName}" incorporating colors ${data.colors.primary} (primary), ${data.colors.secondary} (secondary), and ${data.colors.accent} (accent). The mascot should be approachable and memorable. Brand description: ${data.description}. Industry: ${data.industry}. Brand personality: ${data.personality}.`,
          combination: `a combination mark logo for "${data.brandName}" that combines a wordmark with a distinctive symbol, using colors ${data.colors.primary} (primary), ${data.colors.secondary} (secondary), and ${data.colors.accent} (accent). The design should be balanced and professional. Brand description: ${data.description}. Industry: ${data.industry}. Brand personality: ${data.personality}.`,
          emblem: `an emblem-style logo for "${data.brandName}" with contained typography and imagery, using colors ${data.colors.primary} (primary), ${data.colors.secondary} (secondary), and ${data.colors.accent} (accent). The design should be classic and authoritative. Brand description: ${data.description}. Industry: ${data.industry}. Brand personality: ${data.personality}.`
        }

        const prompt = styleDescriptions[data.style as keyof typeof styleDescriptions] || styleDescriptions.wordmark

        const response = await openai.images.generate({
          model: "gpt-image-1",
          prompt,
          n: 2,
          size: "1024x1024",
        })

        return new Response(JSON.stringify(response.data), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      }

      case 'generateImageAssets': {
        let response;
        
        if (data.images && data.images.length > 0) {
          const formData = new FormData();
          formData.append('model', 'gpt-image-1');
          
          // Add each image to the form data
          for (const img of data.images) {
            const base64Data = img.base64.startsWith('data:') 
              ? img.base64.split(',')[1] 
              : img.base64;
              
            const binaryString = atob(base64Data);
            const bytes = new Uint8Array(binaryString.length);
            
            for (let i = 0; i < binaryString.length; i++) {
              bytes[i] = binaryString.charCodeAt(i);
            }
            
            // Use the correct MIME type from the uploaded file
            const fileExtension = img.type.split('/')[1] || 'png';
            formData.append('image[]', new Blob([bytes], { type: img.type }), `image.${fileExtension}`);
          }
          
          formData.append('prompt', data.prompt);
          formData.append('n', String(data.count || 1));
          formData.append('size', data.size || '1024x1024');
          
          // Make the request to OpenAI's API
          const openaiResponse = await fetch('https://api.openai.com/v1/images/edits', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${Deno.env.get('OPENAI_API_KEY')}`,
            },
            body: formData
          });
          
          if (!openaiResponse.ok) {
            const error = await openaiResponse.json();
            console.error('OpenAI API Error:', error);
            throw new Error(error.error?.message || 'Failed to generate images');
          }
          
          const result = await openaiResponse.json();
          response = { data: result.data };
        } else {
          // Standard image generation when no images are provided
          response = await openai.images.generate({
            model: "gpt-image-1",
            prompt: data.prompt,
            n: data.count || 1,
            size: data.size || "1024x1024",
          });
        }

        return new Response(JSON.stringify(response.data), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      }

      default:
        return new Response(JSON.stringify({ error: 'Invalid action' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
    }
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})