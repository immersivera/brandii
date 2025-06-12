import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useParams, useNavigate } from 'react-router-dom';
import { Layout } from '../components/layout/Layout';
import { Button } from '../components/ui/Button';
import { Card, CardContent } from '../components/ui/Card';
import { Textarea } from '../components/ui/Textarea';
import { Select } from '../components/ui/Select';
import { useUser } from '../context/UserContext';
import { ArrowLeft, Sparkles, Download, X, Calendar, Clock, Upload, Image as ImageIcon, Trash2 } from 'lucide-react';
import { BrandKitForGeneration, fetchBrandKitForGeneration, saveGeneratedAssets } from '../lib/supabase';
import { generateImageAssets, type ImageSize } from '../lib/openai';
import toast from 'react-hot-toast';

const IMAGE_SIZES = [
  { value: '1024x1024', label: 'Square (1024×1024)' },
  { value: '1536x1024', label: 'Landscape (1536×1024)' },
  { value: '1024x1536', label: 'Portrait (1024×1536)' },
  { value: 'auto', label: 'Auto (Optimized)' },
] as const;

const IMAGE_COUNTS = [
  { value: '1', label: '1 Image' },
  { value: '2', label: '2 Images' },
] as const;

export const ImageGeneratorPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { profile } = useUser();
  const [brandKit, setBrandKit] = useState<BrandKitForGeneration | null>(null);
  // const [brandKitAssets, setBrandKitAssets] = useState<any>(null);
  const [prompt, setPrompt] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedImages, setGeneratedImages] = useState<string[]>([]);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [selectedSize, setSelectedSize] = useState<ImageSize>('1024x1024');
  const [imageCount, setImageCount] = useState<number>(1);
  const [promptImages, setPromptImages] = useState<Array<{ url: string; file: File }>>([]);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  
  // Check if user is on free plan (no active subscription)
  const isFreePlan = !profile?.subscription_status || profile.subscription_status !== 'active';
  
  // Brand asset controls
  const [includeBrandAssets, setIncludeBrandAssets] = useState(true);
  const [includeLogo, setIncludeLogo] = useState(false);
  const [includeBrandColors, setIncludeBrandColors] = useState(true);
  const [includeBrandTypography, setIncludeBrandTypography] = useState(true);
  const [includeBrandStyle, setIncludeBrandStyle] = useState(true);

  useEffect(() => {
    const loadBrandKit = async () => {
      if (!id) return;
      
      try {
        const kit = await fetchBrandKitForGeneration(id);
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

  // useEffect(() => {
  //   const loadBrandKitAssets = async () => {
  //     if (!id) return;
      
  //     try {
  //       const assets = await fetchBrandKitById(id);
  //       if (assets) {
  //         setBrandKitAssets([assets]);
  //       } else {
  //         toast.error('Brand kit assets not found');
  //       }
  //     } catch (error) {
  //       console.error('Error loading brand kit assets:', error);
  //       toast.error('Failed to load brand kit assets');
  //     }
  //   };

  //   loadBrandKitAssets();
  // }, []);

  const getBrandAssetsPrompt = () => {
    if (!brandKit || !includeBrandAssets) return '';

    const parts = [];

    if (includeBrandColors) {
      parts.push(`Colors: Primary ${brandKit.colors.primary}, Secondary ${brandKit.colors.secondary}, Accent ${brandKit.colors.accent}`);
    }

    if (includeBrandTypography) {
      parts.push(`Typography: Use fonts similar to ${brandKit.typography.headingFont} for headings and ${brandKit.typography.bodyFont} for body text if text is included`);
    }

    if (includeBrandStyle) {
      parts.push(`Style: Match the brand's ${brandKit.type} industry style and maintain consistency with the brand's visual identity`);
    }

    if (parts.length === 0) return '';

    return `\nUse the following brand assets in the image:\n${parts.join('\n')}`;
  };

  const getSelectedLogo = () => {
    if (!brandKit) return null;
    
    if (!includeLogo) return null;

    // Check for uploaded logo first
    if (brandKit.logo.image && brandKit.logo.image.length > 0) {
      return brandKit.logo.image;
    }

    
    // Then check for AI-generated logo
    // if (brandKitAssets?.length && brandKitAssets.logo_selected_asset_id) {
    //   const selectedAsset = brandKitAssets.find(
    //     (asset: any) => asset.id === brandKitAssets.logo_selected_asset_id && asset.type === 'logo'
    //   );
    //   if (selectedAsset?.image_data) {
    //     return selectedAsset.image_data;
    //   }
    // }

    return null;
  };
  
  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    // Validate files
    const validFiles = Array.from(files).filter(file => {
      // Check file type
      if (!file.type.startsWith('image/')) {
        toast.error(`Skipped ${file.name}: Not an image file`);
        return false;
      }
      
      // Check file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        toast.error(`Skipped ${file.name}: File size exceeds 5MB`);
        return false;
      }
      
      return true;
    });
    
    if (validFiles.length === 0) {
      toast.error('No valid images to upload');
      return;
    }

    setIsUploadingImage(true);
    const newImages: Array<{ url: string; file: File }> = [];
    let processedCount = 0;

    validFiles.forEach((file) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        if (e.target?.result) {
          newImages.push({
            url: e.target.result as string,
            file
          });
        }

        // When all files are processed
        processedCount++;
        if (processedCount === validFiles.length) {
          setPromptImages(prev => [...prev, ...newImages]);
          setIsUploadingImage(false);
          // Clear the input to allow re-uploading the same files
          event.target.value = '';
        }
      };
      reader.onerror = () => {
        console.error('Error reading file:', file.name);
        processedCount++;
        if (processedCount === validFiles.length) {
          setPromptImages(prev => [...prev, ...newImages]);
          setIsUploadingImage(false);
          event.target.value = '';
        }
      };
      reader.readAsDataURL(file);
    });
  };

  const handleRemoveImage = (index: number) => {
    setPromptImages(prev => prev.filter((_, i) => i !== index));
  };
