import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useMemo } from "react";
import { useAppTranslation } from "@/i18n";

interface ExpirationSettingsProps {
  enabled: boolean;
  value: string | null;
  onToggle: (value: boolean) => void;
  onChange: (value: string | null) => void;
}

const getLocalDateTimeString = (date: Date) => {
  const offset = date.getTimezoneOffset();
  const local = new Date(date.getTime() - offset * 60 * 1000);
  return local.toISOString().slice(0, 16);
};

export const ExpirationSettings = ({
  enabled,
  value,
  onToggle,
  onChange,
}: ExpirationSettingsProps) => {
  const { t } = useAppTranslation();

  const minimumValue = useMemo(() => {
    return getLocalDateTimeString(new Date());
  }, []);

  const handleToggle = (checked: boolean) => {
    onToggle(checked);
  };

  const handleClear = () => {
    onChange(null);
  };

  return (
    <div className="space-y-4 border rounded p-4">
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-1">
          <Label className="text-base font-medium">
            {t("links.form.time_expire.title")}
          </Label>
          <p className="text-sm text-muted-foreground">
            {t("links.form.time_expire.description")}
          </p>
        </div>
        <Switch
          checked={enabled}
          onCheckedChange={handleToggle}
          aria-label={t("links.form.time_expire.enable_label")}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="link-expiration" className="text-sm font-medium">
          {t("links.form.time_expire.date_label")}
        </Label>
        <Input
          id="link-expiration"
          type="datetime-local"
          value={value ?? ""}
          min={minimumValue}
          onChange={(event) => onChange(event.target.value || null)}
          disabled={!enabled}
          placeholder={t("links.form.time_expire.placeholder")}
        />
        <p className="text-xs text-muted-foreground">
          {t("links.form.time_expire.timezone_note")}
        </p>
      </div>

      <div className="flex justify-end">
        <Button
          variant="ghost"
          type="button"
          onClick={handleClear}
          disabled={!enabled || !value}
        >
          {t("links.form.time_expire.clear")}
        </Button>
      </div>
    </div>
  );
};
