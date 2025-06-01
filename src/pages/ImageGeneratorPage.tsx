import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useParams, useNavigate } from 'react-router-dom';
import { Layout } from '../components/layout/Layout';
import { Button } from '../components/ui/Button';
import { Card, CardContent } from '../components/ui/Card';
import { Textarea } from '../components/ui/Textarea';
import { Switch } from '../components/ui/Switch';
import { ArrowLeft, ArrowRight, Sparkles, Download, X, Calendar, Clock, Settings } from 'lucide-react';
import { BrandKit, fetchBrandKitById, saveGeneratedAssets } from '../lib/supabase';
import { generateImageAssets } from '../lib/openai';
import { cn } from '../lib/utils';
import toast from 'react-hot-toast';

const steps = [
  { id: 1, name: 'Prompt' },
  { id: 2, name: 'Settings' },
  { id: 3, name: 'Generate' }
];

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
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [currentStep, setCurrentStep] = useState(1);

  useEffect(() => {
    const loadBrandKit = async () => {
      if (!id) return;
      
      try {
        const kit = await fetchBrandKitById(id);
        if (kit) {
          setBrandKit(kit);
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

    return `
      Use the following brand assets in the image:
      Colors: Primary ${brandKit.colors.primary}, Secondary ${brandKit.colors.secondary}, Accent ${brandKit.colors.accent}
      Style: Match the brand's ${brandKit.type} industry style and maintain consistency with the brand's visual identity.
      Typography: Use fonts similar to ${brandKit.typography.headingFont} for headings and ${brandKit.typography.bodyFont} for body text if text is included.
    `;
  };

  const getSelectedLogo = () => {
    if (!brandKit?.generated_assets || !brandKit.logo_selected_asset_id || !includeLogo) return null;

    const selectedLogo = brandKit.generated_assets.find(
      asset => asset.id === brandKit.logo_selected_asset_id
    );
    return selectedLogo?.image_data || null;
  };

  const handleGenerate = async () => {
    if (!brandKit || !prompt.trim()) {
      toast.error('Please enter a prompt');
      return;
    }

    setIsGenerating(true);
    try {
      const fullPrompt = `${prompt}${getBrandAssetsPrompt()}`;
      const logoImage = getSelectedLogo();
      const images = await generateImageAssets(fullPrompt, logoImage);
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

  const formatDate = () => {
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    }).format(new Date());
  };

  const formatTime = () => {
    return new Intl.DateTimeFormat('en-US', {
      hour: 'numeric',
      minute: 'numeric',
      hour12: true,
    }).format(new Date());
  };

  const nextStep = () => {
    if (currentStep < steps.length) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-6">
            <Textarea
              label="Image Prompt"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Describe the image you want to generate..."
              className="h-32"
            />
            <div className="flex justify-end">
              <Button
                onClick={nextStep}
                rightIcon={<ArrowRight className="h-4 w-4" />}
                disabled={!prompt.trim()}
              >
                Next Step
              </Button>
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-6">
            <div className="space-y-4">
              <Switch
                checked={includeBrandAssets}
                onChange={setIncludeBrandAssets}
                label="Include Brand Assets"
                description="Use brand colors, typography, and style in the generation"
              />

              {includeBrandAssets && brandKit?.logo_selected_asset_id && (
                <Switch
                  checked={includeLogo}
                  onChange={setIncludeLogo}
                  label="Include Brand Logo"
                  description="Incorporate your brand logo into the generated images"
                  className="ml-6"
                  disabled={!includeBrandAssets}
                />
              )}
            </div>
            <div className="flex justify-between">
              <Button
                variant="outline"
                onClick={prevStep}
                leftIcon={<ArrowLeft className="h-4 w-4" />}
              >
                Previous Step
              </Button>
              <Button
                onClick={nextStep}
                rightIcon={<ArrowRight className="h-4 w-4" />}
              >
                Next Step
              </Button>
            </div>
          </div>
        );

      case 3:
        return (
          <div className="space-y-6">
            <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 space-y-2">
              <h3 className="text-sm font-medium text-gray-900 dark:text-white">
                Generation Settings
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Prompt: {prompt}
              </p>
              <div className="flex flex-wrap gap-2 mt-2">
                {includeBrandAssets && (
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-brand-100 text-brand-800 dark:bg-brand-900 dark:text-brand-200">
                    Brand Assets
                  </span>
                )}
                {includeLogo && (
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-brand-100 text-brand-800 dark:bg-brand-900 dark:text-brand-200">
                    Logo Included
                  </span>
                )}
              </div>
            </div>
            <div className="flex justify-between">
              <Button
                variant="outline"
                onClick={prevStep}
                leftIcon={<ArrowLeft className="h-4 w-4" />}
              >
                Previous Step
              </Button>
              <Button
                onClick={handleGenerate}
                leftIcon={<Sparkles className="h-4 w-4" />}
                isLoading={isGenerating}
                disabled={isGenerating || !prompt.trim()}
              >
                Generate Images
              </Button>
            </div>
          </div>
        );

      default:
        return null;
    }
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

            <div className="mb-8">
              <nav aria-label="Progress">
                <ol role="list" className="flex items-center">
                  {steps.map((step, stepIdx) => (
                    <li
                      key={step.name}
                      className={cn(
                        stepIdx !== steps.length - 1 ? 'pr-8 sm:pr-20' : '',
                        'relative'
                      )}
                    >
                      <div className="flex items-center">
                        <div
                          className={cn(
                            'relative flex h-8 w-8 items-center justify-center rounded-full',
                            currentStep > step.id
                              ? 'bg-brand-600'
                              : currentStep === step.id
                              ? 'bg-brand-600'
                              : 'bg-gray-200 dark:bg-gray-700'
                          )}
                        >
                          <span className="text-white text-sm font-medium">
                            {step.id}
                          </span>
                        </div>
                        {stepIdx !== steps.length - 1 && (
                          <div
                            className={cn(
                              'absolute top-4 w-full h-0.5 -translate-y-1/2',
                              currentStep > step.id
                                ? 'bg-brand-600'
                                : 'bg-gray-200 dark:bg-gray-700'
                            )}
                            style={{ left: '100%', width: '3rem' }}
                          />
                        )}
                      </div>
                      <span
                        className="absolute -bottom-6 left-1/2 -translate-x-1/2 whitespace-nowrap text-sm font-medium text-gray-500 dark:text-gray-400"
                      >
                        {step.name}
                      </span>
                    </li>
                  ))}
                </ol>
              </nav>
            </div>

            <Card className="mb-8">
              <CardContent className="p-6">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={currentStep}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ duration: 0.2 }}
                  >
                    {renderStepContent()}
                  </motion.div>
                </AnimatePresence>
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
                    <Card 
                      key={index} 
                      hover 
                      className="cursor-pointer"
                      onClick={() => setSelectedImage(imageUrl)}
                    >
                      <CardContent className="p-4">
                        <img
                          src={imageUrl}
                          alt={`Generated image ${index + 1}`}
                          className="w-full h-auto rounded-lg mb-4"
                        />
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDownload(imageUrl, index);
                          }}
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

      {/* Image Modal */}
      <AnimatePresence>
        {selectedImage && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setSelectedImage(null)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white dark:bg-gray-900 rounded-xl shadow-xl max-w-5xl w-full max-h-[90vh] overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex flex-col md:flex-row h-full">
                {/* Image Section */}
                <div className="w-full md:w-2/3 bg-black p-4 flex items-center justify-center">
                  <img
                    src={selectedImage}
                    alt="Selected image"
                    className="max-w-full max-h-[50vh] md:max-h-[80vh] object-contain rounded-lg"
                  />
                </div>

                {/* Details Section */}
                <div className="w-full md:w-1/3 p-6 flex flex-col">
                  <div className="flex justify-between items-start mb-6">
                    <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                      Image Details
                    </h3>
                    <button
                      onClick={() => setSelectedImage(null)}
                      className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-colors"
                    >
                      <X className="h-5 w-5" />
                    </button>
                  </div>

                  <div className="space-y-6 flex-grow">
                    <div>
                      <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">
                        Created
                      </h4>
                      <div className="space-y-2">
                        <div className="flex items-center text-gray-600 dark:text-gray-300">
                          <Calendar className="h-4 w-4 mr-2" />
                          <span>{formatDate()}</span>
                        </div>
                        <div className="flex items-center text-gray-600 dark:text-gray-300">
                          <Clock className="h-4 w-4 mr-2" />
                          <span>{formatTime()}</span>
                        </div>
                      </div>
                    </div>

                    <div>
                      <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">
                        Prompt
                      </h4>
                      <p className="text-gray-600 dark:text-gray-300 text-sm">
                        {prompt}
                      </p>
                    </div>
                  </div>

                  <Button
                    className="w-full mt-6"
                    leftIcon={<Download className="h-4 w-4" />}
                    onClick={() => handleDownload(selectedImage, generatedImages.indexOf(selectedImage))}
                  >
                    Download Image
                  </Button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </Layout>
  );
};