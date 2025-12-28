interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
}

export default function LoadingSpinner({ size = 'md' }: LoadingSpinnerProps) {
  const sizeClasses = {
    sm: 'h-4 w-4 border-2',
    md: 'h-8 w-8 border-2',
    lg: 'h-12 w-12 border-3',
  };

  return (
    <div
      className={`${sizeClasses[size]} animate-spin rounded-full border-slate-300 border-t-indigo-600 dark:border-slate-600 dark:border-t-indigo-400`}
    />
  );
}
