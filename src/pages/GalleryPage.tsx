import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useParams, useNavigate } from 'react-router-dom';
import { Layout } from '../components/layout/Layout';
import { Button } from '../components/ui/Button';
import { Card, CardContent } from '../components/ui/Card';
import { ArrowLeft, Download, Plus } from 'lucide-react';
import { BrandKit, fetchBrandKitById } from '../lib/supabase';
import toast from 'react-hot-toast';

export const GalleryPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [brandKit, setBrandKit] = useState<BrandKit | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadBrandKit = async () => {
      if (!id) return;
      
      try {
        const kit = await fetchBrandKitById(id);
        if (kit) {
          setBrandKit(kit);
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

  const handleDownload = (imageUrl: string, index: number) => {
    const link = document.createElement('a');
    link.href = imageUrl;
    link.download = `${brandKit?.name.toLowerCase().replace(/\s+/g, '-')}-image-${index + 1}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
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

  if (!brandKit) return null;

  const imageAssets = brandKit.generated_assets?.filter(asset => asset.type === 'image') || [];

  return (
    <Layout>
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-12">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-6xl mx-auto">
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

            {imageAssets.length === 0 ? (
              <Card>
                <CardContent className="p-8 text-center">
                  <p className="text-gray-600 dark:text-gray-400 mb-4">
                    No images have been generated yet
                  </p>
                  <Button
                    onClick={() => navigate(`/kit/${id}/create`)}
                    leftIcon={<Plus className="h-4 w-4" />}
                  >
                    Generate Your First Image
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {imageAssets.map((asset, index) => (
                  <motion.div
                    key={asset.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: index * 0.1 }}
                  >
                    <Card hover>
                      <CardContent className="p-4">
                        <img
                          src={asset.image_data}
                          alt={`Generated image ${index + 1}`}
                          className="w-full h-48 object-cover rounded-lg mb-4"
                        />
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDownload(asset.image_data!, index)}
                          leftIcon={<Download className="h-4 w-4" />}
                          className="w-full"
                        >
                          Download Image
                        </Button>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
};