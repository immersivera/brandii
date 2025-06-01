import React, { createContext, useContext, useState } from 'react';

export interface BrandDetails {
  name: string;
  description: string;
  industry: string;
  adjective: string;
  logoStyle: string;
  colors: {
    primary: string;
    secondary: string;
    accent: string;
    background: string;
    text: string;
  };
  typography: {
    headingFont: string;
    bodyFont: string;
  };
  logoOptions?: string[];
  step: number;
}

const initialBrandState: BrandDetails = {
  name: '',
  description: '',
  industry: '',
  adjective: '',
  logoStyle: '',
  colors: {
    primary: '#8B5CF6',
    secondary: '#6D28D9',
    accent: '#EC4899',
    background: '#F5F3FF',
    text: '#111827',
  },
  typography: {
    headingFont: 'Inter',
    bodyFont: 'Inter',
  },
  logoOptions: [],
  step: 1,
};

interface BrandContextType {
  brandDetails: BrandDetails;
  updateBrandDetails: (updates: Partial<BrandDetails>) => void;
  resetBrandDetails: () => void;
  nextStep: () => void;
  prevStep: () => void;
  setStep: (step: number) => void;
}

const BrandContext = createContext<BrandContextType | undefined>(undefined);

export const BrandProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [brandDetails, setBrandDetails] = useState<BrandDetails>(initialBrandState);

  const updateBrandDetails = (updates: Partial<BrandDetails>) => {
    setBrandDetails(prev => ({ ...prev, ...updates }));
  };

  const resetBrandDetails = () => {
    setBrandDetails(initialBrandState);
  };

  const nextStep = () => {
    setBrandDetails(prev => ({ ...prev, step: prev.step + 1 }));
  };

  const prevStep = () => {
    setBrandDetails(prev => ({ ...prev, step: Math.max(1, prev.step - 1) }));
  };

  const setStep = (step: number) => {
    setBrandDetails(prev => ({ ...prev, step }));
  };

  return (
    <BrandContext.Provider value={{ 
      brandDetails, 
      updateBrandDetails, 
      resetBrandDetails,
      nextStep,
      prevStep,
      setStep
    }}>
      {children}
    </BrandContext.Provider>
  );
};

export const useBrand = () => {
  const context = useContext(BrandContext);
  if (context === undefined) {
    throw new Error('useBrand must be used within a BrandProvider');
  }
  return context;
};