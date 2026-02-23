import { useEffect, useRef, useState } from 'react';

import { useUpdateRoute } from '@/features/routes/api/update-route';

interface ClickToEditNotesProps {
  raceId: number;
  routeId: number;
  notes: string | null;
  placeholder?: string;
  testIdPrefix?: string;
}

export function ClickToEditNotes({
  raceId,
  routeId,
  notes,
  placeholder = 'Add notes...',
  testIdPrefix = 'route-notes',
}: ClickToEditNotesProps) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(notes ?? '');
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const updateRoute = useUpdateRoute();

  useEffect(() => {
    if (editing && textareaRef.current) {
      textareaRef.current.focus();
    }
  }, [editing]);

  const handleSave = () => {
    updateRoute.mutate(
      { raceId, routeId, data: { notes: draft } },
      { onSuccess: () => setEditing(false) },
    );
  };

  const handleCancel = () => {
    setDraft(notes ?? '');
    setEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      handleCancel();
    } else if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
      handleSave();
    }
  };

  if (editing) {
    return (
      <div className="flex flex-col gap-1">
        <textarea
          ref={textareaRef}
          data-testid={`${testIdPrefix}-input-${routeId}`}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={handleKeyDown}
          rows={2}
          className="w-full text-sm border border-gray-300 rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-indigo-500 resize-y"
        />
        <div className="flex gap-1">
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
      </div>
    );
  }

  return (
    <div
      data-testid={`${testIdPrefix}-display-${routeId}`}
      onClick={() => {
        setDraft(notes ?? '');
        setEditing(true);
      }}
      className="cursor-pointer text-sm min-h-[1.5rem]"
    >
      {notes ? (
        <span className="text-gray-700">{notes}</span>
      ) : (
        <span className="text-gray-400 italic">{placeholder}</span>
      )}
    </div>
  );
}
