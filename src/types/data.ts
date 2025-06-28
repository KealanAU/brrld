// ============================================================================
// CORE DATA TYPES
// ============================================================================

export type Rating = 'Poor' | 'Fair' | 'Good' | 'Epic';

export const ratingColors: Record<Rating, string> = {
  'Poor': '#ff6b6b',
  'Fair': '#ffd93d',
  'Good': '#6bff6b',
  'Epic': '#6b6bff'
};

// ============================================================================
// BASE INTERFACES
// ============================================================================

export interface BaseVisualizationProps {
  width?: number;
  height?: number;
}

export interface BaseTooltipData {
  dateTime: string;
  x: number;
  y: number;
}

// ============================================================================
// STORM GLASS DATA
// ============================================================================

export interface StormGlassDataPoint {
  beach_id: number;
  date_time: string;
  air_temperature: number;
  water_temperature: number;
  wind_speed: number;
  wind_direction: number;
  gust: number;
  swell_direction: number;
  swell_height: number;
  swell_period: number;
  secondary_swell_direction: number;
  secondary_swell_height: number;
  secondary_swell_period: number;
  wave_direction: number;
  wave_height: number;
  wave_period: number;
  wind_wave_direction: number;
  wind_wave_height: number;
  wind_wave_period: number;
  precipitation: number;
  humidity: number;
  pressure: number;
  visibility: number;
  cloudcover: number;
}

// ============================================================================
// VISUALIZATION PROPS
// ============================================================================

export type SwellVisualizationProps = BaseVisualizationProps;

export interface TidalVisualizationProps extends BaseVisualizationProps {
  minHeight?: number;
  maxHeight?: number;
  heightPadding?: number;
}

export type WindVisualizationProps = BaseVisualizationProps;

// ============================================================================
// TOOLTIP DATA TYPES
// ============================================================================

export interface SwellTooltipData extends BaseTooltipData {
  waveHeight: number;
  windSpeed: number;
  windDirection: number;
  waveDirection: number;
  swellHeight: number;
  swellDirection: number;
  swellPeriod: number;
  secondarySwellHeight: number;
  secondarySwellDirection: number;
  secondarySwellPeriod: number;
  wavePeriod: number;
  windWaveHeight: number;
  windWavePeriod: number;
}

export interface TidalTooltipData extends BaseTooltipData {
  tideHeight: number;
}

export interface WindTooltipData extends BaseTooltipData {
  windSpeed: number;
  windDirection: number;
  gust: number;
}