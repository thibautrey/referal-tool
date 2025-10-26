import {
  Calendar,
  Clock,
  Globe,
  Link as LinkIcon,
  Lock,
  Smartphone,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { DeviceRule, LinkFormData, UTMParametersType } from "./types";
import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useState,
} from "react";

import { BasicSettings } from "./AddLinkForm/BasicSettings";
import { DeviceTargeting } from "./AddLinkForm/DeviceTargeting";
import { ExpandableTabs } from "@/components/ui/expandable-tabs";
import { GeoTargeting } from "./AddLinkForm/GeoTargeting";
import { LinkPreview } from "./LinkPreview";
import { PasswordProtection } from "@/components/links/PasswordProtection";
import { UTMParameters } from "./AddLinkForm/UTMParameters";
import { ExpirationSettings } from "./AddLinkForm/ExpirationSettings";
import { api } from "@/lib/api";
import { detectRegionFromCountries } from "./utils";
import { generateRandomCode } from "./AddLinkForm/utils";
import { toast } from "sonner";
import { useAppTranslation } from "@/i18n";
import { useSearchParams } from "react-router-dom";

export interface GeoRule {
  redirectUrl: string;
  region?: string;
  countries: string[];
}

interface AddLinkFormProps {
  onSubmit: (data: LinkFormData) => Promise<void>;
  initialData?: {
    id: number;
    name: string;
    baseUrl: string;
    shortCode: string;
    rules: GeoRule[];
    deviceRules?: DeviceRule[];
    isPasswordProtected?: boolean;
    password?: string;
    utmSource?: string;
    utmMedium?: string;
    utmCampaign?: string;
    utmTerm?: string;
    utmContent?: string;
    expiresAt?: string | null;
  };
  mode?: "add" | "edit";
}

export interface AddLinkFormRef {
  getFormData: () => LinkFormData;
}

const toDateTimeLocalString = (value: string) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "";
  }
  const offset = date.getTimezoneOffset();
  const local = new Date(date.getTime() - offset * 60 * 1000);
  return local.toISOString().slice(0, 16);
};

const fromDateTimeLocalString = (value: string | null) => {
  if (!value) return null;
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return null;
  }
  return parsed.toISOString();
};

const getDefaultExpirationInput = () => {
  const now = new Date();
  const fallback = new Date(now.getTime() + 60 * 60 * 1000);
  const offset = fallback.getTimezoneOffset();
  const local = new Date(fallback.getTime() - offset * 60 * 1000);
  return local.toISOString().slice(0, 16);
};

