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
import { useAppTranslation } from "@/i18n";

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

const regionKeyMap: Record<string, string> = {
  europe: "europe",
  northAmerica: "northAmerica",
  asia: "asia",
  middleEast: "middleEast",
  africa: "africa",
  southAmerica: "southAmerica",
  oceania: "oceania",
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

const GeoRuleItem = ({
  rule,
  index,
  getRegionLabel,
  t,
}: {
  rule: GeoRule;
  index: number;
  getRegionLabel: (region: string) => string;
  t: ReturnType<typeof useAppTranslation>["t"];
}) => (
  <div className="space-y-2">
    <div className="space-y-1 text-sm">
      {!rule.region ||
      rule.region === "custom" ||
      !detectRegionFromCountries(rule.countries) ? (
        <>
          <div className="font-medium">{t("links.form.preview.custom_countries")}</div>
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
              {getRegionLabel(detectRegionFromCountries(rule.countries) || "")}
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
  t,
}: {
  rule: DeviceRule;
  index: number;
  t: ReturnType<typeof useAppTranslation>["t"];
}) => (
  <div className="space-y-2">
    <div className="text-sm">
      <div className="font-medium">
        {rule.deviceType === "all"
          ? t("links.form.device.device_types.all")
          : rule.deviceType}
        {rule.os && rule.os !== "any" && ` • ${rule.os}`}
        {rule.browser && rule.browser !== "any" && ` • ${rule.browser}`}
      </div>
    </div>
    <LinkCard url={rule.redirectUrl} instanceId={`device-${index}`} />
  </div>
);

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
  const { t } = useAppTranslation();

  const getRegionLabel = (region: string) => {
    const key = regionKeyMap[region];
    if (!key) return region;
    return t(`links.form.geo.regions.${key}`);
  };

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
            {t("links.form.preview.protected")}
          </Badge>
        )}
      </div>

      <div className="mt-6 space-y-4">
        {validGeoRules.length > 0 && (
          <RuleSection
            icon={<Globe className="w-4 h-4 text-primary" />}
            title={t("links.form.preview.geo_rules")}
            isPrimary
            subtitle={t("links.form.preview.takes_precedence")}
          >
            {validGeoRules.map((rule, i) => (
              <GeoRuleItem
                key={i}
                rule={rule}
                index={i}
                getRegionLabel={getRegionLabel}
                t={t}
              />
            ))}
          </RuleSection>
        )}

        {debouncedDeviceRules.length > 0 && (
          <RuleSection
            icon={<Smartphone className="w-4 h-4 text-muted-foreground" />}
            title={t("links.form.preview.device_rules")}
          >
            {debouncedDeviceRules.map((rule, i) => (
              <DeviceRuleItem key={i} rule={rule} index={i} t={t} />
            ))}
          </RuleSection>
        )}

        {hasUtmParameters && (
          <RuleSection
            icon={<Tag className="w-4 h-4 text-muted-foreground" />}
            title={t("links.form.preview.utm_parameters")}
          >
            <div className="space-y-2 text-sm">
              {utmParameters?.utmSource && (
                <div>
                  <span className="font-medium">
                    {t("links.form.preview.utm_labels.source")}:
                  </span>{" "}
                  {utmParameters.utmSource}
                </div>
              )}
              {utmParameters?.utmMedium && (
                <div>
                  <span className="font-medium">
                    {t("links.form.preview.utm_labels.medium")}:
                  </span>{" "}
                  {utmParameters.utmMedium}
                </div>
              )}
              {utmParameters?.utmCampaign && (
                <div>
                  <span className="font-medium">
                    {t("links.form.preview.utm_labels.campaign")}:
                  </span>{" "}
                  {utmParameters.utmCampaign}
                </div>
              )}
              {utmParameters?.utmTerm && (
                <div>
                  <span className="font-medium">
                    {t("links.form.preview.utm_labels.terms")}:
                  </span>{" "}
                  {utmParameters.utmTerm}
                </div>
              )}
              {utmParameters?.utmContent && (
                <div>
                  <span className="font-medium">
                    {t("links.form.preview.utm_labels.content")}:
                  </span>{" "}
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
