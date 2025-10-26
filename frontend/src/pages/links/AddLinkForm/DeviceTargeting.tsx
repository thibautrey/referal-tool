import { Plus, Trash2 } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { Button } from "@/components/ui/button";
import { DeviceRule } from "../types";
import { Input } from "@/components/ui/input";
import { useAppTranslation } from "@/i18n";

interface DeviceTargetingProps {
  rules: DeviceRule[];
  onRulesChange: (rules: DeviceRule[]) => void;
}

const OPERATING_SYSTEMS = ["iOS", "Android", "Windows", "macOS", "Linux"];
const BROWSERS = ["Chrome", "Firefox", "Safari", "Edge", "Opera"];

export function DeviceTargeting({
  rules,
  onRulesChange,
}: DeviceTargetingProps) {
  const { t } = useAppTranslation();

  const handleAddRule = () => {
    onRulesChange([
      ...rules,
      {
        redirectUrl: "",
        deviceType: "all",
        devices: [],
      },
    ]);
  };

  const removeRule = (index: number) => {
    onRulesChange(rules.filter((_, i) => i !== index));
  };

  const updateRule = (index: number, updates: Partial<DeviceRule>) => {
    onRulesChange(
      rules.map((rule, i) => {
        if (i === index) {
          return {
            ...rule,
            ...updates,
            devices: Array.isArray(updates.devices)
              ? updates.devices
              : rule.devices,
          };
        }
        return rule;
      })
    );
  };

  return (
    <div className="space-y-4">
      {rules.length === 0 && (
        <p className="text-sm text-muted-foreground">
          {t("links.form.device.no_rules")}
        </p>
      )}
      {rules.map((rule, index) => (
        <div key={index} className="space-y-4 border p-4 rounded-lg">
          <div className="flex gap-4 items-start">
            <Select
              value={rule.deviceType}
              onValueChange={(value: "mobile" | "tablet" | "desktop" | "all") =>
                updateRule(index, { deviceType: value })
              }
            >
              <SelectTrigger className="w-[200px]">
                <SelectValue
                  placeholder={t("links.form.device.placeholders.device_type")}
                />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">
                  {t("links.form.device.device_types.all")}
                </SelectItem>
                <SelectItem value="mobile">
                  {t("links.form.device.device_types.mobile")}
                </SelectItem>
                <SelectItem value="tablet">
                  {t("links.form.device.device_types.tablet")}
                </SelectItem>
                <SelectItem value="desktop">
                  {t("links.form.device.device_types.desktop")}
                </SelectItem>
              </SelectContent>
            </Select>
            <Input
              placeholder={t("links.form.device.placeholders.redirect_url")}
              value={rule.redirectUrl}
              onChange={(e) =>
                updateRule(index, { redirectUrl: e.target.value })
              }
              className="flex-1"
            />
            <Button
              variant="ghost"
              size="icon"
              onClick={() => removeRule(index)}
              aria-label={t("links.form.device.delete_rule")}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>

          <div className="flex gap-4">
            <Select
              value={rule.os || "any"}
              onValueChange={(value) => updateRule(index, { os: value })}
            >
              <SelectTrigger className="w-[200px]">
                <SelectValue
                  placeholder={t("links.form.device.placeholders.os")}
                />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="any">
                  {t("links.form.device.options.any_os")}
                </SelectItem>
                {OPERATING_SYSTEMS.map((os) => (
                  <SelectItem key={os} value={os}>
                    {os}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Input
              placeholder={t("links.form.device.placeholders.os_version")}
              value={rule.osVersion || ""}
              onChange={(e) => updateRule(index, { osVersion: e.target.value })}
              className="w-[200px]"
            />
          </div>

          <div className="flex gap-4">
            <Select
              value={rule.browser || "any"}
              onValueChange={(value) => updateRule(index, { browser: value })}
            >
              <SelectTrigger className="w-[200px]">
                <SelectValue
                  placeholder={t("links.form.device.placeholders.browser")}
                />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="any">
                  {t("links.form.device.options.any_browser")}
                </SelectItem>
                {BROWSERS.map((browser) => (
                  <SelectItem key={browser} value={browser}>
                    {browser}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Input
              placeholder={t("links.form.device.placeholders.browser_version")}
              value={rule.browserVersion || ""}
              onChange={(e) =>
                updateRule(index, { browserVersion: e.target.value })
              }
              className="w-[200px]"
            />
          </div>
        </div>
      ))}
      <center>
        <Button variant="outline" onClick={handleAddRule}>
          <Plus className="h-4 w-4 mr-2" />
          {t("links.form.device.add_rule")}
        </Button>
      </center>
    </div>
  );
}
