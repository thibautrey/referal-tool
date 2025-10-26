import { lookup, reload } from "ip-location-api";
import fs from "fs/promises";
import path from "path";

const DATA_DIR = process.env.ILA_DATA_DIR || path.join(process.cwd(), "data");
const TMP_DATA_DIR =
  process.env.ILA_TMP_DATA_DIR || path.join(process.cwd(), "tmp");
const AUTO_UPDATE = process.env.ILA_AUTO_UPDATE || "default";

let databaseInitialized = false;

const FIELDS = [
  "country",
  "city",
  "metro",
  "eu",
  "timezone",
  "latitude",
  "longitude",
  "area",
  "postcode",
];

const ensureDirectories = async () => {
  await fs.mkdir(DATA_DIR, { recursive: true });
  await fs.mkdir(TMP_DATA_DIR, { recursive: true });
};

const reloadDatabase = async (licenseKey: string | undefined) =>
  reload({
    fields: FIELDS,
    smallMemory: false,
    dataDir: DATA_DIR,
    tmpDataDir: TMP_DATA_DIR,
    autoUpdate: AUTO_UPDATE,
    licenseKey,
  });

// Configuration initiale
const initGeolocation = async () => {
  if (databaseInitialized) {
    return;
  }

  try {
    await ensureDirectories();
  } catch (error) {
    console.error("Failed to prepare directories for geolocation database:", error);
    console.log("Geolocation will return default values");
    return;
  }

  const configuredLicense = process.env.ILA_LICENSE_KEY?.trim();
  const licenseCandidates = configuredLicense
    ? [configuredLicense, "redist"].filter(
        (key, index, array) => key && array.indexOf(key) === index,
      )
    : ["redist"];

  for (const licenseKey of licenseCandidates) {
    try {
      await reloadDatabase(licenseKey);
      databaseInitialized = true;
      const usedFallback = licenseKey === "redist" && !!configuredLicense;
      if (usedFallback) {
        console.warn(
          "IP geolocation service is using the redistribution database as a fallback.",
        );
      } else {
        console.log("IP geolocation service initialized successfully");
      }
      return;
    } catch (error) {
      console.error(
        `Failed to initialize IP geolocation service with license '${licenseKey}':`,
        error,
      );
    }
  }

  console.log("Geolocation will return default values");
};

export async function getCountryFromIp(ip: string): Promise<[string, string]> {
  try {
    if (!databaseInitialized) {
      // Try to initialize again if it failed on startup
      try {
        await initGeolocation();
        console.log("IP geolocation service initialized successfully");
      } catch (error) {
        console.error("Failed to initialize IP geolocation service again");
        // If still fails, return default
        return ["Unknown", ""];
      }
    }

    const location = await lookup(ip);
    if (!location) {
      console.error("No location found for IP:", ip);
      return ["Unknown", ""]; // Default fallback
    }
    return [location?.country || "Unknown", location?.city || ""];
  } catch (error) {
    console.error("Error fetching location data:", error);
    return ["Unknown", ""]; // Default fallback
  }
}

// Initialize on module import
initGeolocation().catch(console.error);

// Cleanup n'est plus nécessaire car géré par ip-location-api
export async function cleanupExpiredIpCache(): Promise<void> {
  // No-op - cache is managed by ip-location-api
}
