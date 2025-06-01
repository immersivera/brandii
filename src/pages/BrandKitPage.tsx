import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useParams, useNavigate } from 'react-router-dom';
import { Layout } from '../components/layout/Layout';
import { Button } from '../components/ui/Button';
import { Card, CardContent, CardFooter } from '../components/ui/Card';
import { ArrowLeft, Download, Copy, Share2, Trash2 } from 'lucide-react';
import { BrandKit, fetchBrandKitById, deleteBrandKit } from '../lib/supabase';
import { generateBrandKitZip } from '../lib/download';
import toast from 'react-hot-toast';

export const BrandKitPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [brandKit, setBrandKit] = useState<BrandKit | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isDownloading, setIsDownloading] = useState(false);
  const [selectedLogo, setSelectedLogo] = useState<string | null>(null);

  useEffect(() => {
    const loadBrandKit = async () => {
      if (!id) return;
      
      try {
        const kit = await fetchBrandKitById(id);
        if (kit) {
          setBrandKit(kit);
          // Set the first generated asset as selected logo if available
          if (kit.generated_assets && kit.generated_assets.length > 0) {
            setSelectedLogo(kit.generated_assets[0].image_data);
          }
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

  const handleDownload = async () => {
    if (!brandKit) return;

    try {
      setIsDownloading(true);
      
      // Update brand kit with selected logo
      const brandKitWithLogo = {
        ...brandKit,
        logo: {
          ...brandKit.logo,
          image: selectedLogo || undefined
        }
      };
      
      const zipBlob = await generateBrandKitZip(brandKitWithLogo);
      
      const url = URL.createObjectURL(zipBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${brandKit.name.toLowerCase().replace(/\s+/g, '-')}-brand-kit.zip`;
      
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

  const handleDelete = async () => {
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

  if (isLoading) {
    return (
      <Layout>
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-12">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-center items-center py-20">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-brand-600"></div>
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  if (!brandKit) {
    return null;
  }

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
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => navigate('/library')}
                    leftIcon={<ArrowLeft className="h-4 w-4" />}
                    className="mb-4"
                  >
                    Back to Library
                  </Button>
                  <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                    {brandKit.name}
                  </h1>
                  <p className="text-gray-600 dark:text-gray-400">
                    Created on {new Date(brandKit.created_at).toLocaleDateString()}
                  </p>
                </div>
                
                <div className="flex space-x-3">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleDelete}
                    leftIcon={<Trash2 className="h-4 w-4" />}
                    className="text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20"
                  >
                    Delete
                  </Button>
                  
                  <Button
                    size="sm"
                    onClick={handleDownload}
                    leftIcon={<Download className="h-4 w-4" />}
                    isLoading={isDownloading}
                    disabled={isDownloading}
                  >
                    Download
                  </Button>
                </div>
              </div>
              
              <Card className="mb-8">
                <CardContent className="p-6">
                  <div className="flex flex-col md:flex-row items-start gap-6">
                    <div className="flex-1">
                      <p className="text-gray-600 dark:text-gray-400 mb-4">
                        {brandKit.description}
                      </p>
                      
                      <div className="grid grid-cols-2 gap-4 mb-6">
                        <div>
                          <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
                            Type
                          </h3>
                          <p className="text-gray-900 dark:text-white capitalize">
                            {brandKit.type || 'Not specified'}
                          </p>
                        </div>
                        <div>
                          <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
                            Logo Style
                          </h3>
                          <p className="text-gray-900 dark:text-white capitalize">
                            {brandKit.logo.type}
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
                        />
                      ) : (
                        <div 
                          className="w-32 h-32 rounded-xl flex items-center justify-center"
                          style={{ backgroundColor: brandKit.colors.primary }}
                        >
                          <span 
                            className="text-4xl font-bold"
                            style={{ 
                              color: brandKit.colors.primary.startsWith('#f') || 
                                     brandKit.colors.primary.startsWith('#e') || 
                                     brandKit.colors.primary.startsWith('#d') || 
                                     brandKit.colors.primary.startsWith('#c') ? '#000' : '#fff'
                            }}
                          >
                            {brandKit.name.charAt(0)}
                          </span>
                        </div>
                      )}
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
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
                <Card>
                  <CardContent className="p-6">
                    <h3 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">
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
                        <p className="text-2xl font-display font-semibold text-gray-900 dark:text-white">
                          {brandKit.typography.headingFont}
                        </p>
                        <div className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                          ABCDEFGHIJKLMNOPQRSTUVWXYZ<br />
                          abcdefghijklmnopqrstuvwxyz<br />
                          1234567890
                        </div>
                      </div>
                      
                      <div>
                        <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">
                          Body Font
                        </h4>
                        <p className="text-base text-gray-900 dark:text-white">
                          {brandKit.typography.bodyFont}
                        </p>
                        <div className="mt-1 text-sm text-gray-500 dark:text-gray-400">
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
                  <h3 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">
                    Logo Concepts
                  </h3>
                  
                  {brandKit.generated_assets && brandKit.generated_assets.length > 0 ? (
                    <div className="space-y-6">
                      <div className="grid grid-cols-2 gap-4">
                        {brandKit.generated_assets.map((asset, index) => (
                          <div
                            key={asset.id}
                            className={`relative border-2 rounded-lg overflow-hidden cursor-pointer transition-all ${
                              selectedLogo === asset.image_data
                                ? 'border-brand-600 shadow-lg'
                                : 'border-gray-200 dark:border-gray-700'
                            }`}
                            onClick={() => setSelectedLogo(asset.image_data)}
                          >
                            <img
                              src={asset.image_data}
                              alt={`Logo concept ${index + 1}`}
                              className="w-full h-auto"
                            />
                            {selectedLogo === asset.image_data && (
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
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-6 flex items-center justify-center bg-white dark:bg-gray-800 h-40">
                        <div 
                          className="text-3xl font-bold"
                          style={{ color: brandKit.colors.primary }}
                        >
                          {brandKit.name}
                        </div>
                      </div>
                      
                      <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-6 flex items-center justify-center bg-white dark:bg-gray-800 h-40">
                        <div 
                          className="flex flex-col items-center"
                          style={{ color: brandKit.colors.primary }}
                        >
                          <div className="text-5xl font-bold mb-1">
                            {brandKit.name.charAt(0)}
                          </div>
                          <div className="text-sm font-medium">
                            {brandKit.name}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </div>
      </div>
    </Layout>
  );
};