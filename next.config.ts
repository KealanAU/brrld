import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // CSV files are parsed at runtime using papaparse, not imported as modules
  // so no webpack configuration is needed
};

export default nextConfig;
