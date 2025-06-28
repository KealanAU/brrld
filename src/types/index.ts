// ============================================================================
// MAIN TYPE EXPORTS
// ============================================================================

// Core types
export type { Rating } from './data';
export { ratingColors } from './data';

// Base interfaces
export type { BaseVisualizationProps, BaseTooltipData } from './data';

// Data types
export type { StormGlassDataPoint } from './data';
export type { BeachDetails, TideDetails, BeachData, StormGlassDetails } from './beach';

// Visualization props
export type { 
  SwellVisualizationProps, 
  TidalVisualizationProps, 
  WindVisualizationProps 
} from './data';

// Tooltip data types
export type { 
  SwellTooltipData, 
  TidalTooltipData, 
  WindTooltipData,
  TooltipData 
} from './data';

// ============================================================================
// CONVENIENCE RE-EXPORTS
// ============================================================================

// Re-export everything from data.ts for backward compatibility
export * from './data';

// Re-export everything from beach.ts for backward compatibility  
export * from './beach'; 