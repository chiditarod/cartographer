import { useEffect, useRef, useState } from 'react';

import { useUpdateRoute } from '@/features/routes/api/update-route';

interface ClickToEditNameProps {
  raceId: number;
  routeId: number;
  name: string | null;
  fallback: string;
  className?: string;
  testIdPrefix?: string;
}

export function ClickToEditName({
  raceId,
  routeId,
  name,
  fallback,
  className = '',
  testIdPrefix = 'route-name',
}: ClickToEditNameProps) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(name ?? '');
  const inputRef = useRef<HTMLInputElement>(null);
  const updateRoute = useUpdateRoute();

  useEffect(() => {
    if (editing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [editing]);

  const handleSave = () => {
    updateRoute.mutate(
      { raceId, routeId, data: { name: draft } },
      { onSuccess: () => setEditing(false) },
    );
  };

  const handleCancel = () => {
    setDraft(name ?? '');
    setEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      handleCancel();
    } else if (e.key === 'Enter') {
      handleSave();
    }
  };

  if (editing) {
    return (
      <div className="flex items-center gap-1">
        <input
          ref={inputRef}
          data-testid={`${testIdPrefix}-input-${routeId}`}
          type="text"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={fallback}
          className="text-sm border border-gray-300 rounded px-2 py-0.5 focus:outline-none focus:ring-1 focus:ring-indigo-500"
        />
        <button
          type="button"
          data-testid={`${testIdPrefix}-save-${routeId}`}
          onClick={handleSave}
          disabled={updateRoute.isPending}
          className="text-xs px-2 py-0.5 rounded bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-50"
        >
          Save
        </button>
        <button
          type="button"
          data-testid={`${testIdPrefix}-cancel-${routeId}`}
          onClick={handleCancel}
          className="text-xs px-2 py-0.5 rounded bg-gray-200 text-gray-700 hover:bg-gray-300"
        >
          Cancel
        </button>
      </div>
    );
  }

  return (
    <span
      data-testid={`${testIdPrefix}-display-${routeId}`}
      onClick={() => {
        setDraft(name ?? '');
        setEditing(true);
      }}
      className={`cursor-pointer hover:text-indigo-600 ${className}`}
    >
      {name || fallback}
    </span>
  );
}
