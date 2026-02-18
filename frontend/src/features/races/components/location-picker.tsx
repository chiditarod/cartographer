import { useLocations } from '@/features/locations/api/get-locations';
import { Spinner } from '@/components/ui/spinner';

interface LocationPickerProps {
  selectedIds: number[];
  onChange: (ids: number[]) => void;
}

export function LocationPicker({ selectedIds, onChange }: LocationPickerProps) {
  const { data: locations, isLoading } = useLocations();

  if (isLoading) {
    return <Spinner size="sm" />;
  }

  if (!locations || locations.length === 0) {
    return <p className="text-sm text-gray-500">No locations available.</p>;
  }

  const handleToggle = (id: number) => {
    if (selectedIds.includes(id)) {
      onChange(selectedIds.filter((sid) => sid !== id));
    } else {
      onChange([...selectedIds, id]);
    }
  };

  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-2">
        Location Pool
      </label>
      <div className="border border-gray-200 rounded-md max-h-48 overflow-y-auto p-2 space-y-1">
        {locations.map((location) => (
          <label
            key={location.id}
            className="flex items-center gap-2 px-2 py-1.5 rounded hover:bg-gray-50 cursor-pointer text-sm"
          >
            <input
              type="checkbox"
              checked={selectedIds.includes(location.id)}
              onChange={() => handleToggle(location.id)}
              className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
            />
            <span className="text-gray-900">{location.name}</span>
            {location.street_address && (
              <span className="text-gray-400 text-xs ml-1">
                - {location.street_address}
              </span>
            )}
          </label>
        ))}
      </div>
      <p className="mt-1 text-xs text-gray-500">
        {selectedIds.length} location{selectedIds.length !== 1 ? 's' : ''} selected
      </p>
    </div>
  );
}
