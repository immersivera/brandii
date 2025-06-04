import React from 'react';
import { Routes, Route } from 'react-router-dom';
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
import { AuthModal } from './components/AuthModal';
import { useAuthModal } from './context/AuthModalContext';

function App() {
  const { isOpen, onClose, onSuccess } = useAuthModal();

  return (
    <>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/create" element={<CreatePage />} />
        <Route path="/create/new" element={<BrandCreationPage />} />
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/library" element={<LibraryPage />} />
        <Route path="/result" element={<ResultPage />} />
        <Route path="/kit/:id" element={<BrandKitPage />} />
        <Route path="/kit/:id/create" element={<ImageGeneratorPage />} />
        <Route path="/kit/:id/gallery" element={<GalleryPage />} />
        <Route path="/gallery" element={<GlobalGalleryPage />} />
        <Route path="/profile" element={<ProfilePage />} />
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