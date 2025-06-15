import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Layout } from '../components/layout/Layout';
import { Button } from '../components/ui/Button';
import { Download, X, Calendar, Clock, ExternalLink, ChevronLeft, ChevronRight, MessageSquare, Search } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useUser } from '../context/UserContext';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import Masonry from 'react-masonry-css';
import OptimizedImage from '../components/ui/OptimizedImage';
import { Skeleton } from '../components/ui/Skeleton';
import { useDebounce } from '../lib/utils';

interface ImageDetails {
  id: string;
  image_data: string;
  image_url: string;
  image_prompt?: string;
  created_at: string;
  brand_kit: {
    id: string;
    name: string;
    description: string;
    type: string;
    user_id: string;
  } | null;
}

const ITEMS_PER_PAGE = 12;

export const GlobalGalleryPage: React.FC = () => {
  const [images, setImages] = useState<ImageDetails[] | any>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isPageLoading, setIsPageLoading] = useState(false);
  const [selectedImage, setSelectedImage] = useState<ImageDetails | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const { userId } = useUser();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const debouncedSearchQuery = useDebounce(searchQuery, 500);

  const breakpointColumns = {
    default: 4,
    1536: 4,
    1280: 3,
    1024: 2,
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
  if (imageId) {
    //save to localStorage
    localStorage.setItem('pendingGlobalImageId', imageId);
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
          .eq('type', 'image')
          // .not('image_url', 'is', null)
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
        
        // Only show images from the current page
        setImages(data || []);
        
      } catch (error) {
        console.error('Error fetching images:', error);
        toast.error('Failed to load images. Please try again.');
      } finally {
        setIsLoading(false);
        setIsPageLoading(false);
      }
    };

    fetchImages();
    handlePageChange(currentPage);
  }, [currentPage, debouncedSearchQuery]);


  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
    setCurrentPage(1); // Reset to first page when searching
  };
  const handleDownload = async (imageUrl: string, index: number) => {
    try {
      // If it's a base64 data URL, handle it directly
      if (imageUrl.startsWith('data:')) {
        const link = document.createElement('a');
        link.href = imageUrl;
        link.download = `generated-image-${index + 1}.png`;
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
      link.download = `generated-image-${index + 1}.png`;
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

  const isImageOwner = (image: ImageDetails) => {
    return image.brand_kit?.user_id === userId;
  };

  const totalPages = Math.ceil(totalItems / ITEMS_PER_PAGE);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    if (images.length > 0) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  // Handle image selection from URL on component mount
  useEffect(() => {
    const imageId = localStorage.getItem('pendingGlobalImageId');
    if (imageId && !selectedImage) {
      const imageToSelect = images.find((img: any) => img.id === imageId);
      if (imageToSelect) {
        setSelectedImage(imageToSelect);
        // Clear the pending image after setting it
        localStorage.removeItem('pendingGlobalImageId');
        // Update URL with the new image ID
        const params = new URLSearchParams(searchParams);
        params.set('image', imageId);
        navigate(`?${params.toString()}`, { replace: true });
      }
    }
  }, [images, selectedImage]);

  // Update URL when an image is selected
  const handleImageSelect = (image: any) => {
    setSelectedImage(image);
    const params = new URLSearchParams(searchParams);
    params.set('image', image.id);
    navigate(`?${params.toString()}`, { replace: true });
  };

  // Update URL when modal is closed
  const handleCloseModal = () => {
    setSelectedImage(null);
    const params = new URLSearchParams(searchParams);
    params.delete('image');
    navigate(`?${params.toString()}`, { replace: true });
  };

  return (
    <Layout>
      <div className="min-h-screen bg-white dark:bg-gray-900 py-12">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-[1920px] mx-auto">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
              <div>
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Community Gallery</h1>
                Explore AI-generated images from our community.
                <p className="text-gray-600 dark:text-gray-400 mt-1 hidden">
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
                  onChange={handleSearch}
                />
              </div>
            </div>

            {/* Conditional rendering for image grid area */}
            {isLoading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mt-8">
                {[...Array(ITEMS_PER_PAGE)].map((_, i) => (
                  <Skeleton key={`skel-${i}`} className="aspect-square rounded-xl" />
                ))}
              </div>
            ) : images.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-gray-500 dark:text-gray-400 text-lg">
                  {debouncedSearchQuery 
                    ? `No images found for "${debouncedSearchQuery}".`
                    : 'No images in the gallery yet.'}
                </p>
                {debouncedSearchQuery && (
                  <Button
                    variant="outline"
                    className="mt-6"
                    onClick={() => {
                      setSearchQuery('');
                      setCurrentPage(1);
                    }}
                  >
                    Clear Search
                  </Button>
                )}
              </div>
            ) : (
              <>
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
                    {images?.map((image: any, index: any) => (
                      <motion.div
                        key={image.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3, delay: index * 0.05 }}
                        className="mb-4"
                      >
                        <div 
                          className="relative group cursor-pointer overflow-hidden rounded-xl"
                          onClick={() => handleImageSelect(image)}
                        >
                          <OptimizedImage
                            src={image.image_url || image.image_data}
                            alt={image.image_prompt || 'Generated image'}
                            className="w-full h-auto object-cover rounded-xl transition-transform duration-300 group-hover:scale-105"
                            isThumbnail={true}
                            fullResolutionSrc={image.image_url}
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end p-4">
                            <div className="w-full flex justify-between items-center">
                              <div className="flex items-center gap-2">
                                <span className="text-white text-sm">
                                  {formatDate(image.created_at)}
                                </span>
                                {image.image_prompt && (
                                  <MessageSquare className="h-4 w-4 text-white/70" />
                                )}
                              </div>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDownload((image.image_url || image.image_data), index);
                                }}
                                leftIcon={<Download className="h-4 w-4" />}
                                className="bg-white/10 backdrop-blur-sm border-white/20 text-white hover:bg-white/20"
                              >
                                Download
                              </Button>
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </Masonry>
                </div>

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
                      {/* Smart Pagination: Show up to 5 page numbers, centered around current page */}
                    {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                      let pageNum;
                      if (totalPages <= 5) {
                        pageNum = i + 1;
                      } else if (currentPage <= 3) {
                        pageNum = i + 1;
                      } else if (currentPage >= totalPages - 2) {
                        pageNum = totalPages - 4 + i;
                      } else {
                        pageNum = currentPage - 2 + i;
                      }
                      return pageNum;
                    }).map((page) => page && ( // Render button only if pageNum is valid
                        <Button
                          key={page}
                          variant={currentPage === page ? 'primary' : 'outline'}
                          size="sm"
                          onClick={() => handlePageChange(page)}
                          disabled={isPageLoading}
                          className={`w-8 ${
                            currentPage === page
                              ? 'bg-brand-600 text-white hover:bg-brand-700'
                              : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
                          } transition-colors w-9 h-9 p-0`}
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
              </>
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
            className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-2 sm:p-4"
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
              <div className="sticky top-0 z-10 bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm p-2 flex justify-end border-b border-gray-200/50 dark:border-gray-800/50">
                <button
                  onClick={handleCloseModal}
                  className="p-1.5 rounded-full bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm shadow-sm border border-gray-200 dark:border-gray-700 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors"
                  aria-label="Close modal"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
              
              <div className="flex flex-col lg:flex-row">
                {/* Image Section */}
                <div className="w-full lg:w-2/3 bg-black p-2 sm:p-4 flex items-center justify-center min-h-[40vh] lg:min-h-[60vh]">
                  <OptimizedImage
                    src={selectedImage.image_url || selectedImage.image_data}
                    alt={selectedImage.image_prompt || 'Generated image'}
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
                    {selectedImage.brand_kit && (
                      <div>
                        <h4 className="text-xs sm:text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
                          Brand Kit
                        </h4>
                        <p className="text-sm sm:text-base text-gray-900 dark:text-white font-medium">
                          {selectedImage.brand_kit.name}
                        </p>
                        {selectedImage.brand_kit.description && (
                          <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-300 mt-1">
                            {selectedImage.brand_kit.description}
                          </p>
                        )}
                        {isImageOwner(selectedImage) && (
                          <Link
                            to={`/kit/${selectedImage.brand_kit.id}`}
                            className="inline-flex items-center mt-2 text-xs sm:text-sm text-brand-600 dark:text-brand-400 hover:text-brand-700 dark:hover:text-brand-300"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <ExternalLink className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1" />
                            View Brand Kit
                          </Link>
                        )}
                      </div>
                    )}

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
                        <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-300 overflow-y-auto max-h-32 sm:max-h-48 pr-2">
                          {selectedImage.image_prompt}
                        </p>
                      </div>
                    )}
                  </div>

                  <Button
                    className="w-full mt-6"
                    leftIcon={<Download className="h-4 w-4" />}
                    onClick={() => handleDownload(selectedImage.image_url || selectedImage.image_data, images.indexOf(selectedImage))}
                    size="sm"
                  >
                    Download Image
                  </Button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </Layout>
  );
};