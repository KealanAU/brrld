import { BeachSearch } from './BeachSearch';
import Logo from './Logo';
import { useBeachData } from '@/context/BeachDataContext';

export function Header() {
  const { beachData } = useBeachData();

  return (
    <header className="fixed top-0 left-0 right-0 z-[9999]">
      <div className="max-w-[1400px] mx-auto px-3 sm:px-4 py-2">
        <div className="flex items-center justify-between gap-2 sm:gap-4">
          {/* Left side - Beach name */}
          <div className="min-w-0 flex-1 sm:flex-none">
            {beachData?.details && (
              <div className="truncate">
                <h1 className="text-sm sm:text-base font-bold truncate leading-tight">
                  {beachData.details.beach_name.length > 10 ? (
                    <span className="block sm:hidden">
                      {beachData.details.beach_name.substring(0, 10)}...
                    </span>
                  ) : null}
                  <span className="hidden sm:block">
                    {beachData.details.beach_name}
                  </span>
                </h1>
                {beachData.details.area && (
                  <p className="text-[10px] text-gray-600 truncate leading-tight">{beachData.details.area}</p>
                )}
              </div>
            )}
          </div>

          {/* Middle - Search */}
          <div className="flex-1 max-w-[200px] sm:max-w-[300px] md:max-w-[400px] lg:max-w-[500px] h-10">
            <BeachSearch />
          </div>

          {/* Right side - Logo */}
          <div className="flex justify-end flex-shrink-0">
            <Logo width={30} className="sm:w-[100px] w-[30px]" />
          </div>
        </div>
      </div>
    </header>
  );
} 