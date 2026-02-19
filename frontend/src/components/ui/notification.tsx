import { useEffect } from 'react';

interface NotificationProps {
  message: string;
  variant?: 'success' | 'error';
  onDismiss: () => void;
  duration?: number;
}

export function Notification({
  message,
  variant = 'success',
  onDismiss,
  duration = 3000,
}: NotificationProps) {
  useEffect(() => {
    const timer = setTimeout(onDismiss, duration);
    return () => clearTimeout(timer);
  }, [onDismiss, duration]);

  const bgClass = variant === 'success'
    ? 'bg-green-50 border-green-200 text-green-800'
    : 'bg-red-50 border-red-200 text-red-800';

  return (
    <div data-testid="notification" className={`fixed top-4 right-4 z-50 rounded-md border px-4 py-3 shadow-lg ${bgClass}`}>
      <div className="flex items-center gap-2">
        <span className="text-sm font-medium">{message}</span>
        <button
          onClick={onDismiss}
          className="ml-2 text-current opacity-50 hover:opacity-100"
        >
          &times;
        </button>
      </div>
    </div>
  );
}
