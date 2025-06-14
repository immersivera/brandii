import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useParams, useNavigate } from 'react-router-dom';
import { LogoGenerationModal } from '../components/LogoGenerationModal';
import { useBrand } from '../context/BrandContext';
import { Layout } from '../components/layout/Layout';
import { Button } from '../components/ui/Button';
import { Card, CardContent, CardFooter } from '../components/ui/Card';
import { 
  ArrowLeft, 
  ArrowRight, 
  Check, 
  Copy, 
  Download, 
  Eye, 
  FileImage, 
  FileText, 
  Image as ImageIcon, 
  Loader2, 
  Palette, 
  Plus, 
  Share2, 
  Sparkles, 
  Trash2, 
  Upload, 
  X 
} from 'lucide-react';

// Add this interface for download options
interface DownloadOptions {
  brandKit: boolean;
  allImages: boolean;
  allLogos: boolean;
  selectedImages: boolean;
}

// Add this new interface for selected images
interface SelectedImages {
  [key: string]: boolean;
}
import { BrandKit, fetchBrandKitById, deleteBrandKit, updateBrandKit, saveGeneratedAssets, deleteGeneratedAsset, uploadBase64Image, updateGeneratedAsset, GeneratedAsset } from '../lib/supabase';
import { generateLogoImages } from '../lib/openai';
import { generateBrandKitZip } from '../lib/download';
import toast from 'react-hot-toast';
import { supabase } from '../lib/supabase';

