import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Layout } from '../components/layout/Layout';
import { Button } from '../components/ui/Button';
import { Card, CardContent } from '../components/ui/Card';
import { Plus, Image, ArrowRight } from 'lucide-react';
import { checkUserHasBrandKit } from '../lib/supabase';
import { useUser } from '../context/UserContext';
import toast from 'react-hot-toast';
import { useBrand } from '../context/BrandContext';

export const CreatePage: React.FC = () => {
  const [hasExistingBrandKits, setHasExistingBrandKits] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const { userId } = useUser();
  const navigate = useNavigate();
  const { resetBrandDetails } = useBrand();
  useEffect(() => {
    const checkExistingBrandKits = async () => {
      if (!userId) return;

      try {
        const hasBrandKit = await checkUserHasBrandKit();
        setHasExistingBrandKits(hasBrandKit);
      } catch (error) {
        console.error('Error checking brand kits:', error);
        toast.error('Failed to check existing brand kits');
      } finally {
        setIsLoading(false);
      }
    };

    checkExistingBrandKits();
  }, [userId]);

  const handleMediaAssetsClick = () => {
    if (!hasExistingBrandKits) {
      toast.error('Please create a brand kit first before generating media assets');
      return;
    }
    navigate('/dashboard');
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

  return (
    <Layout>
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-12">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-12">
              <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
                What would you like to create?
              </h1>
              <p className="text-xl text-gray-600 dark:text-gray-400">
                Choose an option to get started
              </p>
            </div>

            <div className={`grid grid-cols-1 ${hasExistingBrandKits ? '' : 'md:grid-cols-2'} gap-8`}>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: hasExistingBrandKits ? 0.1 : 0 }}
                className={hasExistingBrandKits ? 'order-1' : 'order-2'}
              >
                <Card 
                  hover 
                  interactive 
                  onClick={handleMediaAssetsClick}
                  className={`h-full transition-all ${hasExistingBrandKits ? 'border-2 border-brand-500 shadow-lg' : ''}`}
                >
                  <CardContent className={`p-8 flex flex-col items-center text-center ${hasExistingBrandKits ? 'pt-12' : ''}`}>
                   
                    <div className={`${hasExistingBrandKits ? 'w-20 h-20' : 'w-16 h-16'} bg-accent-100 dark:bg-accent-900/30 rounded-full flex items-center justify-center mb-6`}>
                      <Image className={`${hasExistingBrandKits ? 'h-10 w-10' : 'h-8 w-8'} text-accent-600`} />
                    </div>
                    <h2 className={`${hasExistingBrandKits ? 'text-3xl' : 'text-2xl'} font-semibold text-gray-900 dark:text-white mb-3`}>
                      Create Media Assets
                    </h2>
                    <p className="text-gray-600 dark:text-gray-400 mb-6">
                      Generate images and content using your existing brand kits
                    </p>
                    <Button
                      rightIcon={<ArrowRight className="h-4 w-4" />}
                      className={`mt-auto ${hasExistingBrandKits ? 'px-6 py-2' : ''}`}
                      variant={hasExistingBrandKits ? 'primary' : 'outline'}
                      size={hasExistingBrandKits ? 'lg' : 'md'}
                    >
                      {hasExistingBrandKits ? 'Start Creating' : 'Get Started'}
                    </Button>
                  </CardContent>
                </Card>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: 0.1 }}
                className={hasExistingBrandKits ? 'mt-6 border-t pt-8 border-gray-200 dark:border-gray-800 order-2' : 'order-1'}
              >
                {hasExistingBrandKits ? (
                  <>
                  <div className="text-center">
                    <p className="text-gray-600 dark:text-gray-400 mb-4">
                      Or create a new brand kit
                    </p>
                    <Button 
                      variant="outline" 
                      onClick={() => { resetBrandDetails(); navigate('/create/new'); }}
                      className="inline-flex items-center"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      New Brand Kit
                    </Button>
                  </div>
                  </>
                ) : (
                  <Card hover interactive onClick={() => { resetBrandDetails(); navigate('/create/new');}} className="h-full">
                    <CardContent className="p-8 flex flex-col items-center text-center">
                      <div className="w-16 h-16 bg-brand-100 dark:bg-brand-900/30 rounded-full flex items-center justify-center mb-6">
                        <Plus className="h-8 w-8 text-brand-600" />
                      </div>
                      <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-3">
                        New Brand Kit
                      </h2>
                      <p className="text-gray-600 dark:text-gray-400 mb-6">
                        Create a new brand identity with colors, typography, and logo concepts
                      </p>
                      <Button
                        rightIcon={<ArrowRight className="h-4 w-4" />}
                        className="mt-auto"
                        variant="outline"
                      >
                        Get Started
                      </Button>
                    </CardContent>
                  </Card>
                )}
              </motion.div>
            </div>

            {!hasExistingBrandKits && (
              <motion.p 
                className="text-center mt-6 text-sm text-gray-500 dark:text-gray-400"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.2 }}
              >
                Create your first brand kit to start generating media assets
              </motion.p>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
};