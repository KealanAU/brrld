'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { BeachData, BeachDetails } from '@/types/beach';
import { getBeachDetails, getStormGlassDetails, getTideDetails } from '@/utils/csvParser';

// Helper function to filter data to last 4 days
const filterToLastFourDays = <T extends { date_time?: string; tide_time?: string }>(data: T[]): T[] => {
  if (data.length === 0) return [];
  
  // Get all unique dates from the data
  const uniqueDates = new Set(
    data.map(item => {
      const date = new Date(item.date_time || item.tide_time || '');
      return date.toISOString().split('T')[0]; // Get just the date part YYYY-MM-DD
    })
  );
  
  const sortedDates = Array.from(uniqueDates).sort();
  
  // Get the earliest date plus the next 3 days
  const fourDaysFromStart = sortedDates.slice(0, 4);
  
  // Filter data to only include entries from these 4 dates
  return data.filter(item => {
    const itemDate = new Date(item.date_time || item.tide_time || '');
    const dateStr = itemDate.toISOString().split('T')[0];
    return fourDaysFromStart.includes(dateStr);
  });
};

const isMobileDevice = (): boolean => {
  if (typeof window === 'undefined') return false;
  return window.innerWidth < 768;
};

interface BeachDataContextType {
  beachData: BeachData | null;
  allBeaches: BeachDetails[];
  isLoading: boolean;
  isLoadingDetails: boolean;
  error: Error | null;
  noDataError: boolean;
  refreshData: () => Promise<void>;
  selectedBeachId: number | null;
  setSelectedBeachId: (id: number | null) => void;
}

interface BeachDataProviderProps {
  children: React.ReactNode;
  initialData?: BeachData;
}

const BeachDataContext = createContext<BeachDataContextType | undefined>(undefined);

