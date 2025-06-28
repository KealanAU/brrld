# Beach Data

This directory contains CSV data files for beach, weather, and surf information.

## File Structure

- `main_beach_details.csv` - Detailed information about surf spots including location, conditions, and ratings
- `main_storm_glass_details.csv` - Hourly weather and ocean conditions data
- `main_tide_details.csv` - Tide information including times and heights

## TypeScript Definitions

```typescript
// Beach Details
interface BeachDetails {
  beach_id: number;
  beach_name: string;
  area: string;
  country: string;
  region: string;
  lat: number;
  lon: number;
  timezone: string;
  has_msw_cam: number;
  beach_text_summary: string;
  surfline_url: string;
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

// Storm Glass Details (Hourly Weather)
interface StormGlassDetails {
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

// Tide Details
interface TideDetails {
  beach_id: number;
  tide_time: string;
  tide_type: 'high' | 'low';
  tide_height: number;
}
```

