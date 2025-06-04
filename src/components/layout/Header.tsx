import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useTheme } from '../../context/ThemeContext';
import { useUser } from '../../context/UserContext';
import { useAuthModal } from '../../context/AuthModalContext';
import { useAuthActions } from '../../lib/hooks/useAuthActions';
import { Moon, Sun, Menu, X, LogIn, LogOut, User, ChevronDown, Settings } from 'lucide-react';
import { Button } from '../ui/Button';
import toast from 'react-hot-toast';

export const Header: React.FC = () => {
  const { theme, toggleTheme } = useTheme();
  const { userId, profile } = useUser();
  const { openModal } = useAuthModal();
  const { signOut } = useAuthActions();
  const location = useLocation();
  const navigate = useNavigate();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  
  const isHomePage = location.pathname === '/';
  const isTransparent = isHomePage && !isMenuOpen;

  // Log authentication state changes
  useEffect(() => {
    console.log('Auth State:', {
      isAuthenticated: !!userId,
      userId,
      hasProfile: !!profile,
      profileEmail: profile?.email,
      currentPath: location.pathname
    });
  }, [userId, profile, location.pathname]);
  
  const navLinks = [
    { name: 'Home', path: '/' },
    { name: 'Create', path: '/create', protected: true },
    { name: 'Library', path: '/library', protected: true },
    { name: 'Gallery', path: '/gallery' }
  ];

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = async () => {
    try {
      await signOut();
      toast.success('Signed out successfully');
      setIsDropdownOpen(false);
      navigate('/');
    } catch (error) {
      console.error('Error signing out:', error);
      toast.error('Failed to sign out');
    }
  };
  
  return (
    <motion.header
      className={`fixed top-0 left-0 right-0 z-50 transition-colors ${
        isTransparent 
          ? 'bg-transparent' 
          : 'bg-white/80 dark:bg-gray-900/80 backdrop-blur-md shadow-sm'
      }`}
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
    >
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 sm:h-20">
          <div className="flex items-center">
            <Link to="/" className="flex items-center space-x-2">
              <img 
                src={theme === 'dark' ? "/logo-white.png" : "/logo.png"}
                alt="Brandii" 
                className="h-8 w-auto"
              />
            </Link>
          </div>
          
          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-8">
            {navLinks.map((link) => (
              (!link.protected || userId) && (
                <Link
                  key={link.path}
                  to={link.path}
                  className={`text-sm font-medium transition-colors relative group ${
                    location.pathname === link.path
                      ? 'text-brand-600 dark:text-brand-400'
                      : isTransparent
                        ? 'text-gray-900 dark:text-white/90 hover:text-gray-900 dark:hover:text-white'
                        : 'text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white'
                  }`}
                >
                  {link.name}
                  <span className={`absolute -bottom-1 left-0 w-0 h-0.5 bg-brand-600 dark:bg-brand-400 transition-all duration-300 group-hover:w-full ${
                    location.pathname === link.path ? 'w-full' : ''
                  }`} />
                </Link>
              )
            ))}
            
            <Button
              variant="ghost"
              size="sm"
              onClick={toggleTheme}
              aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
              className={isTransparent ? 'text-gray-900 dark:text-white' : ''}
            >
              {theme === 'light' ? (
                <Moon className="h-5 w-5" />
              ) : (
                <Sun className="h-5 w-5" />
              )}
            </Button>

            {!userId ? (
              <Button
                size="sm"
                onClick={() => openModal()}
                leftIcon={<LogIn className="h-4 w-4" />}
              >
                Sign In
              </Button>
            ) : (
              <div className="relative" ref={dropdownRef}>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                  className="flex items-center space-x-2"
                >
                  <User className="h-4 w-4" />
                  <span className="max-w-[120px] truncate">
                    {profile?.full_name || profile?.email}
                  </span>
                  <ChevronDown className={`h-4 w-4 transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`} />
                </Button>

                <AnimatePresence>
                  {isDropdownOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 10 }}
                      transition={{ duration: 0.2 }}
                      className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-lg shadow-lg py-1 z-50"
                    >
                      <button
                        onClick={() => {
                          setIsDropdownOpen(false);
                          navigate('/profile');
                        }}
                        className="flex items-center w-full px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700"
                      >
                        <Settings className="h-4 w-4 mr-2" />
                        Profile Settings
                      </button>
                      <button
                        onClick={handleLogout}
                        className="flex items-center w-full px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-gray-100 dark:hover:bg-gray-700"
                      >
                        <LogOut className="h-4 w-4 mr-2" />
                        Sign Out
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            )}
          </nav>
          
          {/* Mobile Menu Button */}
          <div className="flex md:hidden">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              aria-label={isMenuOpen ? 'Close menu' : 'Open menu'}
              className={isTransparent && !isMenuOpen ? 'text-gray-900 dark:text-white' : ''}
            >
              {isMenuOpen ? (
                <X className="h-5 w-5" />
              ) : (
                <Menu className="h-5 w-5" />
              )}
            </Button>
          </div>
        </div>
      </div>
      
      {/* Mobile Navigation */}
      {isMenuOpen && (
        <motion.div
          className="md:hidden bg-white dark:bg-gray-900 shadow-lg"
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
        >
          <nav className="px-4 pt-2 pb-4 space-y-2">
            {navLinks.map((link) => (
              (!link.protected || userId) && (
                <Link
                  key={link.path}
                  to={link.path}
                  className={`block px-3 py-2 rounded-md text-base font-medium relative group ${
                    location.pathname === link.path
                      ? 'bg-brand-50 dark:bg-gray-800 text-brand-600 dark:text-brand-400'
                      : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
                  }`}
                  onClick={() => setIsMenuOpen(false)}
                >
                  {link.name}
                  <span className={`absolute bottom-1 left-3 w-0 h-0.5 bg-brand-600 dark:bg-brand-400 transition-all duration-300 group-hover:w-[calc(100%-24px)] ${
                    location.pathname === link.path ? 'w-[calc(100%-24px)]' : ''
                  }`} />
                </Link>
              )
            ))}
            
            <button
              className="flex w-full items-center px-3 py-2 rounded-md text-base font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
              onClick={toggleTheme}
            >
              {theme === 'light' ? (
                <>
                  <Moon className="h-5 w-5 mr-2" />
                  <span>Dark Mode</span>
                </>
              ) : (
                <>
                  <Sun className="h-5 w-5 mr-2" />
                  <span>Light Mode</span>
                </>
              )}
            </button>

            {!userId ? (
              <Button
                className="w-full"
                onClick={() => {
                  setIsMenuOpen(false);
                  openModal();
                }}
                leftIcon={<LogIn className="h-4 w-4" />}
              >
                Sign In
              </Button>
            ) : (
              <>
                <Link
                  to="/profile"
                  className="flex items-center w-full px-3 py-2 rounded-md text-base font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
                  onClick={() => setIsMenuOpen(false)}
                >
                  <Settings className="h-4 w-4 mr-2" />
                  Profile Settings
                </Link>
                <Button
                  variant="ghost"
                  className="w-full text-red-600 dark:text-red-400"
                  onClick={() => {
                    setIsMenuOpen(false);
                    handleLogout();
                  }}
                  leftIcon={<LogOut className="h-4 w-4" />}
                >
                  Sign Out
                </Button>
              </>
            )}
          </nav>
        </motion.div>
      )}
    </motion.header>
  );
};