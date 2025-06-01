import React from 'react';
import { Routes, Route } from 'react-router-dom';
import { HomePage } from './pages/HomePage';
import { CreatePage } from './pages/CreatePage';
import { LibraryPage } from './pages/LibraryPage';
import { ResultPage } from './pages/ResultPage';
import { BrandKitPage } from './pages/BrandKitPage';

function App() {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/create" element={<CreatePage />} />
      <Route path="/library" element={<LibraryPage />} />
      <Route path="/result" element={<ResultPage />} />
      <Route path="/kit/:id" element={<BrandKitPage />} />
    </Routes>
  );
}

export default App;