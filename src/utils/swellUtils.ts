
import {type Rating} from '@/types/data'
// Add this helper function above the component (or inside if preferred)
export function getCompassDirection(deg: number): string {
    const directions = [
      'N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE',
      'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW',
    ];
    const ix = Math.round(deg / 22.5) % 16;
    return directions[ix];
  }

  // Helper function to calculate rating based on conditions
export function calculateRating(
    waveHeight: number,
    windSpeed: number,
    windDirection: number,
    waveDirection: number
  ): Rating {
    // This is a simplified rating system - you may want to adjust these thresholds
    if (waveHeight < 0.5) return 'Poor';
    if (waveHeight > 3) return 'Epic';
    
    // Consider wind conditions
    const windFactor = windSpeed < 10 ? 1 : windSpeed < 15 ? 0.8 : 0.5;
    
    // Consider wave and wind direction alignment
    const directionDiff = Math.abs(waveDirection - windDirection);
    const directionFactor = directionDiff < 45 ? 1 : directionDiff < 90 ? 0.8 : 0.6;
    
    const adjustedHeight = waveHeight * windFactor * directionFactor;
    
    if (adjustedHeight < 1) return 'Poor';
    if (adjustedHeight < 1.5) return 'Fair';
    if (adjustedHeight < 2.5) return 'Good';
    return 'Epic';
  }