export const BrandKitPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [brandKit, setBrandKit] = useState<BrandKit | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isDownloading, setIsDownloading] = useState(false);
  const [isDeletingLogo, setIsDeletingLogo] = useState<string | null>(null);
  const [isDeletingAllLogos, setIsDeletingAllLogos] = useState(false);
  const [isUploadingLogo, setIsUploadingLogo] = useState(false);
  const [isSelectingLogo, setIsSelectingLogo] = useState<string | null>(null);
  const [isGeneratingLogos, setIsGeneratingLogos] = useState(false);
  const [showLogoModal, setShowLogoModal] = useState(false);
  const [conversionProgress, setConversionProgress] = useState<{[key: string]: 'pending' | 'converting' | 'done' | 'error'}>({});
  const [showDownloadOptions, setShowDownloadOptions] = useState(false);
  const [previewLogo, setPreviewLogo] = useState<string | null>(null);
  
  // Track if any conversion is in progress
  const isConverting = Object.values(conversionProgress).some(
    status => status === 'converting'
  );
  
  // Clean up conversion progress when no longer converting
  useEffect(() => {
    if (!isConverting && Object.keys(conversionProgress).length > 0) {
      // Keep only the successful conversions for a short while
      const timer = setTimeout(() => {
        setConversionProgress(prev => {
          // Only clear completed or error states, keep pending states
          const newProgress = { ...prev };
          Object.entries(prev).forEach(([id, status]) => {
            if (status === 'done' || status === 'error') {
              delete newProgress[id];
            }
          });
          return newProgress;
        });
      }, 3000);
      
      return () => clearTimeout(timer);
    }
  }, [isConverting, conversionProgress]);
  const [downloadOptions, setDownloadOptions] = useState<DownloadOptions>({
    brandKit: true,
    allImages: false,
    allLogos: false,
    selectedImages: false
  });
  // Add state for selected images
  const [selectedImages, setSelectedImages] = useState<SelectedImages>({});
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const { updateBrandDetails } = useBrand();
  const popupRef = React.useRef<HTMLDivElement>(null);

  // Check for unconverted assets when brand kit loads
  useEffect(() => {
    if (!brandKit?.generated_assets) return;
    
    const hasUnconvertedAssets = brandKit.generated_assets.some(
      asset => !asset.image_url
    );
    
    if (hasUnconvertedAssets) {
      toast('Found assets that need conversion. Please convert them below.');
    }
  }, [brandKit]);

  // Close popup when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (popupRef.current && !popupRef.current.contains(event.target as Node)) {
        setShowDownloadOptions(false);
      }
    };

    if (showDownloadOptions) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showDownloadOptions]);

  // Toggle selection for a single image
  const toggleImageSelection = (id: string) => {
    setSelectedImages(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  // Convert a single asset to uploaded file
  const convertAsset = async (asset: GeneratedAsset) => {
    if (!brandKit?.generated_assets) return;

    try {
      // Set initial progress
      setConversionProgress(prev => ({
        ...prev,
        [asset.id]: 'converting'
      }));

      // Upload the base64 image to the appropriate bucket based on asset type
      const imageUrl = await uploadBase64Image(
        '', 
        brandKit.id,
        `${asset.id}.png`,
        asset.type as 'logo' | 'image'
      );
      
      // Create updates object with correct types
      const updates: Partial<GeneratedAsset> = {
        image_url: imageUrl,
      };
      
      
      // Update the database
      const updatedAsset = await updateGeneratedAsset(asset.id, updates);      
      // Update local state
      setBrandKit(prev => {
        if (!prev || !prev.generated_assets) return prev;
        
        return {
          ...prev,
          generated_assets: prev.generated_assets.map(a => 
            a.id === asset.id ? { ...a, ...updates } : a
          )
        };
      });
      
      setConversionProgress(prev => ({
        ...prev,
        [asset.id]: 'done'
      }));
      
      toast.success(`Converted ${asset.type} ${asset.id.substring(0, 6)}...`);
    } catch (error) {
      console.error(`Error converting ${asset.type} ${asset.id}:`, error);
      setConversionProgress(prev => ({
        ...prev,
        [asset.id]: 'error'
      }));
      toast.error(`Failed to convert ${asset.type} ${asset.id.substring(0, 6)}...`);
    }
  };

  // Get all assets that need conversion
  const getUnconvertedAssets = () => {
    if (!brandKit?.generated_assets) return [];
    
    return brandKit.generated_assets.filter(
      (asset): asset is GeneratedAsset => 
        !asset.image_url
    );
  };

  // Toggle select all images
  const toggleSelectAllImages = () => {
    const allSelected = Object.values(selectedImages).every(Boolean);
    const newSelected: SelectedImages = {};
    
    if (brandKit?.generated_assets) {
      brandKit.generated_assets
        .filter(asset => asset.type === 'image')
        .forEach(asset => {
          newSelected[asset.id] = !allSelected;
        });
    }
    
    setSelectedImages(newSelected);
  };

  // Get the count of selected images
  const selectedImageCount = Object.values(selectedImages).filter(Boolean).length;
  const totalImageCount = brandKit?.generated_assets?.filter(asset => asset.type === 'image').length || 0;

  useEffect(() => {
    const loadBrandKit = async () => {
      if (!id) return;
      
      try {
        const kit = await fetchBrandKitById(id);
        if (kit) {
          setBrandKit(kit);
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

  const handleDownload = async (options: DownloadOptions) => {
    if (!brandKit) return;

    try {
      setIsDownloading(true);
      setShowDownloadOptions(false);
      
      // Filter gallery assets based on selection if "Selected Images" is chosen
      let filteredBrandKit = { ...brandKit };
      if (options.selectedImages && !options.allImages) {
        filteredBrandKit = {
          ...brandKit,
          generated_assets: brandKit.generated_assets?.filter(
            asset => asset.type !== 'image' || selectedImages[asset.id]
          )
        };
      }
      
      // Generate the zip with selected options
      const zipBlob = await generateBrandKitZip(filteredBrandKit, {
        includeLogos: options.brandKit || options.allImages,
        includeGallery: options.allImages || options.selectedImages,
        includeAllLogos: options.allLogos
      });
      
      const url = URL.createObjectURL(zipBlob);
      const link = document.createElement('a');
      link.href = url;
      
      // Set filename based on selected options
      let filename = brandKit.name.toLowerCase().replace(/\s+/g, '-');
      if (options.allLogos) {
        filename += '-all-logos';
      } else if (options.allImages) {
        filename += '-all-assets';
      } else if (options.selectedImages) {
        filename += `-${selectedImageCount}-selected-images`;
      } else {
        filename += '-brand-kit';
      }
      
      link.download = `${filename}.zip`;
      
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      // Clean up
      setTimeout(() => URL.revokeObjectURL(url), 100);
      
      toast.success('Download started successfully!');
    } catch (error) {
      console.error('Error generating download:', error);
      toast.error('Failed to prepare download. Please try again.');
    } finally {
      setIsDownloading(false);
    }
  };

  const handleDownloadClick = () => {
    setShowDownloadOptions(true);
  };

  const DownloadOptionsPopup = React.memo(({ 
    onClose, 
    onDownload, 
    downloadOptions, 
    setDownloadOptions,
    selectedImageCount,
    isDownloading,
    selectedImages,
    toggleImageSelection,
    generatedAssets
  }: {
    onClose: () => void;
    onDownload: (options: DownloadOptions) => void;
    downloadOptions: DownloadOptions;
    setDownloadOptions: React.Dispatch<React.SetStateAction<DownloadOptions>>;
    selectedImageCount: number;
    isDownloading: boolean;
    selectedImages: Record<string, boolean>;
    toggleImageSelection: (id: string) => void;
    generatedAssets: any[];
  }) => {
    // Memoize the options toggles to prevent recreating functions on each render
    const toggleBrandKit = () => {
      setDownloadOptions(prev => ({
        ...prev,
        brandKit: !prev.brandKit,
        allImages: false,
        allLogos: false,
        selectedImages: false
      }));
    };

    const toggleAllImages = () => {
      setDownloadOptions(prev => ({
        ...prev,
        brandKit: false,
        allImages: !prev.allImages,
        allLogos: false,
        selectedImages: false
      }));
    };

    const toggleAllLogos = () => {
      setDownloadOptions(prev => ({
        ...prev,
        brandKit: false,
        allImages: false,
        allLogos: !prev.allLogos,
        selectedImages: false
      }));
    };

    const toggleSelectedImages = () => {
      setDownloadOptions(prev => ({
        ...prev,
        brandKit: false,
        allImages: false,
        allLogos: false,
        selectedImages: !prev.selectedImages
      }));
    };

    return (
      <div className="fixed inset-0 z-50 overflow-y-auto" aria-labelledby="modal-title" role="dialog" aria-modal="true">
        <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
          <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" aria-hidden="true" onClick={onClose}></div>
          
          <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>
          
          <div className="inline-block align-bottom bg-white dark:bg-gray-800 rounded-lg px-4 pt-5 pb-4 text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-2xl sm:w-full sm:p-6">
            <div className="sm:flex sm:items-start">
              <div className="mt-3 text-center sm:mt-0 sm:text-left w-full">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg leading-6 font-medium text-gray-900 dark:text-white" id="modal-title">
                    Download Options
                  </h3>
                  <button
                    type="button"
                    className="text-gray-400 hover:text-gray-500 dark:hover:text-gray-300"
                    onClick={onClose}
                  >
                    <span className="sr-only">Close</span>
                    <X className="h-6 w-6" aria-hidden="true" />
                  </button>
                </div>

                <div className="space-y-4">
                  {/* Brand Kit Option */}
                  <div 
                    className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                      downloadOptions.brandKit 
                        ? 'border-brand-500 bg-brand-50 dark:bg-brand-900/20' 
                        : 'border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50'
                    }`}
                    onClick={toggleBrandKit}
                  >
                    <div className="flex items-start">
                      <div className={`flex-shrink-0 h-5 w-5 rounded-full border flex items-center justify-center mr-3 mt-0.5 ${
                        downloadOptions.brandKit 
                          ? 'border-brand-500 bg-brand-500 text-white' 
                          : 'border-gray-300 dark:border-gray-600'
                      }`}>
                        {downloadOptions.brandKit && (
                          <svg className="h-3 w-3" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                        )}
                      </div>
                      <div>
                        <h4 className="font-medium text-gray-900 dark:text-white flex items-center">
                          <FileText className="h-4 w-4 mr-2 text-brand-500" />
                          Brand Kit (Style Guide)
                        </h4>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                          Includes logo, color palette, typography, and brand guidelines
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* All Images Option */}
                  <div 
                    className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                      downloadOptions.allImages 
                        ? 'border-brand-500 bg-brand-50 dark:bg-brand-900/20' 
                        : 'border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50'
                    }`}
                    onClick={toggleAllImages}
                  >
                    <div className="flex items-start">
                      <div className={`flex-shrink-0 h-5 w-5 rounded-full border flex items-center justify-center mr-3 mt-0.5 ${
                        downloadOptions.allImages 
                          ? 'border-brand-500 bg-brand-500 text-white' 
                          : 'border-gray-300 dark:border-gray-600'
                      }`}>
                        {downloadOptions.allImages && (
                          <svg className="h-3 w-3" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                        )}
                      </div>
                      <div>
                        <h4 className="font-medium text-gray-900 dark:text-white flex items-center">
                          <FileImage className="h-4 w-4 mr-2 text-brand-500" />
                          All Generated Images
                        </h4>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                          Download all generated gallery images
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* All Logos Option */}
                  <div 
                    className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                      downloadOptions.allLogos 
                        ? 'border-brand-500 bg-brand-50 dark:bg-brand-900/20' 
                        : 'border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50'
                    }`}
                    onClick={toggleAllLogos}
                  >
                    <div className="flex items-start">
                      <div className={`flex-shrink-0 h-5 w-5 rounded-full border flex items-center justify-center mr-3 mt-0.5 ${
                        downloadOptions.allLogos 
                          ? 'border-brand-500 bg-brand-500 text-white' 
                          : 'border-gray-300 dark:border-gray-600'
                      }`}>
                        {downloadOptions.allLogos && (
                          <svg className="h-3 w-3" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                        )}
                      </div>
                      <div>
                        <h4 className="font-medium text-gray-900 dark:text-white flex items-center">
                          <ImageIcon className="h-4 w-4 mr-2 text-brand-500" />
                          All Logos
                        </h4>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                          Download all generated logos
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Selected Images Option */}
                  <div className="border rounded-lg overflow-hidden">
                    <div 
                      className={`p-4 cursor-pointer transition-colors ${
                        downloadOptions.selectedImages 
                          ? 'bg-brand-50 dark:bg-brand-900/20' 
                          : 'hover:bg-gray-50 dark:hover:bg-gray-700/50'
                      }`}
                      onClick={toggleSelectedImages}
                    >
                      <div className="flex items-start">
                        <div className={`flex-shrink-0 h-5 w-5 rounded-full border flex items-center justify-center mr-3 mt-0.5 ${
                          downloadOptions.selectedImages 
                            ? 'border-brand-500 bg-brand-500 text-white' 
                            : 'border-gray-300 dark:border-gray-600'
                        }`}>
                          {downloadOptions.selectedImages && (
                            <svg className="h-3 w-3" viewBox="0 0 20 20" fill="currentColor">
                              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                            </svg>
                          )}
                        </div>
                        <div className="flex-1">
                          <h4 className="font-medium text-gray-900 dark:text-white">
                            Selected Images ({selectedImageCount})
                          </h4>
                          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                            Download only selected gallery images
                          </p>
                        </div>
                      </div>
                    </div>

                    {downloadOptions.selectedImages && (
                      <div className="border-t border-gray-200 dark:border-gray-700 p-4">
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-40 overflow-y-auto p-1">
                          {generatedAssets
                            .filter(asset => asset.type === 'image')
                            .map(asset => (
                              <div 
                                key={asset.id} 
                                className="relative aspect-square rounded-md overflow-hidden border-2 border-transparent hover:border-brand-500 transition-colors"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  toggleImageSelection(asset.id);
                                }}
                              >
                                <img
                                  src={asset.image_url || asset.image_data || ''}
                                  alt="Generated content"
                                  className="w-full h-full object-cover"
                                />
                                <div className={`absolute inset-0 flex items-center justify-center transition-opacity ${
                                  selectedImages[asset.id] ? 'bg-black/50' : 'bg-black/0 group-hover:bg-black/20'
                                }`}>
                                  <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                                    selectedImages[asset.id] 
                                      ? 'bg-brand-500 border-brand-500' 
                                      : 'bg-white/80 border-white/50'
                                  }`}>
                                    {selectedImages[asset.id] && (
                                      <Check className="h-3 w-3 text-white" />
                                    )}
                                  </div>
                                </div>
                              </div>
                            ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                <div className="mt-6 flex flex-col sm:flex-row-reverse sm:justify-between sm:items-center gap-3">
                  <Button 
                    onClick={() => onDownload(downloadOptions)}
                    disabled={isDownloading || (!downloadOptions.brandKit && !downloadOptions.allImages && !downloadOptions.allLogos && !downloadOptions.selectedImages)}
                    isLoading={isDownloading}
                    className="w-full sm:w-auto"
                  >
                    {isDownloading ? 'Preparing Download...' : 'Download'}
                  </Button>
                  <Button 
                    variant="outline" 
                    onClick={onClose}
                    disabled={isDownloading}
                    className="w-full sm:w-auto"
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  });

  // Add display name for better dev tools experience
  DownloadOptionsPopup.displayName = 'DownloadOptionsPopup';

  const handleDeleteBrandKit = async () => {
    if (!brandKit || !confirm('Are you sure you want to delete this brand kit?')) return;

    try {
      await deleteBrandKit(brandKit.id);
      toast.success('Brand kit deleted successfully');
      navigate('/library');
    } catch (error) {
      console.error('Error deleting brand kit:', error);
      toast.error('Failed to delete brand kit');
    }
  };

  const handleCopy = () => {
    if (!brandKit) return;
    navigator.clipboard.writeText(window.location.href);
    toast.success('Link copied to clipboard');
  };

  const handleShare = async () => {
    if (!brandKit) return;
    if (navigator.share) {
      try {
        await navigator.share({
          title: `${brandKit.name} Brand Kit`,
          text: brandKit.description,
          url: window.location.href,
        });
      } catch (error) {
        if ((error as Error).name !== 'AbortError') {
          console.error('Error sharing:', error);
          toast.error('Failed to share');
        }
      }
    } else {
      handleCopy();
    }
  };

  const handleRemix = () => {
    if (!brandKit) return;
    
    updateBrandDetails({
      name: `${brandKit.name} Remix`,
      description: brandKit.description,
      industry: brandKit.type,
      colors: brandKit.colors,
      typography: brandKit.typography,
      logoStyle: brandKit.logo.type,
      logoChoice: 'ai',
      step: 1 // Start at the design step
    });
    
    // Navigate to the create page with the brand kit data
    navigate('/create/new');
  };

  interface LogoGenerationOptions {
    style: string;
    personality: string;
    complexity: string;
  }

  const handleGenerateMoreLogos = () => {
    setShowLogoModal(true);
  };

  interface LogoGenerationOptions {
    style: string;
    personality: string;
    complexity: string;
  }

  const handleGenerateWithOptions = async (options: LogoGenerationOptions) => {
    if (!brandKit) return;

    try {
      setIsGeneratingLogos(true);
      setShowLogoModal(false);
      
      const logoOptions: any = {
        brandName: brandKit.name,
        style: options.style,
        colors: {
          primary: brandKit.colors.primary,
          secondary: brandKit.colors.secondary,
          accent: brandKit.colors.accent
        },
        description: brandKit.description,
        industry: brandKit.type,
        personality: options.personality,
        complexity: options.complexity,
      };

      const logoUrls = await generateLogoImages(logoOptions);

      // Save the generated logos
      await saveGeneratedAssets(brandKit.id, logoUrls, 'logo');
      
      // Update the brand kit with new assets
      const updatedBrandKit = await fetchBrandKitById(brandKit.id);
      if (updatedBrandKit) {
        setBrandKit(updatedBrandKit);
      }

      toast.success('New logos generated successfully!');
    } catch (error) {
      console.error('Error generating logos:', error);
      toast.error('Failed to generate logos');
    } finally {
      setIsGeneratingLogos(false);
    }
  };

  const handleSelectLogo = async (assetId: string) => {
    if (!brandKit) return;

    try {
      setIsSelectingLogo(assetId);
      const logoAssetImage = logoAssets.find(asset => asset.id === assetId)?.image_url || undefined

      //visually update brandkit logo to the brandkit
      // setBrandKit(prev => ({
      //   ...prev!,
      //   logo: {
      //     ...prev!.logo,
      //     image: logoAssetImage
      //   }
      // }));
      const updatedBrandKit = await updateBrandKit(brandKit.id, {
        logo_selected_asset_id: assetId,
        logo: {
          ...brandKit.logo,
          image: logoAssetImage
        }
      });
      setBrandKit(updatedBrandKit);
      toast.success('Logo updated successfully');
    } catch (error) {
      console.error('Error updating logo:', error);
      toast.error('Failed to update logo');
    } finally {
      setIsSelectingLogo(null);
    }
  };

  const handleDeleteLogoAsset = async (assetId: string) => {
    if (!brandKit || !confirm('Are you sure you want to delete this logo concept?')) return;

    try {
      setIsDeletingLogo(assetId);
      
      // First delete the asset from the database
      await deleteGeneratedAsset(assetId);
      
      // Then update the local state to remove the asset
      const updatedAssets = brandKit.generated_assets?.filter(asset => asset.id !== assetId) || [];
      
      // If the deleted logo was selected, clear the selection
      const logoSelectedAssetId = brandKit.logo_selected_asset_id === assetId 
        ? undefined 
        : brandKit.logo_selected_asset_id;
      
      // Update the brand kit with the new assets and selection
      const updatedBrandKit = {
        ...brandKit,
        generated_assets: updatedAssets,
        logo_selected_asset_id: updatedAssets.length === 0 ? undefined : logoSelectedAssetId
      };
      
      setBrandKit(updatedBrandKit);
      toast.success('Logo concept deleted');
    } catch (error) {
      console.error('Error deleting logo concept:', error);
      toast.error('Failed to delete logo concept');
    } finally {
      setIsDeletingLogo(null);
    }
  };

  const handleDeleteAllLogoConcepts = async () => {
    if (!brandKit || !confirm('Are you sure you want to delete all logo concepts? This action cannot be undone.')) return;

    try {
      setIsDeletingAllLogos(true);
      
      // Delete all logo assets from the database
      if (brandKit.generated_assets?.length) {
        const deletePromises = brandKit.generated_assets
          .filter(asset => asset.type === 'logo')
          .map(asset => deleteGeneratedAsset(asset.id));
        
        await Promise.all(deletePromises);
      }
      
      // Update the local state to remove all logo assets and clear the selected logo
      const updatedBrandKit = {
        ...brandKit,
        generated_assets: brandKit.generated_assets?.filter(asset => asset.type !== 'logo') || [],
        logo_selected_asset_id: undefined
      };
      
      setBrandKit(updatedBrandKit);
      toast.success('All logo concepts deleted');
    } catch (error) {
      console.error('Error deleting all logo concepts:', error);
      toast.error('Failed to delete logo concepts');
    } finally {
      setIsDeletingAllLogos(false);
    }
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !brandKit) return;

    try {
      setIsUploadingLogo(true);
      
      // Upload the file to storage
      const fileExt = file.name.split('.').pop();
      const fileName = `${brandKit.id}-logo-${Date.now()}.${fileExt}`;
      const filePath = `${brandKit.id}/uploads/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('brand-logos')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      // Get the public URL
      const { data: { publicUrl } } = supabase.storage
        .from('brand-logos')
        .getPublicUrl(filePath);

      // Update the brand kit with the new logo
      const updatedBrandKit = await updateBrandKit(brandKit.id, {
        logo: {
          ...brandKit.logo,
          image: publicUrl,
          type: 'user-uploaded',
          text: brandKit.name
        }
      });

      setBrandKit(updatedBrandKit);
      toast.success('Logo uploaded successfully');
    } catch (error) {
      console.error('Error uploading logo:', error);
      toast.error('Failed to upload logo');
    } finally {
      setIsUploadingLogo(false);
      // Reset the file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleRemoveLogo = async () => {
    if (!brandKit?.logo.image || !confirm('Are you sure you want to remove the logo?')) return;

    try {
      // Extract the file path from the URL
      // Format: /storage/v1/object/public/brand-logos/{brandkit-id}/uploads/{filename}
      const url = new URL(brandKit.logo.image);
      const pathParts = url.pathname.split('/');
      const filePath = pathParts.slice(pathParts.indexOf('brand-logos') + 1).join('/');


      // Delete the file from storage
      const { error: deleteError } = await supabase.storage
        .from('brand-logos')
        .remove([filePath]);

      if (deleteError) throw deleteError;

      //set existing image from concept selected or undefined
      const existingImage = brandKit.logo_selected_asset_id ? brandKit.generated_assets?.find(asset => asset.id === brandKit.logo_selected_asset_id)?.image_data : undefined;
      // Update the brand kit to remove the logo
      const updatedBrandKit = await updateBrandKit(brandKit.id, {
        logo: {
          ...brandKit.logo,
          image: existingImage
        }
      });



      setBrandKit(updatedBrandKit);
      toast.success('Logo removed successfully');
    } catch (error) {
      console.error('Error removing logo:', error);
      toast.error('Failed to remove logo');
    }
  };

  const getSelectedLogo = () => {
    if (!brandKit) return null;

    // Check for uploaded logo first
    if (brandKit.logo.image && brandKit.logo.image.length > 0) {
      return brandKit.logo.image;
    }

    // Then check for AI-generated logo
    if (brandKit.generated_assets?.length) {
      if (brandKit.logo_selected_asset_id) {
        const selectedAsset = brandKit.generated_assets.find(
          asset => asset.id === brandKit.logo_selected_asset_id && asset.type === 'logo'
        );
        if (selectedAsset?.image_data) {
          return selectedAsset.image_data;
        }
      }

      const firstLogoAsset = brandKit.generated_assets.find(
        asset => asset.type === 'logo'
      );
      if (firstLogoAsset?.image_data) {
        return firstLogoAsset.image_data;
      }
    }

    return null;
  };

  const renderTextLogo = () => (
    <div 
      className="w-32 h-32 rounded-xl flex items-center justify-center"
      style={{ 
        backgroundColor: brandKit!.colors.background,
        fontFamily: brandKit!.typography.headingFont
      }}
    >
      <span 
        className="text-2xl font-bold text-center px-4"
        style={{ color: brandKit!.colors.primary }}
      >
        {brandKit!.name}
      </span>
    </div>
  );

  const renderUnconvertedAssets = () => {
    const unconvertedAssets = getUnconvertedAssets();
    
    if (unconvertedAssets.length === 0) return null;

    return (
      <div className="mt-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="font-medium text-gray-500 dark:text-gray-400 mb-1">
              Assets Needing Conversion
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              These assets need to be converted for better performance
            </p>
          </div>
          <span className="text-sm text-gray-500">
            {unconvertedAssets.length} asset{unconvertedAssets.length > 1 ? 's' : ''} found
          </span>
        </div>
        
        <div className="space-y-2 max-h-60 overflow-y-auto">
          {unconvertedAssets.map(asset => (
            <div key={asset.id} className="flex items-center justify-between p-3 bg-white dark:bg-gray-700 rounded-md">
              <div className="flex items-center">
                <span className="w-6 text-lg">
                  {asset.type === 'logo' ? '🎨' : '🖼️'}
                </span>
                <div className="ml-3">
                  <p className="text-sm font-medium text-gray-900 dark:text-white">
                    {asset.type === 'logo' ? 'Logo' : 'Image'} {asset.id.substring(0, 6)}...
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-300">
                    {asset.type === 'logo' ? 'Logo' : 'Image'}
                  </p>
                </div>
              </div>
              <Button
                onClick={() => convertAsset(asset)}
                size="sm"
                variant="outline"
                disabled={conversionProgress[asset.id] === 'converting'}
                className="ml-4"
              >
                {conversionProgress[asset.id] === 'converting' ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : conversionProgress[asset.id] === 'done' ? (
                  <Check className="mr-2 h-4 w-4" />
                ) : conversionProgress[asset.id] === 'error' ? (
                  <X className="mr-2 h-4 w-4" />
                ) : (
                  <Upload className="mr-2 h-4 w-4" />
                )}
                {conversionProgress[asset.id] === 'converting' ? 'Converting...' :
                 conversionProgress[asset.id] === 'done' ? 'Converted' :
                 conversionProgress[asset.id] === 'error' ? 'Retry' : 'Convert'}
              </Button>
            </div>
          ))}
        </div>
      </div>
    );
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

  const logoAssets = brandKit.generated_assets?.filter(asset => asset.type === 'logo') || [];
  const imageAssets = brandKit.generated_assets?.filter(asset => asset.type === 'image') || [];
  const selectedLogo = getSelectedLogo();

  return (
    <Layout>
      <div className="min-h-screen bg-white dark:bg-gray-900 py-12">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-4xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8 gap-4">
                <div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => navigate('/library')}
                    leftIcon={<ArrowLeft className="h-4 w-4" />}
                    className="mb-4"
                  >
                    Back to Library
                  </Button>
                  <h1 
                    className="text-3xl font-bold text-gray-900 dark:text-white mb-2"
                    style={{ fontFamily: brandKit.typography.headingFont }}
                  >
                    {brandKit.name}
                  </h1>
                  <p 
                    className="text-gray-600 dark:text-gray-400"
                    style={{ fontFamily: brandKit.typography.bodyFont }}
                  >
                    Created on {new Date(brandKit.created_at).toLocaleDateString()}
                  </p>
                </div>
                
                <div className="flex flex-wrap gap-3">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleDeleteBrandKit}
                    leftIcon={<Trash2 className="h-4 w-4" />}
                    className="text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20"
                  >
                    Delete
                  </Button>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => navigate(`/kit/${id}/gallery`)}
                    leftIcon={<ImageIcon className="h-4 w-4" />}
                  >
                    View Gallery
                  </Button>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => navigate(`/kit/${id}/create`)}
                    leftIcon={<Plus className="h-4 w-4" />}
                  >
                    Create Images
                  </Button>
                  
                  <Button
                    size="sm"
                    onClick={handleDownloadClick}
                    leftIcon={<Download className="h-4 w-4" />}
                    isLoading={isDownloading}
                    disabled={isDownloading}
                  >
                    Download
                  </Button>
                  
                  <AnimatePresence>
                    {showDownloadOptions && <DownloadOptionsPopup 
                      onClose={() => setShowDownloadOptions(false)}
                      onDownload={handleDownload}
                      downloadOptions={downloadOptions}
                      setDownloadOptions={setDownloadOptions}
                      selectedImageCount={selectedImageCount}
                      isDownloading={isDownloading}
                      selectedImages={selectedImages}
                      toggleImageSelection={toggleImageSelection}
                      generatedAssets={brandKit.generated_assets || []}
                    />}
                  </AnimatePresence>
                </div>
              </div>
              
              {renderUnconvertedAssets()}
              <Card className="mt-4">
                <CardContent className="p-6">
                  <div className="flex flex-col md:flex-row items-start gap-6">
                    <div className="flex-1">
                      <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
                        Description
                      </h3>
                      <p 
                        className="text-gray-900 dark:text-white capitalize"
                      >
                        {brandKit.description}
                      </p>
                      
                      <div className="grid grid-cols-2 gap-4 my-6">
                        <div>
                          <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
                            Type
                          </h3>
                          <p 
                            className="text-gray-900 dark:text-white capitalize"
                          >
                            {brandKit.type || 'Not specified'}
                          </p>
                        </div>
                        {brandKit.logo.type && (
                          <div>
                            <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
                              Logo Style
                            </h3>
                            <p 
                            className="text-gray-900 dark:text-white capitalize"
                          >
                            {brandKit.logo.type}
                          </p>
                        </div>
                      )}
                      </div>
                    </div>
                    
                    <div className="w-full md:w-auto flex justify-center">
                      {selectedLogo ? (
                        <img 
                          src={selectedLogo} 
                          alt={brandKit.name}
                          className="w-32 h-32 object-contain rounded-xl"
                          style={{ 
                            backgroundColor: brandKit.colors.background
                          }}
                        />
                      ) : renderTextLogo()}
                    </div>
                  </div>
                </CardContent>
                
                <CardFooter className="border-t border-gray-200 dark:border-gray-700 p-4">
                  <div className="flex justify-end space-x-3">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleCopy}
                      leftIcon={<Copy className="h-4 w-4" />}
                    >
                      Copy Link
                    </Button>
                    
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleShare}
                      leftIcon={<Share2 className="h-4 w-4" />}
                    >
                      Share
                    </Button>
                    
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleRemix}
                      leftIcon={<Palette className="h-4 w-4" />}
                    >
                      Remix
                    </Button>
                  </div>
                </CardFooter>
              </Card>

              <Card className="mt-4">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-6">
                    <h3 
                      className="text-xl font-semibold text-gray-900 dark:text-white"
                      style={{ fontFamily: brandKit.typography.headingFont }}
                    >
                      Logo Concepts
                    </h3>
                    <div className="flex items-center space-x-2">
                      {logoAssets.length > 0 && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={handleDeleteAllLogoConcepts}
                          leftIcon={<Trash2 className="h-4 w-4" />}
                          isLoading={isDeletingAllLogos}
                          disabled={isDeletingAllLogos}
                          className="text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20"
                        >
                          Delete All
                        </Button>
                      )}
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleGenerateMoreLogos}
                        leftIcon={<Sparkles className="h-4 w-4" />}
                        isLoading={isGeneratingLogos}
                        disabled={isGeneratingLogos}
                      >
                        Generate More
                      </Button>
                    </div>
                  </div>
                  
                  <div className="space-y-6">
                    {logoAssets.length > 0 ? (
                      <>
                        <div className="flex flex-col md:flex-row gap-6">
                          <div className="flex flex-col space-y-2 flex-1">
                            {logoAssets.map((asset) => (
                              <div
                                key={asset.id}
                                className={`flex items-center justify-between p-3 ${
                                  brandKit.logo_selected_asset_id === asset.id
                                    ? 'bg-brand-50 dark:bg-brand-900/20 border border-brand-200 dark:border-brand-800'
                                    : 'bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700'
                                } rounded-lg ${previewLogo === asset.image_url ? 'border-2 border-brand-900 dark:border-brand-500' : ''}`}
                              >
                                <div className="flex items-center space-x-3">
                                  <div 
                                    className="w-12 h-12 relative rounded overflow-hidden border border-gray-200 dark:border-gray-700"
                                    style={{ backgroundColor: brandKit.colors.background }}
                                  >
                                    <img
                                      src={asset.image_url}
                                      alt="Logo concept"
                                      className="w-full h-full object-contain"
                                    />
                                  </div>
                                  <div>
                                    <p className="text-sm font-medium">Logo {asset.id.substring(0, 6)}</p>
                                    <a 
                                      href={asset.image_url} 
                                      target="_blank" 
                                      rel="noopener noreferrer"
                                      className="text-xs text-brand-600 hover:text-brand-700 dark:text-brand-400 dark:hover:text-brand-300"
                                    >
                                      View full size
                                    </a>
                                  </div>
                                </div>
                                
                                <div className="flex items-center space-x-2">
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => setPreviewLogo(asset.image_url || '')}
                                    className="text-xs"
                                  >
                                    <Eye className="h-3 w-3 mr-1" />
                                    Preview
                                  </Button>
                                  <Button
                                    variant={brandKit.logo_selected_asset_id === asset.id ? "primary" : "outline"}
                                    size="sm"
                                    onClick={() => handleSelectLogo(asset.id)}
                                    disabled={isSelectingLogo === asset.id}
                                    className="text-xs"
                                  >
                                    {isSelectingLogo === asset.id ? (
                                      <Loader2 className="h-3 w-3 animate-spin mr-1" />
                                    ) : brandKit.logo_selected_asset_id === asset.id ? (
                                      "Selected"
                                    ) : (
                                      "Select"
                                    )}
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleDeleteLogoAsset(asset.id)}
                                    disabled={isDeletingLogo === asset.id}
                                    className="text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 p-1"
                                  >
                                    {isDeletingLogo === asset.id ? (
                                      <Loader2 className="h-3 w-3 animate-spin" />
                                    ) : (
                                      <Trash2 className="h-3 w-3" />
                                    )}
                                  </Button>
                                </div>
                              </div>
                            ))}
                          </div>
                          
                          {previewLogo && (
                            <div className="w-full md:w-1/2 flex flex-col items-center">
                              <div 
                                className="w-full aspect-square flex items-center justify-center rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden"
                                style={{ backgroundColor: brandKit.colors.background }}
                              >
                                <img
                                  src={previewLogo}
                                  alt="Logo preview"
                                  className="max-w-full max-h-full object-contain p-4"
                                />
                              </div>
                              <p className="text-sm text-gray-500 mt-2">Logo Preview</p>
                            </div>
                          )}
                        </div>
                        <p 
                          className="text-sm text-gray-500 dark:text-gray-400"
                          style={{ fontFamily: brandKit.typography.bodyFont }}
                        >
                          Select a logo to use as your primary brand logo.
                        </p>
                      </>
                    ) : (
                      <div className="text-center py-8">
                        <div className="mx-auto w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mb-4">
                          <ImageIcon className="h-8 w-8 text-gray-400" />
                        </div>
                        <h4 
                          className="text-lg font-medium text-gray-900 dark:text-white mb-1"
                          style={{ fontFamily: brandKit.typography.headingFont }}
                        >
                          No Logo Concepts
                        </h4>
                        <p 
                          className="text-gray-500 dark:text-gray-400 max-w-md mx-auto"
                          style={{ fontFamily: brandKit.typography.bodyFont }}
                        >
                          You haven't generated any logo concepts yet. Click the button below to get started.
                        </p>
                        <div className="mt-4">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={handleGenerateMoreLogos}
                            leftIcon={<Sparkles className="h-4 w-4" />}
                            isLoading={isGeneratingLogos}
                            disabled={isGeneratingLogos}
                          >
                            Generate Logos
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
              
              <Card className="mt-4">
                <CardContent className="p-6">
                  <h3 
                    className="text-xl font-semibold text-gray-900 dark:text-white mb-6"
                    style={{ fontFamily: brandKit.typography.headingFont }}
                  >
                    Brand Logo
                  </h3>
                  
                  <div className="flex flex-col md:flex-row items-start gap-8">
                    <div className="w-full md:w-1/3">
                      <div 
                        className="w-full aspect-square flex items-center justify-center rounded-lg border-2 border-dashed border-gray-300 dark:border-gray-700 overflow-hidden"
                        style={{ backgroundColor: brandKit.colors.background }}
                      >
                        {brandKit.logo.image ? (
                          <img 
                            src={brandKit.logo.image} 
                            alt="Brand Logo" 
                            className="w-full h-full object-contain p-4"
                          />
                        ) : (
                          <div className="text-center p-4">
                            <ImageIcon className="h-12 w-12 text-gray-400 mx-auto mb-2" />
                            <p className="text-sm text-gray-500 dark:text-gray-400">
                              {brandKit.logo.text || 'No logo uploaded'}
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex-1 space-y-4">
                      <div>
                        <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Upload Your Own Logo
                        </h4>
                        <div className="flex items-center space-x-2">
                          <input
                            type="file"
                            ref={fileInputRef}
                            onChange={handleLogoUpload}
                            accept="image/*"
                            className="hidden"
                            id="logo-upload"
                            disabled={isUploadingLogo}
                          />
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => fileInputRef.current?.click()}
                            disabled={isUploadingLogo}
                            leftIcon={isUploadingLogo ? undefined : <Upload className="h-4 w-4" />}
                            isLoading={isUploadingLogo}
                          >
                            {isUploadingLogo ? 'Uploading...' : 'Choose File'}
                          </Button>
                          <span className="text-xs text-gray-500 dark:text-gray-400">
                            PNG, JPG, or SVG (max 5MB)
                          </span>
                        </div>
                      </div>
                      
                      {brandKit.logo.image && (
                        <div>
                          {brandKit.logo.image.includes('uploads') && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={handleRemoveLogo}
                              className="text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20"
                              leftIcon={<Trash2 className="h-4 w-4" />}
                            >
                              Remove Logo
                            </Button>
                          )}
                        </div>
                      )}
                      
                      <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          Your logo will be used across your brand assets. For best results, use a high-resolution image with a transparent background.
                        </p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 my-8">
                <Card>
                  <CardContent className="p-6">
                    <h3 
                      className="text-xl font-semibold mb-4 text-gray-900 dark:text-white"
                      style={{ fontFamily: brandKit.typography.headingFont }}
                    >
                      Color Palette
                    </h3>
                    
                    <div className="space-y-4">
                      {Object.entries(brandKit.colors).map(([key, color]) => (
                        <div key={key} className="flex items-center">
                          <div 
                            className="w-12 h-12 rounded-md mr-4"
                            style={{ backgroundColor: color }}
                          ></div>
                          <div>
                            <h4 
                              className="text-sm font-medium text-gray-900 dark:text-white capitalize"
                              style={{ fontFamily: brandKit.typography.headingFont }}
                            >
                              {key}
                            </h4>
                            <p 
                              className="text-sm text-gray-500 dark:text-gray-400"
                              style={{ fontFamily: brandKit.typography.bodyFont }}
                            >
                              {color}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardContent className="p-6">
                    <h3 
                      className="text-xl font-semibold mb-4 text-gray-900 dark:text-white"
                      style={{ fontFamily: brandKit.typography.headingFont }}
                    >
                      Typography
                    </h3>
                    
                    <div className="space-y-6">
                      <div>
                        <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">
                          Heading Font
                        </h4>
                        <p 
                          className="text-2xl font-semibold text-gray-900 dark:text-white"
                          style={{ fontFamily: brandKit.typography.headingFont }}
                        >
                          {brandKit.typography.headingFont}
                        </p>
                        <div 
                          className="mt-1 text-sm text-gray-500 dark:text-gray-400"
                          style={{ fontFamily: brandKit.typography.headingFont }}
                        >
                          ABCDEFGHIJKLMNOPQRSTUVWXYZ<br />
                          abcdefghijklmnopqrstuvwxyz<br />
                          1234567890
                        </div>
                      </div>
                      
                      <div>
                        <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">
                          Body Font
                        </h4>
                        <p 
                          className="text-base text-gray-900 dark:text-white"
                          style={{ fontFamily: brandKit.typography.bodyFont }}
                        >
                          {brandKit.typography.bodyFont}
                        </p>
                        <div 
                          className="mt-1 text-sm text-gray-500 dark:text-gray-400"
                          style={{ fontFamily: brandKit.typography.bodyFont }}
                        >
                          ABCDEFGHIJKLMNOPQRSTUVWXYZ<br />
                          abcdefghijklmnopqrstuvwxyz<br />
                          1234567890
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
              
             

              {imageAssets.length > 0 && (
                <div className="mt-8">
                  <div className="flex items-center justify-between mb-6">
                    <h3 
                      className="text-xl font-semibold text-gray-900 dark:text-white"
                      style={{ fontFamily: brandKit.typography.headingFont }}
                    >
                      Recent Images
                    </h3>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => navigate(`/kit/${id}/gallery`)}
                      rightIcon={<ArrowRight className="h-4 w-4" />}
                    >
                      View All
                    </Button>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {imageAssets.slice(0, 3).map((asset) => (
                      <Card key={asset.id} hover>
                        <CardContent className="p-4">
                          <img
                            src={asset.image_url}
                            alt="Generated image"
                            className="w-full h-32 object-cover rounded-lg"
                          />
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              )}
            </motion.div>
          </div>
        </div>
      </div>
      <LogoGenerationModal
        isOpen={showLogoModal}
        onClose={() => setShowLogoModal(false)}
        onSubmit={handleGenerateWithOptions}
        defaultValues={{
          style: brandKit?.logo?.type || 'any',
        }}
        isLoading={isGeneratingLogos}
      />
      <LogoGenerationModal
        isOpen={showLogoModal}
        onClose={() => setShowLogoModal(false)}
        onSubmit={handleGenerateWithOptions}
        defaultValues={{
          style: brandKit?.logo?.type || 'any',
        }}
        isLoading={isGeneratingLogos}
      />
    </Layout>
  );
};