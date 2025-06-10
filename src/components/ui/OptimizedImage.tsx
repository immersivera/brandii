import { useState, useEffect, useRef } from 'react';

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
  const isBase64 = src.startsWith('data:image');

  // Handle different image sources and optimizations
  useEffect(() => {
    let active = true;
    
    const loadImage = async () => {
      if (!src) {
        setError(true);
        return;
      }

      setIsLoading(true);
      setError(false);

      try {
        if (isBase64) {
          // For base64, we'll use the full resolution for now
          // In a production app, you might want to create a thumbnail version
          setImageSrc(src);
        } else {
          // For URL images, use Supabase transformations for thumbnails
          const url = new URL(src);
          if (isThumbnail && !url.searchParams.has('width')) {
            // Add width parameter for thumbnails if not already present
            url.searchParams.set('width', '400');
            url.searchParams.set('quality', '80');
          }
          setImageSrc(url.toString());
        }
      } catch (err) {
        if (active) {
          console.error('Error processing image:', err);
          setError(true);
        }
      } finally {
        if (active) {
          setIsLoading(false);
        }
      }
    };

    loadImage();

    return () => {
      active = false;
    };
  }, [src, isThumbnail, isBase64]);

  const handleError = () => {
    setError(true);
    // Fallback to full resolution if available
    if (fullResolutionSrc && fullResolutionSrc !== src) {
      setImageSrc(fullResolutionSrc);
      setError(false);
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
        src={imageSrc}
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
