import { useState, useEffect } from 'react';
import { useBeachData } from '@/context/BeachDataContext';

// Custom debounce hook
const useDebounce = <T,>(value: T, delay: number): T => {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(timer);
    };
  }, [value, delay]);

  return debouncedValue;
};

export const BeachSearch = () => {
  const { allBeaches = [], isLoading, setSelectedBeachId } = useBeachData();
  const [searchTerm, setSearchTerm] = useState('');
  
  // Debounce the search term with a 300ms delay
  const debouncedSearchTerm = useDebounce(searchTerm, 300);

  // Log the debounced search term and available beaches
  useEffect(() => {
  }, [debouncedSearchTerm, allBeaches]);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  };

  const handleBeachClick = (beachId: number) => {
    setSelectedBeachId(beachId);
    setSearchTerm('');
  };

  return (
    <div className="relative w-full h-10">
      <input
        type="text"
        value={searchTerm}
        onChange={handleSearchChange}
        placeholder={isLoading ? "Loading beaches..." : "Search beaches..."}
        className="w-full h-full px-3 sm:px-4 text-sm sm:text-base bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#f3e9d2] focus:border-[#f3e9d2] shadow-sm"
        disabled={isLoading}
      />
      {debouncedSearchTerm && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 shadow-lg rounded-lg max-h-[250px] sm:max-h-[300px] overflow-y-auto z-[60] sm:left-0 sm:right-0 -left-3 -right-3 sm:rounded-lg rounded-none sm:border sm:border-gray-200 border-l-0 border-r-0">
          <ul className="py-1">
            {allBeaches
              .filter(beach => 
                beach.beach_name.toLowerCase().includes(debouncedSearchTerm.toLowerCase()) ||
                (beach.area && beach.area.toLowerCase().includes(debouncedSearchTerm.toLowerCase()))
              )
              .slice(0, 8)
              .map(beach => (
                <li 
                  key={beach.beach_id}
                  onClick={() => handleBeachClick(beach.beach_id)}
                  className="px-3 py-3 sm:py-2 hover:bg-gray-100 cursor-pointer text-sm active:bg-gray-200"
                >
                  <div className="font-medium text-sm sm:text-sm">{beach.beach_name}</div>
                  <div className="text-xs text-gray-600 mt-0.5">
                    {beach.area && <span>{beach.area}</span>}
                    {beach.region && beach.area && <span className="mx-1">•</span>}
                    {beach.region && <span>{beach.region}</span>}
                    {(beach.area || beach.region) && beach.ability_level && <span className="mx-1">•</span>}
                    {beach.ability_level && <span>{beach.ability_level}</span>}
                  </div>
                </li>
              ))}
          </ul>
        </div>
      )}
    </div>
  );
}; 