export const AddLinkForm = forwardRef<AddLinkFormRef, AddLinkFormProps>(
  ({ initialData }, ref) => {
    const [searchParams] = useSearchParams();
    const { t } = useAppTranslation();
    const [linkName, setLinkName] = useState(initialData?.name || "");
    const [baseUrl, setBaseUrl] = useState(initialData?.baseUrl || "");
    const [shortCode, setShortCode] = useState(
      initialData?.shortCode || generateRandomCode()
    );
    const [geoRules, setGeoRules] = useState<GeoRule[]>(() => {
      if (initialData?.rules) {
        return initialData.rules.map((rule) => {
          const region = detectRegionFromCountries(rule.countries);
          return {
            redirectUrl: rule.redirectUrl,
            region,
            countries: rule.countries,
          };
        });
      }
      return [];
    });
    const [deviceRules, setDeviceRules] = useState<DeviceRule[]>([]);
    const [isShortCodeAvailable, setIsShortCodeAvailable] = useState(true);
    const [isCheckingShortCode, setIsCheckingShortCode] = useState(false);
    const [currentDomain, setCurrentDomain] = useState("");
    const [activeTab, setActiveTab] = useState<number | null>(null);
    const [isLinkPreviewLoading, setIsLinkPreviewLoading] = useState(false);
    const [previewUrl, setPreviewUrl] = useState<string>("");
    const [isPasswordProtected, setIsPasswordProtected] = useState(
      initialData?.isPasswordProtected || false
    );
    const [password, setPassword] = useState("");
    const [isExpirationEnabled, setIsExpirationEnabled] = useState(
      Boolean(initialData?.expiresAt)
    );
    const [expirationDate, setExpirationDate] = useState<string | null>(
      initialData?.expiresAt ? toDateTimeLocalString(initialData.expiresAt) : null
    );

    const [utmParameters, setUtmParameters] = useState<UTMParametersType>({
      utmSource: initialData?.utmSource || "",
      utmMedium: initialData?.utmMedium || "",
      utmCampaign: initialData?.utmCampaign || "",
      utmTerm: initialData?.utmTerm || "",
      utmContent: initialData?.utmContent || "",
    });

    const isEditMode = searchParams.get("mode") === "edit";
    const id = Number(searchParams.get("id"));

    const isValidUrl = (url: string) => {
      try {
        new URL(url);
        return true;
      } catch {
        return false;
      }
    };

    const handleUrlChange = useCallback((newUrl: string) => {
      setIsLinkPreviewLoading(true);
      const debounceTimer = setTimeout(() => {
        if (isValidUrl(newUrl)) {
          setIsLinkPreviewLoading(false);
        }
      }, 500);
      return () => clearTimeout(debounceTimer);
    }, []);

    useEffect(() => {
      handleUrlChange(baseUrl);
    }, [baseUrl, handleUrlChange]);

    useEffect(() => {
      const validRules = [...geoRules, ...deviceRules];
      validRules.forEach((rule) => {
        if (rule.redirectUrl) {
          handleUrlChange(rule.redirectUrl);
        }
      });
    }, [geoRules, deviceRules, handleUrlChange]);

    useEffect(() => {
      if (isEditMode && !initialData) {
        const fetchLinkData = async () => {
          try {
            const response = await api.get<LinkFormData>(`/links/${id}`);
            const data = response.data;
            setLinkName(data.name);
            setBaseUrl(data.baseUrl);
            setShortCode(data.shortCode);

            if (data.rules && Array.isArray(data.rules)) {
              const parsedRules = data.rules.map((rule) => {
                const countries = Array.isArray(rule.countries)
                  ? rule.countries
                  : typeof rule.countries === "string"
                  ? JSON.parse(rule.countries)
                  : [];

                const region = detectRegionFromCountries(countries);

                return {
                  redirectUrl: rule.redirectUrl,
                  region,
                  countries: countries,
                };
              });

              setGeoRules(parsedRules);
            }

            if (data.deviceRules && Array.isArray(data.deviceRules)) {
              setDeviceRules(
                data.deviceRules.map((rule) => ({
                  redirectUrl: rule.redirectUrl,
                  deviceType: rule.deviceType || "all",
                  devices: rule.devices || [],
                }))
              );
            }

            setIsExpirationEnabled(Boolean(data.expiresAt));
            setExpirationDate(
              data.expiresAt ? toDateTimeLocalString(data.expiresAt) : null
            );
          } catch {
            toast.error(t("links.form.messages.fetch_error"));
            setGeoRules([]);
          }
        };

        fetchLinkData();
      }
    }, [id, isEditMode, initialData, t]);

    useEffect(() => {
      setCurrentDomain(window.location.origin);
    }, []);

    useEffect(() => {
      if (isEditMode) return;

      const findAvailableShortCode = async () => {
        let isAvailable = false;
        let newCode = shortCode;
        let attempts = 0;
        const maxAttempts = 10;

        while (!isAvailable && attempts < maxAttempts) {
          attempts++;
          setIsCheckingShortCode(true);

          try {
            interface ShortCodeResponse {
              available: boolean;
            }
            const response = await api.get<ShortCodeResponse>(
              `/links/check-short-code/${newCode}`
            );

            isAvailable = response.data.available;

            if (!isAvailable) {
              newCode = generateRandomCode();
            }
          } catch {
            newCode = generateRandomCode();
          }
        }

        setShortCode(newCode);
        setIsShortCodeAvailable(isAvailable);
        setIsCheckingShortCode(false);
      };

      findAvailableShortCode();
    }, []);

    useEffect(() => {
      if (isEditMode) return;

      const checkShortCodeAvailability = async () => {
        if (!shortCode) return;

        setIsCheckingShortCode(true);
        try {
          interface ShortCodeResponse {
            available: boolean;
          }
          const response = await api.get<ShortCodeResponse>(
            `/links/check-short-code/${shortCode}`
          );

          setIsShortCodeAvailable(response.data.available);
        } catch {
          setIsShortCodeAvailable(false);
        } finally {
          setIsCheckingShortCode(false);
        }
      };

      const debounceTimer = setTimeout(checkShortCodeAvailability, 500);
      return () => clearTimeout(debounceTimer);
    }, [shortCode, isEditMode]);

    useEffect(() => {
      if (baseUrl) {
        setPreviewUrl(baseUrl);
      }
    }, [baseUrl]);

    useImperativeHandle(ref, () => ({
      getFormData: () => {
        if (!baseUrl.trim() || !linkName.trim()) {
          const message = t("links.form.errors.missing_required");
          toast.error(message);
          throw new Error(message);
        }

        if (!isEditMode && (!shortCode || !isShortCodeAvailable)) {
          const message = t("links.form.errors.shortcode");
          toast.error(message);
          throw new Error(message);
        }

        if (isPasswordProtected && (!password || password.length < 6)) {
          const message = t("links.form.errors.password");
          toast.error(message);
          throw new Error(message);
        }

        const validGeoRules = geoRules
          .filter((rule) => rule.redirectUrl.trim())
          .map((rule) => ({
            redirectUrl: rule.redirectUrl.trim(),
            countries: rule.countries,
          }));

        const validDeviceRules = deviceRules
          .filter((rule) => rule.redirectUrl.trim())
          .map((rule) => ({
            redirectUrl: rule.redirectUrl.trim(),
            deviceType: rule.deviceType,
            devices: rule.devices,
          }));

        let expirationIso: string | null = null;
        if (isExpirationEnabled) {
          if (!expirationDate) {
            const message = t("links.form.errors.expiration_required");
            toast.error(message);
            throw new Error(message);
          }

          const parsed = fromDateTimeLocalString(expirationDate);
          if (!parsed) {
            const message = t("links.form.errors.expiration_invalid");
            toast.error(message);
            throw new Error(message);
          }

          expirationIso = parsed;
        }

        return {
          ...(isEditMode && { id }),
          name: linkName,
          baseUrl: baseUrl,
          shortCode: shortCode,
          rules: validGeoRules,
          deviceRules: validDeviceRules,
          isPasswordProtected,
          password: isPasswordProtected ? password : undefined,
          ...utmParameters,
          tags: [],
          comments: "",
          qrCode: false,
          advanced: {
            conversionTracking: false,
          },
          expiresAt: expirationIso,
        };
      },
    }));

    const tabs = [
      { title: t("links.form.tabs.geo"), icon: Globe },
      { title: t("links.form.tabs.device"), icon: Smartphone },
      { title: t("links.form.tabs.time_expire"), icon: Clock },
      { title: t("links.form.tabs.time_start"), icon: Calendar },
      { title: t("links.form.tabs.password"), icon: Lock },
      { title: t("links.form.tabs.utm"), icon: LinkIcon },
    ];

    const renderTabContent = () => {
      if (activeTab === null) return null;

      switch (activeTab) {
        case 0:
          return <GeoTargeting rules={geoRules} onRulesChange={setGeoRules} />;
        case 1:
          return (
            <DeviceTargeting
              rules={deviceRules}
              onRulesChange={setDeviceRules}
            />
          );
        case 2:
          return (
            <ExpirationSettings
              enabled={isExpirationEnabled}
              value={expirationDate}
              onToggle={(value) => {
                setIsExpirationEnabled(value);
                if (value && !expirationDate) {
                  setExpirationDate(getDefaultExpirationInput());
                }
                if (!value) {
                  setExpirationDate(null);
                }
              }}
              onChange={(val) => {
                setExpirationDate(val);
                if (val) {
                  setIsExpirationEnabled(true);
                }
              }}
            />
          );
        case 3:
          return (
            <div className="p-4 border rounded">
              <p className="text-muted-foreground">
                {t("links.form.coming_soon.time_start")}
              </p>
            </div>
          );
        case 4:
          return (
            <div className="p-4 border rounded">
              <PasswordProtection
                isEnabled={isPasswordProtected}
                onToggle={setIsPasswordProtected}
                password={password}
                onPasswordChange={setPassword}
              />
            </div>
          );
        case 5:
          return (
            <div className="p-4 border rounded">
              <UTMParameters
                parameters={utmParameters}
                onChange={setUtmParameters}
                baseUrl={baseUrl}
              />
            </div>
          );
        default:
          return null;
      }
    };

    return (
      <div className="grid grid-cols-3 gap-6">
        <div className="col-span-2">
          <Card>
            <CardContent className="space-y-6">
              <BasicSettings
                linkName={linkName}
                baseUrl={baseUrl}
                shortCode={shortCode}
                isEditMode={isEditMode}
                currentDomain={currentDomain}
                isShortCodeAvailable={isShortCodeAvailable}
                isCheckingShortCode={isCheckingShortCode}
                onLinkNameChange={setLinkName}
                onBaseUrlChange={setBaseUrl}
                onShortCodeChange={setShortCode}
              />

              <div className="space-y-4">
                <ExpandableTabs
                  tabs={tabs}
                  activeColor="text-primary"
                  onChange={setActiveTab}
                />
                {renderTabContent()}
              </div>
            </CardContent>
          </Card>
        </div>
        <div className="col-span-1">
          <LinkPreview
            linkUrl={previewUrl}
            geoRules={geoRules}
            deviceRules={deviceRules}
            isLoading={isLinkPreviewLoading}
            onLoad={() => setIsLinkPreviewLoading(false)}
            shortCodeUrl={`${currentDomain}/l/${shortCode}`}
            isPasswordProtected={isPasswordProtected}
            utmParameters={utmParameters}
            expiresAt={
              isExpirationEnabled && expirationDate
                ? fromDateTimeLocalString(expirationDate)
                : null
            }
          />
        </div>
      </div>
    );
  }
);

AddLinkForm.displayName = "AddLinkForm";
