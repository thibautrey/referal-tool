import { Globe, Lock, Smartphone } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useEffect, useMemo, useState } from "react";

import { Badge } from "@/components/ui/badge";
import { COUNTRY_OPTIONS } from "./Countries";
import { DeviceRule } from "./types";
import type { GeoRule } from "./AddLinkForm/GeoTargeting";
import { LinkCard } from "@/components/ui/link-card";
import { detectRegionFromCountries } from "./utils";
import { cn } from "@/lib/utils";

interface LinkPreviewProps {
  linkUrl?: string;
  geoRules?: GeoRule[];
  deviceRules?: DeviceRule[];
  onLoad?: () => void;
  isLoading?: boolean;
  shortCodeUrl?: string;
  isPasswordProtected?: boolean;
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

interface RuleSectionProps {
  icon: React.ReactNode;
  title: string;
  isPrimary?: boolean;
  subtitle?: string;
  children: React.ReactNode;
}

const RuleSection = ({ icon, title, isPrimary, subtitle, children }: RuleSectionProps) => (
  <div className={cn("space-y-2 border-l-2 pl-4", isPrimary ? "border-primary/20" : "border-muted")}>
    <div className="flex items-center gap-2 text-sm">
      {icon}
      <span className="font-medium">{title}</span>
      {subtitle && (
        <>
          <div className="h-1 w-1 rounded-full bg-primary/40" />
          <span className="text-xs text-muted-foreground">{subtitle}</span>
        </>
      )}
    </div>
    <div className="pl-6 space-y-4">
      {children}
    </div>
  </div>
);

const GeoRuleItem = ({ rule, index }: { rule: GeoRule; index: number }) => (
  <div className="space-y-2">
    <div className="text-sm space-y-1">
      {!rule.region ||
      rule.region === "custom" ||
      !detectRegionFromCountries(rule.countries) ? (
        <>
          <div className="font-medium">Custom Countries:</div>
          <div className="text-muted-foreground font-mono text-xs">
            {rule.countries
              .map((code) => COUNTRY_OPTIONS.find((c) => c.value === code)?.label)
              .join(", ")}
          </div>
        </>
      ) : (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger className="font-medium">
              {getRegionName(detectRegionFromCountries(rule.countries))}
            </TooltipTrigger>
            <TooltipContent>
              <p className="font-mono text-xs">
                {rule.countries
                  .map((code) => COUNTRY_OPTIONS.find((c) => c.value === code)?.label)
                  .join(", ")}
              </p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      )}
    </div>
    <LinkCard url={rule.redirectUrl} instanceId={`geo-${index}`} />
  </div>
);

const DeviceRuleItem = ({ rule, index }: { rule: DeviceRule; index: number }) => (
  <div className="space-y-2">
    <div className="text-sm">
      <div className="font-medium">
        {rule.deviceType === "all" ? "All Devices" : rule.deviceType}
        {rule.os && rule.os !== "any" && ` • ${rule.os}`}
        {rule.browser && rule.browser !== "any" && ` • ${rule.browser}`}
      </div>
    </div>
    <LinkCard url={rule.redirectUrl} instanceId={`device-${index}`} />
  </div>
);

export const LinkPreview = ({
  linkUrl,
  geoRules = [],
  deviceRules = [],
  onLoad,
  isPasswordProtected,
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

  const validGeoRules = useMemo(
    () => debouncedGeoRules.filter(isValidGeoRule),
    [debouncedGeoRules]
  );

  return (
    <>
      <div className="relative">
        <LinkCard url={debouncedLinkUrl} onLoad={handleLoad} instanceId="main" />
        {isPasswordProtected && (
          <Badge 
            variant="secondary" 
            className="absolute top-2 right-2 gap-1.5"
          >
            <Lock className="h-3 w-3" />
            Protected
          </Badge>
        )}
      </div>

      {/* Rules Summary */}
      <div className="space-y-4 mt-6">
        {validGeoRules.length > 0 && (
          <RuleSection 
            icon={<Globe className="h-4 w-4 text-primary" />}
            title="Geo Rules"
            isPrimary
            subtitle="Takes precedence"
          >
            {validGeoRules.map((rule, i) => (
              <GeoRuleItem key={i} rule={rule} index={i} />
            ))}
          </RuleSection>
        )}

        {debouncedDeviceRules.length > 0 && (
          <RuleSection
            icon={<Smartphone className="h-4 w-4 text-muted-foreground" />}
            title="Device Rules"
          >
            {debouncedDeviceRules.map((rule, i) => (
              <DeviceRuleItem key={i} rule={rule} index={i} />
            ))}
          </RuleSection>
        )}
      </div>
    </>
  );
};
