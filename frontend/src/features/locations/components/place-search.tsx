import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { geocodeSearch, type GeocodeResult } from '@/features/locations/api/geocode-search';

interface PlaceSearchProps {
  onSelect: (result: GeocodeResult) => void;
}

export function PlaceSearch({ onSelect }: PlaceSearchProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<GeocodeResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showResults, setShowResults] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setShowResults(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSearch = async () => {
    const trimmed = query.trim();
    if (!trimmed) return;

    setIsSearching(true);
    setError(null);
    setResults([]);

    try {
      const data = await geocodeSearch(trimmed);
      setResults(data);
      setShowResults(true);
      if (data.length === 0) {
        setError('No results found. Try a different search.');
      }
    } catch {
      setError('Search failed. Please try again.');
    } finally {
      setIsSearching(false);
    }
  };

  const handleSelect = (result: GeocodeResult) => {
    onSelect(result);
    setShowResults(false);
    setQuery('');
    setResults([]);
  };

  return (
    <div ref={containerRef} className="relative">
      <label className="block text-sm font-medium text-gray-700 mb-1">
        Search Address
      </label>
      <div className="flex gap-2">
        <div className="flex-1">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                handleSearch();
              }
            }}
            placeholder="Search for an address or place name..."
            className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm border px-3 py-2"
          />
        </div>
        <Button
          type="button"
          variant="secondary"
          onClick={handleSearch}
          loading={isSearching}
          disabled={!query.trim()}
        >
          Search
        </Button>
      </div>

      {error && (
        <p className="mt-1 text-xs text-red-600">{error}</p>
      )}

      {showResults && results.length > 0 && (
        <div className="absolute z-10 mt-1 w-full bg-white border border-gray-200 rounded-md shadow-lg max-h-60 overflow-y-auto">
          {results.map((result, index) => (
            <button
              key={index}
              type="button"
              onClick={() => handleSelect(result)}
              className="w-full text-left px-4 py-3 hover:bg-indigo-50 border-b border-gray-100 last:border-b-0 transition-colors"
            >
              <p className="text-sm font-medium text-gray-900">
                {result.formatted_address}
              </p>
              {result.lat != null && result.lng != null && (
                <p className="text-xs text-gray-500 mt-0.5">
                  {result.lat.toFixed(6)}, {result.lng.toFixed(6)}
                </p>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
