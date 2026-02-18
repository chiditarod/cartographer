interface RouteMapProps {
  mapUrl: string | null;
}

export function RouteMap({ mapUrl }: RouteMapProps) {
  if (!mapUrl) {
    return (
      <div className="flex items-center justify-center h-64 bg-gray-100 rounded-lg border border-gray-200">
        <p className="text-sm text-gray-500">No map available</p>
      </div>
    );
  }

  return (
    <div className="rounded-lg overflow-hidden border border-gray-200">
      <img
        src={mapUrl}
        alt="Route map"
        className="w-full h-auto"
      />
    </div>
  );
}
