import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Layout } from '../components/layout/Layout';
import { Button } from '../components/ui/Button';
import { Download, X, Calendar, Clock, ExternalLink } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useUser } from '../context/UserContext';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import Masonry from 'react-masonry-css';

interface ImageDetails {
  id: string;
  image_data: string;
  created_at: string;
  brand_kit: {
    id: string;
    name: string;
    description: string;
    type: string;
    user_id: string;
  } | null;
}

export const GlobalGalleryPage: React.FC = () => {
  const [images, setImages] = useState<ImageDetails[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState<ImageDetails | null>(null);
  const { userId } = useUser();

  const breakpointColumns = {
    default: 4,
    1536: 4,
    1280: 3,
    1024: 3,
    768: 2,
    640: 1
  };

  useEffect(() => {
    const fetchImages = async () => {
      try {
        const { data, error } = await supabase
          .from('generated_assets')
          .select(`
            id, 
            image_data, 
            created_at,
            brand_kit:brand_kit_id (
              id,
              name,
              description,
              type,
              user_id
            )
          `)
          .eq('type', 'image')
          .order('created_at', { ascending: false });

        if (error) throw error;
        setImages(data || []);
      } catch (error) {
        console.error('Error fetching images:', error);
        toast.error('Failed to load images');
      } finally {
        setIsLoading(false);
      }
    };

    fetchImages();
  }, []);

  const handleDownload = (imageUrl: string, index: number) => {
    const link = document.createElement('a');
    link.href = imageUrl;
    link.download = `generated-image-${index + 1}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
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

  if (isLoading) {
    return (
      <Layout>
        <div className="min-h-screen bg-gray-900 py-12">
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
      <div className="min-h-screen bg-gray-900 py-12">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-[1920px] mx-auto">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h1 className="text-3xl font-bold text-white mb-2">
                  Community Gallery
                </h1>
                <p className="text-gray-400">
                  Explore AI-generated images from our community
                </p>
              </div>
            </div>

            {images.length === 0 ? (
              <div className="text-center py-20">
                <p className="text-gray-400">
                  No images have been generated yet
                </p>
              </div>
            ) : (
              <Masonry
                breakpointCols={breakpointColumns}
                className="flex -ml-4 w-auto"
                columnClassName="pl-4 bg-clip-padding"
              >
                {images.map((image, index) => (
                  <motion.div
                    key={image.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: index * 0.05 }}
                    className="mb-4"
                  >
                    <div 
                      className="relative group cursor-pointer overflow-hidden rounded-xl"
                      onClick={() => setSelectedImage(image)}
                    >
                      <img
                        src={image.image_data}
                        alt={`Generated image ${index + 1}`}
                        className="w-full h-auto object-cover rounded-xl transition-transform duration-300 group-hover:scale-105"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end p-4">
                        <div className="w-full flex justify-between items-center">
                          <span className="text-white text-sm">
                            {formatDate(image.created_at)}
                          </span>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDownload(image.image_data, index);
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
              className="bg-gray-900 rounded-xl shadow-xl max-w-5xl w-full max-h-[90vh] overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex h-full">
                {/* Image Section */}
                <div className="w-2/3 bg-black p-4 flex items-center justify-center">
                  <img
                    src={selectedImage.image_data}
                    alt="Selected image"
                    className="max-w-full max-h-[80vh] object-contain rounded-lg"
                  />
                </div>

                {/* Details Section */}
                <div className="w-1/3 p-6 flex flex-col">
                  <div className="flex justify-between items-start mb-6">
                    <h3 className="text-xl font-semibold text-white">
                      Image Details
                    </h3>
                    <button
                      onClick={() => setSelectedImage(null)}
                      className="text-gray-400 hover:text-gray-200 transition-colors"
                    >
                      <X className="h-5 w-5" />
                    </button>
                  </div>

                  <div className="space-y-6 flex-grow">
                    {selectedImage.brand_kit && (
                      <div>
                        <h4 className="text-sm font-medium text-gray-400 mb-1">
                          Brand Kit
                        </h4>
                        <p className="text-white font-medium">
                          {selectedImage.brand_kit.name}
                        </p>
                        <p className="text-sm text-gray-300 mt-1">
                          {selectedImage.brand_kit.description}
                        </p>
                        {isImageOwner(selectedImage) && (
                          <Link
                            to={`/kit/${selectedImage.brand_kit.id}`}
                            className="inline-flex items-center mt-2 text-sm text-brand-400 hover:text-brand-300"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <ExternalLink className="h-4 w-4 mr-1" />
                            View Brand Kit
                          </Link>
                        )}
                      </div>
                    )}

                    <div>
                      <h4 className="text-sm font-medium text-gray-400 mb-2">
                        Created
                      </h4>
                      <div className="space-y-2">
                        <div className="flex items-center text-gray-300">
                          <Calendar className="h-4 w-4 mr-2" />
                          <span>{formatDate(selectedImage.created_at)}</span>
                        </div>
                        <div className="flex items-center text-gray-300">
                          <Clock className="h-4 w-4 mr-2" />
                          <span>{formatTime(selectedImage.created_at)}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <Button
                    className="w-full mt-6"
                    leftIcon={<Download className="h-4 w-4" />}
                    onClick={() => handleDownload(selectedImage.image_data, 0)}
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