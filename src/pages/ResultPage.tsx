import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Layout } from '../components/layout/Layout';
import { Button } from '../components/ui/Button';
import { Card, CardContent, CardFooter } from '../components/ui/Card';
import { ArrowLeft, Download, Copy, Share2, RefreshCw, Image, Plus } from 'lucide-react';
import { useBrand } from '../context/BrandContext';
import { generateBrandKitZip } from '../lib/download';
import { BRAND_TYPES, BRAND_ADJECTIVES } from '../lib/constants';
import { fetchBrandKitById, BrandKit, updateBrandKit } from '../lib/supabase';
import toast from 'react-hot-toast';


export const ResultPage: React.FC = () => {
  const { brandDetails, resetBrandDetails } = useBrand();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const brandKitId = searchParams.get('brandKitId') || '';
  const [isDownloading, setIsDownloading] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [brandKit, setBrandKit] = useState<BrandKit | null>(null);
  const [generatedAssets, setGeneratedAssets] = useState<any[]>([]);
  const [selectedLogo, setSelectedLogo] = useState<string | null>(
    brandDetails.logoChoice === 'upload' 
      ? brandDetails.uploadedLogoUrl || null
      : null
  );

  // Fetch brand kit data and assets
  useEffect(() => {
    const fetchBrandKitData = async () => {
      if (!brandKitId) return;
      
      try {
        const kit = await fetchBrandKitById(brandKitId);
        if (kit) {
          setBrandKit(kit);
          
          if (kit.generated_assets) {
            setGeneratedAssets(kit.generated_assets);
            
            // Set the first logo as selected if none is selected
            const logoAssets = kit.generated_assets.filter(asset => 
              asset.type === 'logo'
            );
            
            if (logoAssets.length > 0 && !selectedLogo) {
              setSelectedLogo(logoAssets[0].image_url || null);
            }
          }
        }
      } catch (error) {
        console.error('Error fetching brand kit:', error);
        toast.error('Failed to load brand kit');
      } finally {
        setIsLoading(false);
      }
    };

    fetchBrandKitData();
  }, [brandKitId]);

  // Get the display names for industry and personality from the brand kit
  const industryName = brandKit?.type || BRAND_TYPES.find(t => t.id === brandDetails.industry)?.name || 'Not specified';
  const personalityName = brandKit?.logo?.personality || BRAND_ADJECTIVES.find(a => a.id === brandDetails.adjective)?.name || 'Not specified';

  const handleStartOver = () => {
    resetBrandDetails();
    navigate('/create');
  };

  const handleDownload = async () => {
    try {
      setIsDownloading(true);
      
      const kitData = {
        id: brandKit?.id || 'preview',
        user_id: brandKit?.user_id || 'preview',
        name: brandKit?.name || brandDetails.name,
        description: brandKit?.description || brandDetails.description,
        type: brandKit?.type || brandDetails.industry,
        created_at: brandKit?.created_at || new Date().toISOString(),
        updated_at: brandKit?.updated_at || new Date().toISOString(),
        colors: brandKit?.colors || brandDetails.colors,
        logo: {
          type: brandKit?.logo?.type || brandDetails.logoStyle || 'wordmark',
          text: brandKit?.logo?.text || brandDetails.name,
          image: selectedLogo || brandKit?.logo?.image || undefined,
          personality: brandKit?.logo?.personality || brandDetails.adjective || 'Modern',
        },
        typography: brandKit?.typography || brandDetails.typography,
      };

      const zipBlob = await generateBrandKitZip(kitData);
      
      const url = URL.createObjectURL(zipBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${kitData.name.toLowerCase().replace(/\s+/g, '-')}-brand-kit.zip`;
      
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      URL.revokeObjectURL(url);
      
      toast.success('Brand kit downloaded successfully!');
    } catch (error) {
      console.error('Error downloading brand kit:', error);
      toast.error('Failed to download brand kit');
    } finally {
      setIsDownloading(false);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(window.location.href);
    toast.success('Link copied to clipboard');
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `${brandKit?.name || brandDetails.name} Brand Kit`,
          text: brandKit?.description || brandDetails.description,
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

  const renderTextLogo = () => (
    <div 
      className="w-32 h-32 rounded-xl flex items-center justify-center"
      style={{ 
        backgroundColor: brandKit?.colors?.background || brandDetails.colors.background,
        fontFamily: brandKit?.typography?.headingFont || brandDetails.typography.headingFont
      }}
    >
      <span 
        className="text-2xl font-bold text-center px-4"
        style={{ color: brandKit?.colors?.primary || brandDetails.colors.primary }}
      >
        {brandKit?.name || brandDetails.name}
      </span>
    </div>
  );
  const handleLogoSelect = async (logoUrl: string) => {
    try {
      setSelectedLogo(logoUrl);
      
      if (brandKit) {
        // Update the local state first for immediate UI update
        setBrandKit(prev => ({
          ...prev!,
          logo: {
            ...prev!.logo,
            image: logoUrl
          }
        }));
        
        // Update the database
        await updateBrandKit(brandKit.id, {
          logo: {
            ...brandKit.logo,
            image: logoUrl
          },
          logo_selected_asset_id: generatedAssets.find(asset => asset.image_url === logoUrl)?.id || null
        });
        
        toast.success('Logo updated successfully');
      }
    } catch (error) {
      console.error('Error updating logo:', error);
      toast.error('Failed to update logo');
      // Revert the local state on error
      setSelectedLogo(prev => prev === logoUrl ? null : prev);
    }
  };
  return (
    <Layout>
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-12">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-4xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8 gap-4">
                <div>
                  <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                    Your Brand Kit Is Ready!
                  </h1>
                  <p className="text-gray-600 dark:text-gray-400">
                    Here's everything you need to establish a consistent brand identity
                  </p>
                </div>
                
                <div className="flex space-x-3">
                  <Button
                    onClick={() => navigate(`/kit/${brandKitId}/create`)}
                    leftIcon={<Image className="h-4 w-4" />}
                  >
                    Create Images
                  </Button>
                </div>
              </div>
              
              <Card className="mb-8">
                <CardContent className="p-6">
                  <div className="flex flex-col md:flex-row items-start gap-6">
                    <div className="flex-1">
                      <h2 
                        className="text-2xl font-bold mb-2 text-gray-900 dark:text-white"
                        style={{ fontFamily: brandKit?.typography?.headingFont || brandDetails.typography.headingFont }}
                      >
                        {brandKit?.name || brandDetails.name}
                      </h2>
                      <p 
                        className="text-gray-600 dark:text-gray-400 mb-4"
                        style={{ fontFamily: brandKit?.typography?.bodyFont || brandDetails.typography.bodyFont }}
                      >
                        {brandKit?.description || brandDetails.description}
                      </p>
                      
                      <div className="grid grid-cols-2 gap-4 mb-6">
                        <div>
                          <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
                            Industry
                          </h3>
                          <p className="text-gray-900 dark:text-white capitalize">
                            {industryName}
                          </p>
                        </div>
                        <div>
                          <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
                            Logo Style
                          </h3>
                          <p className="text-gray-900 dark:text-white capitalize">
                            {brandKit?.logo?.type || brandDetails.logoStyle}
                          </p>
                        </div>
                      </div>
                    </div>
                    
                    <div className="w-full md:w-auto flex justify-center">
                      {selectedLogo ? (
                        <img 
                          src={selectedLogo} 
                          alt="Selected logo"
                          className="w-32 h-32 object-contain rounded-xl"
                          style={{ backgroundColor: brandKit?.colors?.background || brandDetails.colors.background }}
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
                  </div>
                </CardFooter>
              </Card>


              {!isLoading && generatedAssets.filter(asset => 
                asset.type === 'logo'
              ).length > 0 && (
                <Card>
                  <CardContent className="p-6">
                    <h3 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">
                      Logo Concepts
                    </h3>
                    
                    <div className="space-y-6">
                      <div className="grid grid-cols-2 gap-4">
                        {generatedAssets
                          .filter(asset => asset.type === 'logo')
                          .map((asset) => (
                            <div
                              key={asset.id}
                              className={`relative border-2 rounded-lg overflow-hidden cursor-pointer transition-all ${
                                selectedLogo === asset.image_url
                                  ? 'border-brand-600 shadow-lg'
                                  : 'border-gray-200 dark:border-gray-700'
                              }`}
                              onClick={() => handleLogoSelect(asset.image_url)}
                            >
                              <img
                                src={asset.image_url}
                                alt={`Logo concept`}
                                className="w-full h-auto"
                                style={{ backgroundColor: brandKit?.colors?.background || brandDetails.colors.background }}
                              />
                              {selectedLogo === asset.image_url && (
                                <div className="absolute inset-0 bg-brand-600/10 flex items-center justify-center">
                                  <div className="bg-brand-600 text-white px-3 py-1 rounded-full text-sm">
                                    Selected
                                  </div>
                                </div>
                              )}
                            </div>
                          ))}
                      </div>
                      
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        Click on a logo concept to select it. The selected logo will be included in your brand kit download.
                      </p>
                    </div>
                  </CardContent>
                </Card>
              )}
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 my-8">
                <Card>
                  <CardContent className="p-6">
                    <h3 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">
                      Color Palette
                    </h3>
                    
                    <div className="space-y-4">
                      {Object.entries(brandKit?.colors || brandDetails.colors).map(([key, color]) => (
                        <div key={key} className="flex items-center">
                          <div 
                            className="w-12 h-12 rounded-md mr-4"
                            style={{ backgroundColor: color }}
                          ></div>
                          <div>
                            <h4 className="text-sm font-medium text-gray-900 dark:text-white capitalize">
                              {key}
                            </h4>
                            <p className="text-sm text-gray-500 dark:text-gray-400">
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
                    <h3 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">
                      Typography
                    </h3>
                    
                    <div className="space-y-6">
                      <div>
                        <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">
                          Heading Font
                        </h4>
                        <p 
                          className="text-2xl font-semibold text-gray-900 dark:text-white"
                          style={{ fontFamily: brandKit?.typography?.headingFont || brandDetails.typography.headingFont }}
                        >
                          {brandKit?.typography?.headingFont || brandDetails.typography.headingFont}
                        </p>
                        <div 
                          className="mt-1 text-sm text-gray-500 dark:text-gray-400"
                          style={{ fontFamily: brandKit?.typography?.headingFont || brandDetails.typography.headingFont }}
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
                          style={{ fontFamily: brandKit?.typography?.bodyFont || brandDetails.typography.bodyFont }}
                        >
                          {brandKit?.typography?.bodyFont || brandDetails.typography.bodyFont}
                        </p>
                        <div 
                          className="mt-1 text-sm text-gray-500 dark:text-gray-400"
                          style={{ fontFamily: brandKit?.typography?.bodyFont || brandDetails.typography.bodyFont }}
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
              
              
              <div className="flex justify-center mt-8">
                <Button
                  size="lg"
                  onClick={() => navigate(`/kit/${brandKitId}/create`)}
                  leftIcon={<Image className="h-5 w-5" />}
                  className="mr-2"
                >
                  Create Images
                </Button>
                
                <Button
                  size="lg"
                  variant='secondary'
                  onClick={handleDownload}
                  leftIcon={<Download className="h-5 w-5" />}
                  isLoading={isDownloading}
                  disabled={isDownloading}
                >
                  Download Brand Kit
                </Button>
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </Layout>
  );
};