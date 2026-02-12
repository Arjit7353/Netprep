import React from 'react';
import { Loader2 } from 'lucide-react';

// Spinner Loader
export const Spinner = ({ size = 'md', className = '' }) => {
  const sizes = {
    xs: 'w-4 h-4',
    sm: 'w-5 h-5',
    md: 'w-8 h-8',
    lg: 'w-12 h-12',
    xl: 'w-16 h-16'
  };

  return (
    <Loader2 className={`animate-spin text-primary-600 dark:text-primary-400 ${sizes[size]} ${className}`} />
  );
};

// Full Page Loader
export const PageLoader = ({ message, messageHi }) => {
  return (
    <div className="fixed inset-0 bg-white/80 dark:bg-secondary-900/80 backdrop-blur-sm z-50 flex items-center justify-center">
      <div className="text-center">
        <Spinner size="xl" />
        {(message || messageHi) && (
          <div className="mt-4">
            {message && <p className="text-gray-600 dark:text-secondary-300">{message}</p>}
            {messageHi && <p className="text-sm text-gray-500 dark:text-secondary-400">{messageHi}</p>}
          </div>
        )}
      </div>
    </div>
  );
};

// Inline Loader
export const InlineLoader = ({ text, textHi }) => {
  return (
    <div className="flex items-center justify-center gap-2 py-4">
      <Spinner size="sm" />
      {(text || textHi) && (
        <span className="text-gray-600 dark:text-secondary-300 text-sm">
          {text || textHi}
        </span>
      )}
    </div>
  );
};

// Skeleton Loader
export const Skeleton = ({ 
  width = 'w-full', 
  height = 'h-4', 
  rounded = 'rounded',
  className = '' 
}) => {
  return (
    <div 
      className={`
        ${width} ${height} ${rounded}
        bg-gray-200 dark:bg-secondary-700 animate-pulse
        ${className}
      `}
    />
  );
};

// Card Skeleton
export const CardSkeleton = () => {
  return (
    <div className="bg-white dark:bg-secondary-800 rounded-xl border border-gray-200 dark:border-secondary-700 p-4 space-y-3">
      <Skeleton height="h-5" width="w-3/4" />
      <Skeleton height="h-4" width="w-full" />
      <Skeleton height="h-4" width="w-5/6" />
      <div className="flex gap-2 pt-2">
        <Skeleton height="h-6" width="w-16" rounded="rounded-full" />
        <Skeleton height="h-6" width="w-20" rounded="rounded-full" />
      </div>
    </div>
  );
};

// Question Skeleton
export const QuestionSkeleton = () => {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
      <div className="flex justify-between items-start">
        <Skeleton height="h-6" width="w-1/2" />
        <Skeleton height="h-6" width="w-16" rounded="rounded-full" />
      </div>
      <Skeleton height="h-4" width="w-full" />
      <Skeleton height="h-4" width="w-5/6" />
      <div className="space-y-2 pt-2">
        {[1, 2, 3, 4].map(i => (
          <div key={i} className="flex items-center gap-3">
            <Skeleton height="h-5" width="w-5" rounded="rounded-full" />
            <Skeleton height="h-4" width="w-3/4" />
          </div>
        ))}
      </div>
    </div>
  );
};

// List Skeleton
export const ListSkeleton = ({ count = 5 }) => {
  return (
    <div className="space-y-3">
      {Array.from({ length: count }).map((_, i) => (
        <CardSkeleton key={i} />
      ))}
    </div>
  );
};

// Default export
const Loader = Spinner;
export default Loader;