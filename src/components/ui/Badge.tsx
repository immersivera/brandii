import React from 'react';

interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'secondary' | 'success' | 'destructive' | 'outline' | 'primary';
}

export function Badge({ className, variant = 'default', ...props }: BadgeProps) {
  const variantClasses = {
    default: 'bg-brand-500 text-white',
    secondary: 'bg-gray-200 text-gray-800 dark:bg-gray-700 dark:text-gray-200',
    success: 'bg-success-100 text-success-700 dark:bg-success-700 dark:text-success-100',
    destructive: 'bg-red-100 text-red-800 dark:bg-red-800 dark:text-red-100',
    outline: 'border border-gray-300 bg-white text-gray-800 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-200',
    primary: 'bg-brand-100 text-brand-800 dark:bg-brand-800 dark:text-brand-100',
  };

  const baseClasses = 'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold';
  
  return (
    <div className={`${baseClasses} ${variantClasses[variant]} ${className || ''}`} {...props} />
  );
}
