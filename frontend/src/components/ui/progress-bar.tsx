interface ProgressBarProps {
  progress: number;
  total: number;
  status: 'pending' | 'running' | 'completed' | 'failed';
  message?: string | null;
}

const statusColors = {
  pending: 'bg-gray-400',
  running: 'bg-indigo-600',
  completed: 'bg-emerald-500',
  failed: 'bg-red-500',
};

export function ProgressBar({ progress, total, status, message }: ProgressBarProps) {
  const percent = total > 0 ? Math.round((progress / total) * 100) : 0;

  return (
    <div data-testid="progress-bar">
      <div className="flex justify-between text-sm text-gray-600 mb-1">
        <span data-testid="progress-status" data-status={status} className="capitalize">{status}</span>
        <span>{percent}%</span>
      </div>
      <div className="w-full bg-gray-200 rounded-full h-2.5">
        <div
          className={`h-2.5 rounded-full transition-all duration-300 ${statusColors[status]}`}
          style={{ width: `${percent}%` }}
        />
      </div>
      {message && (
        <p className="mt-1 text-xs text-gray-500">{message}</p>
      )}
    </div>
  );
}
