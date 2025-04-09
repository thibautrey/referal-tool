import { AVAILABLE_COUNTRIES } from "../Countries";

export const generateRandomCode = (length: number = 4): string => {
  const letters = "abcdefghijklmnopqrstuvwxyz";
  const numbers = "0123456789";
  const chars = letters + numbers;

  let result = "";
  result += numbers.charAt(Math.floor(Math.random() * numbers.length));

  for (let i = 1; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }

  return result
    .split("")
    .sort(() => Math.random() - 0.5)
    .join("");
};

export const detectRegionFromCountries = (countries: string[]): string => {
  for (const [region, regionCountries] of Object.entries(AVAILABLE_COUNTRIES)) {
    if (
      countries.length === regionCountries.length &&
      countries.every((country) => regionCountries.includes(country))
    ) {
      return region;
    }
  }
  return "custom";
};