// Helper function to convert blob to base64
const blobToBase64 = (blob: Blob): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
};
  const handleGenerate = async () => {
    if (!prompt.trim() || !brandKit) {
      toast.error('Please enter a prompt');
      return;
    }

    setIsGenerating(true);
    setGeneratedImages([]);
    setSelectedImage(null);

    try {

      const allImages = [...promptImages];
      let logoAdded = false;
      
      // If logo is included, add it to promptImages
      if (includeLogo) {
        const logoImage = getSelectedLogo();
        if (logoImage) {
          // Check if logo is already in the images to avoid duplicates
          const logoAlreadyAdded = allImages.some(img => 
            img.url === logoImage || 
            (img.file && img.file.name === 'logo.png')
          );
          
          if (!logoAlreadyAdded) {
          
          if (logoImage.startsWith('http')) {
            try {
              const response = await fetch(logoImage);
              const blob = await response.blob();
              const base64 = await blobToBase64(blob);
              const file = new File([blob], 'logo.png', { type: blob.type || 'image/png' });
            
              
              // Add to both state and local array
            setPromptImages(prev => [...prev, { url: base64, file }]);
            allImages.push({ url: base64, file });
            logoAdded = true;
              toast.success('Brand logo added to references');
            } catch (error) {
              console.error('Error loading logo from URL:', error);
              toast.error('Failed to load brand logo');
            }
          } else {
            // Already in base64 format, no processing needed
            const base64 = logoImage;
            const blob = await fetch(logoImage).then(res => res.blob());
            const file = new File([blob], 'logo.png', { type: 'image/png' });
            
            setPromptImages(prev => [...prev, { url: base64, file }]);
            allImages.push({ url: base64, file });
            logoAdded = true;
            toast.success('Brand logo added to references');
          }
        
          // Wait a moment for state to update
          await new Promise(resolve => setTimeout(resolve, 100));
        }
      }
      }

      // Prepare images for the API call
      const imagesForApi = allImages.map(img => ({
        base64: img.url,
        type: img.file.type || 'image/png' // Default to png if type is not available
      }));
    
      // Get the brand assets prompt and combine with the user's prompt
      const brandAssetsPrompt = getBrandAssetsPrompt();
      const fullPrompt = `${prompt.trim()}\n\n${brandAssetsPrompt}`.trim();

      const images = await generateImageAssets(
        fullPrompt,
        imagesForApi.length > 0 ? imagesForApi : undefined,
        selectedSize as ImageSize,
        imageCount
      );

      setGeneratedImages(images);
      // Save the generated images with the prompt
      await saveGeneratedAssets(brandKit.id, images, 'image', prompt);
      toast.success('Images generated and saved successfully!');
      
      if (images.length > 0) {
        setSelectedImage(images[0]);
      }
    } catch (error) {
      console.error('Error generating images:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to generate images');
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
    const date = new Date();
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    }).format(date);
  };

  const formatTime = () => {
    const date = new Date();
    return new Intl.DateTimeFormat('en-US', {
      hour: 'numeric',
      minute: 'numeric',
      hour12: true,
    }).format(date);
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

// if (!brandKitAssets) return null;
const hasLogo = brandKit?.logo?.image;
// const hasLogo = (brandKitAssets.logo_selected_asset_id && brandKitAssets.generated_assets?.some(
//   (asset: any) => asset.id === brandKitAssets.logo_selected_asset_id
// )) || !!brandKitAssets.logo?.image;

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
                Generate Images for {brandKit?.name || 'Brand Kit'}
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

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Select
                    label="Image Size"
                    options={IMAGE_SIZES} 
                    value={selectedSize}
                    onChange={(value) => setSelectedSize(value as ImageSize)}
                    helperText="Choose the dimensions for your generated image"
                  />

                  <div className="relative">
                    <Select
                      label="Number of Images"
                      options={isFreePlan ? [IMAGE_COUNTS[0]] : IMAGE_COUNTS}
                      value={String(imageCount)}
                      onChange={(value) => setImageCount(Number(value))}
                      helperText={isFreePlan ? 'Upgrade to Pro to generate multiple images at once' : 'Choose how many images to generate'}
                      disabled={isFreePlan}
                    />
                    {isFreePlan && (
                      <div className="absolute -bottom-6 right-0">
                        <Button 
                          variant="link" 
                          size="sm" 
                          className="text-xs p-0 h-auto"
                          onClick={() => navigate('/profile')}
                        >
                          Upgrade to Pro
                        </Button>
                      </div>
                    )}
                  </div>
                </div>

                {/* Image Upload Section */}
                <div className="mt-4">
                  <div className="flex items-center space-x-2">
                    <ImageIcon className="h-4 w-4 text-gray-500" />
                    <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">Reference Images</h3>
                  </div>
                  
                  <div className="mt-2">
                    <div className="flex flex-wrap gap-2 mb-2">
                      {promptImages.map((img, index) => (
                        <div key={index} className="relative group">
                          <img 
                            src={img.url} 
                            alt={`Reference ${index + 1}`}
                            className="h-24 w-24 object-cover rounded-md border border-gray-200 dark:border-gray-700"
                          />
                          <button
                            onClick={() => handleRemoveImage(index)}
                            className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                            title="Remove image"
                          >
                            <Trash2 className="h-3 w-3" />
                          </button>
                        </div>
                      ))}
                    </div>
                    
                    <label className="flex items-center justify-center px-4 py-2 border border-dashed border-gray-300 dark:border-gray-700 rounded-md cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                      <Upload className="h-4 w-4 mr-2 text-gray-500" />
                      <span className="text-sm text-gray-600 dark:text-gray-300">
                        {promptImages.length > 0 ? 'Add more images' : 'Upload reference images'}
                      </span>
                      <input
                        id="image-upload"
                        type="file"
                        multiple
                        accept="image/*"
                        className="sr-only"
                        onChange={handleImageUpload}
                        disabled={isUploadingImage}
                      />
                    </label>
                    
                    {isUploadingImage && (
                      <div className="mt-2 flex items-center text-sm text-gray-500 dark:text-gray-400">
                        <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-brand-600 mr-2"></div>
                        Uploading images...
                      </div>
                    )}
                    
                    <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                      Upload one or more images to use as reference for generation
                    </p>
                  </div>
                </div>
                <div className="space-y-3">
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="includeBrandAssets"
                      checked={includeBrandAssets}
                      onChange={(e) => {
                        setIncludeBrandAssets(e.target.checked);
                        if (!e.target.checked) {
                          setIncludeLogo(includeLogo);
                          setIncludeBrandColors(false);
                          setIncludeBrandTypography(false);
                          setIncludeBrandStyle(false);
                        }
                      }}
                      className="h-4 w-4 text-brand-600 focus:ring-brand-500 border-gray-300 rounded"
                    />
                    <label 
                      htmlFor="includeBrandAssets"
                      className="text-sm text-gray-700 dark:text-gray-300"
                    >
                      Include brand assets in generation
                    </label>
                  </div>

                  {includeBrandAssets && (
                    <div className="space-y-2 ml-6">
                      {hasLogo && (
                        <div className="flex items-center space-x-2">
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
                            Include brand logo
                          </label>
                        </div>
                      )}

                      <div className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          id="includeBrandColors"
                          checked={includeBrandColors}
                          onChange={(e) => setIncludeBrandColors(e.target.checked)}
                          className="h-4 w-4 text-brand-600 focus:ring-brand-500 border-gray-300 rounded"
                        />
                        <label 
                          htmlFor="includeBrandColors"
                          className="text-sm text-gray-700 dark:text-gray-300"
                        >
                          Include brand colors
                        </label>
                      </div>

                      <div className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          id="includeBrandTypography"
                          checked={includeBrandTypography}
                          onChange={(e) => setIncludeBrandTypography(e.target.checked)}
                          className="h-4 w-4 text-brand-600 focus:ring-brand-500 border-gray-300 rounded"
                        />
                        <label 
                          htmlFor="includeBrandTypography"
                          className="text-sm text-gray-700 dark:text-gray-300"
                        >
                          Include brand typography
                        </label>
                      </div>

                      <div className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          id="includeBrandStyle"
                          checked={includeBrandStyle}
                          onChange={(e) => setIncludeBrandStyle(e.target.checked)}
                          className="h-4 w-4 text-brand-600 focus:ring-brand-500 border-gray-300 rounded"
                        />
                        <label 
                          htmlFor="includeBrandStyle"
                          className="text-sm text-gray-700 dark:text-gray-300"
                        >
                          Include brand style
                        </label>
                      </div>
                    </div>
                  )}
                </div>

                <Button
                  onClick={handleGenerate}
                  leftIcon={<Sparkles className="h-4 w-4" />}
                  isLoading={isGenerating}
                  disabled={isGenerating || !prompt.trim()}
                  className="w-full md:w-auto"
                >
                  Generate {imageCount > 1 ? 'Images' : 'Image'}
                </Button>
              </div>
            </CardContent>
          </Card>

          {generatedImages.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="mt-12"
            >
              <h2 className="text-2xl font-bold mb-6 text-gray-900 dark:text-white">
                Generated {generatedImages.length > 1 ? 'Images' : 'Image'}
              </h2>

                <div className={`grid grid-cols-1 ${generatedImages.length > 1 ? 'md:grid-cols-2' : ''} gap-6`}>
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
                    onClick={() => selectedImage && handleDownload(selectedImage, generatedImages.indexOf(selectedImage))}
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
}; // Closing brace for ImageGeneratorPage component