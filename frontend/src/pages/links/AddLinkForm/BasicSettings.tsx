import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RefreshCw, Copy } from "lucide-react";
import { toast } from "sonner";
import { generateRandomCode } from "./utils";
import { useRef } from "react";
import { QRCodeDialog } from "@/components/QRCodeDialog";
import { useAppTranslation } from "@/i18n";

interface BasicSettingsProps {
  linkName: string;
  baseUrl: string;
  shortCode: string;
  isEditMode: boolean;
  currentDomain: string;
  isShortCodeAvailable: boolean;
  isCheckingShortCode: boolean;
  onLinkNameChange: (value: string) => void;
  onBaseUrlChange: (value: string) => void;
  onShortCodeChange: (value: string) => void;
}

export function BasicSettings({
  linkName,
  baseUrl,
  shortCode,
  isEditMode,
  currentDomain,
  isShortCodeAvailable,
  isCheckingShortCode,
  onLinkNameChange,
  onBaseUrlChange,
  onShortCodeChange,
}: BasicSettingsProps) {
  const shortCodeInputRef = useRef<HTMLInputElement>(null);
  const { t } = useAppTranslation();

  const regenerateShortCode = () => {
    onShortCodeChange(generateRandomCode());
  };

  const copyShortCode = () => {
    navigator.clipboard.writeText(`${currentDomain}/l/${shortCode}`);
    toast.success(t("links.form.preview.copy_success"));
  };

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="linkName">{t("links.form.basic.name_label")}</Label>
        <Input
          id="linkName"
          placeholder={t("links.form.basic.name_placeholder")}
          value={linkName}
          onChange={(e) => onLinkNameChange(e.target.value)}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="baseUrl">{t("links.form.basic.url_label")}</Label>
        <Input
          id="baseUrl"
          placeholder={t("links.form.basic.url_placeholder")}
          value={baseUrl}
          onChange={(e) => onBaseUrlChange(e.target.value)}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="shortCode">{t("links.form.basic.shortcode_label")}</Label>
        {isEditMode ? (
          <div className="flex items-center border rounded-md px-3 py-2 bg-muted">
            <span className="text-muted-foreground">{currentDomain}/l/</span>
            <span className="font-medium">{shortCode}</span>
            <div className="flex ml-2">
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={copyShortCode}
                title={t("links.form.basic.preview.copy")}
                aria-label={t("links.form.basic.preview.copy")}
              >
                <Copy className="h-4 w-4" />
              </Button>
              <QRCodeDialog url={`${currentDomain}/l/${shortCode}`} />
            </div>
          </div>
        ) : (
          <div className="flex gap-2">
            <div className="relative flex-1">
              <div
                className={`flex items-center border rounded-md overflow-hidden ${
                  !isShortCodeAvailable ? "border-red-500" : "border-input"
                }`}
              >
                <span className="text-[#166434] bg-[#DCFCE7] px-3 py-2 border-r border-[#166434]/20">
                  {currentDomain}/l/
                </span>
                <input
                  ref={shortCodeInputRef}
                  id="shortCode"
                  value={shortCode}
                  onChange={(e) =>
                    onShortCodeChange(e.target.value.toLowerCase())
                  }
                  className="flex-1 bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-0"
                  placeholder={t("links.form.basic.shortcode_placeholder")}
                />
                <div className="flex">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={copyShortCode}
                    title={t("links.form.basic.preview.copy")}
                    aria-label={t("links.form.basic.preview.copy")}
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                  <QRCodeDialog url={`${currentDomain}/l/${shortCode}`} />
                </div>
              </div>
            </div>
            <Button
              variant="outline"
              size="icon"
              onClick={regenerateShortCode}
              title={t("links.form.basic.shortcode_generate")}
              aria-label={t("links.form.basic.shortcode_generate")}
            >
              <RefreshCw className="h-4 w-4" />
            </Button>
          </div>
        )}
        {!isShortCodeAvailable && (
          <p className="text-sm text-red-500 mt-1">
            {t("links.form.basic.availability.unavailable")}
          </p>
        )}
        {isCheckingShortCode && (
          <p className="text-sm text-muted-foreground mt-1">
            {t("links.form.basic.availability.checking")}
          </p>
        )}
        <p className="text-sm text-muted-foreground">
          {t("links.form.basic.shortcode_helper")}
        </p>
      </div>
    </div>
  );
}
