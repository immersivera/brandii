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

function App() {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/create" element={<CreatePage />} />
      <Route path="/create/new" element={<BrandCreationPage />} />
      <Route path="/dashboard" element={<DashboardPage />} />
      <Route path="/library" element={<LibraryPage />} />
      <Route path="/result" element={<ResultPage />} />
      <Route path="/kit/:id" element={<BrandKitPage />} />
      <Route path="/kit/:id/create" element={<ImageGeneratorPage />} />
    </Routes>
  );
}

export default App;