import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Loader2 } from 'lucide-react';
import { Button } from './ui/Button';
import { BRAND_ADJECTIVES } from '../lib/constants';
import { LOGO_STYLES } from '../lib/constants';

export interface LogoGenerationOptions {
  style: string;
  personality: string;
  complexity: string;
//   iconIncluded: boolean;
//   textIncluded: boolean;
}

interface LogoGenerationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (options: LogoGenerationOptions) => void;
  defaultValues?: Partial<LogoGenerationOptions>;
  isLoading?: boolean;
}

export const LogoGenerationModal: React.FC<LogoGenerationModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  defaultValues = {},
  isLoading = false,
}) => {
  const [options, setOptions] = React.useState<LogoGenerationOptions>({
    style: defaultValues.style || 'any',
    personality: defaultValues.personality || 'modern',
    complexity: defaultValues.complexity || 'medium',
    // iconIncluded: defaultValues.iconIncluded ?? true,
    // textIncluded: defaultValues.textIncluded ?? true,
  });

  

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(options);
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -20, opacity: 0 }}
          className="relative w-full max-w-md rounded-lg bg-white dark:bg-gray-800 p-6 shadow-xl"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">Generate Logos</h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-500 dark:text-gray-300 dark:hover:text-gray-200"
            >
              <X className="h-6 w-6" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">
                Style
              </label>
              <select
                value={options.style}
                onChange={(e) => setOptions({ ...options, style: e.target.value })}
                className="w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 p-2 text-gray-900 dark:text-gray-100"
              >
                {LOGO_STYLES.map((style) => (
                  <option key={style.id} value={style.id}>
                    {style.name} - {style.description}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">
                Personality
              </label>
              <select
                value={options.personality}
                onChange={(e) => setOptions({ ...options, personality: e.target.value })}
                className="w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 p-2 text-gray-900 dark:text-gray-100"
              >
                {BRAND_ADJECTIVES.map((adjective) => (
                  <option key={adjective.id} value={adjective.description}>
                    {adjective.name} - {adjective.description}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">
                Complexity
              </label>
              <select
                value={options.complexity}
                onChange={(e) => setOptions({ ...options, complexity: e.target.value })}
                className="w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 p-2 text-gray-900 dark:text-gray-100"
              >
                <option value="simple">Simple</option>
                <option value="medium">Medium</option>
                <option value="complex">Complex</option>
              </select>
            </div>

            <div className="mt-6 flex justify-end space-x-3">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                disabled={isLoading}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Generating...
                  </>
                ) : (
                  'Generate Logos'
                )}
              </Button>
            </div>
          </form>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};
