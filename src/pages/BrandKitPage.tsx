import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Layout } from '../components/layout/Layout';
import { Button } from '../components/ui/Button';
import { Card, CardContent } from '../components/ui/Card';
import { Trash2, Sparkles, ArrowLeft } from 'lucide-react';
import toast from 'react-hot-toast';
import { fetchBrandKitById, updateBrandKit, generateLogoImages, saveGeneratedAssets } from '../lib/supabase';
import type { BrandKit } from '../lib/supabase';

export const BrandKitPage: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [brandKit, setBrandKit] = useState<BrandKit | null>(null);
  const [loading, setLoading] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);

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
        setLoading(false);
      }
    };

    loadBrandKit();
  }, [id, navigate]);

  const handleGenerateLogos = async () => {
    if (!brandKit) return;

    try {
      setIsGenerating(true);
      const logoUrls = await generateLogoImages({
        brandName: brandKit.name,
        style: brandKit.logo.type || 'wordmark',
        colors: {
          primary: brandKit.colors.primary,
          secondary: brandKit.colors.secondary,
          accent: brandKit.colors.accent
        },
        description: brandKit.description,
        industry: brandKit.type,
        personality: 'modern' // Default personality
      });

      // Save the generated logos
      await saveGeneratedAssets(brandKit.id, logoUrls, 'logo');

      // Refresh brand kit data to show new logos
      const updatedKit = await fetchBrandKitById(brandKit.id);
      if (updatedKit) {
        setBrandKit(updatedKit);
      }

      toast.success('New logos generated successfully!');
    } catch (error) {
      console.error('Error generating logos:', error);
      toast.error('Failed to generate logos');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDeleteAllLogos = async () => {
    if (!brandKit || !confirm('Are you sure you want to delete all logos?')) return;

    try {
      const updatedBrandKit = await updateBrandKit(brandKit.id, {
        generated_assets: [],
        logo_selected_asset_id: null
      });

      setBrandKit(updatedBrandKit);
      toast.success('All logos deleted successfully');
    } catch (error) {
      console.error('Error deleting logos:', error);
      toast.error('Failed to delete logos');
    }
  };

  const handleDeleteLogo = async (assetId: string) => {
    if (!brandKit || !confirm('Are you sure you want to delete this logo?')) return;

    try {
      // If deleting the selected logo, clear the selection
      if (brandKit.logo_selected_asset_id === assetId) {
        await updateBrandKit(brandKit.id, {
          logo_selected_asset_id: null
        });
      }

      // Remove the logo from generated assets
      const updatedBrandKit = await updateBrandKit(brandKit.id, {
        generated_assets: brandKit.generated_assets?.filter(asset => asset.id !== assetId) || []
      });

      setBrandKit(updatedBrandKit);
      toast.success('Logo deleted successfully');
    } catch (error) {
      console.error('Error deleting logo:', error);
      toast.error('Failed to delete logo');
    }
  };

  const handleSelectLogo = async (assetId: string) => {
    if (!brandKit) return;

    try {
      const updatedBrandKit = await updateBrandKit(brandKit.id, {
        logo_selected_asset_id: assetId
      });

      setBrandKit(updatedBrandKit);
      toast.success('Logo selected successfully');
    } catch (error) {
      console.error('Error selecting logo:', error);
      toast.error('Failed to select logo');
    }
  };

  if (loading) {
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

  const logoAssets = brandKit.generated_assets?.filter(asset => asset.type === 'logo') || [];

  return (
    <Layout>
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-12">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-4xl mx-auto">
            <div className="flex items-center justify-between mb-8">
              <div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => navigate('/library')}
                  leftIcon={<ArrowLeft className="h-4 w-4" />}
                  className="mb-4"
                >
                  Back to Library
                </Button>
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                  {brandKit.name}
                </h1>
                <p className="text-gray-600 dark:text-gray-400">
                  {brandKit.description}
                </p>
              </div>
            </div>

            {/* Uploaded Logo Section */}
            {brandKit.logo.image && (
              <Card className="mb-8">
                <CardContent className="p-6">
                  <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">
                    Uploaded Logo
                  </h2>
                  <div className="flex items-center justify-center bg-gray-100 dark:bg-gray-800 rounded-lg p-8">
                    <img
                      src={brandKit.logo.image}
                      alt="Uploaded logo"
                      className="max-h-32 w-auto"
                    />
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Logo Concepts Section */}
            <Card className="mb-8">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                    Logo Concepts
                  </h2>
                  <div className="flex gap-3">
                    {logoAssets.length > 0 && (
                      <Button
                        variant="outline"
                        onClick={handleDeleteAllLogos}
                        leftIcon={<Trash2 className="h-4 w-4" />}
                      >
                        Delete All
                      </Button>
                    )}
                    <Button
                      onClick={handleGenerateLogos}
                      leftIcon={<Sparkles className="h-4 w-4" />}
                      isLoading={isGenerating}
                    >
                      Generate New Logos
                    </Button>
                  </div>
                </div>

                {logoAssets.length === 0 ? (
                  <div className="text-center py-12 text-gray-500 dark:text-gray-400">
                    No logo concepts generated yet. Click "Generate New Logos" to create some options.
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-4">
                    {logoAssets.map((asset) => (
                      <div
                        key={asset.id}
                        className={`relative border-2 rounded-lg overflow-hidden transition-all ${
                          brandKit.logo_selected_asset_id === asset.id
                            ? 'border-brand-600 shadow-lg'
                            : 'border-gray-200 dark:border-gray-700'
                        }`}
                      >
                        <img
                          src={asset.image_data}
                          alt="Logo concept"
                          className="w-full h-auto cursor-pointer"
                          style={{ 
                            backgroundColor: brandKit.colors.background
                          }}
                          onClick={() => handleSelectLogo(asset.id)}
                        />
                        <div className="absolute top-2 right-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteLogo(asset.id);
                            }}
                            className="bg-white/10 backdrop-blur-sm border-white/20 text-white hover:bg-red-500/20 hover:border-red-500/20"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                        {brandKit.logo_selected_asset_id === asset.id && (
                          <div className="absolute inset-0 bg-brand-600/10 flex items-center justify-center">
                            <div className="bg-brand-600 text-white px-3 py-1 rounded-full text-sm">
                              Selected
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </Layout>
  );
};