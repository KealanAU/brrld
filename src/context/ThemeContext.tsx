"use client";

import React, { createContext, useContext } from 'react';

interface ThemeColors {
  // Main colors from the palette
  oceanBlue: string;
  sunsetOrange: string;
  deepOcean: string;
  skyBlue: string;
  
  // Semantic colors for charts
  chartBackground: string;
  chartArea: string;
  chartLine: string;
  chartText: string;
  chartGrid: string;
  chartShadow: string;
  chartHover: string;
  chartHighlight: string;
}

const defaultTheme: ThemeColors = {
  // Base palette
  oceanBlue: '#219fbd',
  sunsetOrange: '#fb8501',
  deepOcean: '#0f253f',
  skyBlue: '#8ecbe6',
  
  // Semantic colors
  chartBackground: '#fff',
  chartArea: '#8ecbe6',
  chartLine: '#0f253f',
  chartText: '#0f253f',
  chartGrid: 'rgba(15, 37, 63, 0.2)',
  chartShadow: 'rgba(15, 37, 63, 0.1)',
  chartHover: '#219fbd',
  chartHighlight: '#fb8501',
};

const ThemeContext = createContext<ThemeColors>(defaultTheme);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <ThemeContext.Provider value={defaultTheme}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => useContext(ThemeContext); 