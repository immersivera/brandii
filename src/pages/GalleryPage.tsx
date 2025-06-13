import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { useDebounce } from '../lib/utils';
import { Layout } from '../components/layout/Layout';
import { Button } from '../components/ui/Button';
import { ArrowLeft, Download, Plus, X, Calendar, Clock, Trash2, MessageSquare, ChevronLeft, ChevronRight, Search } from 'lucide-react';
import { supabase, deleteGeneratedAsset } from '../lib/supabase';
import toast from 'react-hot-toast';
import Masonry from 'react-masonry-css';
import OptimizedImage from '../components/ui/OptimizedImage';

const ITEMS_PER_PAGE = 12;

export const GalleryPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [images, setImages] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isPageLoading, setIsPageLoading] = useState(false);
  const [selectedImage, setSelectedImage] = useState<any | null>(null);
  const [isDeletingImage, setIsDeletingImage] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [brandKit, setBrandKit] = useState<any>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const debouncedSearchQuery = useDebounce(searchQuery, 500);

  const breakpointColumns = {
    default: 4,
    1536: 4,
    1280: 3,
    1024: 3,
    768: 2,
    640: 1
  };

  // Initialize state from URL params on component mount
  useEffect(() => {
    const page = parseInt(searchParams.get('page') || '1', 10);
    const search = searchParams.get('search') || '';
    
    setCurrentPage(isNaN(page) ? 1 : page);
    setSearchQuery(search);
  // eslint-disable-next-line react-hooks/exhaustive-deps

    const imageId = searchParams.get('image');
    
    // Save to localStorage if we have an image ID in the URL
    if (imageId) {
      localStorage.setItem('pendingImageId', imageId);
    } 

  }, []); // Run only once on mount

  // Update URL when search or page changes
  useEffect(() => {
    const params = new URLSearchParams();
    if (currentPage > 1) params.set('page', currentPage.toString());
    if (debouncedSearchQuery) params.set('search', debouncedSearchQuery);
    
    navigate(`?${params.toString()}`, { replace: true });
  }, [currentPage, debouncedSearchQuery, navigate]);

  useEffect(() => {
    const fetchBrandKitDetails = async () => {
      if (!id) return;
      try {
        const { data, error } = await supabase
          .from('brand_kits')
          .select('*')
          .eq('id', id)
          .single();
        if (error) throw error;
        setBrandKit(data);
      } catch (error) {
        toast.error('Failed to load brand kit');
        navigate('/library');
      }
    };
    fetchBrandKitDetails();
  }, [id, navigate]);

  useEffect(() => {
    const fetchImages = async () => {
      try {
        if (currentPage === 1) {
          setIsLoading(true);
        } else {
          setIsPageLoading(true);
        }

        let queryBuilder = supabase
        .from('generated_assets')
        .select(
          `
          id,
          image_url,
          image_prompt,
          created_at,
          brand_kit:brand_kit_id (id, name, type, user_id)
          `,
          { count: 'exact' }
        )
          .eq('brand_kit_id', id)
          .eq('type', 'image')
          .order('created_at', { ascending: false })
          .range(
            (currentPage - 1) * ITEMS_PER_PAGE,
            currentPage * ITEMS_PER_PAGE - 1
          );

        if (debouncedSearchQuery) {
          queryBuilder = queryBuilder.ilike('image_prompt', `%${debouncedSearchQuery}%`);
        }

        const { data, error, count } = await queryBuilder;

        if (error) throw error;
        
        setTotalItems(count || 0);
        setImages(data || []);
      } catch (error) {
        console.error('Error fetching images:', error);
        toast.error('Failed to load images');
      } finally {
        setIsLoading(false);
        setIsPageLoading(false);
      }
    };

    if (id) fetchImages();
  }, [id, currentPage, debouncedSearchQuery]);

  // Handle URL changes and image selection with localStorage
  useEffect(() => {
    
    // If we have images but no selected image yet, check for pending image
    if (images.length > 0 && !selectedImage) {
      const pendingImageId = localStorage.getItem('pendingImageId');
      if (pendingImageId) {
        const imageToSelect = images.find(img => img.id === pendingImageId);
        if (imageToSelect) {
          // Use setTimeout to ensure the modal opens after the component is mounted
          const timer = setTimeout(() => {
            setSelectedImage(imageToSelect);
            // Clear the pending image after setting it
            localStorage.removeItem('pendingImageId');
            // Update URL with the new image ID
            const params = new URLSearchParams(searchParams);
            params.set('image', pendingImageId);
            navigate(`?${params.toString()}`, { replace: true });
          }, 100);
          return () => clearTimeout(timer);
        }
      }
    }
    
  }, [images, selectedImage]);

  // Handle image selection with URL update
  const handleImageSelect = useCallback((image: any) => {
    // Don't update if selecting the same image
    if (selectedImage?.id === image.id) return;
    
    setSelectedImage(image);
    
    // Update URL with the new image ID
    const params = new URLSearchParams(searchParams);
    params.set('image', image.id);
    
    // Only update URL if it's different from current
    if (searchParams.get('image') !== image.id) {
      // Save to localStorage before navigation
      localStorage.setItem('pendingImageId', image.id);
      navigate(`?${params.toString()}`, { replace: true });
    }
  }, [navigate, searchParams, selectedImage]);

  // Handle modal close with URL cleanup
  const handleCloseModal = useCallback(() => {
    if (!selectedImage) return; // Already closed
    
    setSelectedImage(null);
    
    // Clear from localStorage
    localStorage.removeItem('pendingImageId');
    
    const params = new URLSearchParams(searchParams);
    params.delete('image');
    
    // Only update URL if it still contains the image param
    if (searchParams.has('image')) {
      navigate(`?${params.toString()}`, { replace: true });
    }
  }, [navigate, searchParams, selectedImage]);

  const totalPages = Math.ceil(totalItems / ITEMS_PER_PAGE);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDownload = async (imageUrl: string, index: number) => {
    try {
      // If it's a base64 data URL, handle it directly
      if (imageUrl.startsWith('data:')) {
        const link = document.createElement('a');
        link.href = imageUrl;
        link.download = `${brandKit?.name ? brandKit.name.toLowerCase().replace(/\s+/g, '-') : 'generated'}-image-${index + 1}.png`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        return;
      }
  
      // For regular URLs, fetch the image and create a download
      const response = await fetch(imageUrl);
      const blob = await response.blob();
      const blobUrl = window.URL.createObjectURL(blob);
      
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = `${brandKit?.name ? brandKit.name.toLowerCase().replace(/\s+/g, '-') : 'generated'}-image-${index + 1}.png`;
      document.body.appendChild(link);
      link.click();
      
      // Cleanup
      document.body.removeChild(link);
      window.URL.revokeObjectURL(blobUrl);
    } catch (error) {
      console.error('Error downloading image:', error);
      toast.error('Failed to download image');
    }
  };

  const handleDeleteImage = async (imageId: string) => {
    if (!confirm('Are you sure you want to delete this image? This action cannot be undone.')) {
      return;
    }

    try {
      setIsDeletingImage(true);
      await deleteGeneratedAsset(imageId);
      
      // Update local state
      if (brandKit) {
        setBrandKit({
          ...brandKit,
          generated_assets: brandKit.generated_assets?.filter((asset: any) => asset.id !== imageId) || []
        });
      }
      
      // Close modal if the deleted image was selected
      if (selectedImage?.id === imageId) {
        setSelectedImage(null);
      }
      
      toast.success('Image deleted successfully');
    } catch (error) {
      console.error('Error deleting image:', error);
      toast.error('Failed to delete image');
    } finally {
      setIsDeletingImage(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    }).format(date);
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
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

  if (!brandKit) return null;

  return (
    <Layout> 
      <div className="min-h-screen bg-white dark:bg-gray-900 py-12">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-[1920px] mx-auto">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
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
                  {brandKit.name} Image Gallery
                </h1>
                <p className="text-gray-600 dark:text-gray-400">
                  {totalItems > 0 ? `${totalItems} ${totalItems === 1 ? 'image' : 'images'} found` : 'No images yet'}
                  {debouncedSearchQuery && ` for "${debouncedSearchQuery}"`}
                </p>
              </div>
              
              <div className="relative w-full md:w-80">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search by prompt..."
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-brand-500 focus:border-transparent transition-colors"
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setCurrentPage(1); // Reset to first page when searching
                  }}
                />
              </div>

              <Button
                onClick={() => navigate(`/kit/${id}/create`)}
                leftIcon={<Plus className="h-4 w-4" />}
              >
                Create New Image
              </Button>
            </div>

            {images.length === 0 && !isLoading ? (
              <div className="text-center py-20">
                <p className="text-gray-600 dark:text-gray-400 mb-4">
                  No images have been generated yet
                </p>
                <Button
                  onClick={() => navigate(`/kit/${id}/create`)}
                  leftIcon={<Plus className="h-4 w-4" />} 
                >
                  Generate Your First Image
                </Button>
              </div>
            ) : (
              <div className="relative">
                {isPageLoading && (
                  <div className="absolute inset-0 bg-white/50 dark:bg-gray-900/50 backdrop-blur-sm z-10 flex items-center justify-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-brand-600"></div>
                  </div>
                )}
                <Masonry
                  breakpointCols={breakpointColumns}
                  className="flex -ml-4 w-auto"
                  columnClassName="pl-4 bg-clip-padding"
                >
                  {images.map((asset, index) => (
                    <motion.div
                      key={asset.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3, delay: index * 0.05 }}
                      className="mb-4"
                    >
                      <div 
                        className="relative group cursor-pointer overflow-hidden rounded-xl"
                        onClick={() => handleImageSelect(asset)}
                      >
                        <OptimizedImage
                          src={asset.image_url || asset.image_data}
                          alt={asset.image_prompt || `Generated image ${index + 1}`}
                          className="w-full h-auto object-cover rounded-xl transition-transform duration-300 group-hover:scale-105"
                          isThumbnail={true}
                          fullResolutionSrc={asset.image_url || asset.image_data}
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end p-4">
                          <div className="w-full flex justify-between items-center">
                            <div className="flex items-center gap-2">
                              <span className="text-white text-sm">
                                {formatDate(asset.created_at)}
                              </span>
                              {asset.image_prompt && (
                                <MessageSquare className="h-4 w-4 text-white/70" />
                              )}
                            </div>
                            <div className="flex gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDeleteImage(asset.id);
                                }}
                                leftIcon={<Trash2 className="h-4 w-4" />}
                                className="bg-white/10 backdrop-blur-sm border-white/20 text-white hover:bg-red-500/20 hover:border-red-500/20"
                                isLoading={isDeletingImage}
                              >
                                Delete
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDownload(asset.image_url || asset.image_data, index);
                                }}
                                leftIcon={<Download className="h-4 w-4" />}
                                className="bg-white/10 backdrop-blur-sm border-white/20 text-white hover:bg-white/20"
                              >
                                Download
                              </Button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </Masonry>
                {totalPages > 1 && (
                  <div className="mt-8 flex justify-center items-center space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handlePageChange(currentPage - 1)}
                      disabled={currentPage === 1 || isPageLoading}
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
                          disabled={isPageLoading}
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
                      disabled={currentPage === totalPages || isPageLoading}
                      rightIcon={<ChevronRight className="h-4 w-4" />}
                    >
                      Next
                    </Button>
                  </div>
                )}
              </div>
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
            onClick={handleCloseModal}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white dark:bg-gray-900 rounded-xl shadow-xl w-full max-w-5xl max-h-[95vh] sm:max-h-[90vh] overflow-auto"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Close Button - Sticky on mobile */}
              <div className="sticky top-0 z-10 bg-white dark:bg-gray-900 p-2 flex justify-end border-b border-gray-200 dark:border-gray-800">
                <button
                  onClick={handleCloseModal}
                  className="p-1.5 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors"
                  aria-label="Close modal"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
              
              {/* Image & Details Section */}
              <div className="flex flex-col lg:flex-row">
                {/* Image Section */}
                <div className="w-full lg:w-2/3 bg-black p-2 sm:p-4 flex items-center justify-center min-h-[40vh] lg:min-h-[60vh]">
                  <OptimizedImage
                    src={selectedImage.image_url || selectedImage.image_data}
                    alt={selectedImage.image_prompt || "Selected image"}
                    className="max-w-full max-h-[calc(95vh-200px)] sm:max-h-[80vh] object-contain"
                    isThumbnail={false}
                    fullResolutionSrc={selectedImage.image_url || selectedImage.image_data}
                  />
                </div>
                
                {/* Details Section */}
                <div className="w-full lg:w-1/3 p-4 sm:p-6 flex flex-col border-t lg:border-t-0 lg:border-l border-gray-200 dark:border-gray-800">
                  <h3 className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-white mb-4 sm:mb-6">
                    Image Details
                  </h3>
                  
                  <div className="space-y-4 sm:space-y-6 flex-grow">
                    <div>
                      <h4 className="text-xs sm:text-sm font-medium text-gray-500 dark:text-gray-400 mb-1 sm:mb-2">
                        Created
                      </h4>
                      <div className="space-y-1 sm:space-y-2">
                        <div className="flex items-center text-sm sm:text-base text-gray-600 dark:text-gray-300">
                          <Calendar className="h-4 w-4 sm:h-5 sm:w-5 mr-2 flex-shrink-0" />
                          <span>{formatDate(selectedImage.created_at)}</span>
                        </div>
                        <div className="flex items-center text-sm sm:text-base text-gray-600 dark:text-gray-300">
                          <Clock className="h-4 w-4 sm:h-5 sm:w-5 mr-2 flex-shrink-0" />
                          <span>{formatTime(selectedImage.created_at)}</span>
                        </div>
                      </div>
                    </div>

                    {selectedImage.image_prompt && (
                      <div>
                        <h4 className="text-xs sm:text-sm font-medium text-gray-500 dark:text-gray-400 mb-1 sm:mb-2">
                          Generation Prompt
                        </h4>
                        <p className="text-sm text-gray-600 dark:text-gray-300 overflow-y-auto max-h-32 sm:max-h-48 pr-2">
                          {selectedImage.image_prompt}
                        </p>
                      </div>
                    )}
                  </div>
                  
                  <div className="flex flex-col sm:flex-row gap-2 mt-6 pt-4 border-t border-gray-200 dark:border-gray-800">
                    <Button
                      variant="outline"
                      className="flex-1"
                      leftIcon={<Trash2 className="h-4 w-4" />}
                      onClick={() => handleDeleteImage(selectedImage.id)}
                      isLoading={isDeletingImage}
                      size="sm"
                    >
                      Delete
                    </Button>
                    <Button
                      variant="primary"
                      className="flex-1"
                      leftIcon={<Download className="h-4 w-4" />}
                      onClick={() => handleDownload(selectedImage.image_url || selectedImage.image_data, images.indexOf(selectedImage))}
                      size="sm"
                    >
                      Download
                    </Button>
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </Layout>
  );
};