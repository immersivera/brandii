import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { generateLogoImages } from '../lib/openai';
import { saveBrandKit } from '../lib/supabase';

export const CreatePage: React.FC = () => {
  const navigate = useNavigate();
  const [isGeneratingLogos, setIsGeneratingLogos] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [brandDetails, setBrandDetails] = useState({
    name: '',
    description: '',
    industry: '',
    logoStyle: 'wordmark',
    adjective: 'modern',
    colors: {},
    typography: {},
    logoOptions: []
  });

  const updateBrandDetails = (updates: Partial<typeof brandDetails>) => {
    setBrandDetails(prev => ({ ...prev, ...updates }));
  };

  const handleComplete = async () => {
    try {
      setIsGeneratingLogos(true);
      
      // Generate logo images with all brand details
      const logoUrls = await generateLogoImages(
        brandDetails.name,
        brandDetails.logoStyle || 'wordmark',
        brandDetails.adjective || 'modern',
        brandDetails.industry || 'business',
        brandDetails.description,
        brandDetails.colors,
        brandDetails.typography
      );
      
      // Save the generated logos in brand details
      updateBrandDetails({ logoOptions: logoUrls });
      
      setIsGeneratingLogos(false);
      setIsSaving(true);
      
      const brandKitData = {
        name: brandDetails.name,
        description: brandDetails.description,
        type: brandDetails.industry,
        colors: brandDetails.colors,
        logo: {
          type: brandDetails.logoStyle || 'wordmark',
          text: brandDetails.name,
        },
        typography: brandDetails.typography,
      };

      await toast.promise(
        saveBrandKit(brandKitData, logoUrls),
        {
          loading: 'Saving your brand kit...',
          success: 'Brand kit saved successfully!',
          error: 'Failed to save brand kit',
        }
      );

      navigate('/result');
    } catch (error) {
      console.error('Error completing brand kit:', error);
      toast.error('Failed to complete brand kit');
      setIsGeneratingLogos(false);
      setIsSaving(false);
    }
  };

  return (
    <div>
      {/* Your existing JSX content */}
    </div>
  );
};

export default CreatePage;