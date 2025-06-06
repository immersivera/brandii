import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useParams, useNavigate } from 'react-router-dom';
import { useBrand } from '../context/BrandContext';
import { Layout } from '../components/layout/Layout';
import { Button } from '../components/ui/Button';
import { Card, CardContent, CardFooter } from '../components/ui/Card';
import { ArrowLeft, ArrowRight, Download, Copy, Share2, Trash2, Image as ImageIcon, Plus, Sparkles, Upload, Palette, X, FileText, FileImage } from 'lucide-react';

// Add this interface for download options
interface DownloadOptions {
  brandKit: boolean;
  allImages: boolean;
  selectedImages: boolean;
}

// Add this new interface for selected images
interface SelectedImages {
  [key: string]: boolean;
}
import { BrandKit, fetchBrandKitById, deleteBrandKit, updateBrandKit, saveGeneratedAssets, deleteGeneratedAsset } from '../lib/supabase';
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
  const [isGeneratingLogos, setIsGeneratingLogos] = useState(false);
  const [isDeletingLogo, setIsDeletingLogo] = useState<string | null>(null);
  const [isDeletingAllLogos, setIsDeletingAllLogos] = useState(false);
  const [isUploadingLogo, setIsUploadingLogo] = useState(false);
  const [isSelectingLogo, setIsSelectingLogo] = useState<string | null>(null);
  const [showDownloadOptions, setShowDownloadOptions] = useState(false);
  const [downloadOptions, setDownloadOptions] = useState<DownloadOptions>({
    brandKit: true,
    allImages: false,
    selectedImages: false
  });
  // Add state for selected images
  const [selectedImages, setSelectedImages] = useState<SelectedImages>({});
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const { updateBrandDetails } = useBrand();
  const popupRef = React.useRef<HTMLDivElement>(null);

  // Initialize selected images when brand kit loads
  useEffect(() => {
    if (brandKit?.generated_assets) {
      const initialSelected: SelectedImages = {};
      brandKit.generated_assets
        .filter(asset => asset.type === 'image')
        .forEach(asset => {
          initialSelected[asset.id] = true;
        });
      setSelectedImages(initialSelected);
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
        includeGallery: options.allImages || options.selectedImages
      });
      
      const url = URL.createObjectURL(zipBlob);
      const link = document.createElement('a');
      link.href = url;
      
      // Set filename based on selected options
      let filename = brandKit.name.toLowerCase().replace(/\s+/g, '-');
      if (options.brandKit && !options.allImages && !options.selectedImages) {
        filename += '-brand-kit';
      } else if (options.allImages) {
        filename += '-all-assets';
      } else if (options.selectedImages) {
        filename += `-${selectedImageCount}-selected-images`;
      } else {
        filename += '-download';
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

  const DownloadOptionsPopup = () => (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <motion.div 
        ref={popupRef}
        className="bg-white dark:bg-gray-800 rounded-xl p-6 w-full max-w-md shadow-xl max-h-[90vh] overflow-y-auto"
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        transition={{ duration: 0.2 }}
      >
        <div className="flex justify-between items-center mb-4 sticky top-0 bg-white dark:bg-gray-800 pb-4 z-10">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Download Options</h3>
          <button 
            onClick={() => setShowDownloadOptions(false)}
            className="text-gray-400 hover:text-gray-500 dark:hover:text-gray-300"
          >
            <X className="h-5 w-5" />
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
            onClick={() => setDownloadOptions({
              brandKit: true,
              allImages: false,
              selectedImages: false
            })}
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
            onClick={() => setDownloadOptions({
              brandKit: false,
              allImages: true,
              selectedImages: false
            })}
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

          {/* Selected Images Option */}
          <div className="border rounded-lg overflow-hidden">
            <div 
              className={`p-4 cursor-pointer transition-colors ${
                downloadOptions.selectedImages 
                  ? 'border-b border-brand-500 bg-brand-50 dark:bg-brand-900/20' 
                  : 'border-b border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50'
              }`}
              onClick={() => setDownloadOptions({
                brandKit: false,
                allImages: false,
                selectedImages: true
              })}
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
                  <div className="flex justify-between items-start">
                    <h4 className="font-medium text-gray-900 dark:text-white flex items-center">
                      <FileImage className="h-4 w-4 mr-2 text-brand-500" />
                      Selected Images
                    </h4>
                    <span className="text-sm text-gray-500 dark:text-gray-400">
                      {selectedImageCount} of {totalImageCount} selected
                    </span>
                  </div>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                    Choose specific images to download
                  </p>
                </div>
              </div>
            </div>

            {/* Image Selection Grid */}
            {downloadOptions.selectedImages && brandKit?.generated_assets && (
              <div className="p-4 bg-gray-50 dark:bg-gray-700/30">
                <div className="mb-3 flex justify-between items-center">
                  <button
                    type="button"
                    onClick={toggleSelectAllImages}
                    className="text-sm text-brand-600 dark:text-brand-400 hover:underline"
                  >
                    {selectedImageCount === totalImageCount ? 'Deselect All' : 'Select All'}
                  </button>
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    {selectedImageCount} selected
                  </span>
                </div>
                <div className="grid grid-cols-3 gap-2 max-h-60 overflow-y-auto p-1">
                  {brandKit.generated_assets
                    .filter(asset => asset.type === 'image')
                    .map(asset => (
                      <div 
                        key={asset.id}
                        className={`relative aspect-square rounded-md overflow-hidden border-2 ${
                          selectedImages[asset.id] 
                            ? 'border-brand-500 ring-2 ring-brand-500' 
                            : 'border-transparent'
                        }`}
                        onClick={() => toggleImageSelection(asset.id)}
                      >
                        <img 
                          src={asset.image_data} 
                          alt={`Generated image ${asset.id}`}
                          className="w-full h-full object-cover"
                        />
                        <div className={`absolute inset-0 flex items-center justify-center bg-black bg-opacity-50 transition-opacity ${
                          selectedImages[asset.id] ? 'opacity-100' : 'opacity-0 hover:opacity-100'
                        }`}>
                          <div className={`w-6 h-6 rounded-full flex items-center justify-center ${
                            selectedImages[asset.id] 
                              ? 'bg-brand-500 text-white' 
                              : 'bg-white/80 text-transparent'
                          }`}>
                            <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                            </svg>
                          </div>
                        </div>
                      </div>
                    ))}
                </div>
                {totalImageCount === 0 && (
                  <div className="text-center py-4 text-sm text-gray-500 dark:text-gray-400">
                    No gallery images available
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        <div className="mt-6 flex justify-end space-x-3">
          <Button 
            variant="outline" 
            onClick={() => setShowDownloadOptions(false)}
            disabled={isDownloading}
          >
            Cancel
          </Button>
          <Button 
            onClick={() => handleDownload(downloadOptions)}
            disabled={isDownloading || (!downloadOptions.brandKit && !downloadOptions.allImages && !downloadOptions.selectedImages)}
            isLoading={isDownloading}
          >
            {isDownloading ? 'Preparing Download...' : 'Download'}
          </Button>
        </div>
      </motion.div>
    </div>
  );

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
      logoChoice: brandKit.logo.image ? 'upload' : 'ai',
      step: 1 // Start at the design step
    });
    
    // Navigate to the create page with the brand kit data
    navigate('/create/new');
  };

  const handleGenerateMoreLogos = async () => {
    if (!brandKit) return;

    try {
      setIsGeneratingLogos(true);
      const logoUrls = await generateLogoImages({
        brandName: brandKit.name,
        style: brandKit.logo.type,
        colors: {
          primary: brandKit.colors.primary,
          secondary: brandKit.colors.secondary,
          accent: brandKit.colors.accent
        },
        description: brandKit.description,
        industry: brandKit.type,
        personality: 'modern' // Default to modern style
      });

      // Save the generated logos
      const newAssets = await saveGeneratedAssets(brandKit.id, logoUrls, 'logo');
      
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
      const updatedBrandKit = await updateBrandKit(brandKit.id, {
        logo_selected_asset_id: assetId
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
      const filePath = `${fileName}`;

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
          image: publicUrl
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
      const url = new URL(brandKit.logo.image);
      const pathParts = url.pathname.split('/');
      const filePath = pathParts[pathParts.length - 1];

      // Delete the file from storage
      const { error: deleteError } = await supabase.storage
        .from('brand-logos')
        .remove([filePath]);

      if (deleteError) throw deleteError;

      // Update the brand kit to remove the logo
      const updatedBrandKit = await updateBrandKit(brandKit.id, {
        logo: {
          ...brandKit.logo,
          image: undefined
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
                    {showDownloadOptions && <DownloadOptionsPopup />}
                  </AnimatePresence>
                </div>
              </div>
              
              <Card className="mb-8">
                <CardContent className="p-6">
                  <div className="flex flex-col md:flex-row items-start gap-6">
                    <div className="flex-1">
                      <p 
                        className="text-gray-600 dark:text-gray-400 mb-4"
                        style={{ fontFamily: brandKit.typography.bodyFont }}
                      >
                        {brandKit.description}
                      </p>
                      
                      <div className="grid grid-cols-2 gap-4 mb-6">
                        <div>
                          <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
                            Type
                          </h3>
                          <p 
                            className="text-gray-900 dark:text-white capitalize"
                            style={{ fontFamily: brandKit.typography.bodyFont }}
                          >
                            {brandKit.type || 'Not specified'}
                          </p>
                        </div>
                        <div>
                          <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
                            Logo Style
                          </h3>
                          <p 
                            className="text-gray-900 dark:text-white capitalize"
                            style={{ fontFamily: brandKit.typography.bodyFont }}
                          >
                            {brandKit.logo.type}
                          </p>
                        </div>
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
              
              <Card className="mb-8">
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
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={handleRemoveLogo}
                            className="text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20"
                            leftIcon={<Trash2 className="h-4 w-4" />}
                          >
                            Remove Logo
                          </Button>
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
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
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
              
              <Card>
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
                        <div className="grid grid-cols-2 gap-4">
                          {logoAssets.map((asset) => (
                            <div
                              key={asset.id}
                              className={`relative group border-2 rounded-lg overflow-hidden cursor-pointer transition-all ${
                                brandKit.logo_selected_asset_id === asset.id
                                  ? 'border-brand-600 shadow-lg'
                                  : 'border-gray-200 dark:border-gray-700'
                              }`}
                            >
                              <div className="relative">
                                <img
                                  src={asset.image_data}
                                  alt="Logo concept"
                                  className={`w-full h-auto ${isSelectingLogo === asset.id ? 'opacity-50' : ''}`}
                                  style={{ 
                                    backgroundColor: brandKit.colors.background
                                  }}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleSelectLogo(asset.id);
                                  }}
                                />
                                {isSelectingLogo === asset.id && (
                                  <div className="absolute inset-0 flex items-center justify-center">
                                    <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-brand-600"></div>
                                  </div>
                                )}
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleDeleteLogoAsset(asset.id);
                                  }}
                                  className="absolute top-2 right-2 p-1.5 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600 disabled:opacity-100 disabled:bg-gray-300 dark:disabled:bg-gray-600"
                                  aria-label="Delete logo"
                                  disabled={isDeletingLogo === asset.id}
                                >
                                  {isDeletingLogo === asset.id ? (
                                    <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                  ) : (
                                    <Trash2 className="h-4 w-4" />
                                  )}
                                </button>
                              </div>
                              {brandKit.logo_selected_asset_id === asset.id && (
                                <div className="absolute inset-0 bg-brand-600/10 flex items-center justify-center">
                                  <div className="bg-brand-600 text-white px-3 py-1 rounded-full text-sm">
                                    Selected
                                  </div>
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                        <p 
                          className="text-sm text-gray-500 dark:text-gray-400"
                          style={{ fontFamily: brandKit.typography.bodyFont }}
                        >
                          Click on a logo concept to select it as your primary logo.
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
                            src={asset.image_data}
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
    </Layout>
  );
};