import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { supportedLanguages, useAppTranslation, useLanguage } from "@/i18n";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { useMemo } from "react";

export const LanguageSelector = () => {
  const { t } = useAppTranslation();
  const { language, changeLanguage } = useLanguage();

  const languages = useMemo(
    () =>
      supportedLanguages.map((lng) => ({
        value: lng,
        label: t(`language.${lng}`, {
          defaultValue: t(`language.${lng}`, {
            defaultValue: lng,
          }),
        }),
      })),
    [t]
  );

  const handleChange = (value: string) => {
    changeLanguage(value);
    localStorage.setItem("preferredLanguage", value);
    toast.success(t("settings.language_selector.toast"));
  };

  return (
    <div className="space-y-1">
      <Label htmlFor="language-selector">
        {t("settings.language_selector.label")}
      </Label>
      <p className="text-sm text-muted-foreground">
        {t("settings.language_selector.helper")}
      </p>
      <Select value={language} onValueChange={handleChange}>
        <SelectTrigger id="language-selector" className="w-[200px]">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {languages.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
};
