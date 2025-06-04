import React, { createContext, useContext, useState, useCallback } from 'react';

interface AuthModalContextType {
  isOpen: boolean;
  openModal: (onSuccessCallback?: () => void) => void;
  onClose: () => void;
  onSuccess: () => void;
}

const AuthModalContext = createContext<AuthModalContextType | undefined>(undefined);

export const AuthModalProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [successCallback, setSuccessCallback] = useState<(() => void) | undefined>();

  const openModal = useCallback((onSuccessCallback?: () => void) => {
    setIsOpen(true);
    setSuccessCallback(() => onSuccessCallback);
  }, []);

  const onClose = useCallback(() => {
    setIsOpen(false);
    setSuccessCallback(undefined);
  }, []);

  const onSuccess = useCallback(() => {
    if (successCallback) {
      successCallback();
    }
    onClose();
  }, [successCallback, onClose]);

  return (
    <AuthModalContext.Provider value={{ isOpen, openModal, onClose, onSuccess }}>
      {children}
    </AuthModalContext.Provider>
  );
};

export const useAuthModal = () => {
  const context = useContext(AuthModalContext);
  if (context === undefined) {
    throw new Error('useAuthModal must be used within an AuthModalProvider');
  }
  return context;
};