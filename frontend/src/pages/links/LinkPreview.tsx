import { Card, CardContent } from "@/components/ui/card";
import { Globe, QrCode, Smartphone, Download } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useEffect, useMemo, useState } from "react";

import { Button } from "@/components/ui/button";
import { COUNTRY_OPTIONS } from "./Countries";
import { DeviceRule } from "./types";
import type { GeoRule } from "./AddLinkForm/GeoTargeting";
import { LinkCard } from "@/components/ui/link-card";
import QRCode from "react-qr-code";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

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
    (rule.region === "custom" || !!rule.region)
  );
};

export const LinkPreview = ({
  linkUrl,
  geoRules = [],
  deviceRules = [],
  onLoad,
  isLoading = false,
  shortCodeUrl = "",
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

  const downloadQRCode = () => {
    const svg = document.getElementById("qr-code");
    if (!svg) return;

    const svgData = new XMLSerializer().serializeToString(svg);
    const base64Data = btoa(svgData);
    const img = new Image();

    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = 1024; // Higher resolution
      canvas.height = 1024; // Higher resolution
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      ctx.fillStyle = "white";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

      const pngUrl = canvas.toDataURL("image/png");
      const downloadLink = document.createElement("a");
      downloadLink.href = pngUrl;
      downloadLink.download = "qrcode.png";
      document.body.appendChild(downloadLink);
      downloadLink.click();
      document.body.removeChild(downloadLink);
    };

    img.src = "data:image/svg+xml;base64," + base64Data;
  };

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
          <div>
            <Dialog>
              <DialogTrigger asChild>
                <Button variant="outline" size="icon" className="h-8 w-8">
                  <QrCode className="h-4 w-4" />
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                  <DialogTitle>QR Code</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="flex justify-center p-4 bg-white rounded">
                    <QRCode id="qr-code" value={shortCodeUrl} size={200} />
                  </div>
                  <Button
                    variant="outline"
                    onClick={downloadQRCode}
                    className="w-full"
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Download QR Code
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
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
