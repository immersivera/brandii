import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Button } from '@/components/ui/Button';
import { Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { updateBrandKit } from '@/lib/supabase';

export const BrandKitPage: React.FC = () => {
  const { id } = useParams();
  const [brandKit, setBrandKit] = useState(null);
  const [loading, setLoading] = useState(true);

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

  const logoAssets = brandKit?.generated_assets || [];

  return (
    <div className="container mx-auto px-4 py-8">
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
    </div>
  );
};