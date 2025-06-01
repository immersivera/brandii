import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Image } from 'lucide-react';

export function BrandKitPage() {
  const navigate = useNavigate();
  // These would typically come from your context or props
  const [brandKit, setBrandKit] = React.useState<any>(null);
  const [currentValues, setCurrentValues] = React.useState<any>({
    name: '',
    colors: {
      primary: '#8B5CF6'
    }
  });

  const handleLogoSelect = (assetId: string) => {
    // Implementation for logo selection
    if (brandKit) {
      setBrandKit({
        ...brandKit,
        logo_selected_asset_id: assetId
      });
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
              Logo Concepts
            </h3>
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate(`/kit/${brandKit?.id}/gallery`)}
              className="flex items-center gap-2"
            >
              <Image className="h-4 w-4" />
              View Image Gallery
            </Button>
          </div>
          
          {brandKit?.generated_assets && brandKit.generated_assets.filter(asset => asset.type === 'logo').length > 0 ? (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                {brandKit.generated_assets
                  .filter(asset => asset.type === 'logo')
                  .map((asset) => (
                    <div
                      key={asset.id}
                      className={`relative border-2 rounded-lg overflow-hidden cursor-pointer transition-all ${
                        brandKit.logo_selected_asset_id === asset.id
                          ? 'border-brand-600 shadow-lg'
                          : 'border-gray-200 dark:border-gray-700'
                      }`}
                      onClick={() => handleLogoSelect(asset.id)}
                    >
                      <img
                        src={asset.image_data}
                        alt="Logo concept"
                        className="w-full h-auto"
                      />
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
              
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Click on a logo concept to select it. The selected logo will be included in your brand kit download.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-6 flex items-center justify-center bg-white dark:bg-gray-800 h-40">
                <div 
                  className="text-3xl font-bold"
                  style={{ color: currentValues.colors.primary }}
                >
                  {currentValues.name}
                </div>
              </div>
              
              <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-6 flex items-center justify-center bg-white dark:bg-gray-800 h-40">
                <div 
                  className="flex flex-col items-center"
                  style={{ color: currentValues.colors.primary }}
                >
                  <div className="text-5xl font-bold mb-1">
                    {currentValues.name.charAt(0)}
                  </div>
                  <div className="text-sm font-medium">
                    {currentValues.name}
                  </div>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}