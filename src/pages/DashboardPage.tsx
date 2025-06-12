import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Layout } from '../components/layout/Layout';
import { Button } from '../components/ui/Button';
import { Card, CardContent } from '../components/ui/Card';
import { Input } from '../components/ui/Input';
import { Plus, Image, ArrowRight, Search, ChevronLeft, ChevronRight } from 'lucide-react';
import { fetchBrandKits, type BrandKit } from '../lib/supabase';
import toast from 'react-hot-toast';
import { useDebounce } from '../lib/utils';

const ITEMS_PER_PAGE = 6;

export const DashboardPage: React.FC = () => {
  const [brandKits, setBrandKits] = useState<BrandKit[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const navigate = useNavigate();
  const debouncedSearchQuery = useDebounce(searchQuery, 300);
  
  const handleSearch = (value: string) => {
    setSearchQuery(value);
    setCurrentPage(1); // Reset to first page when searching
  };

  useEffect(() => {
    const loadBrandKits = async () => {
      try {
        setIsLoading(true);
        const { data, totalCount } = await fetchBrandKits(
          currentPage,
          ITEMS_PER_PAGE,
          debouncedSearchQuery
        );
        setBrandKits(data);
        setTotalItems(totalCount);
      } catch (error) {
        console.error('Failed to fetch brand kits:', error);
        toast.error('Failed to load brand kits');
      } finally {
        setIsLoading(false);
      }
    };

    loadBrandKits();
  }, [currentPage, debouncedSearchQuery]);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

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

  const totalPages = Math.ceil(totalItems / ITEMS_PER_PAGE);

  return (
    <Layout>
      <div className="min-h-screen bg-white dark:bg-gray-900 py-12">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-6xl mx-auto">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8 gap-4">
              <div>
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                  Create Brand Images
                </h1>
                <p className="text-gray-600 dark:text-gray-400">
                  Select a brand kit to generate new images
                </p>
              </div>
              
              <div className="flex space-x-4">
                <Input
                  placeholder="Search brand kits..."
                  value={searchQuery}
                  onChange={(e) => handleSearch(e.target.value)}
                  leftIcon={<Search className="h-4 w-4 text-gray-500" />}
                  className="w-full md:w-auto h-8"
                />
                <Button
                  size="sm"
                  onClick={() => navigate('/create/new')}
                  leftIcon={<Plus className="h-4 w-4" />}
                  className="min-w-40"
                >
                  New Kit
                </Button>
              </div>
            </div>

            {isLoading ? (
              <div className="flex justify-center items-center py-20">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-brand-600"></div>
              </div>
            ) : (
              <>
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
                                <div 
                                  className="h-24 w-24 rounded-lg flex items-center justify-center"
                                  style={{ 
                                    backgroundColor: brandKit.colors.background,
                                    fontFamily: brandKit.typography?.headingFont
                                  }}
                                >
                                  <span 
                                    className="text-lg font-bold text-center px-2"
                                    style={{ color: brandKit.colors.primary }}
                                  >
                                    {brandKit.name}
                                  </span>
                                </div>
                              )}
                            </div>
                            
                            <div className="p-6">
                              <h3 
                                className="text-xl font-semibold mb-2 text-gray-900 dark:text-white"
                                style={{ fontFamily: brandKit.typography?.headingFont }}
                              >
                                {brandKit.name}
                              </h3>
                              <p 
                                className="text-sm text-gray-500 dark:text-gray-400 mb-4"
                                style={{ fontFamily: brandKit.typography?.bodyFont }}
                              >
                                {brandKit.description}
                              </p>
                              
                              <div className="flex space-x-2 mb-4">
                                {brandKit.colors && Object.values(brandKit.colors).slice(0, 4).map((color, i) => (
                                  <div
                                    key={i}
                                    className="w-6 h-6 rounded-full border border-gray-200 dark:border-gray-700"
                                    style={{ backgroundColor: color }}
                                    title={color}
                                  ></div>
                                ))}
                              </div>
                              
                              <Button
                                size="sm"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  navigate(`/kit/${brandKit.id}/create`);
                                }}
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

                {totalPages > 1 && (
                  <div className="mt-8 flex justify-center items-center space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handlePageChange(currentPage - 1)}
                      disabled={currentPage === 1}
                      leftIcon={<ChevronLeft className="h-4 w-4" />}
                    >
                      Previous
                    </Button>
                    
                    <div className="flex items-center space-x-1">
                      {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                        <Button
                          key={page}
                          variant={currentPage === page ? 'primary' : 'outline'}
                          size="sm"
                          onClick={() => handlePageChange(page)}
                          className={`w-8 ${
                            currentPage === page
                              ? 'bg-brand-600 text-white'
                              : 'text-gray-600 dark:text-gray-400'
                          }`}
                        >
                          {page}
                        </Button>
                      ))}
                    </div>
                    
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handlePageChange(currentPage + 1)}
                      disabled={currentPage === totalPages}
                      rightIcon={<ChevronRight className="h-4 w-4" />}
                    >
                      Next
                    </Button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
};