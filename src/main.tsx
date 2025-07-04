import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { ThemeProvider } from './context/ThemeContext';
import { BrandProvider } from './context/BrandContext';
import { UserProvider } from './context/UserContext';
import { AuthModalProvider } from './context/AuthModalContext';
import { GTMProvider } from './providers/GTMProvider';
import App from './App.tsx';
import './index.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <GTMProvider>
        <ThemeProvider>
          <UserProvider>
            <AuthModalProvider>
              <BrandProvider>
                <App />
              </BrandProvider>
            </AuthModalProvider>
          </UserProvider>
        </ThemeProvider>
      </GTMProvider>
    </BrowserRouter>
  </StrictMode>
);