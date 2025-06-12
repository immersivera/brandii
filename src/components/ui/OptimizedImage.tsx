import { useState, useEffect, useRef, useCallback } from 'react';
import { supabase } from '../../lib/supabase';

// Cache for storing resolved image URLs to avoid repeated processing
const imageUrlCache = new Map();

interface OptimizedImageProps {
  src: string;
  alt: string;
  className?: string;
  isThumbnail?: boolean;
  fullResolutionSrc?: string;
}

export const OptimizedImage: React.FC<OptimizedImageProps> = ({
  src,
  alt,
  className = '',
  isThumbnail = false,
  fullResolutionSrc
}) => {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(false);
  const [imageSrc, setImageSrc] = useState('');
  const imgRef = useRef<HTMLImageElement>(null);
  const isBase64 = src?.startsWith('data:image');

  // Function to process and cache the image URL
  const processImageUrl = useCallback(async (sourceUrl: string): Promise<string> => {
    // Check cache first
    const cacheKey = `${sourceUrl}-${isThumbnail}`;
    if (imageUrlCache.has(cacheKey)) {
      return imageUrlCache.get(cacheKey);
    }

    // If it's a base64 image, use it directly
    if (isBase64) {
      imageUrlCache.set(cacheKey, sourceUrl);
      return sourceUrl;
    }

    try {
      let finalUrl = sourceUrl;
      
      // If it's a Supabase storage URL, add transformation params if needed
      if (sourceUrl.includes('storage/v1/object/public/')) {
        const url = new URL(sourceUrl);
        if (isThumbnail) {
          url.searchParams.set('width', '400');
          url.searchParams.set('quality', '80');
          // Add cache buster to prevent stale images
          url.searchParams.set('t', Date.now().toString());
        }
        finalUrl = url.toString();
      } 
      // If it's a path or filename, try to construct a public URL
      else if (!sourceUrl.startsWith('http')) {
        const fileName = sourceUrl.split('/').pop();
        if (fileName) {
          const { data } = await supabase.storage
            .from('generated-assets')
            .getPublicUrl(fileName);
          
          if (data?.publicUrl) {
            const url = new URL(data.publicUrl);
            if (isThumbnail) {
              url.searchParams.set('width', '400');
              url.searchParams.set('quality', '80');
              url.searchParams.set('t', Date.now().toString());
            }
            finalUrl = url.toString();
          }
        }
      }
      
      // Cache the result
      imageUrlCache.set(cacheKey, finalUrl);
      return finalUrl;
    } catch (err) {
      console.warn('Error processing image URL:', err);
      return sourceUrl; // Return original URL as fallback
    }
  }, [isThumbnail, isBase64]);

  // Handle loading the image with retries
  const loadImageWithRetry = useCallback(async (sourceUrl: string, retryCount = 0) => {
    const MAX_RETRIES = 3;
    const RETRY_DELAY = 1000; // 1 second
    
    try {
      const processedUrl = await processImageUrl(sourceUrl);
      
      // Create a promise that resolves when the image loads or rejects on error
      const loadPromise = new Promise<string>((resolve, reject) => {
        const img = new Image();
        img.onload = () => resolve(processedUrl);
        img.onerror = () => reject(new Error('Image failed to load'));
        img.src = processedUrl;
      });
      
      // Add a timeout to the promise
      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error('Image load timeout')), 10000); // 10 second timeout
      });
      
      // Race the load against the timeout
      await Promise.race([loadPromise, timeoutPromise]);
      
      // If we get here, the image loaded successfully
      return processedUrl;
      
    } catch (err) {
      console.warn(`Image load attempt ${retryCount + 1} failed:`, err);
      
      // If we've hit max retries, give up
      if (retryCount >= MAX_RETRIES - 1) {
        throw err;
      }
      
      // Otherwise, wait and retry
      await new Promise(resolve => setTimeout(resolve, RETRY_DELAY * (retryCount + 1)));
      return loadImageWithRetry(sourceUrl, retryCount + 1);
    }
  }, [processImageUrl]);

  // Handle different image sources and optimizations
  useEffect(() => {
    let isMounted = true;
    
    const loadImage = async () => {
      if (!src) {
        setError(true);
        return;
      }
      
      setIsLoading(true);
      setError(false);
      
      try {
        const url = await loadImageWithRetry(src);
        if (isMounted) {
          setImageSrc(url);
        }
      } catch (err) {
        console.error('Failed to load image after retries:', err);
        if (isMounted) {
          setError(true);
          // Try fallback URL if available
          if (fullResolutionSrc && fullResolutionSrc !== src) {
            try {
              const fallbackUrl = await loadImageWithRetry(fullResolutionSrc);
              if (isMounted) {
                setImageSrc(fallbackUrl);
                setError(false);
              }
            } catch (fallbackErr) {
              console.error('Fallback image also failed to load:', fallbackErr);
            }
          }
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };
    
    loadImage();
    
    return () => {
      isMounted = false;
    };
  }, [src, fullResolutionSrc, loadImageWithRetry]);

  const handleError = () => {
    // Only try to use fullResolutionSrc if it's different from current src
    if (fullResolutionSrc && fullResolutionSrc !== src && !error) {
      setImageSrc(fullResolutionSrc);
      setError(false);
    } else {
      setError(true);
    }
  };

  if (error) {
    return (
      <div className={`bg-gray-200 dark:bg-gray-800 rounded-xl flex items-center justify-center ${className}`}>
        <span className="text-xs text-gray-500">Image not available</span>
      </div>
    );
  }

  return (
    <div className="relative w-full h-full">
      {isLoading && (
        <div className={`absolute inset-0 bg-gray-200 dark:bg-gray-800 rounded-xl animate-pulse ${className}`} />
      )}
      <img
        ref={imgRef}
        src={imageSrc || src}
        alt={alt}
        className={`${className} transition-opacity duration-300 ${
          isLoading ? 'opacity-0' : 'opacity-100'
        }`}
        loading={isThumbnail ? 'lazy' : 'eager'}
        decoding="async"
        onLoad={() => setIsLoading(false)}
        onError={handleError}
      />
    </div>
  );
};

export default OptimizedImage;
