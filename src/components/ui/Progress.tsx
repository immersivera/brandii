import React from 'react';

interface ProgressProps extends React.HTMLAttributes<HTMLDivElement> {
  value: number;
  max?: number;
  label?: string;
}

export function Progress({
  className,
  value,
  max = 100,
  label,
  ...props
}: ProgressProps) {
  const percentage = Math.min(100, Math.max(0, (value / max) * 100));

  return (
    <div className={`relative w-full ${className || ''}`} {...props}>
      {label && (
        <div className="flex justify-between mb-1">
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
            {label}
          </span>
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
            {percentage.toFixed(0)}%
          </span>
        </div>
      )}
      <div className="w-full bg-gray-200 rounded-full h-2.5 dark:bg-gray-700">
        <div
          className="bg-brand-600 h-2.5 rounded-full transition-all duration-300 ease-in-out"
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}
