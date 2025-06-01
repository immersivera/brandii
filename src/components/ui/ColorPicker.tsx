import React from 'react';
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
  
  const handleClickOutside = React.useCallback(() => {
    setIsOpen(false);
  }, []);
  
  React.useEffect(() => {
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    } else {
      document.removeEventListener('mousedown', handleClickOutside);
    }
    
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, handleClickOutside]);
  
  return (
    <div className={cn("relative", className)}>
      {label && (
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
          {label}
        </label>
      )}
      
      <motion.button
        type="button"
        className="w-12 h-12 rounded-lg shadow-sm border border-gray-300 dark:border-gray-700 transition-all"
        style={{ backgroundColor: color }}
        onClick={(e) => {
          e.stopPropagation();
          setIsOpen(!isOpen);
        }}
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
          onClick={e => e.stopPropagation()}
        >
          <HexColorPicker color={color} onChange={onChange} />
          <div className="mt-2 flex items-center justify-between bg-white dark:bg-gray-800 p-2 rounded-md shadow-md border border-gray-200 dark:border-gray-700">
            <span className="text-sm text-gray-500 dark:text-gray-400">
              {color}
            </span>
            <button
              type="button"
              className="text-xs bg-brand-100 text-brand-800 dark:bg-brand-900 dark:text-brand-200 px-2 py-1 rounded"
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