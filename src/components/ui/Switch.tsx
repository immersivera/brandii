import React from 'react';
import { motion } from 'framer-motion';
import { cn } from '../../lib/utils';

interface SwitchProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label?: string;
  description?: string;
  disabled?: boolean;
  className?: string;
}

export const Switch: React.FC<SwitchProps> = ({
  checked,
  onChange,
  label,
  description,
  disabled = false,
  className,
}) => {
  return (
    <div className={cn("flex items-start", className)}>
      <button
        role="switch"
        aria-checked={checked}
        onClick={() => !disabled && onChange(!checked)}
        className={cn(
          "relative inline-flex h-6 w-11 flex-shrink-0 rounded-full transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-2",
          checked ? "bg-brand-600" : "bg-gray-200 dark:bg-gray-700",
          disabled && "opacity-50 cursor-not-allowed"
        )}
      >
        <motion.span
          layout
          className={cn(
            "inline-block h-5 w-5 rounded-full bg-white shadow transform ring-0 transition-transform duration-200 ease-in-out",
            "mx-0.5 my-0.5"
          )}
          animate={{
            x: checked ? "100%" : "0%",
            translateX: checked ? "-100%" : "0%"
          }}
        />
      </button>
      {(label || description) && (
        <div className="ml-3">
          {label && (
            <span className={cn(
              "text-sm font-medium text-gray-900 dark:text-gray-100",
              disabled && "opacity-50"
            )}>
              {label}
            </span>
          )}
          {description && (
            <p className={cn(
              "text-sm text-gray-500 dark:text-gray-400",
              disabled && "opacity-50"
            )}>
              {description}
            </p>
          )}
        </div>
      )}
    </div>
  );
};