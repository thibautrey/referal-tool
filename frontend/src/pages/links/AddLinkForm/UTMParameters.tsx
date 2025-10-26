import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { UTMParametersType } from "../types";
import { useAppTranslation } from "@/i18n";
import { useState } from "react";

interface UTMParametersProps {
  parameters: UTMParametersType;
  onChange: (parameters: UTMParametersType) => void;
  baseUrl: string;
}

const PRESETS = {
  facebook: {
    source: "facebook",
    medium: "social",
  },
  instagram: {
    source: "instagram",
    medium: "social",
  },
  linkedin: {
    source: "linkedin",
    medium: "social",
  },
  twitter: {
    source: "twitter",
    medium: "social",
  },
  google: {
    source: "google",
    medium: "cpc",
  },
  email: {
    source: "newsletter",
    medium: "email",
  },
  display: {
    source: "display",
    medium: "banner",
  },
} as const;

export function UTMParameters({
  parameters,
  onChange,
  baseUrl,
}: UTMParametersProps) {
  const [previewUrl, setPreviewUrl] = useState("");
  const { t } = useAppTranslation();

  const updateParameters = (update: Partial<UTMParametersType>) => {
    const newParameters = { ...parameters, ...update };
    onChange(newParameters);

    try {
      const url = new URL(baseUrl);
      if (newParameters.utmSource)
        url.searchParams.set("utm_source", newParameters.utmSource);
      if (newParameters.utmMedium)
        url.searchParams.set("utm_medium", newParameters.utmMedium);
      if (newParameters.utmCampaign)
        url.searchParams.set("utm_campaign", newParameters.utmCampaign);
      if (newParameters.utmTerm)
        url.searchParams.set("utm_term", newParameters.utmTerm);
      if (newParameters.utmContent)
        url.searchParams.set("utm_content", newParameters.utmContent);
      setPreviewUrl(url.toString());
    } catch {
      setPreviewUrl("");
    }
  };

  const applyPreset = (preset: keyof typeof PRESETS) => {
    updateParameters({
      utmSource: PRESETS[preset].source,
      utmMedium: PRESETS[preset].medium,
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap gap-2">
        {(Object.keys(PRESETS) as Array<keyof typeof PRESETS>).map((preset) => (
          <Button
            key={preset}
            variant="outline"
            size="sm"
            onClick={() => applyPreset(preset)}
          >
            {t(`links.form.utm.presets.${preset}`)}
          </Button>
        ))}
      </div>

      <div className="grid gap-4">
        <div className="grid gap-2">
          <Label htmlFor="utm_source">{t("links.form.utm.fields.source")}</Label>
          <Input
            id="utm_source"
            placeholder={t("links.form.utm.placeholders.source")}
            value={parameters.utmSource}
            onChange={(e) => updateParameters({ utmSource: e.target.value })}
          />
        </div>

        <div className="grid gap-2">
          <Label htmlFor="utm_medium">{t("links.form.utm.fields.medium")}</Label>
          <Select
            value={parameters.utmMedium}
            onValueChange={(value) => updateParameters({ utmMedium: value })}
          >
            <SelectTrigger>
              <SelectValue placeholder={t("links.form.utm.medium_placeholder")} />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(t("links.form.utm.medium_options", { returnObjects: true }) as Record<string, string>).map(
                ([value, label]) => (
                  <SelectItem key={value} value={value}>
                    {label}
                  </SelectItem>
                )
              )}
            </SelectContent>
          </Select>
        </div>

        <div className="grid gap-2">
          <Label htmlFor="utm_campaign">{t("links.form.utm.fields.campaign")}</Label>
          <Input
            id="utm_campaign"
            placeholder={t("links.form.utm.placeholders.campaign")}
            value={parameters.utmCampaign}
            onChange={(e) => updateParameters({ utmCampaign: e.target.value })}
          />
        </div>

        <div className="grid gap-2">
          <Label htmlFor="utm_term">{t("links.form.utm.fields.term_optional")}</Label>
          <Input
            id="utm_term"
            placeholder={t("links.form.utm.placeholders.term")}
            value={parameters.utmTerm}
            onChange={(e) => updateParameters({ utmTerm: e.target.value })}
          />
        </div>

        <div className="grid gap-2">
          <Label htmlFor="utm_content">{t("links.form.utm.fields.content_optional")}</Label>
          <Input
            id="utm_content"
            placeholder={t("links.form.utm.placeholders.content")}
            value={parameters.utmContent}
            onChange={(e) => updateParameters({ utmContent: e.target.value })}
          />
        </div>
      </div>

      {previewUrl && (
        <div className="p-4 mt-4 rounded-md bg-muted">
          <Label>{t("links.form.utm.preview_label")}</Label>
          <div className="mt-2 font-mono text-sm break-all">{previewUrl}</div>
        </div>
      )}
    </div>
  );
}
