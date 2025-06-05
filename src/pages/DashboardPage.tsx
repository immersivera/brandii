import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Layout } from '../components/layout/Layout';
import { Button } from '../components/ui/Button';
import { Card, CardContent } from '../components/ui/Card';
import { Plus, Image, ArrowRight } from 'lucide-react';
import { fetchBrandKits, type BrandKit } from '../lib/supabase';
import toast from 'react-hot-toast';

export const DashboardPage: React.FC = () => {
  const [brandKits, setBrandKits] = useState<BrandKit[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const loadBrandKits = async () => {
      try {
        const { data } = await fetchBrandKits();
        setBrandKits(data);
      } catch (error) {
        console.error('Failed to fetch brand kits:', error);
        toast.error('Failed to load brand kits');
      } finally {
        setIsLoading(false);
      }
    };

    loadBrandKits();
  }, []);

  const getLogoForBrandKit = (brandKit: BrandKit) => {
    // if (!brandKit.logo.image) return null;
    // Check for uploaded logo first
    if (brandKit.logo.image && brandKit.logo.image.length > 0) {
      return brandKit.logo.image;
    }
    
    if (brandKit.generated_assets?.length) {
      // First try to find the selected logo
      if (brandKit.logo_selected_asset_id) {
        const selectedAsset = brandKit.generated_assets.find(
          asset => asset.id === brandKit.logo_selected_asset_id && asset.type === 'logo'
        );
        
        // Check for image_data in different possible locations
        const imageData = selectedAsset?.image_data || (selectedAsset as any)?.imageData;
        if (imageData) {
          return imageData;
        }
      }

      // Fallback to first logo if no selected logo is found
      const firstLogoAsset = brandKit.generated_assets.find(
        asset => asset.type === 'logo'
      );
      
      if (firstLogoAsset) {
        // Check for image_data in different possible locations
        const imageData = firstLogoAsset.image_data || (firstLogoAsset as any)?.imageData;
        if (imageData) {
          return imageData;
        }
      }
    }

    return null;
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

  if (brandKits.length === 0) {
    navigate('/create');
    return null;
  }

  return (
    <Layout>
      <div className="min-h-screen bg-white dark:bg-gray-900 py-12">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-6xl mx-auto">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                  Create Brand Images
                </h1>
                <p className="text-gray-600 dark:text-gray-400">
                  Select a brand kit to generate new images
                </p>
              </div>
              
              <Button
                onClick={() => navigate('/create')}
                leftIcon={<Plus className="h-4 w-4" />}
              >
                New Brand Kit
              </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {brandKits.map((brandKit, index) => {
                const logoImage = getLogoForBrandKit(brandKit);

                return (
                  <motion.div
                    key={brandKit.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: index * 0.1 }}
                  >
                    <Card 
                      hover 
                      interactive 
                      onClick={() => navigate(`/kit/${brandKit.id}/create`)}
                      className="h-full"
                    >
                      <CardContent className="p-0">
                        <div 
                          className="h-48 w-full rounded-t-xl flex items-center justify-center"
                          style={{ 
                            backgroundColor: brandKit.colors.background
                          }}
                        >
                          {logoImage ? (
                            <img 
                              src={logoImage}
                              alt={brandKit.name}
                              className="h-32 w-32 object-contain"
                            />
                          ) : (
                            <span 
                              className="text-6xl font-bold font-display"
                              style={{ 
                                color: brandKit.colors.text
                              }}
                            >
                              {brandKit.name.charAt(0)}
                            </span>
                          )}
                        </div>
                        
                        <div className="p-6">
                          <h3 className="text-xl font-semibold mb-2 text-gray-900 dark:text-white">
                            {brandKit.name}
                          </h3>
                          <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                            {brandKit.description}
                          </p>
                          
                          <Button
                            size="sm"
                            onClick={() => navigate(`/kit/${brandKit.id}/create`)}
                            leftIcon={<Image className="h-4 w-4" />}
                            rightIcon={<ArrowRight className="h-4 w-4" />}
                            className="w-full"
                          >
                            Create Images
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};