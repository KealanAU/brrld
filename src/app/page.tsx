'use client';

import dynamic from 'next/dynamic';
import { TidalVisualization } from '@/components/TidalVisualization';
import { WindVisualization } from '@/components/WindVisualization';
import { TopBar } from '@/components/TopBar';
import Map from '@/components/Map';
import { BeachDataProvider, useBeachData } from '@/context/BeachDataContext';
import { ChartHoverProvider } from '@/context/ChartHoverContext';
import { Header } from '@/components/Header';
import { useEffect, useState } from 'react';

const SwellVisualization = dynamic(() => import('@/components/SwellVisualization'), { ssr: false });

function useWindowWidth() {
  const [width, setWidth] = useState<number | null>(null);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
    setWidth(window.innerWidth);
    
    const handleResize = () => {
      setWidth(window.innerWidth);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return { width, isClient };
}

function ForecastContent() {
  const { width, isClient } = useWindowWidth();
  
  // Use a default mobile width during SSR to prevent layout shift
  const effectiveWidth = isClient ? width : 375; // Default mobile width
  const isMobile = effectiveWidth ? effectiveWidth < 768 : true;
  const visualizationWidth = isMobile ? (effectiveWidth || 375) : Math.floor((effectiveWidth || 1200) * 0.8);

  // Show loading state until client-side hydration is complete
  if (!isClient) {
    return (
      <div className="flex flex-col items-center space-y-4 md:space-y-8">
        <div className="w-full max-w-md h-16 bg-gray-200 animate-pulse rounded"></div>
        <div className="w-full max-w-md h-64 bg-gray-200 animate-pulse rounded"></div>
        <div className="w-full max-w-md h-64 bg-gray-200 animate-pulse rounded"></div>
        <div className="w-full max-w-md h-64 bg-gray-200 animate-pulse rounded"></div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center space-y-4 md:space-y-8">
      <ChartHoverProvider>
        <TopBar width={visualizationWidth} />
        <SwellVisualization width={visualizationWidth} />
        <TidalVisualization width={visualizationWidth} />
        <WindVisualization width={visualizationWidth} />
      </ChartHoverProvider>
    </div>
  );
}

function Visualizations() {
  const { beachData, noDataError } = useBeachData();

  if (!beachData?.details) {
    return (
      <div className="flex flex-col h-screen">
        <Header />
        <div className="flex-1 relative" style={{ marginTop: '0' }}>
          <Map className="absolute inset-0" />
        </div>
      </div>
    );
  }

  // Show error message when there's no swell and tidal data
  if (noDataError) {
    return (
      <>
        <Header />
        <div className="flex flex-col items-center justify-center min-h-screen px-4">
          <div className="text-center max-w-md">
            <div className="text-6xl mb-4">🌊</div>
            <h2 className="text-2xl font-bold text-gray-800 mb-2">No Data Available</h2>
            <p className="text-gray-600 mb-4">
              Sorry, there&apos;s no swell and tidal data available for {beachData.details.beach_name} at the moment.
            </p>
            <p className="text-sm text-gray-500">
              Please try selecting a different beach or check back later for updated forecasts.
            </p>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <Header />
      <div className="mt-4 md:px-4">
        <ForecastContent />
      </div>
    </>
  );
}

export default function Home() {
  return (
    <BeachDataProvider>
      <main className="relative h-screen w-full overflow-y-auto bg-white">
        <Visualizations />
      </main>
    </BeachDataProvider>
  );
}
