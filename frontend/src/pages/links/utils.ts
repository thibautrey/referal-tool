import { AVAILABLE_COUNTRIES } from "./Countries";

export const detectRegionFromCountries = (countries: string[]): string => {
  if (!countries || !Array.isArray(countries) || countries.length === 0) {
    return "";
  }

  // Sort the arrays for consistent comparison
  const sortedCountries = [...countries].sort();

  for (const [region, regionCountries] of Object.entries(AVAILABLE_COUNTRIES)) {
    const sortedRegionCountries = [...regionCountries].sort();

    // For an exact match:
    // 1. Lengths must be identical
    // 2. Every sorted element must match
    if (
      sortedCountries.length === sortedRegionCountries.length &&
      sortedCountries.join(",") === sortedRegionCountries.join(",")
    ) {
      return region;
    }
  }
  return "custom";
};
