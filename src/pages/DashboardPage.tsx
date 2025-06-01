import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Layout } from '../components/layout/Layout';
import { Button } from '../components/ui/Button';
import { Card, CardContent } from '../components/ui/Card';
import { Plus, Image, Settings, ArrowRight } from 'lucide-react';
import { fetchBrandKits, type BrandKit } from '../lib/supabase';
import toast from 'react-hot-toast';

export const DashboardPage: React.FC = () => {
  const [brandKits, setBrandKits] = useState<BrandKit[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

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

  if (brandKits.length === 0) {
    navigate('/create');
    return null;
  }

  return (
    <Layout>
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-12">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-6xl mx-auto">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                  Your Brand Kits
                </h1>
                <p className="text-gray-600 dark:text-gray-400">
                  Select a brand kit to manage or create a new one
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
              {brandKits.map((brandKit, index) => (
                <motion.div
                  key={brandKit.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: index * 0.1 }}
                >
                  <Card hover interactive className="h-full">
                    <CardContent className="p-0">
                      <div 
                        className="h-32 w-full rounded-t-xl bg-gradient-to-br flex items-center justify-center"
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
                      
                      <div className="p-6">
                        <h3 className="text-xl font-semibold mb-2 text-gray-900 dark:text-white">
                          {brandKit.name}
                        </h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                          {brandKit.description}
                        </p>
                        
                        <div className="grid grid-cols-2 gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => navigate(`/kit/${brandKit.id}`)}
                            leftIcon={<Settings className="h-4 w-4" />}
                          >
                            Manage
                          </Button>
                          <Button
                            size="sm"
                            onClick={() => navigate(`/kit/${brandKit.id}/create`)}
                            leftIcon={<Image className="h-4 w-4" />}
                            rightIcon={<ArrowRight className="h-4 w-4" />}
                          >
                            Create
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};