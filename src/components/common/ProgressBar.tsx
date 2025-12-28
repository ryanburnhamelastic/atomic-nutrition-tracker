interface ProgressBarProps {
  value: number;
  max: number;
  label?: string;
  showValues?: boolean;
  color?: 'primary' | 'success' | 'warning' | 'danger';
  size?: 'sm' | 'md' | 'lg';
}

const colorClasses = {
  primary: 'bg-indigo-500',
  success: 'bg-green-500',
  warning: 'bg-yellow-500',
  danger: 'bg-red-500',
};

const sizeClasses = {
  sm: 'h-2',
  md: 'h-3',
  lg: 'h-4',
};

export default function ProgressBar({
  value,
  max,
  label,
  showValues = true,
  color = 'primary',
  size = 'md',
}: ProgressBarProps) {
  const percentage = max > 0 ? Math.min((value / max) * 100, 100) : 0;
  const isOver = value > max;

  // Change color to danger if over target
  const barColor = isOver ? 'bg-red-500' : colorClasses[color];

  return (
    <div className="w-full">
      {(label || showValues) && (
        <div className="flex justify-between items-center mb-1">
          {label && (
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
              {label}
            </span>
          )}
          {showValues && (
            <span className={`text-sm ${isOver ? 'text-red-500 font-semibold' : 'text-gray-500 dark:text-gray-400'}`}>
              {Math.round(value)} / {Math.round(max)}
            </span>
          )}
        </div>
      )}
      <div className={`w-full bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden ${sizeClasses[size]}`}>
        <div
          className={`${barColor} ${sizeClasses[size]} rounded-full transition-all duration-300 ease-out`}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}
