import { useState, useEffect, useRef } from 'react';
import { supabase } from '../../lib/supabase';

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

  // Handle different image sources and optimizations
  useEffect(() => {
    let active = true;
    let retryCount = 0;
    const maxRetries = 2;

    const loadImage = async (sourceUrl: string, isRetry = false) => {
      if (!sourceUrl) {
        setError(true);
        return;
      }

      if (active) {
        setIsLoading(true);
        setError(false);
      }

      try {
        // If it's a base64 image, use it directly
        if (isBase64) {
          setImageSrc(sourceUrl);
          return;
        }

        // If it's a Supabase storage URL, try to get a public URL
        if (sourceUrl.includes('storage/v1/object/public/')) {
          const url = new URL(sourceUrl);
          if (isThumbnail) {
            url.searchParams.set('width', '400');
            url.searchParams.set('quality', '80');
          }
          setImageSrc(url.toString());
          return;
        }

        // If it's a relative path or filename, try to construct a public URL
        const fileName = sourceUrl.split('/').pop();
        if (fileName) {
          try {
            const { data } = supabase.storage
              .from('generated-assets') // Adjust bucket name as needed
              .getPublicUrl(fileName);
            
            if (data?.publicUrl) {
              const optimizedUrl = new URL(data.publicUrl);
              if (isThumbnail) {
                optimizedUrl.searchParams.set('width', '400');
                optimizedUrl.searchParams.set('quality', '80');
              }
              setImageSrc(optimizedUrl.toString());
              return;
            }
          } catch (storageErr) {
            console.warn('Failed to get public URL:', storageErr);
          }
        }

        // Fallback to the original URL
        try {
          const fallbackUrl = new URL(sourceUrl);
          if (isThumbnail && !fallbackUrl.searchParams.has('width')) {
            fallbackUrl.searchParams.set('width', '400');
            fallbackUrl.searchParams.set('quality', '80');
          }
          setImageSrc(fallbackUrl.toString());
        } catch (urlErr) {
          // If we can't process as URL, use as is
          setImageSrc(sourceUrl);
        }
      } catch (err) {
        console.error('Error processing image:', err);
        // Only retry if we haven't exceeded max retries
        if (retryCount < maxRetries && !isRetry) {
          retryCount++;
          // Wait a bit before retrying
          setTimeout(() => loadImage(sourceUrl, true), 500 * retryCount);
        } else if (active) {
          setError(true);
        }
      } finally {
        if (active) {
          setIsLoading(false);
        }
      }
    };

    loadImage(src);

    return () => {
      active = false;
    };
  }, [src, isThumbnail, isBase64]);

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
