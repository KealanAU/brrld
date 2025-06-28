'use client';

import React, { createContext, useContext, useState, ReactNode } from 'react';

interface ChartHoverContextType {
  hoveredTime: Date | null;
  setHoveredTime: (time: Date | null) => void;
  // Mobile day navigation state
  currentDayIndex: number;
  setCurrentDayIndex: (index: number) => void;
  isMobile: boolean;
  setIsMobile: (mobile: boolean) => void;
  uniqueDays: string[];
  setUniqueDays: (days: string[]) => void;
}

const ChartHoverContext = createContext<ChartHoverContextType | undefined>(undefined);

export const useChartHover = () => {
  const context = useContext(ChartHoverContext);
  if (context === undefined) {
    throw new Error('useChartHover must be used within a ChartHoverProvider');
  }
  return context;
};

interface ChartHoverProviderProps {
  children: ReactNode;
}

export const ChartHoverProvider: React.FC<ChartHoverProviderProps> = ({ children }) => {
  const [hoveredTime, setHoveredTime] = useState<Date | null>(null);
  const [currentDayIndex, setCurrentDayIndex] = useState(0);
  const [isMobile, setIsMobile] = useState(false);
  const [uniqueDays, setUniqueDays] = useState<string[]>([]);

  return (
    <ChartHoverContext.Provider value={{
      hoveredTime,
      setHoveredTime,
      currentDayIndex,
      setCurrentDayIndex,
      isMobile,
      setIsMobile,
      uniqueDays,
      setUniqueDays
    }}>
      {children}
    </ChartHoverContext.Provider>
  );
}; 