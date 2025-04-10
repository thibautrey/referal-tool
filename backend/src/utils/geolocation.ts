import { lookup, reload } from "ip-location-api";
import path from "path";

const DATA_DIR = process.env.ILA_DATA_DIR || path.join(process.cwd(), "data");
const TMP_DATA_DIR =
  process.env.ILA_TMP_DATA_DIR || path.join(process.cwd(), "tmp");

let databaseInitialized = false;

// Configuration initiale
const initGeolocation = async () => {
  try {
    // Initialize lookup
    await reload({
      fields: ["country", "city"],
      smallMemory: false,
      dataDir: DATA_DIR,
      tmpDataDir: TMP_DATA_DIR,
      autoUpdate: "default",
    });
    databaseInitialized = true;
    console.log("IP geolocation service initialized successfully");
  } catch (error) {
    console.error("Failed to initialize IP geolocation service:", error);
    console.log("Geolocation will return default values");
  }
};

export async function getCountryFromIp(ip: string): Promise<[string, string]> {
  try {
    if (!databaseInitialized) {
      // Try to initialize again if it failed on startup
      try {
        await initGeolocation();
      } catch {
        // If still fails, return default
        return ["XX", ""];
      }
    }

    const location = await lookup(ip);
    return [location?.country || "XX", location?.city || ""];
  } catch (error) {
    console.error("Error fetching location data:", error);
    return ["XX", ""]; // Default fallback
  }
}

// Initialize on module import
initGeolocation().catch(console.error);

// Cleanup n'est plus nécessaire car géré par ip-location-api
export async function cleanupExpiredIpCache(): Promise<void> {
  // No-op - cache is managed by ip-location-api
}
