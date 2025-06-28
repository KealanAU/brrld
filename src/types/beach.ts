import { StormGlassDataPoint } from './data';

export interface BeachDetails {
  beach_id: number;
  beach_name: string;
  area: string;
  country: string;
  region: string;
  lat: number;
  lon: number;
  timezone: string;
  beach_text_summary: string;
  ability_level: string;
  ability_level_long_text: string;
  local_vibe: string;
  local_vibe_long_text: string;
  crowd_factor: string;
  crowd_factor_long_text: string;
  spot_rating: string;
  spot_rating_long_text: string;
  shoulder_burn: string;
  shoulder_burn_long_text: string;
  water_quality: string;
  water_quality_long_text: string;
  hazards: string;
  access: string;
  bring_your: string;
  seabed: string;
  best_season: string;
}

export interface TideDetails {
  beach_id: number;
  tide_time: string;
  tide_type: 'high' | 'low';
  tide_height: number;
}

export interface BeachData {
  details: BeachDetails;
  stormGlassData: StormGlassDataPoint[];
  tideData: TideDetails[];
}

// ============================================================================
// LEGACY COMPATIBILITY
// ============================================================================

// Keep the old StormGlassDetails name for backward compatibility
export type StormGlassDetails = StormGlassDataPoint; 