import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Layout } from '../components/layout/Layout';
import { Button } from '../components/ui/Button';
import { Card, CardContent, CardFooter } from '../components/ui/Card';
import { ArrowLeft, Download, Copy, Share2, RefreshCw } from 'lucide-react';
import { useBrand } from '../context/BrandContext';
import { generateBrandKitZip } from '../lib/download';
import { BRAND_TYPES, BRAND_ADJECTIVES } from '../lib/constants';
import toast from 'react-hot-toast';

export const ResultPage: React.FC = () => {
  const { brandDetails, resetBrandDetails } = useBrand();
  const navigate = useNavigate();
  const [isDownloading, setIsDownloading] = useState(false);
  const [selectedLogo, setSelectedLogo] = useState<string | null>(
    brandDetails.logoOptions?.[0] || null
  );

  const handleStartOver = () => {
    resetBrandDetails();
    navigate('/create');
  };

  const handleDownload = async () => {
    try {
      setIsDownloading(true);
      
      const brandKit = {
        id: 'preview',
        user_id: 'preview',
        name: brandDetails.name,
        description: brandDetails.description,
        type: brandDetails.industry,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        colors: brandDetails.colors,
        logo: {
          type: brandDetails.logoStyle || 'wordmark',
          text: brandDetails.name,
          image: selectedLogo || undefined
        },
        typography: brandDetails.typography,
      };

      const zipBlob = await generateBrandKitZip(brandKit);
      
      const url = URL.createObjectURL(zipBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${brandDetails.name.toLowerCase().replace(/\s+/g, '-')}-brand-kit.zip`;
      
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
          title: `${brandDetails.name} Brand Kit`,
          text: brandDetails.description,
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

  // Get the display names for industry and personality
  const industryName = BRAND_TYPES.find(t => t.id === brandDetails.industry)?.name || 'Not specified';
  const personalityName = BRAND_ADJECTIVES.find(a => a.id === brandDetails.adjective)?.name || 'Not specified';

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
                    variant="outline"
                    size="sm"
                    onClick={handleStartOver}
                    leftIcon={<RefreshCw className="h-4 w-4" />}
                  >
                    Start Over
                  </Button>
                  
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => navigate('/create')}
                    leftIcon={<ArrowLeft className="h-4 w-4" />}
                  >
                    Back to Editor
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
                      <h2 className="text-2xl font-bold mb-2 text-gray-900 dark:text-white">
                        {brandDetails.name}
                      </h2>
                      <p className="text-gray-600 dark:text-gray-400 mb-4">
                        {brandDetails.description}
                      </p>
                      
                      <div className="grid grid-cols-2 gap-4 mb-6">
                        <div>
                          <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
                            Industry
                          </h3>
                          <p className="text-gray-900 dark:text-white">
                            {industryName}
                          </p>
                        </div>
                        <div>
                          <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
                            Personality
                          </h3>
                          <p className="text-gray-900 dark:text-white">
                            {personalityName}
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
                          style={{ backgroundColor: brandDetails.colors.primary }}
                        >
                          <span 
                            className="text-4xl font-bold"
                            style={{ 
                              color: brandDetails.colors.primary.startsWith('#f') || 
                                     brandDetails.colors.primary.startsWith('#e') || 
                                     brandDetails.colors.primary.startsWith('#d') || 
                                     brandDetails.colors.primary.startsWith('#c') ? '#000' : '#fff'
                            }}
                          >
                            {brandDetails.name.charAt(0)}
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
                      {Object.entries(brandDetails.colors).map(([key, color]) => (
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
                          {brandDetails.typography.headingFont}
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
                          {brandDetails.typography.bodyFont}
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
                  
                  {brandDetails.logoOptions ? (
                    <div className="space-y-6">
                      <div className="grid grid-cols-2 gap-4">
                        {brandDetails.logoOptions.map((url, index) => (
                          <div
                            key={index}
                            className={`relative border-2 rounded-lg overflow-hidden cursor-pointer transition-all ${
                              selectedLogo === url
                                ? 'border-brand-600 shadow-lg'
                                : 'border-gray-200 dark:border-gray-700'
                            }`}
                            onClick={() => setSelectedLogo(url)}
                          >
                            <img
                              src={url}
                              alt={`Logo concept ${index + 1}`}
                              className="w-full h-auto"
                            />
                            {selectedLogo === url && (
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
                    <div className="text-center py-12">
                      <p className="text-gray-500 dark:text-gray-400">
                        Logo concepts are being generated...
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
              
              <div className="flex justify-center mt-8">
                <Button
                  size="lg"
                  onClick={handleDownload}
                  leftIcon={<Download className="h-5 w-5" />}
                  isLoading={isDownloading}
                  disabled={isDownloading}
                >
                  Download Complete Brand Kit
                </Button>
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </Layout>
  );
};