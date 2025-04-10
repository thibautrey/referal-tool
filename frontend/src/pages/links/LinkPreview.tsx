import { Globe, Smartphone } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useEffect, useMemo, useState } from "react";

import { COUNTRY_OPTIONS } from "./Countries";
import { DeviceRule } from "./types";
import type { GeoRule } from "./AddLinkForm/GeoTargeting";
import { LinkCard } from "@/components/ui/link-card";
import { detectRegionFromCountries } from "./utils";

interface LinkPreviewProps {
  linkUrl?: string;
  geoRules?: GeoRule[];
  deviceRules?: DeviceRule[];
  onLoad?: () => void;
  isLoading?: boolean;
  shortCodeUrl?: string;
}

const getRegionName = (region: string): string => {
  const regionMap: Record<string, string> = {
    europe: "European Union",
    northAmerica: "North America",
    asia: "Asia",
    middleEast: "Middle East",
    africa: "Africa",
    southAmerica: "South America",
    oceania: "Oceania",
  };
  return regionMap[region] || region;
};

const isValidGeoRule = (rule: GeoRule): boolean => {
  return (
    !!rule.redirectUrl &&
    rule.countries.length > 0 &&
    (rule.region === "custom" || !!detectRegionFromCountries(rule.countries))
  );
};

export const LinkPreview = ({
  linkUrl,
  geoRules = [],
  deviceRules = [],
  onLoad,
}: LinkPreviewProps) => {
  const [debouncedLinkUrl, setDebouncedLinkUrl] = useState(linkUrl);
  const [debouncedGeoRules, setDebouncedGeoRules] = useState(geoRules);
  const [debouncedDeviceRules, setDebouncedDeviceRules] = useState(deviceRules);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedLinkUrl(linkUrl);
      setDebouncedGeoRules(geoRules);
      setDebouncedDeviceRules(deviceRules);
    }, 500);

    return () => clearTimeout(timer);
  }, [linkUrl, geoRules, deviceRules]);

  const handleLoad = () => {
    if (onLoad) {
      onLoad();
    }
  };

  const formatCountries = (countries: string[]) => {
    return countries
      .map((code) => COUNTRY_OPTIONS.find((c) => c.value === code)?.label)
      .join(", ");
  };

  const validGeoRules = useMemo(
    () => debouncedGeoRules.filter(isValidGeoRule),
    [debouncedGeoRules]
  );

  return (
    <>
      <LinkCard url={debouncedLinkUrl} onLoad={handleLoad} instanceId="main" />
      {/* Rules Summary */}
      <div className="space-y-4 mt-6">
        {validGeoRules.length > 0 && (
          <div className="space-y-2 border-l-2 border-primary/20 pl-4">
            <div className="flex items-center gap-2 text-sm">
              <Globe className="h-4 w-4 text-primary" />
              <span className="font-medium">Geo Rules</span>
              <div className="h-1 w-1 rounded-full bg-primary/40" />
              <span className="text-xs text-muted-foreground">
                Takes precedence
              </span>
            </div>
            <div className="pl-6 space-y-4">
              {validGeoRules.map((rule, i) => (
                <div key={i} className="space-y-2">
                  <div className="text-sm space-y-1">
                    {!rule.region ||
                    rule.region === "custom" ||
                    !detectRegionFromCountries(rule.countries) ? (
                      <>
                        <div className="font-medium">Custom Countries:</div>
                        <div className="text-muted-foreground font-mono text-xs">
                          {formatCountries(rule.countries)}
                        </div>
                      </>
                    ) : (
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger className="font-medium">
                            {getRegionName(
                              detectRegionFromCountries(rule.countries)
                            )}
                          </TooltipTrigger>
                          <TooltipContent>
                            <p className="font-mono text-xs">
                              {formatCountries(rule.countries)}
                            </p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    )}
                  </div>
                  <LinkCard url={rule.redirectUrl} instanceId={`geo-${i}`} />
                </div>
              ))}
            </div>
          </div>
        )}

        {debouncedDeviceRules.length > 0 && (
          <div className="space-y-2 border-l-2 border-muted pl-4">
            <div className="flex items-center gap-2 text-sm">
              <Smartphone className="h-4 w-4 text-muted-foreground" />
              <span className="font-medium">Device Rules</span>
            </div>
            <div className="pl-6 space-y-4">
              {debouncedDeviceRules.map((rule, i) => (
                <div key={i} className="space-y-2">
                  <div className="text-sm">
                    <div className="font-medium">
                      {rule.deviceType === "all"
                        ? "All Devices"
                        : rule.deviceType}
                      {rule.os && rule.os !== "any" && ` • ${rule.os}`}
                      {rule.browser &&
                        rule.browser !== "any" &&
                        ` • ${rule.browser}`}
                    </div>
                  </div>
                  <LinkCard url={rule.redirectUrl} instanceId={`device-${i}`} />
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </>
  );
};
