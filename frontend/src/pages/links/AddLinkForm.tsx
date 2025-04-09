import {
  Calendar,
  Clock,
  Globe,
  Link as LinkIcon,
  Lock,
  Plus,
  Save,
  Smartphone,
} from "lucide-react";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { DeviceRule, LinkFormData } from "./types";
import { useCallback, useEffect, useState } from "react";

import { AVAILABLE_COUNTRIES } from "./Countries";
import { BasicSettings } from "./AddLinkForm/BasicSettings";
import { Button } from "@/components/ui/button";
import { DeviceTargeting } from "./AddLinkForm/DeviceTargeting";
import { ExpandableTabs } from "@/components/ui/expandable-tabs";
import { GeoTargeting } from "./AddLinkForm/GeoTargeting";
import { LinkPreview } from "./LinkPreview";
import { api } from "@/lib/api";
import { generateRandomCode } from "./AddLinkForm/utils";
import { toast } from "sonner";
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
  };
  mode?: "add" | "edit";
}

const detectRegionFromCountries = (countries: string[]): string => {
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

export function AddLinkForm({ onSubmit, initialData }: AddLinkFormProps) {
  const [searchParams] = useSearchParams();
  const [linkName, setLinkName] = useState(initialData?.name || "");
  const [baseUrl, setBaseUrl] = useState(initialData?.baseUrl || "");
  const [shortCode, setShortCode] = useState(
    initialData?.shortCode || generateRandomCode()
  );
  const [geoRules, setGeoRules] = useState<GeoRule[]>(() => {
    if (initialData?.rules) {
      return initialData.rules.map((rule) => ({
        redirectUrl: rule.redirectUrl,
        region: rule.region || detectRegionFromCountries(rule.countries),
        countries: rule.countries,
      }));
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

          // Handle rules properly
          if (data.rules && Array.isArray(data.rules)) {
            setGeoRules(
              data.rules.map((rule) => ({
                redirectUrl: rule.redirectUrl,
                region:
                  rule.region || detectRegionFromCountries(rule.countries),
                countries: Array.isArray(rule.countries)
                  ? rule.countries
                  : typeof rule.countries === "string"
                  ? JSON.parse(rule.countries)
                  : [],
              }))
            );
          }

          // Handle device rules if they exist
          if (data.deviceRules && Array.isArray(data.deviceRules)) {
            setDeviceRules(
              data.deviceRules.map((rule) => ({
                redirectUrl: rule.redirectUrl,
                deviceType: rule.deviceType || "all",
                devices: rule.devices || [],
              }))
            );
          }
        } catch {
          toast.error("Failed to fetch link data");
          setGeoRules([]);
        }
      };

      fetchLinkData();
    }
  }, [id, isEditMode, initialData]);

  useEffect(() => {
    setCurrentDomain(window.location.host);
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

  const handleSubmit = () => {
    if (!baseUrl.trim() || !linkName.trim()) {
      toast.error("Base URL and name are required");
      return;
    }

    if (!isEditMode && (!shortCode || !isShortCodeAvailable)) {
      toast.error("A valid short code is required");
      return;
    }

    // Filter and format geo rules
    const validGeoRules = geoRules
      .filter((rule) => rule.redirectUrl.trim())
      .map((rule) => ({
        redirectUrl: rule.redirectUrl.trim(),
        region: rule.region,
        countries: rule.countries,
      }));

    // Filter and format device rules
    const validDeviceRules = deviceRules
      .filter((rule) => rule.redirectUrl.trim())
      .map((rule) => ({
        redirectUrl: rule.redirectUrl.trim(),
        deviceType: rule.deviceType,
        devices: rule.devices,
      }));

    const data = {
      name: linkName,
      baseUrl: baseUrl,
      shortCode: shortCode,
      rules: validGeoRules,
      deviceRules: validDeviceRules,
      ...(isEditMode && { id }),
    };

    onSubmit(data);
  };

  const tabs = [
    { title: "Geo Targeting", icon: Globe },
    { title: "Device", icon: Smartphone },
    { title: "Time Expire", icon: Clock },
    { title: "Time Start", icon: Calendar },
    { title: "Pass Protection", icon: Lock },
    { title: "UTM", icon: LinkIcon },
  ];

  const renderTabContent = () => {
    if (activeTab === null) return null;

    switch (activeTab) {
      case 0:
        return <GeoTargeting rules={geoRules} onRulesChange={setGeoRules} />;
      case 1:
        return (
          <DeviceTargeting rules={deviceRules} onRulesChange={setDeviceRules} />
        );
      case 2:
        return (
          <div className="p-4 border rounded">
            <p className="text-muted-foreground">Time expiry coming soon</p>
          </div>
        );
      case 3:
        return (
          <div className="p-4 border rounded">
            <p className="text-muted-foreground">Time start coming soon</p>
          </div>
        );
      case 4:
        return (
          <div className="p-4 border rounded">
            <p className="text-muted-foreground">Pass protection coming soon</p>
          </div>
        );
      case 5:
        return (
          <div className="p-4 border rounded">
            <p className="text-muted-foreground">UTM parameters coming soon</p>
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
          <CardFooter>
            <Button onClick={handleSubmit}>
              {isEditMode ? (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Save Changes
                </>
              ) : (
                <>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Link
                </>
              )}
            </Button>
          </CardFooter>
        </Card>
      </div>
      <div className="col-span-1">
        <LinkPreview
          linkUrl={previewUrl}
          geoRules={geoRules}
          deviceRules={deviceRules}
          isLoading={isLinkPreviewLoading}
          onLoad={() => setIsLinkPreviewLoading(false)}
        />
      </div>
    </div>
  );
}
