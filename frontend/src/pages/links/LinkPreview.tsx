import { Card, CardContent } from "@/components/ui/card";
import { Globe, QrCode, Smartphone } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useEffect, useMemo, useState } from "react";

import { Button } from "@/components/ui/button";
import { COUNTRY_OPTIONS } from "./Countries";
import type { DeviceRule } from "./AddLinkForm/DeviceTargeting";
import type { GeoRule } from "./AddLinkForm/GeoTargeting";
import { LinkCard } from "@/components/ui/link-card";
import QRCode from "react-qr-code";

interface LinkPreviewProps {
  linkUrl?: string;
  geoRules?: GeoRule[];
  deviceRules?: DeviceRule[];
  onLoad?: () => void;
  isLoading?: boolean;
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
    (rule.region === "custom" || !!rule.region)
  );
};

export const LinkPreview = ({
  linkUrl,
  geoRules = [],
  deviceRules = [],
  onLoad,
  isLoading = false,
}: LinkPreviewProps) => {
  const [showQr, setShowQr] = useState(false);
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
    <Card className="sticky top-6">
      <CardContent className={`space-y-6 ${isLoading ? "opacity-50" : ""}`}>
        <LinkCard
          url={debouncedLinkUrl}
          onLoad={handleLoad}
          instanceId="main"
        />

        {/* QR Code Section */}
        {debouncedLinkUrl && (
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <Button
                variant="outline"
                onClick={() => setShowQr(!showQr)}
                className="w-full"
              >
                <QrCode className="h-4 w-4 mr-2" />
                {showQr ? "Hide QR Code" : "Show QR Code"}
              </Button>
            </div>
            {showQr && (
              <div className="flex justify-center p-4 bg-white rounded">
                <QRCode value={debouncedLinkUrl} size={128} />
              </div>
            )}
          </div>
        )}

        {/* Rules Summary */}
        <div className="space-y-4">
          {validGeoRules.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm font-medium">
                <Globe className="h-4 w-4" />
                Geo Rules
              </div>
              <div className="pl-6 space-y-4">
                {validGeoRules.map((rule, i) => (
                  <div key={i} className="space-y-2">
                    <div className="text-sm space-y-1">
                      {rule.region === "custom" ? (
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
                              {getRegionName(rule.region || "")}
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
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm font-medium">
                <Smartphone className="h-4 w-4" />
                Device Rules
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
                    <LinkCard
                      url={rule.redirectUrl}
                      instanceId={`device-${i}`}
                    />
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
