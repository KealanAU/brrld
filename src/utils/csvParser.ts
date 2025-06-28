import Papa from 'papaparse';
import { BeachDetails, StormGlassDetails, TideDetails } from '@/types/beach';

export async function parseCSV<T>(filePath: string): Promise<T[]> {
  try {
    const response = await fetch(filePath);
    const csvText = await response.text();
    
    return new Promise((resolve, reject) => {
      Papa.parse(csvText, {
        header: true,
        dynamicTyping: true,
        skipEmptyLines: true,
        complete: (results) => {
          resolve(results.data as T[]);
        },
        error: (error: Error) => {
          reject(error);
        }
      });
    });
  } catch (error) {
    console.error(`Error parsing CSV file ${filePath}:`, error);
    throw error;
  }
}

export async function getBeachDetails(): Promise<BeachDetails[]> {
  const data = await parseCSV<BeachDetails>('/data/beach/main_beach_details.csv');
  // Filter out any non-numeric beach_ids and ensure they're numbers
  return data
    .filter(beach => !isNaN(Number(beach.beach_id)))
    .map(beach => ({
      ...beach,
      beach_id: Number(beach.beach_id)
    }));
}

export async function getStormGlassDetails(): Promise<StormGlassDetails[]> {
  return parseCSV<StormGlassDetails>('/data/beach/main_storm_glass_details.csv');
}

export async function getTideDetails(): Promise<TideDetails[]> {
  return parseCSV<TideDetails>('/data/beach/main_tide_details.csv');
}

export function getLatestDataForBeach<T extends { beach_id: number; date_time?: string }>(
  data: T[],
  beachId: number
): T | undefined {
  return data
    .filter(item => item.beach_id === beachId)
    .sort((a, b) => {
      if (!a.date_time || !b.date_time) return 0;
      return new Date(b.date_time).getTime() - new Date(a.date_time).getTime();
    })[0];
} 