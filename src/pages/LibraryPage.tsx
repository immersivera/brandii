import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Layout } from '../components/layout/Layout';
import { Button } from '../components/ui/Button';
import { Card, CardContent } from '../components/ui/Card';
import { Input } from '../components/ui/Input';
import { Search, Plus, Trash2, Palette, ChevronLeft, ChevronRight } from 'lucide-react';
import { fetchBrandKits, BrandKit, deleteBrandKit } from '../lib/supabase';
import { useNavigate } from 'react-router-dom';
import { useBrand } from '../context/BrandContext';
import toast from 'react-hot-toast';

const ITEMS_PER_PAGE = 6;

export const LibraryPage: React.FC = () => {
  const [brandKits, setBrandKits] = useState<BrandKit[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const navigate = useNavigate();
  const { updateBrandDetails } = useBrand();

  useEffect(() => {
    const loadBrandKits = async () => {
      try {
        const kits = await fetchBrandKits();
        setBrandKits(kits);
      } catch (error) {
        console.error('Failed to fetch brand kits:', error);
        toast.error('Failed to load brand kits');
      } finally {
        setIsLoading(false);
      }
    };
    
    loadBrandKits();
  }, []);

  const handleDeleteBrandKit = async (id: string) => {
    try {
      await deleteBrandKit(id);
      setBrandKits(brandKits.filter(kit => kit.id !== id));
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

  const filteredBrandKits = brandKits.filter(kit => 
    kit.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    kit.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const totalPages = Math.ceil(filteredBrandKits.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const paginatedBrandKits = filteredBrandKits.slice(startIndex, startIndex + ITEMS_PER_PAGE);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

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
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setCurrentPage(1);
                  }}
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
            
            {isLoading ? (
              <div className="flex justify-center items-center py-20">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-brand-600"></div>
              </div>
            ) : filteredBrandKits.length === 0 ? (
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
                      onClick={() => setSearchQuery('')}
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
                  {paginatedBrandKits.map((brandKit, index) => (
                    <motion.div
                      key={brandKit.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3, delay: index * 0.05 }}
                    >
                      <Card hover interactive className="h-full">
                        <CardContent className="p-0">
                          <div className="relative">
                            {brandKit.generated_assets?.some(asset => asset.type === 'logo') ? (
                              <div 
                                className="h-32 w-full bg-gradient-to-br rounded-t-xl flex items-center justify-center"
                                style={{ 
                                  background: `linear-gradient(135deg, ${brandKit.colors.primary}, ${brandKit.colors.secondary})`
                                }}
                              >
                                <span 
                                  className="text-4xl font-bold font-display"
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
                            ) : (
                              <div 
                                className="h-32 w-full rounded-t-xl"
                                style={{ backgroundColor: brandKit.colors.primary }}
                              >
                                <div className="h-full w-full flex items-center justify-center p-4" style={{ 
                                  color: brandKit.colors.primary.startsWith('#f') || 
                                         brandKit.colors.primary.startsWith('#e') || 
                                         brandKit.colors.primary.startsWith('#d') || 
                                         brandKit.colors.primary.startsWith('#c') ? '#000' : '#fff'
                                }}>
                                  <span className="text-3xl font-bold font-display">
                                    {brandKit.name.charAt(0)}
                                  </span>
                                </div>
                              </div>
                            )}
                          </div>
                          
                          <div className="p-6">
                            <h3 className="text-xl font-semibold mb-1 text-gray-900 dark:text-white">
                              {brandKit.name}
                            </h3>
                            <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
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
                              
                              <div className="flex gap-2">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleRemix(brandKit)}
                                  leftIcon={<Palette className="h-4 w-4" />}
                                >
                                  Remix
                                </Button>
                                
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleDeleteBrandKit(brandKit.id)}
                                  className="text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>
                  ))}
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