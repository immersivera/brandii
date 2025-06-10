import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useParams, useNavigate } from 'react-router-dom';
import { Layout } from '../components/layout/Layout';
import { Button } from '../components/ui/Button';
import { ArrowLeft, Download, Plus, X, Calendar, Clock, Trash2, MessageSquare, ChevronLeft, ChevronRight } from 'lucide-react';
import { supabase, deleteGeneratedAsset } from '../lib/supabase';
import toast from 'react-hot-toast';
import Masonry from 'react-masonry-css';
import OptimizedImage from '../components/ui/OptimizedImage';

const ITEMS_PER_PAGE = 12;

export const GalleryPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [images, setImages] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isPageLoading, setIsPageLoading] = useState(false);
  const [selectedImage, setSelectedImage] = useState<any | null>(null);
  const [isDeletingImage, setIsDeletingImage] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [brandKit, setBrandKit] = useState<any>(null);

  const breakpointColumns = {
    default: 4,
    1536: 4,
    1280: 3,
    1024: 3,
    768: 2,
    640: 1
  };

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
        const { data, error, count } = await supabase
          .from('generated_assets')
          .select('*', { count: 'exact' })
          .eq('brand_kit_id', id)
          .eq('type', 'image')
          .order('created_at', { ascending: false })
          .range((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE - 1);
        if (error) throw error;
        setTotalItems(count || 0);
        setImages(data || []);
      } catch (error) {
        toast.error('Failed to load images');
      } finally {
        setIsLoading(false);
        setIsPageLoading(false);
      }
    };
    if (id) fetchImages();
  }, [id, currentPage]);

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
            <div className="flex items-center justify-between mb-8">
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
                  View and manage your brand's generated images
                </p>
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
                        onClick={() => setSelectedImage(asset)}
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
            onClick={() => setSelectedImage(null)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white dark:bg-gray-900 rounded-xl shadow-xl max-w-5xl w-full max-h-[90vh] overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Image & Details Section (modal) */}
              <div className="flex flex-col md:flex-row h-full">
                {/* Image Section */}
                <div className="w-full md:w-2/3 bg-black p-4 flex items-center justify-center">
                  <OptimizedImage
                    src={selectedImage.image_url || selectedImage.image_data}
                    alt={selectedImage.image_prompt || "Selected image"}
                    className="max-w-full max-h-[50vh] md:max-h-[80vh] object-contain rounded-lg"
                    isThumbnail={false}
                    fullResolutionSrc={selectedImage.image_url || selectedImage.image_data}
                  />
                </div>
                {/* Details Section */}
                <div className="w-full md:w-1/3 p-6 flex flex-col">
                  <div className="flex justify-between items-start mb-6">
                    <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                      Image Details
                    </h3>
                    <button
                      onClick={() => setSelectedImage(null)}
                      className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-colors"
                    >
                      <X className="h-5 w-5" />
                    </button>
                  </div>
                  <div className="space-y-6 flex-grow">
                    <div>
                      <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">
                        Created
                      </h4>
                      <div className="space-y-2">
                        <div className="flex items-center text-gray-600 dark:text-gray-300">
                          <Calendar className="h-4 w-4 mr-2" />
                          <span>{formatDate(selectedImage.created_at)}</span>
                        </div>
                        <div className="flex items-center text-gray-600 dark:text-gray-300">
                          <Clock className="h-4 w-4 mr-2" />
                          <span>{formatTime(selectedImage.created_at)}</span>
                        </div>
                      </div>
                    </div>

                    {selectedImage.image_prompt && (
                      <div>
                        <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">
                          Generation Prompt
                        </h4>
                        <p className="text-gray-600 dark:text-gray-300 text-sm">
                          {selectedImage.image_prompt}
                        </p>
                      </div>
                    )}
                  </div>
                  <div className="flex gap-2 mt-6">
                    <Button
                      variant="outline"
                      className="w-1/2"
                      leftIcon={<Trash2 className="h-4 w-4" />}
                      onClick={() => handleDeleteImage(selectedImage.id)}
                      isLoading={isDeletingImage}
                    >
                      Delete
                    </Button>
                    <Button
                      variant="primary"
                      className="w-1/2"
                      leftIcon={<Download className="h-4 w-4" />}
                      onClick={() => handleDownload(selectedImage.image_url || selectedImage.image_data, images.indexOf(selectedImage))}
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