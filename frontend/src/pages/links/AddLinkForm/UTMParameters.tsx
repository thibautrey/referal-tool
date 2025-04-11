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
};

export function UTMParameters({
  parameters,
  onChange,
  baseUrl,
}: UTMParametersProps) {
  const [previewUrl, setPreviewUrl] = useState("");

  const updateParameters = (update: Partial<UTMParametersType>) => {
    const newParameters = { ...parameters, ...update };
    onChange(newParameters);

    // Update preview URL
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
        {Object.keys(PRESETS).map((preset) => (
          <Button
            key={preset}
            variant="outline"
            size="sm"
            onClick={() => applyPreset(preset as keyof typeof PRESETS)}
          >
            {preset.charAt(0).toUpperCase() + preset.slice(1)}
          </Button>
        ))}
      </div>

      <div className="grid gap-4">
        <div className="grid gap-2">
          <Label htmlFor="utm_source">Source</Label>
          <Input
            id="utm_source"
            placeholder="e.g., google, facebook, newsletter"
            value={parameters.utmSource}
            onChange={(e) => updateParameters({ utmSource: e.target.value })}
          />
        </div>

        <div className="grid gap-2">
          <Label htmlFor="utm_medium">Medium</Label>
          <Select
            value={parameters.utmMedium}
            onValueChange={(value) => updateParameters({ utmMedium: value })}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select medium" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="social">Social</SelectItem>
              <SelectItem value="email">Email</SelectItem>
              <SelectItem value="cpc">CPC</SelectItem>
              <SelectItem value="display">Display</SelectItem>
              <SelectItem value="affiliate">Affiliate</SelectItem>
              <SelectItem value="referral">Referral</SelectItem>
              <SelectItem value="organic">Organic</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="grid gap-2">
          <Label htmlFor="utm_campaign">Campaign Name</Label>
          <Input
            id="utm_campaign"
            placeholder="e.g., summer_sale, black_friday"
            value={parameters.utmCampaign}
            onChange={(e) => updateParameters({ utmCampaign: e.target.value })}
          />
        </div>

        <div className="grid gap-2">
          <Label htmlFor="utm_term">Keywords (Optional)</Label>
          <Input
            id="utm_term"
            placeholder="e.g., running shoes, blue dress"
            value={parameters.utmTerm}
            onChange={(e) => updateParameters({ utmTerm: e.target.value })}
          />
        </div>

        <div className="grid gap-2">
          <Label htmlFor="utm_content">Content (Optional)</Label>
          <Input
            id="utm_content"
            placeholder="e.g., logolink, textlink"
            value={parameters.utmContent}
            onChange={(e) => updateParameters({ utmContent: e.target.value })}
          />
        </div>
      </div>

      {previewUrl && (
        <div className="p-4 mt-4 rounded-md bg-muted">
          <Label>Preview URL:</Label>
          <div className="mt-2 font-mono text-sm break-all">{previewUrl}</div>
        </div>
      )}
    </div>
  );
}
