import React, { useRef, useEffect } from 'react';
import { HexColorPicker } from 'react-colorful';
import { motion } from 'framer-motion';
import { cn } from '../../lib/utils';

interface ColorPickerProps {
  color: string;
  onChange: (color: string) => void;
  label?: string;
  className?: string;
}

export const ColorPicker: React.FC<ColorPickerProps> = ({ 
  color, 
  onChange, 
  label,
  className
}) => {
  const [isOpen, setIsOpen] = React.useState(false);
  const [hexInput, setHexInput] = React.useState(color);
  const pickerRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    setHexInput(color);
  }, [color]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (pickerRef.current && !pickerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const handleHexInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setHexInput(value);

    // Only update the color if it's a valid hex
    if (/^#[0-9A-F]{6}$/i.test(value)) {
      onChange(value);
    }
  };

  const handleHexInputBlur = () => {
    // Reset to current color if invalid hex
    if (!/^#[0-9A-F]{6}$/i.test(hexInput)) {
      setHexInput(color);
    }
  };

  const formatHexInput = (value: string) => {
    value = value.replace(/[^0-9A-F]/ig, '');
    if (!value.startsWith('#')) {
      value = '#' + value;
    }
    return value.slice(0, 7).toUpperCase();
  };

  return (
    <div className={cn("relative", className)} ref={pickerRef}>
      {label && (
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
          {label}
        </label>
      )}
      
      <motion.button
        type="button"
        className="w-12 h-12 rounded-lg shadow-sm border border-gray-300 dark:border-gray-700 transition-all"
        style={{ backgroundColor: color }}
        onClick={() => setIsOpen(!isOpen)}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        aria-label={`Select color: current value is ${color}`}
      />
      
      {isOpen && (
        <motion.div 
          className="absolute z-10 mt-2"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.2 }}
        >
          <HexColorPicker 
            color={color} 
            onChange={(newColor) => {
              onChange(newColor);
              setHexInput(newColor);
            }} 
          />
          <div className="mt-2 flex items-center justify-between bg-white dark:bg-gray-800 p-2 rounded-md shadow-md border border-gray-200 dark:border-gray-700">
            <input
              type="text"
              value={hexInput}
              onChange={(e) => handleHexInputChange(formatHexInput(e.target.value))}
              onBlur={handleHexInputBlur}
              className="w-24 px-2 py-1 text-sm bg-gray-100 dark:bg-gray-700 rounded border border-gray-200 dark:border-gray-600 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-1 focus:ring-brand-500"
              placeholder="#000000"
            />
            <button
              type="button"
              className="ml-2 text-xs bg-brand-100 text-brand-800 dark:bg-brand-900 dark:text-brand-200 px-2 py-1 rounded hover:bg-brand-200 dark:hover:bg-brand-800 transition-colors"
              onClick={() => setIsOpen(false)}
            >
              Done
            </button>
          </div>
        </motion.div>
      )}
    </div>
  );
};