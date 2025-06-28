# Type Definitions

This directory contains all TypeScript type definitions for the brrld-visual application.

## File Structure

- `index.ts` - Main entry point with all type exports
- `data.ts` - Core data types, visualization props, and tooltip data
- `beach.ts` - Beach-specific data types
- `README.md` - This documentation file

## Type Organization

### Core Types (`data.ts`)

#### Base Interfaces
- `BaseVisualizationProps` - Common props for all visualization components
- `BaseTooltipData` - Common properties for all tooltip data

#### Core Data Types
- `Rating` - Surf condition rating ('Poor' | 'Fair' | 'Good' | 'Epic')
- `ratingColors` - Color mapping for ratings
- `StormGlassDataPoint` - Complete weather/ocean data structure

#### Visualization Props
- `SwellVisualizationProps` - Props for swell visualization
- `TidalVisualizationProps` - Props for tidal visualization (extends base with height options)
- `WindVisualizationProps` - Props for wind visualization

#### Tooltip Data Types
- `SwellTooltipData` - Data for swell chart tooltips
- `TidalTooltipData` - Data for tidal chart tooltips  
- `WindTooltipData` - Data for wind chart tooltips
- `TooltipData` - Legacy alias for SwellTooltipData

### Beach Types (`beach.ts`)

- `BeachDetails` - Static beach information
- `TideDetails` - Tide data structure
- `BeachData` - Complete beach dataset
- `StormGlassDetails` - Legacy alias for StormGlassDataPoint

## Usage Examples

### Importing Types

```typescript
// Import specific types
import { Rating, ratingColors, SwellTooltipData } from '@/types';

// Import all types
import * as Types from '@/types';

// Import from specific files (not recommended)
import { BeachDetails } from '@/types/beach';
```

### Using Base Interfaces

```typescript
// Extend base interfaces for new components
interface CustomVisualizationProps extends BaseVisualizationProps {
  customProp: string;
}

interface CustomTooltipData extends BaseTooltipData {
  customData: number;
}
```

### Type Safety

```typescript
// Type-safe rating usage
const rating: Rating = 'Good';
const color = ratingColors[rating]; // Type-safe color lookup

// Type-safe tooltip data
const tooltipData: SwellTooltipData = {
  dateTime: '2024-01-01T12:00:00Z',
  x: 100,
  y: 200,
  waveHeight: 2.5,
  // ... other required properties
};
```

## Migration Guide

### From Old Structure

The old structure had some issues:
- Duplicate `StormGlassDetails` and `StormGlassDataPoint`
- Inconsistent naming conventions
- Scattered related types

### To New Structure

1. **Use the index file**: Import from `@/types` instead of specific files
2. **Leverage base interfaces**: Extend `BaseVisualizationProps` and `BaseTooltipData` for new types
3. **Use consistent naming**: All new types follow camelCase for properties
4. **Eliminate duplication**: Use `StormGlassDataPoint` instead of `StormGlassDetails`

### Backward Compatibility

All existing imports will continue to work:
- `StormGlassDetails` is now an alias for `StormGlassDataPoint`
- `TooltipData` is now an alias for `SwellTooltipData`
- All existing type names are preserved

## Best Practices

1. **Import from index**: Use `@/types` for all type imports
2. **Extend base interfaces**: Create new visualization props by extending `BaseVisualizationProps`
3. **Use type aliases**: For simple type mappings, use `type` instead of empty interfaces
4. **Maintain consistency**: Follow the established naming conventions
5. **Document changes**: Update this README when adding new types 