export function BeachDataProvider({ children, initialData }: BeachDataProviderProps) {
  const searchParams = useSearchParams();
  const [beachData, setBeachData] = useState<BeachData | null>(initialData ?? null);
  const [allBeaches, setAllBeaches] = useState<BeachDetails[]>([]);
  const [isLoading, setIsLoading] = useState(!initialData);
  const [isLoadingDetails, setIsLoadingDetails] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [noDataError, setNoDataError] = useState(false);
  const [selectedBeachId, setSelectedBeachId] = useState<number | null>(initialData?.details.beach_id ?? null);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(isMobileDevice());
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Only load beach details if we don't have initial data
  useEffect(() => {
    if (initialData) return;

    const loadBeachDetails = async () => {
      try {
        setIsLoading(true);
        setError(null);

        const beachDetails = await getBeachDetails();
        setAllBeaches(beachDetails);

        // Check URL for beach parameters
        const beachParam = searchParams.get('beach');
        const beachNameParam = searchParams.get('beachName');
        const beachIdParam = searchParams.get('beachId');

        let beachSelected = false;

        // Try beach parameter first (most common)
        if (beachParam) {
          // Try to find beach by name (case-insensitive)
          const beach = beachDetails.find(
            beach => beach.beach_name.toLowerCase() === beachParam.toLowerCase()
          );
          if (beach) {
            setSelectedBeachId(beach.beach_id);
            beachSelected = true;
          }
        } else if (beachNameParam) {
          // Try beachName parameter next
          const beach = beachDetails.find(
            beach => beach.beach_name.toLowerCase() === beachNameParam.toLowerCase()
          );
          if (beach) {
            setSelectedBeachId(beach.beach_id);
            beachSelected = true;
          }
        } else if (beachIdParam) {
          // Fallback to beach ID
          const beachId = parseInt(beachIdParam, 10);
          if (!isNaN(beachId) && beachDetails.some(beach => beach.beach_id === beachId)) {
            setSelectedBeachId(beachId);
            beachSelected = true;
          }
        }

        // If no beach was selected from URL parameters and we're on mobile, select the first beach
        if (!beachSelected && isMobile && beachDetails.length > 0) {
          setSelectedBeachId(beachDetails[0].beach_id);
        }
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Failed to fetch beach details'));
      } finally {
        setIsLoading(false);
      }
    };

    loadBeachDetails();
  }, [searchParams, isMobile]);

  useEffect(() => {
    const loadBeachData = async () => {
      if (!selectedBeachId || !allBeaches.length) {
        return;
      }

      try {
        setIsLoadingDetails(true);
        const selectedBeach = allBeaches.find(beach => beach.beach_id === selectedBeachId);
        
        if (!selectedBeach) return;

        const [stormGlassData, tideData] = await Promise.all([
          getStormGlassDetails(),
          getTideDetails()
        ]);

        const beachStormGlassData = stormGlassData
          .filter(data => data.beach_id === selectedBeachId)
          .sort((a, b) => new Date(a.date_time).getTime() - new Date(b.date_time).getTime());

        const beachTideData = tideData
          .filter(tide => tide.beach_id === selectedBeachId)
          .sort((a, b) => new Date(a.tide_time).getTime() - new Date(b.tide_time).getTime());

        const filteredStormGlassData = filterToLastFourDays(beachStormGlassData);
        const filteredTideData = filterToLastFourDays(beachTideData);
        
        if (filteredStormGlassData.length === 0 && filteredTideData.length === 0) {
          setBeachData({
            details: selectedBeach,
            stormGlassData: [],
            tideData: []
          });
          setNoDataError(true);
          return;
        }

        setBeachData({
          details: selectedBeach,
          stormGlassData: filteredStormGlassData,
          tideData: filteredTideData
        });
        setNoDataError(false);
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Failed to fetch beach data'));
      } finally {
        setIsLoadingDetails(false);
      }
    };

    loadBeachData();
  }, [selectedBeachId, allBeaches]);

  const refreshData = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const beachDetails = await getBeachDetails();
      setAllBeaches(beachDetails);

      if (selectedBeachId) {
        setIsLoadingDetails(true);
        const selectedBeach = beachDetails.find(beach => beach.beach_id === selectedBeachId);
        if (selectedBeach) {
          const [stormGlassData, tideData] = await Promise.all([
            getStormGlassDetails(),
            getTideDetails()
          ]);

          const beachStormGlassData = stormGlassData
            .filter(data => data.beach_id === selectedBeachId)
            .sort((a, b) => new Date(a.date_time).getTime() - new Date(b.date_time).getTime());

          const beachTideData = tideData
            .filter(tide => tide.beach_id === selectedBeachId)
            .sort((a, b) => new Date(a.tide_time).getTime() - new Date(b.tide_time).getTime());

          const filteredStormGlassData = filterToLastFourDays(beachStormGlassData);
          const filteredTideData = filterToLastFourDays(beachTideData);
          
          if (filteredStormGlassData.length === 0 && filteredTideData.length === 0) {
            setBeachData({
              details: selectedBeach,
              stormGlassData: [],
              tideData: []
            });
            setNoDataError(true);
            return;
          }

          setBeachData({
            details: selectedBeach,
            stormGlassData: filteredStormGlassData,
            tideData: filteredTideData
          });
          setNoDataError(false);
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to refresh beach data'));
    } finally {
      setIsLoading(false);
      setIsLoadingDetails(false);
    }
  };

  return (
    <BeachDataContext.Provider 
      value={{ 
        beachData, 
        allBeaches,
        isLoading, 
        isLoadingDetails,
        error, 
        noDataError,
        refreshData,
        selectedBeachId,
        setSelectedBeachId
      }}
    >
      {children}
    </BeachDataContext.Provider>
  );
}

export function useBeachData() {
  const context = useContext(BeachDataContext);
  if (context === undefined) {
    throw new Error('useBeachData must be used within a BeachDataProvider');
  }
  return context;
} 
