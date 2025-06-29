import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Layout } from '../components/layout/Layout';
import { Button } from '../components/ui/Button';
import { Card, CardContent } from '../components/ui/Card';
import { Input } from '../components/ui/Input';
import { Search, Plus, Trash2, Palette, ChevronLeft, ChevronRight, Image } from 'lucide-react';
import { fetchBrandKits, BrandKit, deleteBrandKit } from '../lib/supabase';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useBrand } from '../context/BrandContext';
import toast from 'react-hot-toast';
import { useDebounce } from '../lib/utils';

const ITEMS_PER_PAGE = 6;

export const LibraryPage: React.FC = () => {
  const [brandKits, setBrandKits] = useState<BrandKit[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { updateBrandDetails } = useBrand();
  
  // Initialize state from URL params on component mount
  useEffect(() => {
    const page = parseInt(searchParams.get('page') || '1', 10);
    const search = searchParams.get('search') || '';
    
    setCurrentPage(isNaN(page) ? 1 : page);
    setSearchQuery(search);
  }, []);

  const debouncedSearchQuery = useDebounce(searchQuery, 300);

  // Update URL when search or page changes
  useEffect(() => {
    const params = new URLSearchParams();
    if (currentPage > 1) params.set('page', currentPage.toString());
    if (debouncedSearchQuery) params.set('search', debouncedSearchQuery);
    
    // Replace the current entry in the history stack instead of pushing a new one
    navigate(`?${params.toString()}`, { replace: true });
  }, [currentPage, debouncedSearchQuery, navigate]);

  // Fetch brand kits when page or search changes
  useEffect(() => {
    const loadBrandKits = async () => {
      try {
        setIsLoading(true);
        const { data: kits, totalCount } = await fetchBrandKits(
          currentPage,
          ITEMS_PER_PAGE,
          debouncedSearchQuery
        );
        setBrandKits(kits);
        setTotalItems(totalCount);
      } catch (error) {
        console.error('Failed to fetch brand kits:', error);
        toast.error('Failed to load brand kits');
      } finally {
        setIsLoading(false);
      }
    };
    
    loadBrandKits();
    handlePageChange(currentPage);
  }, [currentPage, debouncedSearchQuery]);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
    // Reset to first page when searching
    setCurrentPage(1);
  };

  const handlePageChange = (newPage: number) => {
    setCurrentPage(newPage);
    // Scroll to top of the page
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDeleteBrandKit = async (id: string) => {
    try {
      await deleteBrandKit(id);
      
      // Refresh the current page
      const { data: kits, totalCount } = await fetchBrandKits(
        currentPage,
        ITEMS_PER_PAGE,
        debouncedSearchQuery
      );
      
      // If the current page is empty and it's not the first page, go to the previous page
      if (kits.length === 0 && currentPage > 1) {
        handlePageChange(currentPage - 1);
      } else {
        setBrandKits(kits);
        setTotalItems(totalCount);
      }
      
      toast.success('Brand kit deleted successfully');
    } catch (error) {
      console.error('Failed to delete brand kit:', error);
      toast.error('Failed to delete brand kit');
    }
  };

  const handleRemix = (brandKit: BrandKit) => {
    updateBrandDetails({
      name: `${brandKit.name} Remix`,
      description: brandKit.description,
      industry: brandKit.type,
      colors: brandKit.colors,
      typography: brandKit.typography,
      logoStyle: brandKit.logo.type,
      step: 1
    });
    navigate('/create');
  };

  const getLogoForBrandKit = (brandKit: BrandKit): string | null => {
    // Check for uploaded logo first
    if (brandKit.logo.image && brandKit.logo.image.length > 0) {
      return brandKit.logo.image;
    }

    // Then check for AI-generated logo
    if (brandKit.generated_assets?.length) {
      // First try to find the selected logo
      if (brandKit.logo_selected_asset_id) {
        const selectedAsset = brandKit.generated_assets.find(
          asset => asset.id === brandKit.logo_selected_asset_id && asset.type === 'logo'
        );
        if (selectedAsset?.image_data) {
          return selectedAsset.image_data;
        }
      }

      // Fallback to first logo if no selected logo is found
      const firstLogoAsset = brandKit.generated_assets.find(
        asset => asset.type === 'logo'
      );
      if (firstLogoAsset?.image_data) {
        return firstLogoAsset.image_data;
      }
    }

    return null;
  };

  const renderTextLogo = (brandKit: BrandKit) => (
    <div 
      className="h-24 w-24 rounded-lg flex items-center justify-center"
      style={{ 
        backgroundColor: brandKit.colors.background,
        fontFamily: brandKit.typography.headingFont
      }}
    >
      <span 
        className="text-lg font-bold text-center px-2"
        style={{ color: brandKit.colors.primary }}
      >
        {brandKit.name}
      </span>
    </div>
  );

  const totalPages = Math.ceil(totalItems / ITEMS_PER_PAGE);

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

  return (
    <Layout>
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-12">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-6xl mx-auto">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8 gap-4">
              <div>
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                  Brand Kit Library
                </h1>
                <p className="text-gray-600 dark:text-gray-400">
                  Access and manage all your saved brand kits
                </p>
              </div>
              
              <div className="flex space-x-4">
                <Input
                  placeholder="Search brand kits..."
                  value={searchQuery}
                  onChange={handleSearchChange}
                  leftIcon={<Search className="h-4 w-4 text-gray-500" />}
                  className="w-full md:w-auto h-8"
                />
                
                <Button
                  className="text-xs"
                  onClick={() => navigate('/create')}
                  leftIcon={<Plus className="h-4 w-4" />}
                >
                  Create
                </Button>
              </div>
            </div>
            
            {totalItems === 0 ? (
              <div className="text-center py-20">
                {searchQuery ? (
                  <div>
                    <p className="text-xl font-semibold text-gray-700 dark:text-gray-300 mb-2">
                      No results found for "{searchQuery}"
                    </p>
                    <p className="text-gray-500 dark:text-gray-400">
                      Try a different search term or clear the search
                    </p>
                    <Button
                      variant="outline"
                      className="mt-4"
                      onClick={() => handleSearchChange({ target: { value: '' } } as any)}
                    >
                      Clear Search
                    </Button>
                  </div>
                ) : (
                  <div>
                    <p className="text-xl font-semibold text-gray-700 dark:text-gray-300 mb-2">
                      Your brand kit library is empty
                    </p>
                    <p className="text-gray-500 dark:text-gray-400 mb-6">
                      Create your first brand kit to get started
                    </p>
                    <Button
                      onClick={() => navigate('/create')}
                      leftIcon={<Plus className="h-4 w-4" />}
                    >
                      Create Brand Kit
                    </Button>
                  </div>
                )}
              </div>
            ) : (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {brandKits.map((brandKit, index) => {
                    const logoUrl = getLogoForBrandKit(brandKit);
                    
                    return (
                      <motion.div
                        key={brandKit.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3, delay: index * 0.05 }}
                      >
                        <Card hover interactive className="h-full">
                          <CardContent className="p-0">
                            <div className="relative">
                              <div 
                                className="h-32 w-full rounded-t-xl flex items-center justify-center"
                                style={{ 
                                  backgroundColor: brandKit.colors.background
                                }}
                              >
                                {logoUrl ? (
                                  <img 
                                    src={logoUrl}
                                    alt={`${brandKit.name} logo`}
                                    className="h-24 w-24 object-contain"
                                  />
                                ) : renderTextLogo(brandKit)}
                              </div>
                            </div>
                            
                            <div className="p-6">
                              <h3 
                                className="text-xl font-semibold mb-1 text-gray-900 dark:text-white"
                                style={{ fontFamily: brandKit.typography.headingFont }}
                              >
                                {brandKit.name}
                              </h3>
                              <p 
                                className="text-sm text-gray-500 dark:text-gray-400 mb-4"
                                style={{ fontFamily: brandKit.typography.bodyFont }}
                              >
                                {brandKit.description}
                              </p>
                              
                              <div className="flex space-x-2 mb-4">
                                {Object.values(brandKit.colors).slice(0, 4).map((color, i) => (
                                  <div
                                    key={i}
                                    className="w-6 h-6 rounded-full"
                                    style={{ backgroundColor: color }}
                                  ></div>
                                ))}
                              </div>
                              
                              <div className="flex justify-between gap-2">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => navigate(`/kit/${brandKit.id}`)}
                                >
                                  View Details
                                </Button>
                                
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => navigate(`/kit/${brandKit.id}/create`)}
                                  leftIcon={<Image className="h-4 w-4" />}
                                >
                                  Create Images
                                </Button>
                              </div>
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