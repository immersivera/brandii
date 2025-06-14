import React from 'react';
import { Routes, Route, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { HomePage } from './pages/HomePage';
import { CreatePage } from './pages/CreatePage';
import { BrandCreationPage } from './pages/BrandCreationPage';
import { LibraryPage } from './pages/LibraryPage';
import { ResultPage } from './pages/ResultPage';
import { BrandKitPage } from './pages/BrandKitPage';
import { DashboardPage } from './pages/DashboardPage';
import { ImageGeneratorPage } from './pages/ImageGeneratorPage';
import { GalleryPage } from './pages/GalleryPage';
import { GlobalGalleryPage } from './pages/GlobalGalleryPage';
import { ProfilePage } from './pages/ProfilePage';
import { ResetPasswordPage } from './pages/ResetPasswordPage';
import { PrivacyPolicyPage } from './pages/PrivacyPolicyPage';
import { TermsOfServicePage } from './pages/TermsOfServicePage';
import { AuthModal } from './components/AuthModal';
import { ScrollToTop } from './components/ScrollToTop';
import { useAuthModal } from './context/AuthModalContext';
import { useUser } from './context/UserContext';

function App() {
  const { isOpen, onClose, onSuccess, openModal } = useAuthModal();
  const { userId, isLoading } = useUser();

  // Protected route wrapper
  const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
    const navigate = useNavigate();
    const location = useLocation();

    React.useEffect(() => {
      if (!isLoading && !userId) {
        const intendedPath = location.pathname;
        openModal(() => navigate(intendedPath));
        navigate('/');
      }
    }, [isLoading, userId, navigate, location.pathname]);

    if (isLoading) {
      return <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-brand-600"></div>
      </div>;
    }

    if (!userId) {
      return null;
    }

    return <>{children}</>;
  };

  return (
    <>
      <ScrollToTop />
      <Routes>
        {/* Public routes */}
        <Route path="/" element={<HomePage />} />
        <Route path="/gallery" element={<GlobalGalleryPage />} />
        <Route path="/reset-password" element={<ResetPasswordPage />} />
        <Route path="/privacy" element={<PrivacyPolicyPage />} />
        <Route path="/terms" element={<TermsOfServicePage />} />

        {/* Protected routes */}
        <Route path="/create" element={
          <ProtectedRoute>
            <CreatePage />
          </ProtectedRoute>
        } />
        <Route path="/create/new" element={
          <ProtectedRoute>
            <BrandCreationPage />
          </ProtectedRoute>
        } />
        <Route path="/dashboard" element={
          <ProtectedRoute>
            <DashboardPage />
          </ProtectedRoute>
        } />
        <Route path="/library" element={
          <ProtectedRoute>
            <LibraryPage />
          </ProtectedRoute>
        } />
        <Route path="/result" element={
          <ProtectedRoute>
            <ResultPage />
          </ProtectedRoute>
        } />
        <Route path="/kit/:id" element={
          <ProtectedRoute>
            <BrandKitPage />
          </ProtectedRoute>
        } />
        <Route path="/kit/:id/create" element={
          <ProtectedRoute>
            <ImageGeneratorPage />
          </ProtectedRoute>
        } />
        <Route path="/kit/:id/gallery" element={
          <ProtectedRoute>
            <GalleryPage />
          </ProtectedRoute>
        } />
        <Route path="/profile" element={
          <ProtectedRoute>
            <ProfilePage />
          </ProtectedRoute>
        } />
      </Routes>

      <AuthModal 
        isOpen={isOpen}
        onClose={onClose}
        onSuccess={onSuccess}
      />
    </>
  );
}

export default App;