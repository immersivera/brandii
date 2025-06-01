import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useParams, useNavigate } from 'react-router-dom';
import { Layout } from '../components/layout/Layout';
import { Button } from '../components/ui/Button';
import { Card, CardContent } from '../components/ui/Card';
import { Textarea } from '../components/ui/Textarea';
import { ArrowLeft, Sparkles, Download } from 'lucide-react';
import { BrandKit, fetchBrandKitById, saveGeneratedAssets } from '../lib/supabase';
import { generateImageAssets } from '../lib/openai';
import toast from 'react-hot-toast';

export const ImageGeneratorPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [brandKit, setBrandKit] = useState<BrandKit | null>(null);
  const [prompt, setPrompt] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedImages, setGeneratedImages] = useState<string[]>([]);
  const [includeBrandAssets, setIncludeBrandAssets] = useState(true);
  const [includeLogo, setIncludeLogo] = useState(false);

  useEffect(() => {
    const loadBrandKit = async () => {
      if (!id) return;
      
      try {
        const kit = await fetchBrandKitById(id);
        if (kit) {
          setBrandKit(kit);
          // Set a default prompt based on brand details
          setPrompt(`Create an image for ${kit.name}, a ${kit.type} brand. ${kit.description}`);
        } else {
          toast.error('Brand kit not found');
          navigate('/library');
        }
      } catch (error) {
        console.error('Error loading brand kit:', error);
        toast.error('Failed to load brand kit');
      } finally {
        setIsLoading(false);
      }
    };

    loadBrandKit();
  }, [id, navigate]);

  const getBrandAssetsPrompt = () => {
    if (!brandKit || !includeBrandAssets) return '';

    let assetsPrompt = `
      Use the following brand assets in the image:
      Colors: Primary ${brandKit.colors.primary}, Secondary ${brandKit.colors.secondary}, Accent ${brandKit.colors.accent}
      Style: Match the brand's ${brandKit.type} industry style and maintain consistency with the brand's visual identity.
      Typography: Use fonts similar to ${brandKit.typography.headingFont} for headings and ${brandKit.typography.bodyFont} for body text if text is included.
    `;

    // Add logo context if selected and available
    if (includeLogo && brandKit.logo_selected_asset_id && brandKit.generated_assets) {
      const selectedLogo = brandKit.generated_assets.find(
        asset => asset.id === brandKit.logo_selected_asset_id
      );
      if (selectedLogo?.image_data) {
        assetsPrompt += `\nIncorporate the brand logo: ${selectedLogo.image_data}`;
      }
    }

    return assetsPrompt;
  };

  const handleGenerate = async () => {
    if (!brandKit || !prompt.trim()) {
      toast.error('Please enter a prompt');
      return;
    }

    setIsGenerating(true);
    try {
      const fullPrompt = `${prompt}${getBrandAssetsPrompt()}`;
      const images = await generateImageAssets(fullPrompt);
      setGeneratedImages(images);

      // Save the generated images
      await saveGeneratedAssets(brandKit.id, images, 'image');
      toast.success('Images generated and saved successfully!');
    } catch (error) {
      console.error('Error generating images:', error);
      toast.error('Failed to generate images');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDownload = (imageUrl: string, index: number) => {
    const link = document.createElement('a');
    link.href = imageUrl;
    link.download = `${brandKit?.name.toLowerCase().replace(/\s+/g, '-')}-image-${index + 1}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (isLoading) {
    return (
      <Layout>
        <div className="min-h-screen bg-white dark:bg-gray-900 py-12">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-center items-center py-20">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-brand-600"></div>
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  if (!brandKit) return null;

  const hasLogo = brandKit.logo_selected_asset_id && brandKit.generated_assets?.some(
    asset => asset.id === brandKit.logo_selected_asset_id
  );

  return (
    <Layout>
      <div className="min-h-screen bg-white dark:bg-gray-900 py-12">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-4xl mx-auto">
            <div className="flex items-center justify-between mb-8">
              <div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => navigate(`/kit/${id}`)}
                  leftIcon={<ArrowLeft className="h-4 w-4" />}
                  className="mb-4"
                >
                  Back to Brand Kit
                </Button>
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                  Generate Images for {brandKit.name}
                </h1>
                <p className="text-gray-600 dark:text-gray-400">
                  Create custom images that match your brand identity
                </p>
              </div>
            </div>

            <Card className="mb-8">
              <CardContent className="p-6">
                <div className="space-y-6">
                  <Textarea
                    label="Image Prompt"
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    placeholder="Describe the image you want to generate..."
                    className="h-32"
                  />

                  <div className="space-y-3">
                    <div className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id="includeBrandAssets"
                        checked={includeBrandAssets}
                        onChange={(e) => {
                          setIncludeBrandAssets(e.target.checked);
                          if (!e.target.checked) {
                            setIncludeLogo(false);
                          }
                        }}
                        className="h-4 w-4 text-brand-600 focus:ring-brand-500 border-gray-300 rounded"
                      />
                      <label 
                        htmlFor="includeBrandAssets"
                        className="text-sm text-gray-700 dark:text-gray-300"
                      >
                        Include brand colors, typography, and style in the generation
                      </label>
                    </div>

                    {includeBrandAssets && hasLogo && (
                      <div className="flex items-center space-x-2 ml-6">
                        <input
                          type="checkbox"
                          id="includeLogo"
                          checked={includeLogo}
                          onChange={(e) => setIncludeLogo(e.target.checked)}
                          className="h-4 w-4 text-brand-600 focus:ring-brand-500 border-gray-300 rounded"
                        />
                        <label 
                          htmlFor="includeLogo"
                          className="text-sm text-gray-700 dark:text-gray-300"
                        >
                          Include brand logo in the generated images
                        </label>
                      </div>
                    )}
                  </div>

                  <Button
                    onClick={handleGenerate}
                    leftIcon={<Sparkles className="h-4 w-4" />}
                    isLoading={isGenerating}
                    disabled={isGenerating || !prompt.trim()}
                  >
                    Generate Images
                  </Button>
                </div>
              </CardContent>
            </Card>

            {generatedImages.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
              >
                <h2 className="text-2xl font-bold mb-6 text-gray-900 dark:text-white">
                  Generated Images
                </h2>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {generatedImages.map((imageUrl, index) => (
                    <Card key={index} hover>
                      <CardContent className="p-4">
                        <img
                          src={imageUrl}
                          alt={`Generated image ${index + 1}`}
                          className="w-full h-auto rounded-lg mb-4"
                        />
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDownload(imageUrl, index)}
                          leftIcon={<Download className="h-4 w-4" />}
                          className="w-full"
                        >
                          Download Image
                        </Button>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </motion.div>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
};