import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { ThemeProvider } from './context/ThemeContext';
import { BrandProvider } from './context/BrandContext';
import { UserProvider } from './context/UserContext';
import App from './App.tsx';
import './index.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <ThemeProvider>
        <UserProvider>
          <BrandProvider>
            <App />
          </BrandProvider>
        </UserProvider>
      </ThemeProvider>
    </BrowserRouter>
  </StrictMode>
);