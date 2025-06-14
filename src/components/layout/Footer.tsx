import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Twitter, Instagram, Github as GitHub } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';

export const Footer: React.FC = () => {
  const { theme } = useTheme();
  const location = useLocation();
  const navigate = useNavigate();

  const handleNavigation = (path: string, sectionId?: string) => {
    if (location.pathname === '/' && sectionId) {
      // If we're on the homepage, scroll to the section
      const element = document.getElementById(sectionId);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth' });
      }
    } else if (sectionId) {
      // If we're not on the homepage, navigate to the homepage with hash
      navigate(`/#${sectionId}`);
      // Then scroll to the section after a small delay to allow the page to load
      setTimeout(() => {
        const element = document.getElementById(sectionId);
        if (element) {
          element.scrollIntoView({ behavior: 'smooth' });
        }
      }, 100);
    } else {
      // Regular navigation for other links
      navigate(path);
    }
  };
  
  return (
    <footer className="bg-gray-50 dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="col-span-1 md:col-span-2">
            <div className="flex items-center space-x-2 mb-4">
              <img 
                src={theme === 'dark' ? "/logo-white.png" : "/logo.png"}
                alt="Brandii" 
                className="h-8 w-auto"
              />
            </div>
            <p className="text-gray-600 dark:text-gray-400 mb-4 max-w-md">
              Create stunning brand kits with AI-powered tools. Generate color palettes, 
              logo concepts, and brand guidelines in minutes.
            </p>
            <div className="flex space-x-4">
              <a href="https://twitter.com/#" target="_blank" rel="noopener noreferrer" className="text-gray-500 hover:text-brand-600 dark:text-gray-400 dark:hover:text-brand-400 transition-colors">
                <Twitter className="h-5 w-5" />
                <span className="sr-only">Twitter</span>
              </a>
              <a href="https://instagram.com/#" target="_blank" rel="noopener noreferrer" className="text-gray-500 hover:text-brand-600 dark:text-gray-400 dark:hover:text-brand-400 transition-colors">
                <Instagram className="h-5 w-5" />
                <span className="sr-only">Instagram</span>
              </a>
              <a href="https://github.com/#" target="_blank" rel="noopener noreferrer" className="text-gray-500 hover:text-brand-600 dark:text-gray-400 dark:hover:text-brand-400 transition-colors">
                <GitHub className="h-5 w-5" />
                <span className="sr-only">GitHub</span>
              </a>
            </div>
          </div>
          
          <div>
            <h3 className="font-semibold text-gray-900 dark:text-white mb-4">Product</h3>
            <ul className="space-y-2">
              <li>
                <Link to="/create" className="text-gray-600 dark:text-gray-400 hover:text-brand-600 dark:hover:text-brand-400 transition-colors">
                  Create Brand Kit
                </Link>
              </li>
              <li>
                <button 
                  onClick={() => handleNavigation('/', 'features')} 
                  className="text-gray-600 dark:text-gray-400 hover:text-brand-600 dark:hover:text-brand-400 transition-colors text-left"
                >
                  Features
                </button>
              </li>
              <li>
                <button 
                  onClick={() => handleNavigation('/', 'pricing')} 
                  className="text-gray-600 dark:text-gray-400 hover:text-brand-600 dark:hover:text-brand-400 transition-colors text-left"
                >
                  Pricing
                </button>
              </li>
              <li>
                <Link to="/gallery" className="text-gray-600 dark:text-gray-400 hover:text-brand-600 dark:hover:text-brand-400 transition-colors">
                  Showcase
                </Link>
              </li>
            </ul>
          </div>
          
          <div>
            <h3 className="font-semibold text-gray-900 dark:text-white mb-4">Company</h3>
            <ul className="space-y-2">
              <li className="hidden">
                <Link to="/about" className="text-gray-600 dark:text-gray-400 hover:text-brand-600 dark:hover:text-brand-400 transition-colors">
                  About
                </Link>
              </li>
              <li className="">
                <Link to="/blog" className="text-gray-600 dark:text-gray-400 hover:text-brand-600 dark:hover:text-brand-400 transition-colors">
                  Blog
                </Link>
              </li>
              <li className="">
                <Link to={`mailto:${import.meta.env.VITE_APP_EMAIL}`} className="text-gray-600 dark:text-gray-400 hover:text-brand-600 dark:hover:text-brand-400 transition-colors">
                  Contact
                </Link>
              </li>
              <li className="hidden">
                <Link to="/careers" className="text-gray-600 dark:text-gray-400 hover:text-brand-600 dark:hover:text-brand-400 transition-colors">
                  Careers
                </Link>
              </li>
            </ul>
          </div>
        </div>
        
        <div className="border-t border-gray-200 dark:border-gray-800 mt-12 pt-8 flex flex-col md:flex-row justify-between items-center">
          <div className="flex flex-col md:flex-row items-center gap-4">
            <p className="text-sm text-gray-500 dark:text-gray-400">
              &copy; {new Date().getFullYear()} Brandii. All rights reserved.
            </p>
            <div className="flex items-center">
              <span className="text-sm text-gray-400 dark:text-gray-500 mx-2">Built with</span>
              <a 
                href="https://bolt.new"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center hover:opacity-80 transition-opacity"
              >
                <img 
                  src="/black_circle_360x360.png" 
                  alt="Built with Bolt.new" 
                  className="h-6 w-6 dark:invert"
                />
              </a>
            </div>
          </div>
          <div className="flex space-x-6 mt-4 md:mt-0">
            <Link to="/privacy" className="text-sm text-gray-500 dark:text-gray-400 hover:text-brand-600 dark:hover:text-brand-400 transition-colors">
              Privacy Policy
            </Link>
            <Link to="/terms" className="text-sm text-gray-500 dark:text-gray-400 hover:text-brand-600 dark:hover:text-brand-400 transition-colors">
              Terms of Service
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
};