import { cn } from '../../lib/utils';

interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  className?: string;
}

export function Skeleton({ className, ...props }: SkeletonProps) {
  return (
    <div
      className={cn(
        'animate-pulse bg-gray-200 dark:bg-gray-800 rounded-md',
        className
      )}
      {...props}
    />
  );
}

export default Skeleton;
