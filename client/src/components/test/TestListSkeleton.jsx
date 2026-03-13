import React from 'react';

const TestListSkeleton = ({ count = 6, viewMode = 'grid' }) => {
  const Pulse = ({ w = 'w-full', h = 'h-4', r = 'rounded', className = '' }) => (
    <div className={`${w} ${h} ${r} bg-gray-200 dark:bg-gray-700 animate-pulse ${className}`} />
  );

  const CardSkeleton = () => (
    <div className="rounded-2xl border-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-4 space-y-3">
      <div className="absolute top-0 left-0 right-0 h-1 bg-gray-200 dark:bg-gray-700 rounded-t-2xl animate-pulse" />
      <div className="flex gap-3">
        <Pulse w="w-12" h="h-12" r="rounded-xl" />
        <div className="flex-1 space-y-2">
          <div className="flex gap-2">
            <Pulse w="w-12" h="h-5" r="rounded-md" />
            <Pulse w="w-8" h="h-5" r="rounded-md" />
          </div>
          <Pulse w="w-3/4" h="h-5" />
          <div className="flex gap-3">
            <Pulse w="w-14" h="h-4" />
            <Pulse w="w-14" h="h-4" />
          </div>
        </div>
      </div>
      <div className="flex items-center justify-between pt-3 border-t border-gray-100 dark:border-gray-700">
        <Pulse w="w-16" h="h-3" />
        <div className="flex gap-2">
          <Pulse w="w-8" h="h-8" r="rounded-xl" />
          <Pulse w="w-20" h="h-8" r="rounded-xl" />
        </div>
      </div>
    </div>
  );

  const RowSkeleton = () => (
    <div className="rounded-xl border-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-3.5 pl-5 flex items-center gap-3">
      <Pulse w="w-10" h="h-10" r="rounded-xl" />
      <div className="flex-1 space-y-1.5">
        <div className="flex gap-2">
          <Pulse w="w-10" h="h-4" r="rounded" />
          <Pulse w="w-8" h="h-4" r="rounded" />
        </div>
        <Pulse w="w-1/2" h="h-4" />
        <Pulse w="w-1/4" h="h-3" />
      </div>
      <div className="flex gap-2">
        <Pulse w="w-8" h="h-8" r="rounded-xl" />
        <Pulse w="w-20" h="h-8" r="rounded-xl" />
      </div>
    </div>
  );

  if (viewMode === 'list') {
    return (
      <div className="space-y-2">
        {Array.from({ length: count }).map((_, i) => (
          <RowSkeleton key={i} />
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
      {Array.from({ length: count }).map((_, i) => (
        <CardSkeleton key={i} />
      ))}
    </div>
  );
};

export default TestListSkeleton;