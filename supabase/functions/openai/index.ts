import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'npm:@supabase/supabase-js@2.49.8'
import OpenAI from 'npm:openai@4.28.4'

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

        // Make two separate API calls to generate two images
        const [response1, response2] = await Promise.all([
          openai.images.generate({
            model: "gpt-image-1",
            prompt,
            n: 1,
            size: "1024x1024",
          }),
          openai.images.generate({
            model: "gpt-image-1",
            prompt,
            n: 1,
            size: "1024x1024",
          })
        ])

        // Combine the results
        const combinedData = [
          ...response1.data,
          ...response2.data
        ]

        return new Response(JSON.stringify(combinedData), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      }

      case 'generateImageAssets': {
        let images = []

        // Function to generate a single image
        const generateImage = async (prompt: string, logoImage?: Uint8Array) => {
          if (logoImage) {
            return await openai.images.edit({
              model: "gpt-image-1",
              image: logoImage,
              mask: logoImage,
              prompt,
              n: 1,
              size: "1024x1024",
            })
          } else {
            return await openai.images.generate({
              model: "gpt-image-1",
              prompt,
              n: 1,
              size: "1024x1024",
            })
          }
        }
        
        if (data.logoImage) {
          // Convert base64 string to Uint8Array for image editing
          const base64Data = data.logoImage.split(',')[1]
          const binaryString = atob(base64Data)
          const bytes = new Uint8Array(binaryString.length)
          for (let i = 0; i < binaryString.length; i++) {
            bytes[i] = binaryString.charCodeAt(i)
          }

          // Generate two images with the logo
          const [response1, response2] = await Promise.all([
            generateImage(data.prompt, bytes),
            generateImage(data.prompt, bytes)
          ])

          images = [...response1.data, ...response2.data]
        } else {
          // Generate two images without a logo
          const [response1, response2] = await Promise.all([
            generateImage(data.prompt),
            generateImage(data.prompt)
          ])

          images = [...response1.data, ...response2.data]
        }

        return new Response(JSON.stringify(images), {
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