import React, { useRef, useState } from 'react';
import { cn } from '../../lib/utils';
import { Upload, X } from 'lucide-react';
import { Button } from './Button';

interface FileUploadProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
  onFileSelect: (file: File) => void;
  onClear?: () => void;
  preview?: string;
  accept?: string;
}

export const FileUpload: React.FC<FileUploadProps> = ({
  className,
  label,
  error,
  helperText,
  onFileSelect,
  onClear,
  preview,
  accept = "image/*",
  ...props
}) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      onFileSelect(file);
    }
  };

  const handleDragOver = (event: React.DragEvent) => {
    event.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (event: React.DragEvent) => {
    event.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (event: React.DragEvent) => {
    event.preventDefault();
    setIsDragging(false);
    
    const file = event.dataTransfer.files[0];
    if (file && file.type.startsWith('image/')) {
      onFileSelect(file);
    }
  };

  return (
    <div className={cn("w-full", className)}>
      {label && (
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
          {label}
        </label>
      )}
      
      <div
        className={cn(
          "relative border-2 border-dashed rounded-lg p-4 transition-colors",
          isDragging ? "border-brand-500 bg-brand-50 dark:bg-brand-900/20" : "border-gray-300 dark:border-gray-700",
          error && "border-red-500"
        )}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        {preview ? (
          <div className="relative">
            <img
              src={preview}
              alt="Upload preview"
              className="w-full h-48 object-contain rounded-lg"
            />
            {onClear && (
              <button
                type="button"
                onClick={onClear}
                className="absolute top-2 right-2 p-1 bg-gray-900/50 hover:bg-gray-900/70 rounded-full text-white transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
        ) : (
          <div className="text-center p-6">
            <Upload className="mx-auto h-12 w-12 text-gray-400 dark:text-gray-600 mb-4" />
            <div className="text-sm text-gray-600 dark:text-gray-400">
              <Button
                type="button"
                variant="link"
                onClick={() => inputRef.current?.click()}
              >
                Click to upload
              </Button>
              {" "}or drag and drop
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
              PNG, JPG, GIF up to 10MB
            </p>
          </div>
        )}
        
        <input
          ref={inputRef}
          type="file"
          className="hidden"
          onChange={handleFileChange}
          accept={accept}
          {...props}
        />
      </div>
      
      {(helperText || error) && (
        <p className={cn(
          "mt-1.5 text-sm",
          error ? "text-red-500" : "text-gray-500 dark:text-gray-400"
        )}>
          {error || helperText}
        </p>
      )}
    </div>
  );
};