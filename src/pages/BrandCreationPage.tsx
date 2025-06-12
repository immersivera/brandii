import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Layout } from '../components/layout/Layout';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Textarea } from '../components/ui/Textarea';
import { Select } from '../components/ui/Select';
import { Card, CardContent } from '../components/ui/Card';
import { FileUpload } from '../components/ui/FileUpload';
import { AuthModal } from '../components/AuthModal';
import { useBrand } from '../context/BrandContext';
import { useUser } from '../context/UserContext';
import { ArrowLeft, ArrowRight, Sparkles, RefreshCw, Loader } from 'lucide-react';
import { BRAND_TYPES, BRAND_ADJECTIVES, LOGO_STYLES, GOOGLE_FONTS } from '../lib/constants';
import { ColorPicker } from '../components/ui/ColorPicker';
import { saveBrandKit, fetchBrandKitById, uploadImageToStorage } from '../lib/supabase';
import { generateBrandSuggestion, generateLogoImages } from '../lib/openai';
import toast from 'react-hot-toast';

export const BrandCreationPage: React.FC = () => {
  const { brandDetails, updateBrandDetails, setStep, resetBrandDetails } = useBrand();
  const { userId, isAnonymous } = useUser();
  const [isGenerating, setIsGenerating] = useState(false);
  const [isGeneratingColors, setIsGeneratingColors] = useState(false);
  const [isGeneratingLogos, setIsGeneratingLogos] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const navigate = useNavigate();

  const handleGenerateWithAI = async () => {
    if (!brandDetails.name || !brandDetails.description) {
      toast.error('Please provide a brand name and description');
      return;
    }
    
    setIsGenerating(true);
    
    try {
      const prompt = `Generate a brand identity for a brand called "${brandDetails.name}". 
        Description: ${brandDetails.description}`;
      
      const suggestion = await generateBrandSuggestion(prompt);
      
      updateBrandDetails({
        industry: suggestion.industry,
        adjective: suggestion.adjective,
        logoStyle: suggestion.logoStyle,
        colors: suggestion.colors,
        typography: suggestion.typography,
        logoChoice: 'ai'
      });
      
      toast.success('Brand identity generated successfully!');
      // setStep(2);
    } catch (error) {
      console.error('Error generating brand identity:', error);
      toast.error('Failed to generate brand identity');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleGenerateColors = async () => {
    if (!brandDetails.name || !brandDetails.description) {
      toast.error('Please complete the brand information first');
      return;
    }

    setIsGeneratingColors(true);

    try {
      const prompt = `Generate a color palette for a brand called "${brandDetails.name}".
        Description: ${brandDetails.description}
        Industry: ${brandDetails.industry}
        Personality: ${brandDetails.adjective}`;

      const suggestion = await generateBrandSuggestion(prompt);
      
      updateBrandDetails({
        colors: suggestion.colors
      });
      
      toast.success('Color palette generated successfully!');
    } catch (error) {
      console.error('Error generating colors:', error);
      toast.error('Failed to generate colors');
    } finally {
      setIsGeneratingColors(false);
    }
  };

  const handleComplete = async () => {
    if (isAnonymous) {
      setShowAuthModal(true);
      return;
    }

    try {
      setIsSaving(true);

      let logoUrls: string[] = [];
      let uploadedLogoUrl: string | undefined;

      // Handle logo based on user choice
      if (brandDetails.logoChoice === 'ai') {
        setIsGeneratingLogos(true);
        try {
          logoUrls = await generateLogoImages({
            brandName: brandDetails.name,
            style: brandDetails.logoStyle || 'wordmark',
            colors: {
              primary: brandDetails.colors.primary,
              secondary: brandDetails.colors.secondary,
              accent: brandDetails.colors.accent
            },
            description: brandDetails.description,
            industry: brandDetails.industry,
            personality: brandDetails.adjective
          });
        } catch (error) {
          console.error('Error generating logos:', error);
          toast.error('Failed to generate logos. Please try again.');
          setIsGeneratingLogos(false);
          setIsSaving(false);
          return;
        }
        setIsGeneratingLogos(false);
      } else if (brandDetails.logoChoice === 'upload' && uploadedFile) {
        try {
          uploadedLogoUrl = await uploadImageToStorage(uploadedFile, userId!);
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Failed to upload logo';
          toast.error(errorMessage);
          setIsSaving(false);
          return;
        }
      }
      
      const brandKitData = {
        name: brandDetails.name,
        description: brandDetails.description,
        type: brandDetails.industry,
        colors: brandDetails.colors,
        logo: {
          type: brandDetails.logoStyle || 'wordmark',
          text: brandDetails.name,
          image: uploadedLogoUrl,
          personality: brandDetails.adjective,
        },
        typography: brandDetails.typography,
      };

      const savedBrandKit = await toast.promise(
        saveBrandKit(brandKitData, logoUrls),
        {
          loading: 'Saving your brand kit...',
          success: 'Brand kit saved successfully!',
          error: 'Failed to save brand kit. Please try again.'
        }
      );
      navigate(`/result?brandKitId=${savedBrandKit.id}`);
    } catch (error) {
      console.error('Error completing brand kit:', error);
      toast.error('Failed to complete brand kit. Please try again.');
      setIsGeneratingLogos(false);
      setIsSaving(false);
    }
  };

  const handleStartOver = () => {
    if (window.confirm('Are you sure you want to start over? All current progress will be lost.')) {
      resetBrandDetails();
      setStep(1);
    }
  };

  const steps = [
    { name: 'Info', step: 1 },
    { name: 'Design', step: 2 },
    { name: 'Preview', step: 3 }
  ];

  const renderStep = () => {
    switch (brandDetails.step) {
      case 1:
        return (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold mb-6 text-gray-900 dark:text-white">
                Tell us about your brand
              </h2>
              <Button
                  variant="outline"
                  size='sm'
                  onClick={handleGenerateWithAI}
                  leftIcon={<Sparkles className="h-4 w-4" />}
                  isLoading={isGenerating}
                >
                  Generate Suggestions
                </Button>
            </div>
            
            <div className="space-y-6">
              <Input
                label="Brand Name"
                placeholder="e.g., Acme Corp"
                value={brandDetails.name}
                onChange={(e) => updateBrandDetails({ name: e.target.value })}
                required
              />
              
              <Textarea
                label="Brand Description"
                placeholder="Describe your brand, products/services, and target audience in a few sentences..."
                value={brandDetails.description}
                onChange={(e) => updateBrandDetails({ description: e.target.value })}
                required
                helperText="This helps our AI understand your brand better"
              />
              
              <Select
                label="Industry Type"
                options={[
                  { value: '', label: 'Select an industry', disabled: true },
                  ...BRAND_TYPES.map(type => ({ value: type.id, label: type.name }))
                ]}
                value={brandDetails.industry}
                onChange={(value) => updateBrandDetails({ industry: value })}
                helperText="Choose the category that best fits your business"
              />
              
              <Select
                label="Brand Personality"
                options={[
                  { value: '', label: 'Select a personality', disabled: true },
                  ...BRAND_ADJECTIVES.map(adj => ({ value: adj.id, label: adj.name }))
                ]}
                value={brandDetails.adjective}
                onChange={(value) => updateBrandDetails({ adjective: value })}
                helperText="How do you want your brand to be perceived?"
              />
              
              <div className="pt-4 flex justify-between">
                <Button
                  variant="outline"
                  onClick={handleStartOver}
                  leftIcon={<RefreshCw className="h-4 w-4" />}
                >
                  Reset
                </Button>
                
                <Button
                  onClick={() => setStep(2)}
                  rightIcon={<ArrowRight className="h-4 w-4" />}
                  disabled={!brandDetails.name || !brandDetails.description}
                >
                  Next Step
                </Button>
              </div>
            </div>
          </motion.div>
        );
        
      case 2:
        return (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                Design your brand identity
              </h2>
              <Button
                variant="outline"
                size="sm"
                onClick={handleGenerateColors}
                leftIcon={<RefreshCw className="h-4 w-4" />}
                isLoading={isGeneratingColors}
              >
                Generate New Colors
              </Button>
            </div>
            
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Brand Colors
                </label>
                <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                  <ColorPicker
                    label="Primary"
                    color={brandDetails.colors.primary}
                    onChange={(color) => updateBrandDetails({ 
                      colors: { ...brandDetails.colors, primary: color } 
                    })}
                  />
                  <ColorPicker
                    label="Secondary"
                    color={brandDetails.colors.secondary}
                    onChange={(color) => updateBrandDetails({ 
                      colors: { ...brandDetails.colors, secondary: color } 
                    })}
                  />
                  <ColorPicker
                    label="Accent"
                    color={brandDetails.colors.accent}
                    onChange={(color) => updateBrandDetails({ 
                      colors: { ...brandDetails.colors, accent: color } 
                    })}
                  />
                  <ColorPicker
                    label="Background"
                    color={brandDetails.colors.background}
                    onChange={(color) => updateBrandDetails({ 
                      colors: { ...brandDetails.colors, background: color } 
                    })}
                  />
                  <ColorPicker
                    label="Text"
                    color={brandDetails.colors.text}
                    onChange={(color) => updateBrandDetails({ 
                      colors: { ...brandDetails.colors, text: color } 
                    })}
                  />
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Logo Options
                  </label>
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                      <input
                        type="radio"
                        id="logoAI"
                        checked={brandDetails.logoChoice === 'ai'}
                        onChange={() => updateBrandDetails({ logoChoice: 'ai' })}
                        className="h-4 w-4 text-brand-600 focus:ring-brand-500 border-gray-300"
                      />
                      <label htmlFor="logoAI" className="text-sm text-gray-700 dark:text-gray-300">
                        Generate logo with AI
                      </label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <input
                        type="radio"
                        id="logoUpload"
                        checked={brandDetails.logoChoice === 'upload'}
                        onChange={() => updateBrandDetails({ logoChoice: 'upload' })}
                        className="h-4 w-4 text-brand-600 focus:ring-brand-500 border-gray-300"
                      />
                      <label htmlFor="logoUpload" className="text-sm text-gray-700 dark:text-gray-300">
                        Upload your own logo
                      </label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <input
                        type="radio"
                        id="logoNone"
                        checked={brandDetails.logoChoice === 'none'}
                        onChange={() => updateBrandDetails({ logoChoice: 'none' })}
                        className="h-4 w-4 text-brand-600 focus:ring-brand-500 border-gray-300"
                      />
                      <label htmlFor="logoNone" className="text-sm text-gray-700 dark:text-gray-300">
                        No logo needed
                      </label>
                    </div>
                  </div>
                </div>

                {brandDetails.logoChoice === 'ai' && (
                  <div>
                  <Select
                    label="Logo Style"
                    options={[
                      { value: '', label: 'Select a logo style', disabled: true },
                      ...LOGO_STYLES.map(style => ({ value: style.id, label: `${style.name}` }))
                    ]}
                    value={brandDetails.logoStyle}
                    onChange={(value) => updateBrandDetails({ logoStyle: value })}
                    helperText="Choose the type of logo that best represents your brand"
                  />
                  </div>
                )}

                {brandDetails.logoChoice === 'upload' && (
                  <FileUpload
                    label="Upload Logo"
                    onFileSelect={(file) => {
                      setUploadedFile(file);
                      const url = URL.createObjectURL(file);
                      updateBrandDetails({ uploadedLogoUrl: url });
                    }}
                    onClear={() => {
                      setUploadedFile(null);
                      updateBrandDetails({ uploadedLogoUrl: undefined });
                    }}
                    preview={brandDetails.uploadedLogoUrl}
                    helperText="Upload your existing logo file"
                  />
                )}
              </div>

              <div className="space-y-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Typography
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <Select
                      label="Heading Font"
                      options={[
                        { value: '', label: 'Select a font', disabled: true },
                        ...GOOGLE_FONTS.map(font => ({ value: font.value, label: font.label }))
                      ]}
                      value={brandDetails.typography.headingFont}
                      onChange={(value) => updateBrandDetails({
                        typography: { ...brandDetails.typography, headingFont: value }
                      })}
                    />
                    <div 
                      className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg"
                      style={{ fontFamily: brandDetails.typography.headingFont }}
                    >
                      <p className="text-2xl font-bold mb-2">The quick brown fox</p>
                      <p className="text-xl">ABCDEFGHIJKLMNOPQRSTUVWXYZ</p>
                      <p className="text-lg">abcdefghijklmnopqrstuvwxyz</p>
                      <p className="text-base">1234567890</p>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <Select
                      label="Body Font"
                      options={[
                        { value: '', label: 'Select a font', disabled: true },
                        ...GOOGLE_FONTS.map(font => ({ value: font.value, label: font.label }))
                      ]}
                      value={brandDetails.typography.bodyFont}
                      onChange={(value) => updateBrandDetails({
                        typography: { ...brandDetails.typography, bodyFont: value }
                      })}
                    />
                    <div 
                      className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg"
                      style={{ fontFamily: brandDetails.typography.bodyFont }}
                    >
                      <p className="text-base mb-2">Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.</p>
                      <p className="text-sm">ABCDEFGHIJKLMNOPQRSTUVWXYZ</p>
                      <p className="text-sm">abcdefghijklmnopqrstuvwxyz</p>
                      <p className="text-sm">1234567890</p>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="pt-4 flex justify-between">
                <Button
                  variant="outline"
                  onClick={() => setStep(1)}
                  leftIcon={<ArrowLeft className="h-4 w-4" />}
                >
                  Previous
                </Button>
                
                <Button
                  onClick={() => setStep(3)}
                  rightIcon={<ArrowRight className="h-4 w-4" />}
                >
                  Next Step
                </Button>
              </div>
            </div>
          </motion.div>
        );
        
      case 3:
        return (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <h2 className="text-2xl font-bold mb-6 text-gray-900 dark:text-white">
              Preview your brand kit
            </h2>
            
            <div className="space-y-8">
              <Card>
                <CardContent className="p-6">
                  <h3 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">
                    Brand Summary
                  </h3>
                  
                  <div className="space-y-4">
                    <div>
                      <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400">
                        Brand Name
                      </h4>
                      <p className="text-lg font-semibold text-gray-900 dark:text-white">
                        {brandDetails.name}
                      </p>
                    </div>
                    
                    <div>
                      <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400">
                        Description
                      </h4>
                      <p className="text-gray-700 dark:text-gray-300">
                        {brandDetails.description}
                      </p>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400">
                          Industry
                        </h4>
                        <p className="text-gray-700 dark:text-gray-300">
                          {BRAND_TYPES.find(t => t.id === brandDetails.industry)?.name || 'Not specified'}
                        </p>
                      </div>
                      
                      <div>
                        <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400">
                          Personality
                        </h4>
                        <p className="text-gray-700 dark:text-gray-300">
                          {BRAND_ADJECTIVES.find(a => a.id === brandDetails.adjective)?.name || 'Not specified'}
                        </p>
                      </div>
                    </div>

                      {/*Typography*/}
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400">
                            Typography Heading Font
                          </h4>
                            <p className="text-gray-700 dark:text-gray-300" style={{ fontFamily: brandDetails.typography.headingFont }}>
                              {brandDetails.typography.headingFont}
                            </p>
                        </div>
                        <div>
                            <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400">
                            Typography Body Font
                            </h4>
                            <p className="text-gray-700 dark:text-gray-300" style={{ fontFamily: brandDetails.typography.bodyFont }}>
                              {brandDetails.typography.bodyFont}
                            </p>
                        </div>
                      </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="p-6">
                  <h3 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">
                    Brand Colors
                  </h3>
                  
                  <div className="grid grid-cols-5 gap-3">
                    {Object.entries(brandDetails.colors).map(([key, color]) => (
                      <div key={key} className="text-center">
                        <div 
                          className="w-full h-16 rounded-md mb-2 shadow-sm"
                          style={{ backgroundColor: color }}
                        ></div>
                        <span className="text-xs font-medium text-gray-500 dark:text-gray-400 capitalize">
                          {key}
                        </span>
                        <p className="text-xs text-gray-700 dark:text-gray-300">
                          {color}
                        </p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="p-6">
                  <h3 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">
                    Logo Preview
                  </h3>
                  
                  <div className="bg-gray-100 dark:bg-gray-800 rounded-lg p-8 flex items-center justify-center">
                    {isGeneratingLogos ? (
                      <div className="flex flex-col items-center gap-4">
                        <Loader className="h-8 w-8 animate-spin text-brand-600" />
                        <p className="text-sm text-gray-500">Generating logo options...this may take a few seconds.</p>
                      </div>
                    ) : brandDetails.logoChoice === 'upload' && brandDetails.uploadedLogoUrl ? (
                      <img
                        src={brandDetails.uploadedLogoUrl}
                        alt="Uploaded logo"
                        className="max-h-32 w-auto"
                      />
                    ) : (
                      <div 
                        className="text-3xl font-bold"
                        style={{ color: brandDetails.colors.primary }}
                      >
                        {brandDetails.name}
                      </div>
                    )}
                  </div>
                  
                  {brandDetails.logoChoice === 'ai' && (
                    <p className="mt-4 text-sm text-gray-500 dark:text-gray-400">
                      Click "Complete" to generate logo concepts based on your brand details.
                    </p>
                  )}
                  {brandDetails.logoChoice === 'none' && (
                    <p className="mt-4 text-sm text-gray-500 dark:text-gray-400">
                      This is a text-based substitute for the logo.
                    </p>
                  )}
                </CardContent>
              </Card>
              
              <div className="pt-4 flex justify-between">
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    onClick={() => setStep(2)}
                    leftIcon={<ArrowLeft className="h-4 w-4" />}
                  >
                    Previous
                  </Button>
                </div>
                
                <Button
                  onClick={handleComplete}
                  rightIcon={<Sparkles className="h-4 w-4" />}
                  isLoading={isSaving || isGeneratingLogos}
                  disabled={isSaving || isGeneratingLogos}
                >
                  Complete
                </Button>
              </div>
            </div>
          </motion.div>
        );
        
      default:
        return null;
    }
  };

  return (
    <Layout hideFooter>
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-12">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mx-auto">
            <div className="mb-8">
              <div className="flex items-center justify-between">
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                  Create Your Brand Kit
                </h1>
                
                <div className="flex items-center space-x-1 text-sm font-medium text-gray-500 dark:text-gray-400">
                  {steps.map((s, index) => (
                    <React.Fragment key={s.step}>
                      <button
                        onClick={() => {
                          if (s.step <= Math.max(brandDetails.step, 1)) {
                            setStep(s.step);
                          }
                        }}
                        className={`px-2 py-1 rounded transition-colors ${
                          s.step === brandDetails.step
                            ? 'text-brand-600 dark:text-brand-400 bg-brand-50 dark:bg-brand-900/20'
                            : s.step < brandDetails.step
                            ? 'text-brand-600 dark:text-brand-400 hover:bg-brand-50 dark:hover:bg-brand-900/20'
                            : ''
                        }`}
                        disabled={s.step > Math.max(brandDetails.step, 1)}
                      >
                        {s.name}
                      </button>
                      {index < steps.length - 1 && (
                        <span className="text-gray-400 dark:text-gray-600">→</span>
                      )}
                    </React.Fragment>
                  ))}
                </div>
              </div>
              
              <div className="w-full bg-gray-200 dark:bg-gray-700 h-2 rounded-full mt-4">
                <div 
                  className="bg-brand-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${(brandDetails.step / 3) * 100}%` }}
                ></div>
              </div>
            </div>
            
            <Card className="shadow-lg">
              <CardContent className="p-8">
                {renderStep()}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        onSuccess={handleComplete}
      />
    </Layout>
  );
};