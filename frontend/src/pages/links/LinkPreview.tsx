import { Globe, Lock, Smartphone, Tag } from "lucide-react";
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
import { cn } from "@/lib/utils";
import { detectRegionFromCountries } from "./utils";

interface LinkPreviewProps {
  linkUrl?: string;
  geoRules?: GeoRule[];
  deviceRules?: DeviceRule[];
  onLoad?: () => void;
  isLoading?: boolean;
  shortCodeUrl?: string;
  isPasswordProtected?: boolean;
  utmParameters?: {
    utmSource?: string;
    utmMedium?: string;
    utmCampaign?: string;
    utmTerm?: string;
    utmContent?: string;
  };
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

const RuleSection = ({
  icon,
  title,
  isPrimary,
  subtitle,
  children,
}: RuleSectionProps) => (
  <div
    className={cn(
      "space-y-2 border-l-2 pl-4",
      isPrimary ? "border-primary/20" : "border-muted"
    )}
  >
    <div className="flex items-center gap-2 text-sm">
      {icon}
      <span className="font-medium">{title}</span>
      {subtitle && (
        <>
          <div className="w-1 h-1 rounded-full bg-primary/40" />
          <span className="text-xs text-muted-foreground">{subtitle}</span>
        </>
      )}
    </div>
    <div className="pl-6 space-y-4">{children}</div>
  </div>
);

const GeoRuleItem = ({ rule, index }: { rule: GeoRule; index: number }) => (
  <div className="space-y-2">
    <div className="space-y-1 text-sm">
      {!rule.region ||
      rule.region === "custom" ||
      !detectRegionFromCountries(rule.countries) ? (
        <>
          <div className="font-medium">Custom Countries:</div>
          <div className="font-mono text-xs text-muted-foreground">
            {rule.countries
              .map(
                (code) => COUNTRY_OPTIONS.find((c) => c.value === code)?.label
              )
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
                  .map(
                    (code) =>
                      COUNTRY_OPTIONS.find((c) => c.value === code)?.label
                  )
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

const DeviceRuleItem = ({
  rule,
  index,
}: {
  rule: DeviceRule;
  index: number;
}) => (
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

// Helper function to construct URL with UTM parameters
const constructUrlWithUtm = (
  baseUrl: string,
  utmParams?: LinkPreviewProps["utmParameters"]
): string => {
  if (!utmParams) return baseUrl;
  try {
    const url = new URL(
      baseUrl.startsWith("http") ? baseUrl : `https://${baseUrl}`
    );
    if (utmParams.utmSource)
      url.searchParams.set("utm_source", utmParams.utmSource);
    if (utmParams.utmMedium)
      url.searchParams.set("utm_medium", utmParams.utmMedium);
    if (utmParams.utmCampaign)
      url.searchParams.set("utm_campaign", utmParams.utmCampaign);
    if (utmParams.utmTerm) url.searchParams.set("utm_term", utmParams.utmTerm);
    if (utmParams.utmContent)
      url.searchParams.set("utm_content", utmParams.utmContent);
    return url.toString();
  } catch {
    return baseUrl;
  }
};

export const LinkPreview = ({
  linkUrl,
  geoRules = [],
  deviceRules = [],
  onLoad,
  isPasswordProtected,
  utmParameters,
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

  const hasUtmParameters =
    utmParameters && Object.values(utmParameters).some(Boolean);

  return (
    <>
      <div className="relative">
        <LinkCard
          url={
            hasUtmParameters
              ? constructUrlWithUtm(debouncedLinkUrl || "", utmParameters)
              : debouncedLinkUrl
          }
          onLoad={handleLoad}
          instanceId="main"
        />
        {isPasswordProtected && (
          <Badge variant="secondary" className="absolute top-2 right-2 gap-1.5">
            <Lock className="w-3 h-3" />
            Protected
          </Badge>
        )}
      </div>

      {/* Rules Summary */}
      <div className="mt-6 space-y-4">
        {validGeoRules.length > 0 && (
          <RuleSection
            icon={<Globe className="w-4 h-4 text-primary" />}
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
            icon={<Smartphone className="w-4 h-4 text-muted-foreground" />}
            title="Device Rules"
          >
            {debouncedDeviceRules.map((rule, i) => (
              <DeviceRuleItem key={i} rule={rule} index={i} />
            ))}
          </RuleSection>
        )}

        {hasUtmParameters && (
          <RuleSection
            icon={<Tag className="w-4 h-4 text-muted-foreground" />}
            title="UTM Parameters"
          >
            <div className="space-y-2 text-sm">
              {utmParameters?.utmSource && (
                <div>
                  <span className="font-medium">Source:</span>{" "}
                  {utmParameters.utmSource}
                </div>
              )}
              {utmParameters?.utmMedium && (
                <div>
                  <span className="font-medium">Medium:</span>{" "}
                  {utmParameters.utmMedium}
                </div>
              )}
              {utmParameters?.utmCampaign && (
                <div>
                  <span className="font-medium">Campaign:</span>{" "}
                  {utmParameters.utmCampaign}
                </div>
              )}
              {utmParameters?.utmTerm && (
                <div>
                  <span className="font-medium">Terms:</span>{" "}
                  {utmParameters.utmTerm}
                </div>
              )}
              {utmParameters?.utmContent && (
                <div>
                  <span className="font-medium">Content:</span>{" "}
                  {utmParameters.utmContent}
                </div>
              )}
            </div>
          </RuleSection>
        )}
      </div>
    </>
  );
};
